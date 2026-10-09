import { create } from 'zustand';
import { baseReadings, initialAlerts } from '../data/mockData';
import { buildSyntheticReading, evaluateHealthRules } from '../services/aiAnalysis';
import type { Activity, AlertItem, HealthStatus, ScenarioType, SensorReading } from '../types';

interface SimulationState {
  page: string;
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  behavior: Activity;
  xRayView: boolean;
  showBolus: boolean;
  scenario: ScenarioType;
  selectedComponent: string;
  lockCamera: boolean;
  demoStep: number;
  isGuidedDemo: boolean;
  simulationClock: number;
  readings: SensorReading[];
  alerts: AlertItem[];
  currentHealthStatus: HealthStatus;
  currentActivity: Activity;
  temperatureC: number;
  movementIndex: number;
  connectionStatus: string;
  lastTransmission: string;
  setPage: (page: string) => void;
  setSpeed: (speed: 1 | 2 | 5) => void;
  togglePlay: () => void;
  setBehavior: (behavior: Activity) => void;
  setScenario: (scenario: ScenarioType) => void;
  setXRayView: (value: boolean) => void;
  toggleBolus: () => void;
  setSelectedComponent: (label: string) => void;
  resetSimulation: () => void;
  advanceSimulation: () => void;
  setGuidedDemo: (active: boolean, step?: number) => void;
  acknowledgeAlert: (id: string) => void;
}

const initialReading = buildSyntheticReading(0, 'normal', 'Grazing');

export const useSimulationStore = create<SimulationState>((set, get) => ({
  page: 'Live Cow Simulation',
  isPlaying: true,
  speed: 1,
  behavior: 'Grazing',
  xRayView: false,
  showBolus: true,
  scenario: 'normal',
  selectedComponent: 'ESP32-C3 MCU',
  lockCamera: false,
  demoStep: 0,
  isGuidedDemo: false,
  simulationClock: 0,
  readings: [initialReading],
  alerts: initialAlerts,
  currentHealthStatus: 'Healthy',
  currentActivity: 'Grazing',
  temperatureC: initialReading.temperatureC,
  movementIndex: initialReading.movementIndex,
  connectionStatus: 'Connected',
  lastTransmission: 'now',
  setPage: (page) => set({ page }),
  setSpeed: (speed) => set({ speed }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setBehavior: (behavior) => set({ behavior, currentActivity: behavior }),
  setScenario: (scenario) => set({ scenario }),
  setXRayView: (value) => set({ xRayView: value }),
  toggleBolus: () => set((state) => ({ showBolus: !state.showBolus })),
  setSelectedComponent: (label) => set({ selectedComponent: label }),
  resetSimulation: () => {
    const resetReading = buildSyntheticReading(0, 'normal', 'Grazing');
    set({
      isPlaying: true,
      speed: 1,
      behavior: 'Grazing',
      xRayView: false,
      showBolus: true,
      scenario: 'normal',
      demoStep: 0,
      isGuidedDemo: false,
      simulationClock: 0,
      readings: [resetReading],
      alerts: initialAlerts,
      currentHealthStatus: 'Healthy',
      currentActivity: 'Grazing',
      temperatureC: resetReading.temperatureC,
      movementIndex: resetReading.movementIndex,
      connectionStatus: 'Connected',
      lastTransmission: 'now',
    });
  },
  advanceSimulation: () => {
    const state = get();
    const nextClock = state.simulationClock + 1;
    const generated = buildSyntheticReading(nextClock, state.scenario, state.behavior);
    const updatedReadings = [...state.readings.slice(-59), generated];
    const evaluation = evaluateHealthRules(updatedReadings, state.scenario);

    set({
      simulationClock: nextClock,
      readings: updatedReadings,
      temperatureC: generated.temperatureC,
      movementIndex: generated.movementIndex,
      currentHealthStatus: evaluation.status,
      currentActivity: state.behavior,
      lastTransmission: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      connectionStatus: 'Connected',
    });
  },
  setGuidedDemo: (active, step) => set({ isGuidedDemo: active, demoStep: step ?? 0 }),
  acknowledgeAlert: (id) => set((state) => ({ alerts: state.alerts.map((alert) => alert.id === id ? { ...alert, read: true } : alert) })),
}));

export const getLatestReading = () => {
  const { readings } = useSimulationStore.getState();
  return readings[readings.length - 1] ?? {
    id: 0,
    time: '00:00',
    temperatureC: baseReadings.temperatureC,
    movementIndex: baseReadings.movementIndex,
    ph: baseReadings.ph,
    acceleration: baseReadings.acceleration,
    batteryPercent: baseReadings.batteryPercent,
    status: 'Healthy',
  } as SensorReading;
};
