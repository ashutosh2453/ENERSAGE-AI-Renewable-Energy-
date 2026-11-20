const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const EnergyRecord = require('../models/EnergyRecord');
const Forecast = require('../models/Forecast');
const { protect } = require('../middleware/auth');
const { findOwnedProject } = require('../middleware/ownership');

router.use(protect);

router.post('/chat', async (req, res) => {
    try {
        const { message, projectId, history = [] } = req.body;

        if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ message: 'No message provided' });
        if (message.length > 4000) return res.status(400).json({ message: 'Message too long' });
        if (!Array.isArray(history)) return res.status(400).json({ message: 'history must be an array' });

        // Only ever put the caller's OWN project data into the prompt.
        let project = null;
        if (projectId) {
            project = await findOwnedProject(req, projectId);
            if (!project) return res.status(404).json({ message: 'Project not found' });
        }

        const latestRecord = project
            ? await EnergyRecord.findOne({ projectId: project._id }).sort({ timestamp: -1 })
            : null;
        const latestForecast = project
            ? await Forecast.findOne({ projectId: project._id }).sort({ generatedAt: -1 })
            : null;

        // Build rich system prompt with real data
        let systemContext = `You are ENER SAGE AI Copilot, an expert AI assistant for a renewable energy microgrid management system. You provide concise, data-driven advice about energy generation, storage, demand, and grid operations. Always respond in a helpful, professional tone. Keep responses under 3 paragraphs unless detailed analysis is requested.\n\n`;

        if (latestRecord) {
            const ts = new Date(latestRecord.timestamp).toLocaleString();
            const totalGen = (latestRecord.solarGeneration || 0) + (latestRecord.windGeneration || 0);
            const surplus = totalGen - (latestRecord.energyDemand || 0);
            systemContext += `LIVE SYSTEM STATUS (as of ${ts}):\n`;
            systemContext += `- Solar Generation: ${(latestRecord.solarGeneration || 0).toFixed(1)} kW\n`;
            systemContext += `- Wind Generation: ${(latestRecord.windGeneration || 0).toFixed(1)} kW\n`;
            systemContext += `- Total Generation: ${totalGen.toFixed(1)} kW\n`;
            systemContext += `- Energy Demand: ${(latestRecord.energyDemand || 0).toFixed(1)} kW\n`;
            systemContext += `- Net Surplus/Deficit: ${surplus.toFixed(1)} kW\n`;
            systemContext += `- Battery SOC: ${(latestRecord.batterySOC || 0).toFixed(1)}%\n`;
            systemContext += `- Battery Capacity: ${latestRecord.batteryCapacity || 500} kWh\n`;
            systemContext += `- Grid Price: $${(latestRecord.gridPrice || 0.1).toFixed(4)}/kWh\n`;
            systemContext += `- Cloud Coverage: ${(latestRecord.cloudCoverage || 0).toFixed(0)}%\n`;
            systemContext += `- Temperature: ${(latestRecord.temperature || 20).toFixed(1)}°C\n`;
            systemContext += `- Wind Speed: ${(latestRecord.windSpeed || 0).toFixed(1)} m/s\n\n`;
        } else {
            systemContext += `NOTE: No live sensor data is currently available. Answer based on general renewable energy principles.\n\n`;
        }

        if (latestForecast) {
            systemContext += `ML FORECAST (${latestForecast.horizon}h horizon, confidence: ${((latestForecast.confidenceScore || 0) * 100).toFixed(1)}%):\n`;
            if (latestForecast.xaiReasons?.length) {
                systemContext += `Key drivers: ${latestForecast.xaiReasons.join('; ')}\n`;
            }
            const firstPred = latestForecast.predictions?.[0];
            const lastPred = latestForecast.predictions?.[latestForecast.predictions.length - 1];
            if (firstPred) systemContext += `Next hour forecast: ${firstPred.value?.toFixed(1)} kW (range: ${firstPred.lowerBound?.toFixed(1)}–${firstPred.upperBound?.toFixed(1)} kW)\n`;
            if (lastPred) systemContext += `End of horizon: ${lastPred.value?.toFixed(1)} kW\n`;
            systemContext += '\n';
        }

        // Build messages array with conversation history
        const chatMessages = [
            { role: 'system', content: systemContext },
            // Include last 6 history turns for context
            ...history.slice(-6).filter(h => h && typeof h.content === 'string').map(h => ({
                role: h.role === 'ai' ? 'assistant' : 'user',
                content: h.content.slice(0, 4000)
            })),
            { role: 'user', content: message }
        ];

        try {
            const openai = new OpenAI({
                apiKey: process.env.GROQ_API_KEY,
                baseURL: 'https://api.groq.com/openai/v1'
            });

            const response = await openai.chat.completions.create({
                model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
                messages: chatMessages,
                temperature: 0.7,
                max_tokens: 512,
            });

            const reply = response.choices[0].message.content;
            res.json({ reply, context: systemContext, source: 'groq' });

        } catch (groqErr) {
            // Log the actual error for debugging
            console.error('Groq API error:', groqErr.status, groqErr.message);

            // Intelligent fallback using real data
            let reply;
            if (latestRecord) {
                const totalGen = (latestRecord.solarGeneration || 0) + (latestRecord.windGeneration || 0);
                const surplus = totalGen - (latestRecord.energyDemand || 0);
                const soc = latestRecord.batterySOC || 0;
                reply = `Based on your current data:\n\n`;
                reply += `• **Generation**: Solar ${latestRecord.solarGeneration?.toFixed(1)}kW + Wind ${latestRecord.windGeneration?.toFixed(1)}kW = **${totalGen.toFixed(1)}kW total**\n`;
                reply += `• **Demand**: ${latestRecord.energyDemand?.toFixed(1)}kW | **${surplus >= 0 ? 'Surplus' : 'Deficit'}**: ${Math.abs(surplus).toFixed(1)}kW\n`;
                reply += `• **Battery**: ${soc.toFixed(0)}% SOC (${((soc / 100) * (latestRecord.batteryCapacity || 500)).toFixed(0)} kWh stored)\n\n`;
                reply += surplus > 0 && soc < 90
                    ? `Recommendation: Store the ${surplus.toFixed(1)}kW surplus — battery has room at ${soc.toFixed(0)}%.`
                    : surplus > 0 && soc >= 90
                    ? `Recommendation: Battery full — consider exporting ${surplus.toFixed(1)}kW to the grid at $${latestRecord.gridPrice?.toFixed(4)}/kWh.`
                    : `Recommendation: You have a ${Math.abs(surplus).toFixed(1)}kW deficit. ${soc > 20 ? 'Drawing from battery.' : 'Battery low — consider grid import.'}`;
                reply += `\n\n*(AI Copilot running in offline mode — Groq API unavailable)*`;
            } else {
                reply = `I couldn't reach the AI service and have no live data to reference. Please ensure your backend is running and a project is selected.`;
            }

            res.json({ reply, context: systemContext, source: 'fallback' });
        }
    } catch (err) {
        console.error('Copilot route error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
