const Alert = require('../models/Alert');

async function generateAlerts(projectId, forecast, latestRecord) {
    if (!forecast || !forecast.predictions || !forecast.predictions.length) return;
    
    const newAlerts = [];
    
    // Analyze every 6h window in forecast for simpliciy, or just loop through
    let futureGeneration = 0;
    for (let p of forecast.predictions) {
        futureGeneration += p.value;
    }
    const avgFutureGen = futureGeneration / forecast.predictions.length;
    
    // Some arbitrary alert logic based on requirements
    if (avgFutureGen < (latestRecord.energyDemand || 100) * 0.3) {
        newAlerts.push({
            projectId,
            type: 'critical',
            message: 'Low Generation Expected',
            detail: 'Average predicted generation is less than 30% of current demand.'
        });
    }
    
    if (latestRecord.batterySOC < 20 && avgFutureGen < (latestRecord.energyDemand || 100)) {
        newAlerts.push({
            projectId,
            type: 'warning',
            message: 'Battery Low, Deficit Expected',
            detail: 'Battery SOC below 20% and expected generation is lower than demand.'
        });
    }
    
    if (latestRecord.solarGeneration + latestRecord.windGeneration > latestRecord.energyDemand + 50 && latestRecord.gridPrice > 0.15) {
        newAlerts.push({
            projectId,
            type: 'opportunity',
            message: 'High Export Value',
            detail: 'Significant surplus available while grid prices are high.'
        });
    }
    
    await Alert.deleteMany({ projectId, resolved: false });
    if (newAlerts.length > 0) {
        await Alert.insertMany(newAlerts);
    }
}

module.exports = { generateAlerts };
