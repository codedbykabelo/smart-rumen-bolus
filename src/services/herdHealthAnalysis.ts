import type { HealthStatus, SensorReading } from '../types';

export interface CowHealthAnalysis {
  riskLevel: HealthStatus;
  concern: string;
  action: string;
  explanation: string;
  reasons: string[];
}

export function analyzeCowReadings(readings: readonly SensorReading[]): CowHealthAnalysis {
  const current = readings[readings.length - 1];
  const previous = readings[readings.length - 2] ?? current;
  if (!current) {
    return {
      riskLevel: 'Healthy',
      concern: 'Insufficient simulated readings',
      action: 'Continue monitoring until readings are available.',
      explanation: 'No current sensor record is available for comparison.',
      reasons: ['A current and previous simulated reading are required.'],
    };
  }

  const temperatureDelta = current.temperatureC - previous.temperatureC;
  const movementDelta = current.movementIndex - previous.movementIndex;
  const phDelta = current.ph - previous.ph;
  const reasons: string[] = [];
  if (current.temperatureC >= 40) reasons.push(`Temperature is high at ${current.temperatureC.toFixed(1)}°C.`);
  else if (current.temperatureC >= 39.4) reasons.push(`Temperature is elevated at ${current.temperatureC.toFixed(1)}°C.`);
  if (temperatureDelta >= 0.5) reasons.push(`Temperature rose ${temperatureDelta.toFixed(1)}°C since the previous sample.`);
  if (current.movementIndex <= 0.3) reasons.push(`Movement index is low at ${current.movementIndex.toFixed(2)}.`);
  else if (movementDelta <= -0.2) reasons.push(`Movement fell ${Math.abs(movementDelta).toFixed(2)} since the previous sample.`);
  if (current.ph < 5.7) reasons.push(`Simulated pH is low at ${current.ph.toFixed(2)}.`);
  else if (phDelta <= -0.3) reasons.push(`Simulated pH fell ${Math.abs(phDelta).toFixed(2)} since the previous sample.`);

  const urgent = current.temperatureC >= 40
    || (temperatureDelta >= 0.5 && movementDelta <= -0.2)
    || (current.temperatureC >= 39.4 && current.movementIndex <= 0.3);
  const needsAttention = !urgent && (
    current.temperatureC >= 39.4
    || current.movementIndex < 0.4
    || current.ph < 5.7
    || temperatureDelta >= 0.1
    || movementDelta <= -0.025
    || phDelta <= -0.3
  );
  const riskLevel: HealthStatus = urgent ? 'Urgent' : needsAttention ? 'Attention' : 'Healthy';

  if (riskLevel === 'Healthy') {
    return {
      riskLevel,
      concern: 'No unusual pattern detected',
      action: 'Continue routine monitoring.',
      explanation: 'Current simulated readings are not showing the configured early-warning thresholds.',
      reasons: ['Temperature, movement, and pH are near the recent sample range.'],
    };
  }

  const possiblePattern = current.ph < 5.7 || phDelta <= -0.3
    ? 'Possible rumen-acidity or feeding-related concern'
    : 'Nonspecific fever and/or reduced-activity pattern';
  const diseaseContext = riskLevel === 'Urgent'
    ? 'FMD, heartwater, and redwater can be veterinary differentials depending on clinical signs and local context; these sensor values cannot distinguish or confirm them.'
    : 'FMD, heartwater, and redwater are not diagnosed by these readings; interpret any concern with clinical signs and veterinary assessment.';

  return {
    riskLevel,
    concern: possiblePattern,
    action: riskLevel === 'Urgent'
      ? 'Promptly contact a veterinarian, check the animal for clinical signs, and follow local biosecurity guidance.'
      : 'Recheck readings and observe appetite, behaviour, and clinical signs; consult a veterinarian if the pattern persists.',
    explanation: `${diseaseContext} This is a transparent rule-based alert, not a disease prediction.`,
    reasons: reasons.length > 0 ? reasons : ['A recent reading changed beyond the configured trend threshold.'],
  };
}
