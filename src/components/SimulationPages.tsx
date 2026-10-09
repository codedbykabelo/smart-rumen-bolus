import { useState } from 'react';
import { CowPicture } from './CowPicture';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  HeartPulse,
  Thermometer,
  Waves,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Canvas } from '@react-three/fiber';
import { CowPasture } from './CowPasture';
import type { CowAnimationReport } from './CowPasture';
import type { Activity as CowActivity, HealthStatus, SensorReading } from '../types';
import {
  getCowHealthAnalysis,
  getLatestCowReading,
  getPreviousCowReading,
  type MonitoredCow,
} from '../store/useSimulationStore';

const activities: CowActivity[] = ['Grazing', 'Walking', 'Drinking', 'Resting', 'Looking around'];

function formatReading(value: number, sensor: 'temperature' | 'movement' | 'ph'): string {
  if (sensor === 'temperature') return `${value.toFixed(1)}°C`;
  return sensor === 'ph' ? value.toFixed(2) : value.toFixed(2);
}

function getSensorValue(reading: SensorReading, sensor: 'temperature' | 'movement' | 'ph'): number {
  if (sensor === 'temperature') return reading.temperatureC;
  if (sensor === 'movement') return reading.movementIndex;
  return reading.ph;
}

function getTrend(delta: number): { label: string; className: string; Icon: typeof ArrowRight } {
  if (delta > 0.035) return { label: 'Rising', className: 'text-amber-300', Icon: ArrowUpRight };
  if (delta < -0.035) return { label: 'Falling', className: 'text-sky-300', Icon: ArrowDownRight };
  return { label: 'Stable', className: 'text-emerald-300', Icon: ArrowRight };
}

function RiskBadge({ risk }: { risk: HealthStatus }) {
  const style = risk === 'Urgent'
    ? 'border-rose-400/40 bg-rose-400/10 text-rose-200'
    : risk === 'Attention'
      ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
      : risk === 'Monitoring'
        ? 'border-sky-400/40 bg-sky-400/10 text-sky-200'
        : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}>{risk}</span>;
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-800 bg-slate-900/75 p-4 shadow-lg shadow-slate-950/20 sm:p-5 ${className}`}>{children}</section>;
}

function SimulatedPill() {
  return <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">Simulated data</span>;
}

export function LiveSimulationPage({
  cow,
  cowAssetAvailable,
  modelLoadFailed,
  animationReport,
  onCowModelError,
  onAnimationReport,
  onSelectCow,
  cows,
}: {
  cow: MonitoredCow;
  cows: MonitoredCow[];
  cowAssetAvailable: boolean;
  modelLoadFailed: boolean;
  animationReport: CowAnimationReport | null;
  onCowModelError: () => void;
  onAnimationReport: (report: CowAnimationReport) => void;
  onSelectCow: (cowId: string) => void;
}) {
  const [cowView, setCowView] = useState<'3d' | 'picture'>('3d');
  const [transparentStomach, setTransparentStomach] = useState(true);
  const reading = getLatestCowReading(cow);
  const assessment = getCowHealthAnalysis(cow);
  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.55fr)]">
      <Panel className="min-w-0">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Pasture monitoring</div>
            <h2 className="mt-1 text-xl font-semibold text-white">Live Cow Simulation</h2>
            <p className="mt-1 text-sm text-slate-400">Holstein model with embedded grazing, walking, and idle animation clips.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="scene-cow-selector">Select cow to observe</label>
            <select
              id="scene-cow-selector"
              value={cow.id}
              onChange={(event) => onSelectCow(event.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              {cows.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.tag}</option>)}
            </select>
            <span className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">{cowView === '3d' ? '3D DIGESTIVE ASSET REQUIRED' : 'EDUCATIONAL CUTAWAY'}</span>
          </div>
        </div>
        <div className="relative h-[min(67vh,620px)] min-h-[380px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-lg border border-slate-700 bg-slate-950/90 p-1 text-[10px] backdrop-blur" role="group" aria-label="Cow view">
            <button type="button" aria-pressed={cowView === '3d'} onClick={() => setCowView('3d')} className={`rounded-md px-2.5 py-1.5 font-semibold transition ${cowView === '3d' ? 'bg-emerald-400/15 text-emerald-100' : 'text-slate-400 hover:text-white'}`}>Animated 3D</button>
            <button type="button" aria-pressed={cowView === 'picture'} onClick={() => setCowView('picture')} className={`rounded-md px-2.5 py-1.5 font-semibold transition ${cowView === 'picture' ? 'bg-emerald-400/15 text-emerald-100' : 'text-slate-400 hover:text-white'}`}>Realistic picture</button>
          </div>
          {cowView === 'picture' ? <>
            <CowPicture transparentStomach={transparentStomach} />
            <label className="absolute right-3 top-14 z-10 flex items-center gap-2 sm:top-3 rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 py-2 text-[10px] text-emerald-100 backdrop-blur">
              <input type="checkbox" checked={transparentStomach} onChange={(event) => setTransparentStomach(event.target.checked)} className="accent-emerald-400" />
              Transparent stomach
            </label>
            <div className="absolute bottom-12 right-3 max-w-[min(340px,70%)] rounded-lg border border-amber-300/25 bg-slate-950/80 px-3 py-2 text-[10px] leading-relaxed text-amber-100/90 backdrop-blur sm:bottom-3" role="status">Still educational illustration · capsule shown inside the reticulum. Use Animated 3D for the existing moving cow.</div>
          </> : <>
          <Canvas
            shadows
            frameloop="always"
            dpr={[1, 1.15]}
            camera={{ position: [0, 2.9, 7.4], fov: 38, near: 0.1, far: 60 }}
            gl={{ powerPreference: 'low-power', antialias: false }}
          >
            <CowPasture
              cowAssetAvailable={cowAssetAvailable}
              onCowModelError={onCowModelError}
              xRayView={false}
              activity={cow.activity}
              illnessStage={cow.illnessStage}
              isInspectingBolus={false}
              onAnimationReport={onAnimationReport}
            />
          </Canvas>
          {cowAssetAvailable && !animationReport && !modelLoadFailed && <div className="absolute inset-x-4 top-16 rounded-xl border border-sky-300/30 bg-slate-950/85 p-3 text-sm text-sky-100" role="status">Loading the Holstein model and its animation clips…</div>}
          {modelLoadFailed && <div className="absolute inset-x-4 top-16 rounded-xl border border-rose-300/30 bg-slate-950/90 p-3 text-sm text-rose-100" role="alert">The hosted cow model was found but could not be loaded.</div>}
          {animationReport && <div className="absolute right-3 top-3 max-w-64 rounded-lg border border-slate-700/70 bg-slate-950/75 px-3 py-2 text-[10px] text-slate-300 backdrop-blur">Model clips: {animationReport.clipNames.join(', ') || 'none'}{animationReport.missingActivities.length > 0 ? ` · no dedicated ${animationReport.missingActivities.join(', ')} clips` : ''}</div>}
          <div className="absolute bottom-3 right-3 max-w-[min(340px,70%)] rounded-lg border border-amber-300/25 bg-slate-950/80 px-3 py-2 text-[10px] leading-relaxed text-amber-100/90 backdrop-blur" role="status">
            Four-compartment 3D anatomy is not installed. The external stomach overlay has been removed; no substitute anatomy is shown.
          </div>
          </>}
          <div className="absolute bottom-3 left-3 rounded-lg border border-emerald-100/20 bg-slate-950/70 px-3 py-2 text-xs text-emerald-100 backdrop-blur">
            <span className="font-semibold">{cow.id}</span><span className="mx-2 text-slate-500">·</span>{cow.location}<span className="mx-2 text-slate-500">·</span>{cow.activity}
          </div>
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Selected animal</div>
              <h3 className="mt-1 text-2xl font-semibold text-white">{cow.id}</h3>
              <div className="text-sm text-slate-400">Tag {cow.tag} · {cow.location}</div>
            </div>
            <SimulatedPill />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <ReadingTile label="Temperature" value={formatReading(reading.temperatureC, 'temperature')} icon={<Thermometer />} />
            <ReadingTile label="Movement" value={formatReading(reading.movementIndex, 'movement')} icon={<Activity />} />
            <ReadingTile label="Rumen pH" value={formatReading(reading.ph, 'ph')} icon={<Waves />} />
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Health status</div>
              <div className="mt-2"><RiskBadge risk={assessment.riskLevel} /></div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">Last update {reading.time} · all readings are simulated</div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white">Automatic behaviour</h3>
              <p className="mt-1 text-xs text-slate-400">The simulation cycles through activities; walking moves the cow within the pasture.</p>
            </div>
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-200">AUTO</span>
          </div>
          <div className={`mt-3 rounded-xl border p-3 text-xs ${cow.illnessStage === 'Urgent veterinary warning' ? 'border-rose-400/35 bg-rose-400/5 text-rose-100' : cow.illnessStage === 'Early warning' ? 'border-amber-400/35 bg-amber-400/5 text-amber-100' : 'border-emerald-400/25 bg-emerald-400/5 text-emerald-100'}`}>
            <div className="font-semibold">COW-001 simulated suspected-FMD scenario · {cow.id === 'COW-001' ? cow.illnessStage : 'COW-001 is progressing in the background'}</div>
            <div className="mt-1 text-[11px] opacity-80">Stage order: Normal → Early warning → Urgent veterinary warning. This is a demonstration, not a disease diagnosis.</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {activities.map((activity) => (
              <span key={activity} className={`rounded-full border px-2.5 py-1 text-xs ${cow.activity === activity ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' : 'border-slate-700 text-slate-500'}`}>
                {activity === 'Looking around' ? 'Look around' : activity}{cow.activity === activity ? ' · now' : ''}
              </span>
            ))}
          </div>
          {cow.id === 'COW-001' && cow.illnessStage !== 'Normal' && (
            <div className={`mt-3 rounded-xl border p-3 text-xs leading-relaxed ${cow.illnessStage === 'Urgent veterinary warning' ? 'border-rose-400/30 bg-rose-400/5 text-rose-100' : 'border-amber-400/30 bg-amber-400/5 text-amber-100'}`}>
              <strong>Simulated illness progression · {cow.illnessStage}</strong>
              <p className="mt-1">COW-001 is entering an illness demonstration with fever and reduced activity. This nonspecific pattern does not diagnose FMD; no lesions, drooling, or lameness are fabricated.</p>
            </div>
          )}
          {cow.activity === 'Drinking' && (
            <div className="mt-3 text-xs text-slate-500">Drinking phase: cow moves to the trough. The model has no dedicated drinking/head-lowering clip, so this phase does not fabricate one.</div>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><HeartPulse className="h-4 w-4 text-rose-300" /> Current analysis</div>
          <div className="mt-3"><RiskBadge risk={assessment.riskLevel} /></div>
          <p className="mt-2 text-sm text-slate-300">{assessment.concern}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{assessment.explanation}</p>
        </Panel>
      </div>
    </div>
  );
}

function ReadingTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-400">{icon}<span>{label}</span></div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function MovementIllustration({ value }: { value: number }) {
  return (
    <svg className="h-44 w-full" viewBox="0 0 500 180" role="img" aria-label="Illustrative reticulum motion signal, not an image of the stomach">
      <defs>
        <linearGradient id="motion-fill" x1="0" x2="1"><stop stopColor="#34d399" stopOpacity="0.06" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0.32" /></linearGradient>
      </defs>
      <path d="M15 45 C53 30 72 70 108 54 S166 36 197 57 S250 73 280 48 S335 32 366 56 S424 71 485 44" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="5 7" />
      <path d={`M15 117 ${Array.from({ length: 30 }, (_, index) => {
        const x = 15 + index * 16;
        const amplitude = 15 + value * 26;
        const y = 104 + Math.sin(index * 1.33) * amplitude * (0.55 + ((index * 7) % 10) / 18);
        return `L${x} ${y}`;
      }).join(' ')} L485 117 Z`} fill="url(#motion-fill)" />
      <path d={`M15 104 ${Array.from({ length: 30 }, (_, index) => {
        const x = 15 + index * 16;
        const amplitude = 15 + value * 26;
        const y = 104 + Math.sin(index * 1.33) * amplitude * (0.55 + ((index * 7) % 10) / 18);
        return `L${x} ${y}`;
      }).join(' ')}`} fill="none" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" className="scanner-signal" />
      <path d="M186 59 C199 45 223 44 240 52 C253 58 257 78 247 92 C236 107 208 110 192 100 C178 92 175 71 186 59Z" fill="#22d3ee" fillOpacity="0.1" stroke="#67e8f9" strokeWidth="2" />
      <path d="M193 72 C206 62 218 82 233 70 M192 86 C205 76 219 97 238 84" fill="none" stroke="#a5f3fc" strokeWidth="2" strokeLinecap="round" />
      <text x="207" y="133" fill="#94a3b8" fontSize="11">Illustrative reticulum activity region</text>
      <text x="15" y="163" fill="#64748b" fontSize="10">Motion sensor signal · simulated</text>
    </svg>
  );
}

function ScannerCard({
  title,
  description,
  children,
  icon,
  accent,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Panel className="min-w-0">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl border border-white/10 bg-white/5 p-2.5 ${accent}`}>{icon}</div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </Panel>
  );
}

export function ScannersPage({ cow }: { cow: MonitoredCow }) {
  const current = getLatestCowReading(cow);
  const previous = getPreviousCowReading(cow);
  const history = cow.readings.slice(-18);
  const movementTrend = getTrend(current.movementIndex - previous.movementIndex);
  const temperatureTrend = getTrend(current.temperatureC - previous.temperatureC);
  const phTrend = getTrend(current.ph - previous.ph);
  const graphData = history.map((reading) => ({ time: reading.time, movement: reading.movementIndex }));
  const movementChange = current.movementIndex - previous.movementIndex;
  const tempDifference = current.temperatureC - previous.temperatureC;
  const phDifference = current.ph - previous.ph;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-semibold text-white">Sensor Scanners</h2><p className="mt-1 text-sm text-slate-400">Live simulated signals for <strong className="text-slate-200">{cow.id}</strong> · last sample {current.time}</p></div>
        <SimulatedPill />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ScannerCard title="Movement Scanner" description="Acceleration and movement-pattern proxy; this sensor does not create an image of the stomach." icon={<Activity className="h-5 w-5" />} accent="text-emerald-200">
          <div className="flex items-end justify-between">
            <div><div className="text-3xl font-semibold text-white">{current.movementIndex.toFixed(2)}</div><div className="text-xs text-slate-400">movement index</div></div>
            <TrendMark trend={movementTrend} />
          </div>
          <MovementIllustration value={current.movementIndex} />
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={18} />
                <YAxis domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} width={26} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 10, fontSize: 11 }} />
                <Line dataKey="movement" name="Movement index" type="monotone" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-slate-400">Previous {previous.movementIndex.toFixed(2)} <span className="mx-1">·</span> Change {movementChange >= 0 ? '+' : ''}{movementChange.toFixed(2)}</div>
        </ScannerCard>

        <ScannerCard title="pH Scanner" description="Simulated rumen pH until compatible, calibrated pH sensor hardware is integrated." icon={<Waves className="h-5 w-5" />} accent="text-fuchsia-200">
          <div className="flex items-end justify-between">
            <div><div className="text-3xl font-semibold text-white">{current.ph.toFixed(2)} <span className="text-base font-normal text-slate-400">pH</span></div><div className="text-xs text-slate-400">current simulated value</div></div>
            <TrendMark trend={phTrend} />
          </div>
          <div className="relative mt-10 mb-8">
            <div className="h-5 rounded-full bg-gradient-to-r from-rose-500 via-orange-400 via-40% via-lime-400 to-cyan-400 shadow-[0_0_22px_rgba(163,230,53,0.2)]" />
            <div className="absolute -top-3 transition-all duration-700" style={{ left: `${Math.max(1, Math.min(99, ((current.ph - 4) / 4) * 100))}%` }}>
              <div className="-translate-x-1/2">
                <div className="mx-auto h-11 w-1 rounded bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                <div className="mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-600 bg-slate-950 px-2 py-1 text-xs font-semibold text-white">{current.ph.toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-10 flex justify-between text-[10px] text-slate-500"><span>4.0 acidic</span><span>6.0</span><span>8.0</span></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SmallValue label="Previous" value={previous.ph.toFixed(2)} />
            <SmallValue label="Change" value={`${phDifference >= 0 ? '+' : ''}${phDifference.toFixed(2)}`} />
            <SmallValue label="Trend" value={phTrend.label} />
          </div>
          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-relaxed text-amber-100/80">Simulated pH only. It is not a live measurement and must not be used for treatment decisions.</div>
        </ScannerCard>

        <ScannerCard title="Temperature Scanner" description="Color indicates the reading band; this is a visualization, not a thermal camera or real thermal scan." icon={<Thermometer className="h-5 w-5" />} accent="text-orange-200">
          <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-4">
            <div className="temperature-glow absolute inset-0 opacity-35" />
            <div className="relative flex min-h-44 flex-col items-center justify-center">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Simulated core temperature</div>
              <div className="mt-2 text-5xl font-semibold text-white">{current.temperatureC.toFixed(1)}<span className="ml-1 text-xl">°C</span></div>
              <TemperatureState value={current.temperatureC} />
              <div className="mt-3 text-xs text-slate-400">Previous {previous.temperatureC.toFixed(1)}°C <span className="mx-1">·</span> Change {tempDifference >= 0 ? '+' : ''}{tempDifference.toFixed(1)}°C</div>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 via-yellow-300 via-orange-500 to-rose-600" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            <span className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2 py-2 text-emerald-200">Normal<br />&lt; 39.4°C</span>
            <span className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-2 py-2 text-amber-200">Elevated<br />39.4–39.9°C</span>
            <span className="rounded-lg border border-rose-400/20 bg-rose-400/5 px-2 py-2 text-rose-200">Urgent<br />≥ 40.0°C</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">Trend: <span className={temperatureTrend.className}>{temperatureTrend.label}</span></div>
        </ScannerCard>
      </div>
    </div>
  );
}

function TrendMark({ trend }: { trend: ReturnType<typeof getTrend> }) {
  const { Icon } = trend;
  return <span className={`inline-flex items-center gap-1 text-xs ${trend.className}`}><Icon className="h-4 w-4" />{trend.label}</span>;
}

function SmallValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-2"><div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-sm font-semibold text-slate-100">{value}</div></div>;
}

function TemperatureState({ value }: { value: number }) {
  const state = value >= 40 ? ['Urgent warning', 'text-rose-200 border-rose-400/30 bg-rose-400/10'] : value >= 39.4 ? ['Elevated', 'text-amber-200 border-amber-400/30 bg-amber-400/10'] : ['Normal range', 'text-emerald-200 border-emerald-400/30 bg-emerald-400/10'];
  return <span className={`mt-2 rounded-full border px-3 py-1 text-xs ${state[1]}`}>{state[0]}</span>;
}

const sensorRows = [
  { key: 'temperature' as const, label: 'Temperature', unit: '°C' },
  { key: 'movement' as const, label: 'Movement', unit: 'index' },
  { key: 'ph' as const, label: 'Rumen pH', unit: 'pH' },
];

export function HealthAnalysisPage({
  cows,
  selectedCow,
  onSelectCow,
}: {
  cows: MonitoredCow[];
  selectedCow: MonitoredCow;
  onSelectCow: (cowId: string) => void;
}) {
  const reading = getLatestCowReading(selectedCow);
  const previous = getPreviousCowReading(selectedCow);
  const analysis = getCowHealthAnalysis(selectedCow);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-semibold text-white">Smart Health Analysis Model</h2><p className="mt-1 text-sm text-slate-400">Explainable rule-based comparisons of actual simulated history—not a trained AI diagnosis.</p></div>
        <SimulatedPill />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.65fr)]">
        <Panel className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-semibold text-white">Previous vs current sensor readings</h3><p className="text-xs text-slate-400">Each row compares successive timestamped records.</p></div>
            <select value={selectedCow.id} onChange={(event) => onSelectCow(event.target.value)} aria-label="Select cow for health analysis" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.id}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse text-left text-xs">
              <thead><tr className="border-b border-slate-700 text-[10px] uppercase tracking-wide text-slate-500">
                <th className="px-2 py-3">Cow ID</th><th className="px-2 py-3">Sensor type</th><th className="px-2 py-3">Previous</th><th className="px-2 py-3">Current</th><th className="px-2 py-3">Difference</th><th className="px-2 py-3">Trend</th><th className="px-2 py-3">Risk level</th><th className="px-2 py-3">Possible health concern</th><th className="px-2 py-3">Recommended action</th>
              </tr></thead>
              <tbody>
                {cows.flatMap((cow) => {
                  const current = getLatestCowReading(cow);
                  const prior = getPreviousCowReading(cow);
                  const result = getCowHealthAnalysis(cow);
                  return sensorRows.map((sensor) => {
                    const diff = getSensorValue(current, sensor.key) - getSensorValue(prior, sensor.key);
                    const trend = getTrend(diff);
                    return <tr key={`${cow.id}-${sensor.key}`} className={`border-b border-slate-800/80 align-top ${cow.id === selectedCow.id ? 'bg-slate-800/25' : ''}`}>
                      <td className="whitespace-nowrap px-2 py-3 font-semibold text-slate-200">{cow.id}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-slate-300">{sensor.label}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-slate-400">{formatReading(getSensorValue(prior, sensor.key), sensor.key)}</td>
                      <td className="whitespace-nowrap px-2 py-3 font-semibold text-white">{formatReading(getSensorValue(current, sensor.key), sensor.key)}</td>
                      <td className={`whitespace-nowrap px-2 py-3 ${trend.className}`}>{diff >= 0 ? '+' : ''}{diff.toFixed(sensor.key === 'ph' ? 2 : 2)} {sensor.unit}</td>
                      <td className="whitespace-nowrap px-2 py-3"><TrendMark trend={trend} /></td>
                      <td className="whitespace-nowrap px-2 py-3"><RiskBadge risk={result.riskLevel} /></td>
                      <td className="max-w-56 px-2 py-3 leading-relaxed text-slate-400">{result.concern}</td>
                      <td className="max-w-64 px-2 py-3 leading-relaxed text-slate-400">{result.action}</td>
                    </tr>;
                  });
                })}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">Rule-based interpretation</div>
          <h3 className="mt-1 text-xl font-semibold text-white">{selectedCow.id} analysis</h3>
          <div className="mt-3"><RiskBadge risk={analysis.riskLevel} /></div>
          <p className="mt-3 text-sm font-medium text-slate-200">{analysis.concern}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{analysis.explanation}</p>
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
            <div className="text-xs font-semibold text-slate-200">Why this warning was generated</div>
            <ul className="mt-2 space-y-2">{analysis.reasons.map((reason) => <li key={reason} className="flex gap-2 text-xs leading-relaxed text-slate-400"><span className="text-amber-300">•</span>{reason}</li>)}</ul>
            <div className="mt-3 border-t border-slate-800 pt-3 text-xs leading-relaxed text-slate-300">Current: {reading.temperatureC.toFixed(1)}°C temperature · {reading.movementIndex.toFixed(2)} movement · pH {reading.ph.toFixed(2)}. Previous sample: {previous.time}.</div>
          </div>
          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-relaxed text-amber-100/80">
            FMD, heartwater, and redwater are possible veterinary differentials only when broader clinical context supports them. Temperature, movement, and pH cannot distinguish or confirm these diseases. Seek veterinary assessment.
          </div>
          <div className="mt-3 space-y-2">
            <DifferentialScenario title="Foot-and-mouth disease" detail="Fever may accompany oral or foot lesions, drooling, and lameness; sensor readings alone are not specific." />
            <DifferentialScenario title="Heartwater" detail="Fever with neurologic or respiratory signs and tick exposure needs prompt veterinary assessment." />
            <DifferentialScenario title="Redwater" detail="Fever with dark urine, pale or yellow mucosa, or weakness warrants urgent veterinary examination." />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function DifferentialScenario({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-lg border border-slate-700/80 bg-slate-950/45 p-2.5"><div className="text-xs font-semibold text-slate-200">{title}</div><div className="mt-1 text-[11px] leading-relaxed text-slate-400">{detail}</div></div>;
}

export function FarmerDashboardPage({
  cows,
  selectedCow,
  onSelectCow,
}: {
  cows: MonitoredCow[];
  selectedCow: MonitoredCow;
  onSelectCow: (cowId: string) => void;
}) {
  const selectedReading = getLatestCowReading(selectedCow);
  const selectedHistory = selectedCow.readings.map((reading) => ({
    time: reading.time,
    temperature: reading.temperatureC,
    movement: reading.movementIndex,
    ph: reading.ph,
  }));
  const urgentCows = cows.filter((cow) => getCowHealthAnalysis(cow).riskLevel === 'Urgent');
  const attentionCount = cows.filter((cow) => getCowHealthAnalysis(cow).riskLevel === 'Attention').length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-2xl font-semibold text-white">Farmer Dashboard</h2><p className="mt-1 text-sm text-slate-400">Herd overview with shared, live simulated readings and rule-based health results.</p></div><SimulatedPill />
      </div>
      {urgentCows.length > 0 && <div className="rounded-2xl border border-rose-400/40 bg-rose-950/35 p-4 shadow-[0_0_32px_rgba(244,63,94,0.08)]" role="alert">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-rose-400/15 p-2 text-rose-200"><HeartPulse className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="font-semibold text-rose-100">Urgent health warning · {urgentCows.map((cow) => cow.id).join(', ')}</div><p className="mt-1 text-sm text-rose-100/75">Rule-based sensor alert indicates a nonspecific abnormal pattern. This is not a diagnosis; contact a veterinarian for assessment.</p></div></div>
      </div>}
      <Panel className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><h3 className="font-semibold text-white">Monitored herd</h3><div className="text-xs text-slate-400">{cows.length} cows · {attentionCount} require attention</div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Cow ID</th><th className="px-3 py-3">Temperature</th><th className="px-3 py-3">Movement</th><th className="px-3 py-3">pH</th><th className="px-3 py-3">Latest analysis</th><th className="px-3 py-3">Risk</th><th className="px-3 py-3">Last update</th>
            </tr></thead>
            <tbody>{cows.map((cow) => {
              const reading = getLatestCowReading(cow);
              const analysis = getCowHealthAnalysis(cow);
              return <tr key={cow.id} className={`cursor-pointer border-b border-slate-800/70 transition hover:bg-slate-800/40 ${selectedCow.id === cow.id ? 'bg-emerald-400/5' : ''}`} onClick={() => onSelectCow(cow.id)} onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectCow(cow.id); }
              }} tabIndex={0} aria-label={`Select ${cow.id}`}>
                <td className="px-4 py-3 font-semibold text-white">{cow.id}<div className="text-[10px] font-normal text-slate-500">{cow.tag} · {cow.location}</div></td>
                <td className="px-3 py-3 text-slate-200">{reading.temperatureC.toFixed(1)}°C</td>
                <td className="px-3 py-3 text-slate-200">{reading.movementIndex.toFixed(2)}</td>
                <td className="px-3 py-3 text-slate-200">{reading.ph.toFixed(2)}</td>
                <td className="max-w-60 px-3 py-3 text-xs text-slate-400">{analysis.concern}</td>
                <td className="px-3 py-3"><RiskBadge risk={analysis.riskLevel} /></td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">{reading.time}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="font-semibold text-white">Cow history · {selectedCow.id}</h3><p className="text-xs text-slate-400">Select a herd row to inspect its timeline.</p></div>
            <select value={selectedCow.id} onChange={(event) => onSelectCow(event.target.value)} aria-label="Select cow history" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.id}</option>)}</select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedHistory}>
                <CartesianGrid stroke="#273449" strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={22} />
                <YAxis yAxisId="temperature" domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: '#64748b', fontSize: 9 }} tickLine={false} axisLine={false} width={35} />
                <YAxis yAxisId="movement" orientation="right" domain={[0, 1]} hide />
                <YAxis yAxisId="ph" orientation="right" domain={[4, 8]} hide />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 10, fontSize: 11 }} />
                <Line yAxisId="temperature" dataKey="temperature" name="Temperature °C" type="monotone" stroke="#fb923c" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="movement" dataKey="movement" name="Movement index" type="monotone" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="ph" dataKey="ph" name="Simulated pH" type="monotone" stroke="#c084fc" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-slate-400"><span className="text-orange-300">● Temperature °C</span><span className="text-emerald-300">● Movement index</span><span className="text-purple-300">● Simulated pH</span></div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-white">SMS notification preview</h3><span className="rounded-full border border-slate-600 px-2 py-1 text-[9px] uppercase tracking-wide text-slate-400">Simulated · no SMS sent</span></div>
          {urgentCows.length > 0 ? <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-950/25 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-200">Preview for {urgentCows.map((cow) => cow.id).join(', ')}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">RumiGuard alert: {urgentCows.map((cow) => {
              const reading = getLatestCowReading(cow);
              return `${cow.id} has elevated temperature (${reading.temperatureC.toFixed(1)}°C) and/or reduced movement (${reading.movementIndex.toFixed(2)}). This is a simulated, nonspecific early warning—not a diagnosis. Please contact your veterinarian.`;
            }).join(' ')}</p>
            <div className="mt-3 border-t border-rose-400/15 pt-3 text-[10px] text-slate-500">Recipient: Farmer demo contact · Delivery: preview only</div>
          </div> : <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-100/80">No urgent warnings at this time. A simulated SMS preview will appear here if the rule-based risk becomes urgent.</div>}
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">Latest selected reading for {selectedCow.id}: {selectedReading.temperatureC.toFixed(1)}°C, movement {selectedReading.movementIndex.toFixed(2)}, pH {selectedReading.ph.toFixed(2)} at {selectedReading.time}.</div>
        </Panel>
      </div>
    </div>
  );
}
