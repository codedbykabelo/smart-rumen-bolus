import { create } from 'zustand';
import { formatSouthAfricanTime } from '../lib/time';
import type { Activity, SensorReading } from '../types';
import { analyzeCowReadings, type CowHealthAnalysis } from '../services/herdHealthAnalysis';

export const simulationPages = [
  'Live Cow Simulation',
  'Scanners',
  'Smart Health Analysis Model',
  'Farmer Dashboard',
] as const;

export type SimulationPage = (typeof simulationPages)[number];

export interface MonitoredCow {
  id: string;
  tag: string;
  location: string;
  activity: Activity;
  readings: SensorReading[];
  illnessStage: 'Normal' | 'Early warning' | 'Urgent veterinary warning';
}

interface SimulationState {
  page: SimulationPage;
  isPlaying: boolean;
  clock: number;
  selectedCowId: string;
  cows: MonitoredCow[];
  setPage: (page: SimulationPage) => void;
  setPlaying: (isPlaying: boolean) => void;
  selectCow: (cowId: string) => void;
  advanceSimulation: () => void;
}

const cowSeeds = [
  { id: 'COW-001', tag: 'A-101', location: 'North pasture', temperature: 38.4, movement: 0.82, ph: 6.72, activity: 'Grazing' as Activity },
  { id: 'COW-002', tag: 'A-102', location: 'Water trough', temperature: 38.8, movement: 0.61, ph: 6.58, activity: 'Walking' as Activity },
  { id: 'COW-003', tag: 'B-214', location: 'Shade paddock', temperature: 38.6, movement: 0.74, ph: 6.66, activity: 'Ruminating' as Activity },
  { id: 'COW-004', tag: 'B-316', location: 'West field', temperature: 39.0, movement: 0.52, ph: 6.43, activity: 'Resting' as Activity },
  { id: 'COW-005', tag: 'C-405', location: 'South pasture', temperature: 38.2, movement: 0.91, ph: 6.81, activity: 'Grazing' as Activity },
] as const;

function makeReading(
  id: number,
  timestamp: string,
  temperatureC: number,
  movementIndex: number,
  ph: number,
): SensorReading {
  return {
    id,
    time: timestamp,
    temperatureC: Number(temperatureC.toFixed(1)),
    movementIndex: Number(Math.max(0, Math.min(1, movementIndex)).toFixed(2)),
    ph: Number(ph.toFixed(2)),
    acceleration: { x: 0.12, y: -0.07, z: 0.94 },
    batteryPercent: 92,
    status: 'Healthy',
  };
}

function initialTimestamp(minutesAgo: number): string {
  const time = new Date(Date.now() - minutesAgo * 60_000);
  return formatSouthAfricanTime(time);
}

function makeInitialCows(): MonitoredCow[] {
  return cowSeeds.map((seed, cowIndex) => ({
    id: seed.id,
    tag: seed.tag,
    location: seed.location,
    activity: seed.activity,
    illnessStage: 'Normal',
    readings: Array.from({ length: 6 }, (_, index) => {
      const initialTick = index - 5;
      const temperatureOffset = Math.sin((index + cowIndex) * 0.8) * 0.12;
      const movementOffset = Math.cos((index + cowIndex) * 0.75) * 0.06;
      return makeReading(
        index,
        initialTimestamp((5 - index) * 2),
        seed.id === 'COW-001' ? 38.5 + Math.sin(initialTick * 0.45) * 0.12 : seed.temperature + temperatureOffset,
        seed.id === 'COW-001' ? 0.81 + Math.cos(initialTick * 0.4) * 0.045 : seed.movement + movementOffset,
        seed.id === 'COW-001' ? 6.72 + Math.sin(initialTick * 0.25) * 0.035 : seed.ph + Math.sin((index + cowIndex) * 0.55) * 0.05 + initialTick * 0.002,
      );
    }),
  }));
}

function getStage(tick: number): MonitoredCow['illnessStage'] {
  if (tick >= 20) return 'Urgent veterinary warning';
  if (tick >= 8) return 'Early warning';
  return 'Normal';
}

function getAutomaticActivity(tick: number, illnessStage: MonitoredCow['illnessStage']): Activity {
  if (illnessStage === 'Urgent veterinary warning') return 'Resting';
  if (illnessStage === 'Early warning') {
    const earlyCycle: Activity[] = ['Walking', 'Resting', 'Looking around'];
    return earlyCycle[Math.floor(tick / 4) % earlyCycle.length];
  }
  const cycle: Activity[] = ['Grazing', 'Grazing', 'Walking', 'Walking', 'Drinking', 'Drinking', 'Resting', 'Looking around'];
  return cycle[tick % cycle.length];
}

function getCowOneReading(tick: number, timestamp: string, previous: SensorReading): SensorReading {
  const stage = getStage(tick);
  const elapsedEarly = Math.max(0, tick - 8);
  if (stage === 'Normal') {
    return makeReading(
      tick + 6,
      timestamp,
      38.5 + Math.sin(tick * 0.45) * 0.12,
      0.81 + Math.cos(tick * 0.4) * 0.045,
      6.72 + Math.sin(tick * 0.25) * 0.035,
    );
  }
  if (stage === 'Early warning') {
    return makeReading(
      tick + 6,
      timestamp,
      38.6 + elapsedEarly * 0.11,
      0.79 - elapsedEarly * 0.032,
      6.7 - elapsedEarly * 0.012,
    );
  }
  return makeReading(
    tick + 6,
    timestamp,
    Math.min(40.5, Math.max(40.0, previous.temperatureC + 0.025)),
    Math.max(0.2, previous.movementIndex - 0.01),
    Math.max(6.1, previous.ph - 0.005),
  );
}

function addReading(cow: MonitoredCow, tick: number, timestamp: string): MonitoredCow {
  const previous = cow.readings[cow.readings.length - 1];
  const phase = tick + cow.id.charCodeAt(cow.id.length - 1);
  const reading = cow.id === 'COW-001'
    ? getCowOneReading(tick, timestamp, previous)
    : makeReading(
      tick + 6,
      timestamp,
      previous.temperatureC + Math.sin(phase * 0.65) * 0.08,
      previous.movementIndex + Math.cos(phase * 0.55) * 0.045,
      previous.ph + Math.sin(phase * 0.45) * 0.025,
    );
  const readings = [...cow.readings.slice(-59), reading];
  const assessment = analyzeCowReadings(readings);
  const illnessStage = cow.id === 'COW-001' ? getStage(tick) : 'Normal';
  const activity = cow.id === 'COW-001' ? getAutomaticActivity(tick, illnessStage) : cow.activity;
  return {
    ...cow,
    activity,
    illnessStage,
    readings: readings.map((item, index) => index === readings.length - 1 ? { ...item, status: assessment.riskLevel } : item),
  };
}

export function getLatestCowReading(cow: MonitoredCow): SensorReading {
  return cow.readings[cow.readings.length - 1];
}

export function getPreviousCowReading(cow: MonitoredCow): SensorReading {
  return cow.readings[cow.readings.length - 2] ?? getLatestCowReading(cow);
}

function computeCowHealthAnalysis(cow: MonitoredCow): CowHealthAnalysis {
  const assessment = analyzeCowReadings(cow.readings);
  if (cow.id !== 'COW-001' || cow.illnessStage === 'Normal') return assessment;
  return {
    ...assessment,
    concern: `${assessment.concern} · suspected-FMD demonstration scenario`,
    explanation: `This is the staged simulated suspected-FMD demonstration. ${assessment.explanation} These nonspecific signals do not confirm FMD.`,
  };
}

// Immutable cow records change only when a new reading arrives; old entries are GC eligible.
const assessmentCache = new WeakMap<MonitoredCow, CowHealthAnalysis>();
export function getCowHealthAnalysis(cow: MonitoredCow): CowHealthAnalysis {
  let result = assessmentCache.get(cow);
  if (!result) { result = computeCowHealthAnalysis(cow); assessmentCache.set(cow, result); }
  return result;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  page: 'Live Cow Simulation',
  isPlaying: true,
  clock: 0,
  selectedCowId: 'COW-001',
  cows: makeInitialCows(),
  setPage: (page) => set({ page }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  selectCow: (selectedCowId) => set({ selectedCowId }),
  advanceSimulation: () => {
    const state = get();
    const tick = state.clock + 1;
    const timestamp = formatSouthAfricanTime(new Date());
    set({
      clock: tick,
      cows: state.cows.map((cow) => addReading(cow, tick, timestamp)),
    });
  },
}));
