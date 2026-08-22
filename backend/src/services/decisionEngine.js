function makeDecision({ solarGen, windGen, demand, batterySOC, batteryCapacity, gridPrice, gridAvailability }) {
    const totalGeneration = solarGen + windGen;
    const surplus = totalGeneration - demand;
    const socPercent = batterySOC / 100;

    let action, reason;

    if (surplus > 0) {
        if (socPercent < 0.9 && surplus > 0.1 * totalGeneration) {
            action = 'STORE';
            reason = `Storing ${surplus.toFixed(1)}kW surplus. Battery at ${batterySOC}%.`;
        } else if (socPercent >= 0.9) {
            action = 'EXPORT';
            reason = `Battery full. Exporting ${surplus.toFixed(1)}kW to grid at $${gridPrice}/kWh.`;
        } else {
            action = 'USE';
            reason = `Using ${totalGeneration.toFixed(1)}kW directly for consumption.`;
        }
    } else {
        const deficit = Math.abs(surplus);
        if (socPercent > 0.2) {
            action = 'USE';
            reason = `${deficit.toFixed(1)}kW deficit. Drawing from battery (${batterySOC}% SOC).`;
        } else if (gridAvailability) {
            action = 'GRID';
            reason = `Battery low (${batterySOC}%). Importing ${deficit.toFixed(1)}kW from grid.`;
        } else {
            action = 'GRID';
            reason = `Critical: ${deficit.toFixed(1)}kW deficit with low battery. Grid import required.`;
        }
    }

    return { 
        action, 
        surplus, 
        deficit: surplus < 0 ? Math.abs(surplus) : 0, 
        totalGeneration, 
        efficiency: totalGeneration / (totalGeneration + Math.max(0, -surplus)), 
        reason 
    };
}

module.exports = { makeDecision };
