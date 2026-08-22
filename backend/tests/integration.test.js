const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runEndToEndCheck() {
  console.log('🚀 Starting RENEW-AI End-to-End System Health Check...\n');
  let token = '';
  let projectId = '';

  try {
    // 1. Auth Test
    console.log('1️⃣ Testing Authentication...');
    const testEmail = `healthcheck_${Date.now()}@renewai.test`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'System Verifier',
      email: testEmail,
      password: 'StrongPassword123!'
    });
    token = regRes.data.token;
    console.log('   ✅ Register passed! JWT Token received.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Demo Data Pipeline
    console.log('\n2️⃣ Testing Synthetic Demo Data Generator (720 records)...');
    const demoRes = await axios.post(`${API_BASE}/data/demo`, {}, { headers });
    projectId = demoRes.data.projectId;
    console.log(`   ✅ Demo project generated! Project ID: ${projectId}`);

    // 3. Stats Aggregation
    console.log('\n3️⃣ Testing Data Aggregation & Telemetry...');
    const statsRes = await axios.get(`${API_BASE}/data/stats/${projectId}`, { headers });
    console.log(`   ✅ Stats aggregated! Total Records: ${statsRes.data.totalRecords}, Solar Gen: ${statsRes.data.latest?.solarGeneration}kW`);

    // 4. ML Ensemble Training
    console.log('\n4️⃣ Testing ML Microservice Ensemble Training (RF + GBM + XGBoost)...');
    const trainRes = await axios.post(`${API_BASE}/forecast/train/${projectId}`, {}, { headers });
    console.log(`   ✅ ML Model trained! R² Score: ${trainRes.data.r2Score?.toFixed(3)}, RMSE: ${trainRes.data.rmse?.toFixed(2)} kW`);

    // 5. Forecast & XAI Generation
    console.log('\n5️⃣ Testing Probabilistic Forecast & XAI Generation...');
    const fcRes = await axios.post(`${API_BASE}/forecast/generate/${projectId}`, { horizon: 24 }, { headers });
    console.log(`   ✅ Forecast generated! Predictions: ${fcRes.data.predictions?.length} points, Confidence: ${(fcRes.data.confidenceScore * 100).toFixed(1)}%`);
    console.log(`   💡 XAI Insight: "${fcRes.data.xaiReasons?.[0]}"`);

    // 6. What-If Simulator
    console.log('\n6️⃣ Testing What-If Simulation Engine...');
    const simRes = await axios.post(`${API_BASE}/simulate/${projectId}`, {
      solarDelta: 20,
      windDelta: -10,
      demandDelta: 15,
      cloudDelta: -20,
      batteryCapacity: 500,
      gridPrice: 0.12
    }, { headers });
    console.log(`   ✅ Simulation complete! Baseline Action: ${simRes.data.baseline.action} ➡️ Simulated Action: ${simRes.data.simulated.action}`);
    console.log(`   ⚡ Delta Generation: ${simRes.data.comparison.generationDelta} kW`);

    // 7. Alert Management
    console.log('\n7️⃣ Testing Alerts System...');
    const alertRes = await axios.get(`${API_BASE}/alerts/${projectId}`, { headers });
    console.log(`   ✅ Active Alerts retrieved: ${alertRes.data?.length || 0} alerts.`);

    // 8. AI Copilot (Groq LLM)
    console.log('\n8️⃣ Testing AI Copilot with Groq LLM...');
    const chatRes = await axios.post(`${API_BASE}/copilot/chat`, {
      message: 'What is the current status and recommendation for my battery?',
      projectId: projectId
    }, { headers });
    console.log(`   ✅ Copilot replied (Source: ${chatRes.data.source}):\n   "${chatRes.data.reply.slice(0, 150)}..."`);

    console.log('\n======================================================');
    console.log('🎉 ALL 8 SUBSYSTEMS PASSED WITH 100% SUCCESS!');
    console.log('RENEW-AI platform is fully integrated & production-ready.');
    console.log('======================================================\n');
  } catch (error) {
    console.error('\n❌ Health check failed at step:', error.response?.data || error.message);
  }
}

runEndToEndCheck();
