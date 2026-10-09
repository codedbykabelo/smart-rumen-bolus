import type { HealthAssessment, SensorReading, ScenarioType } from '../types';

export function buildSyntheticReading(tick: number, scenario: ScenarioType, activity: string): SensorReading {
  const timeLabel = new Date(Date.UTC(2026, 9, 9, 10, 0, tick)).toISOString().slice(11, 16);

  let temperatureC = 38.5 + Math.sin(tick / 8) * 0.25;
  let movementIndex = 0.75 + Math.cos(tick / 10) * 0.18;
  let ph = 6.7;

  switch (scenario) {
    case 'fmd':
      temperatureC = 38.7 + tick * 0.06 + Math.sin(tick / 4) * 0.22;
      movementIndex = Math.max(0.18, 0.72 - tick * 0.02);
      ph = 6.5;
      break;
    case 'heartwater':
      temperatureC = 39.2 + Math.sin(tick / 6) * 0.2;
      movementIndex = Math.max(0.3, 0.68 - tick * 0.015);
      ph = 6.6;
      break;
    case 'redwater':
      temperatureC = 39.1 + Math.sin(tick / 5) * 0.25;
      movementIndex = Math.max(0.25, 0.7 - tick * 0.017);
      ph = 6.55;
      break;
    case 'acidosis':
      temperatureC = 38.9 + Math.cos(tick / 7) * 0.18;
      movementIndex = Math.max(0.22, 0.66 - tick * 0.016);
      ph = 5.8 + Math.sin(tick / 4) * 0.25;
      break;
    default:
      break;
  }

  if (activity === 'Drinking') {
    temperatureC += 0.4;
    movementIndex += 0.08;
  }
  if (activity === 'Resting' || activity === 'Lying down') {
    movementIndex *= 0.75;
  }

  const period = Math.max(0.1, Math.sin(tick / 2) * 0.12 + 0.15);

  return {
    id: tick,
    time: timeLabel,
    temperatureC: Number(temperatureC.toFixed(1)),
    movementIndex: Number(movementIndex.toFixed(2)),
    ph: Number(ph.toFixed(2)),
    acceleration: {
      x: Number((0.08 + Math.sin(tick / 4) * 0.08).toFixed(2)),
      y: Number((0.04 + Math.cos(tick / 5) * 0.07).toFixed(2)),
      z: Number((0.9 + period).toFixed(2)),
    },
    batteryPercent: 92 - tick * 0.1,
    status: 'Healthy',
  };
}

export function evaluateHealthRules(readings: SensorReading[], scenario: ScenarioType): HealthAssessment {
  const latest = readings[readings.length - 1] ?? { temperatureC: 38.5, movementIndex: 0.8, ph: 6.7 } as SensorReading;
  const previous = readings[readings.length - 2] ?? latest;
  const tempRise = latest.temperatureC - previous.temperatureC;
  const movementDrop = previous.movementIndex - latest.movementIndex;

  const abnormalReadings: string[] = [];
  if (latest.temperatureC > 39.2) abnormalReadings.push('Elevated rumen temperature');
  if (latest.movementIndex < 0.5) abnormalReadings.push('Reduced movement/activity');
  if (scenario === 'acidosis' && latest.ph < 5.9) abnormalReadings.push('Low rumen pH trend');
  if (scenario === 'fmd' && latest.temperatureC > 39.5) abnormalReadings.push('Compatible fever pattern');

  const trendComparison =
    tempRise > 0.3
      ? 'Temperature is rising above the individual baseline trend.'
      : 'Temperature remains close to the stable baseline.';

  const contributingFactors = [
    'Sensor readings are compared to the individual cow baseline.',
    'Activity and temperature are evaluated together instead of in isolation.',
  ];

  if (scenario === 'fmd') {
    contributingFactors.push('Farmer-reported oral lesions and salivation are compatible with a possible FMD signal.');
  }
  if (scenario === 'heartwater') {
    contributingFactors.push('Tick exposure and fever may be consistent with a broader vector-borne differential.');
  }
  if (scenario === 'redwater') {
    contributingFactors.push('Raised temperature and reduced activity may justify veterinary examination for redwater or similar causes.');
  }
  if (scenario === 'acidosis') {
    contributingFactors.push('Low pH and reduced activity are consistent with a ruminal acidosis concern.');
  }

  let status: HealthAssessment['status'] = 'Healthy';
  let riskCategory = 'Low';
  let explanation = 'No clear alarming pattern detected. Normal activity and stable readings are within the expected range.';
  let recommendedAction = 'Continue routine monitoring and keep recording observations.';
  let scenarioSummary = 'Rule-based demonstration is returning a stable baseline status.';

  if (scenario === 'fmd' || latest.temperatureC > 39.8 || movementDrop > 0.2) {
    status = 'Urgent';
    riskCategory = 'Possible FMD / high-risk illness';
    explanation = 'The pattern shows a sustained elevation in temperature and depressed activity. The system is flagging a nonspecific illness signal that may merit urgent veterinary review when compatible symptoms are present.';
    recommendedAction = 'Immediately contact the State Veterinarian and restrict animal movement while following official biosecurity guidance.';
    scenarioSummary = 'Prototype Health Analysis detected an abnormal trend that could align with a suspected FMD presentation when symptoms are present.';
  } else if (scenario === 'heartwater' || latest.temperatureC > 39.4 || movementDrop > 0.12) {
    status = 'Attention';
    riskCategory = 'Watchlist';
    explanation = 'The trend is abnormal but not specific to one disease. Acute fever and reduced movement warrant closer observation and veterinary assessment.';
    recommendedAction = 'Review the cow in the next observation window and seek veterinary guidance if symptoms persist.';
    scenarioSummary = 'The rule engine detected a general illness pattern requiring closer scrutiny.';
  } else if (scenario === 'redwater' || latest.temperatureC > 39.3) {
    status = 'Monitoring';
    riskCategory = 'Clinical follow-up';
    explanation = 'Temperature is elevated compared with baseline, but the evidence remains general and could reflect multiple causes.';
    recommendedAction = 'Monitor for additional signs such as dark urine, anaemia, or reduced appetite and consult a veterinarian.';
    scenarioSummary = 'A mild fever pattern is present, but the evidence is still nonspecific.';
  } else if (scenario === 'acidosis' || latest.ph < 5.9) {
    status = 'Attention';
    riskCategory = 'Rumen acid challenge';
    explanation = 'The rumen pH is trending low, which could indicate acidosis or an abnormal fermentation pattern requiring interpretation with sensor hardware and veterinary input.';
    recommendedAction = 'Review feeding patterns, confirm pH sensor function, and consult a veterinarian for interpretation.';
    scenarioSummary = 'The optional pH-enabled bolus suggests a rumen acidity concern.';
  }

  if (abnormalReadings.length === 0) {
    status = 'Healthy';
    riskCategory = 'Low';
    recommendedAction = 'Continue routine monitoring and keep recording observations.';
  }

  return {
    status,
    riskCategory,
    abnormalReadings,
    trendComparison,
    contributingFactors,
    explanation,
    recommendedAction,
    scenarioSummary,
  };
}

export function getScenarioLabel(scenario: ScenarioType): string {
  switch (scenario) {
    case 'fmd':
      return 'Scenario A: Foot-and-Mouth disease';
    case 'heartwater':
      return 'Scenario B: Heartwater';
    case 'redwater':
      return 'Scenario C: Redwater';
    case 'acidosis':
      return 'Scenario D: Ruminal acidosis';
    default:
      return 'Normal monitoring';
  }
}
