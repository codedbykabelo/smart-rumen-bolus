import type { Activity, AlertItem, CowProfile, ScenarioType } from '../types';

export const appPages = [
  'Live Cow Simulation',
  'Bolus Sensor Monitoring',
  'AI Health Analysis',
  'Farmer Dashboard',
  'Outbreak Monitoring',
] as const;

export const cowId = 'COW-008';

export const herdProfiles: CowProfile[] = [
  { id: 'COW-001', tag: 'A-101', activity: 'Grazing', temperature: 38.6, health: 'Healthy', lastReading: '2 min ago', location: 'North pasture', zone: 'Paddock 1' },
  { id: 'COW-002', tag: 'A-102', activity: 'Walking', temperature: 38.7, health: 'Healthy', lastReading: '1 min ago', location: 'Water trough', zone: 'Paddock 1' },
  { id: 'COW-003', tag: 'B-214', activity: 'Ruminating', temperature: 38.5, health: 'Healthy', lastReading: '4 min ago', location: 'Shade area', zone: 'Paddock 2' },
  { id: 'COW-004', tag: 'B-316', activity: 'Resting', temperature: 38.8, health: 'Monitoring', lastReading: '2 min ago', location: 'Holding pen', zone: 'Paddock 2' },
  { id: 'COW-005', tag: 'C-405', activity: 'Drinking', temperature: 39.0, health: 'Healthy', lastReading: '1 min ago', location: 'Water trough', zone: 'Paddock 3' },
  { id: 'COW-006', tag: 'C-408', activity: 'Grazing', temperature: 38.9, health: 'Healthy', lastReading: '3 min ago', location: 'North pasture', zone: 'Paddock 3' },
  { id: 'COW-007', tag: 'D-511', activity: 'Walking', temperature: 39.1, health: 'Attention', lastReading: '2 min ago', location: 'Gate lane', zone: 'Paddock 4' },
  { id: 'COW-008', tag: 'D-512', activity: 'Grazing', temperature: 40.8, health: 'Urgent', lastReading: 'now', location: 'South pasture', zone: 'Paddock 4' },
  { id: 'COW-009', tag: 'E-604', activity: 'Lying down', temperature: 39.4, health: 'Monitoring', lastReading: '5 min ago', location: 'Shade shed', zone: 'Paddock 5' },
  { id: 'COW-010', tag: 'E-708', activity: 'Resting', temperature: 38.7, health: 'Healthy', lastReading: '4 min ago', location: 'Holding pen', zone: 'Paddock 5' },
  { id: 'COW-011', tag: 'F-801', activity: 'Walking', temperature: 39.3, health: 'Attention', lastReading: '2 min ago', location: 'North pasture', zone: 'Paddock 6' },
  { id: 'COW-012', tag: 'F-804', activity: 'Grazing', temperature: 38.6, health: 'Healthy', lastReading: '1 min ago', location: 'West field', zone: 'Paddock 6' },
];

export const initialAlerts: AlertItem[] = [
  { id: 'alert-1', type: 'urgent', title: 'Suspected FMD risk', message: 'COW-008 shows rising temperature, reduced movement, and compatible oral symptoms.', timestamp: '08:42', read: false, cowId: 'COW-008', action: 'Contact State Veterinarian' },
  { id: 'alert-2', type: 'warning', title: 'Group watchlist', message: 'Three animals in Paddock 4 show unusual readings.', timestamp: '08:47', read: false, cowId: 'COW-007', action: 'Increase observation frequency' },
  { id: 'alert-3', type: 'info', title: 'Water temperature variation', message: 'Minor internal temperature rise after drinking event recorded.', timestamp: '08:50', read: true, cowId: 'COW-008', action: 'Continue monitoring' },
];

export const chartLabels = ['00:00', '00:04', '00:08', '00:12', '00:16', '00:20'];

export const demoScenarioPlan: ScenarioType[] = ['normal', 'normal', 'normal', 'fmd', 'fmd'];

export const historicalTemperatures = [38.4, 38.6, 38.7, 38.5, 38.8, 38.6, 38.9, 39.1, 39.0, 39.5, 39.7, 40.8];

export const transmissionPackets = [
  { packetId: 'PKT-1021', timestamp: '08:45:03Z', cowId: cowId, status: 'Queued' },
  { packetId: 'PKT-1022', timestamp: '08:45:15Z', cowId: cowId, status: 'Received' },
  { packetId: 'PKT-1023', timestamp: '08:45:29Z', cowId: cowId, status: 'Validated' },
];

export const bolusComponents = [
  'ESP32-C3 MCU',
  'Temperature Sensor',
  'Motion Sensor',
  'Battery',
  'Wireless Tx',
  'Protective Enclosure',
] as const;

export const baseReadings = {
  temperatureC: 38.5,
  movementIndex: 0.8,
  ph: 6.7,
  acceleration: { x: 0.12, y: -0.07, z: 0.94 },
  batteryPercent: 84,
};

export const activityOptions: Activity[] = ['Grazing', 'Walking', 'Ruminating', 'Drinking', 'Resting', 'Lying down'];
