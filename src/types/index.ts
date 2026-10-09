export type Activity = 'Grazing' | 'Walking' | 'Ruminating' | 'Drinking' | 'Resting' | 'Lying down';
export type ScenarioType = 'normal' | 'fmd' | 'heartwater' | 'redwater' | 'acidosis';
export type HealthStatus = 'Healthy' | 'Monitoring' | 'Attention' | 'Urgent';
export type AlertType = 'info' | 'warning' | 'urgent';

export interface SensorReading {
  id: number;
  time: string;
  temperatureC: number;
  movementIndex: number;
  ph: number;
  acceleration: { x: number; y: number; z: number };
  batteryPercent: number;
  status: HealthStatus;
}

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  cowId: string;
  action: string;
}

export interface CowProfile {
  id: string;
  tag: string;
  activity: Activity;
  temperature: number;
  health: HealthStatus;
  lastReading: string;
  location: string;
  zone: string;
}

export interface HealthAssessment {
  status: HealthStatus;
  riskCategory: string;
  abnormalReadings: string[];
  trendComparison: string;
  contributingFactors: string[];
  explanation: string;
  recommendedAction: string;
  scenarioSummary: string;
}
