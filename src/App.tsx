import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Bell,
  CloudSun,
  Gauge,
  MapPinned,
  Pause,
  Play,
  Thermometer,
  Waves,
  Wifi,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { appPages, bolusComponents, herdProfiles, transmissionPackets } from './data/mockData';
import { CowPasture } from './components/CowPasture';
import { evaluateHealthRules, getScenarioLabel } from './services/aiAnalysis';
import { useSimulationStore } from './store/useSimulationStore';
import type { ScenarioType } from './types';

const scenarioOptions: { value: ScenarioType; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'fmd', label: 'Foot-and-mouth' },
  { value: 'heartwater', label: 'Heartwater' },
  { value: 'redwater', label: 'Redwater' },
  { value: 'acidosis', label: 'Ruminal acidosis' },
];

function App() {
  const [cowAssetInstalled, setCowAssetInstalled] = useState<boolean | null>(null);
  const {
    page,
    isPlaying,
    speed,
    behavior,
    xRayView,
    showBolus,
    scenario,
    selectedComponent,
    simulationClock,
    readings,
    alerts,
    currentHealthStatus,
    currentActivity,
    temperatureC,
    movementIndex,
    connectionStatus,
    lastTransmission,
    isGuidedDemo,
    demoStep,
    setPage,
    togglePlay,
    setSpeed,
    setBehavior,
    setScenario,
    setXRayView,
    toggleBolus,
    setSelectedComponent,
    resetSimulation,
    advanceSimulation,
    setGuidedDemo,
    acknowledgeAlert,
  } = useSimulationStore();

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      advanceSimulation();
    }, 1200 / speed);
    return () => window.clearInterval(timer);
  }, [advanceSimulation, isPlaying, speed]);

  useEffect(() => {
    fetch('/models/holstein-cow.glb', { method: 'HEAD' })
      .then((response) => {
        const contentType = response.headers.get('content-type') ?? '';
        setCowAssetInstalled(response.ok && !contentType.includes('text/html'));
      })
      .catch(() => setCowAssetInstalled(false));
  }, []);

  useEffect(() => {
    if (!isGuidedDemo) return;
    const sequence: Array<{ scenario: ScenarioType; behavior: 'Grazing' | 'Walking' | 'Resting' | 'Lying down'; xRayView: boolean }> = [
      { scenario: 'normal', behavior: 'Grazing', xRayView: false },
      { scenario: 'normal', behavior: 'Grazing', xRayView: false },
      { scenario: 'normal', behavior: 'Walking', xRayView: false },
      { scenario: 'normal', behavior: 'Resting', xRayView: false },
      { scenario: 'fmd', behavior: 'Resting', xRayView: true },
      { scenario: 'fmd', behavior: 'Lying down', xRayView: true },
    ];
    const step = sequence[Math.min(demoStep, sequence.length - 1)];
    setBehavior(step.behavior);
    setScenario(step.scenario);
    setXRayView(step.xRayView);

    if (demoStep >= sequence.length - 1) {
      const timer = window.setTimeout(() => setGuidedDemo(false, 0), 1200);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => setGuidedDemo(true, demoStep + 1), 1500);
    return () => window.clearTimeout(timer);
  }, [demoStep, isGuidedDemo, setBehavior, setGuidedDemo, setScenario, setXRayView]);

  const chartData = useMemo(
    () => readings.map((reading, index) => ({
      time: reading.time || `T${index}`,
      temp: reading.temperatureC,
      movement: reading.movementIndex,
      ph: reading.ph,
    })),
    [readings],
  );

  const healthAssessment = useMemo(() => evaluateHealthRules(readings, scenario), [readings, scenario]);
  const urgentCount = alerts.filter((alert) => alert.type === 'urgent').length;
  const healthyCount = herdProfiles.filter((cow) => cow.health === 'Healthy').length;
  const attentionCount = herdProfiles.filter((cow) => cow.health === 'Monitoring' || cow.health === 'Attention').length;

  const moveGuidedDemo = (direction: 'next' | 'previous') => {
    if (!isGuidedDemo) {
      setGuidedDemo(true, 0);
      return;
    }
    const nextStep = Math.max(0, Math.min(demoStep + (direction === 'next' ? 1 : -1), 5));
    setGuidedDemo(true, nextStep);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-16 shrink-0 border-r border-slate-800 bg-slate-900/80 p-2 xl:w-72 xl:p-5">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 text-slate-950 shadow-lg shadow-emerald-500/30">
              <CloudSun className="h-5 w-5" />
            </div>
            <div className="hidden xl:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-300">DEMO MODE</div>
              <div className="text-xl font-semibold text-white">RumiGuard</div>
            </div>
          </div>

          <nav className="space-y-2">
            {appPages.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                title={item}
                className={`flex w-full items-center justify-center rounded-xl border px-2 py-2.5 text-left text-sm transition xl:justify-between xl:px-3 ${
                  page === item ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100' : 'border-slate-800 bg-slate-950/40 text-slate-300'
                }`}
              >
                <span className="hidden xl:inline">{item}</span>
                <span className="text-slate-400">→</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 hidden rounded-2xl border border-slate-700 bg-slate-950/60 p-4 xl:block">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
              <span>Simulation</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">{isPlaying ? 'Live' : 'Paused'}</span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <div className="flex justify-between"><span>Cow</span><strong>COW-008</strong></div>
              <div className="flex justify-between"><span>Status</span><strong>{currentHealthStatus}</strong></div>
              <div className="flex justify-between"><span>Clock</span><strong>{simulationClock}s</strong></div>
              <div className="flex justify-between"><span>Page</span><strong>{page}</strong></div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden">
          <header className="border-b border-slate-800 bg-slate-950/80 px-5 py-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Livestock intelligence</div>
                <h1 className="mt-1 text-2xl font-semibold text-white">RumiGuard Early Warning System</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={togglePlay} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button type="button" onClick={() => setGuidedDemo(true, 0)} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-medium text-slate-950">Start Guided Demo</button>
                {isGuidedDemo && (
                  <>
                    <button type="button" onClick={() => moveGuidedDemo('previous')} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">Previous</button>
                    <button type="button" onClick={() => moveGuidedDemo('next')} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">Next</button>
                    <button type="button" onClick={() => setGuidedDemo(false, 0)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">Pause</button>
                    <button type="button" onClick={() => { resetSimulation(); setGuidedDemo(true, 0); }} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm">Restart</button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
              <MetricTile label="Cow ID" value="COW-008" />
              <MetricTile label="Current activity" value={currentActivity} />
              <MetricTile label="Temperature" value={`${temperatureC.toFixed(1)}°C`} />
              <MetricTile label="Movement" value={movementIndex.toFixed(2)} />
              <MetricTile label="Connection" value={connectionStatus} accent="emerald" />
              <MetricTile label="Last TX" value={lastTransmission} />
            </div>
          </header>

          <div className="space-y-6 p-6">
            {page === 'Live Cow Simulation' && (
              <div className="grid gap-6 xl:grid-cols-[1.7fr_0.7fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Farm environment</div>
                      <h2 className="mt-1 text-xl font-semibold text-white">Live cow simulation</h2>
                      <p className="mt-1 text-xs text-slate-300">
                        {cowAssetInstalled === true
                          ? 'Local Holstein GLB found.'
                          : cowAssetInstalled === false
                            ? 'Cow asset not installed. Download the CC BY 4.0 Holstein cow by 3Dima and save it as public/models/holstein-cow.glb: '
                            : 'Checking local cow asset… '}
                        {cowAssetInstalled !== true && cowAssetInstalled !== null && (
                          <a
                            className="text-emerald-300 underline underline-offset-2"
                            href="https://sketchfab.com/3d-models/realistic-holstein-cow-game-ready-asset-0bd2f1c0c79a4b5b9d36e67f0f700c5e"
                            target="_blank"
                            rel="noreferrer"
                          >
                            licensed                             Sketchfab download page
                          </a>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs text-slate-300">
                      {[1,2,5].map((value) => (
                        <button key={value} type="button" onClick={() => setSpeed(value as 1|2|5)} className={`rounded-lg border px-2 py-1 ${speed === value ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200' : 'border-slate-700'}`}>
                          {value}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-[520px] overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,#14251b_0%,#0f172a_35%,#020617_100%)]">
                    <Canvas
                      shadows
                      frameloop="always"
                      dpr={[1, 1.15]}
                      camera={{ position: [4.2, 2.8, 6.2], fov: 38, near: 0.1, far: 60 }}
                      gl={{ powerPreference: 'low-power', antialias: false }}
                    >
                      <CowPasture
                        xRayView={xRayView}
                        showBolus={showBolus}
                        activity={behavior}
                        onBolusClick={() => {
                          setSelectedComponent('ESP32-C3 MCU');
                          setPage('Bolus Sensor Monitoring');
                        }}
                      />
                    </Canvas>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-slate-500">Behaviour</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Grazing','Walking','Ruminating','Drinking','Resting','Lying down'] as const).map((option) => (
                        <button key={option} type="button" onClick={() => setBehavior(option)} className={`rounded-lg border px-2 py-2 text-sm ${behavior === option ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 text-slate-300'}`}>
                          {option}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                        <span>X-Ray view</span>
                        <input type="checkbox" checked={xRayView} onChange={(e) => setXRayView(e.target.checked)} />
                      </label>
                      <label className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                        <span>Smart bolus</span>
                        <input type="checkbox" checked={showBolus} onChange={() => toggleBolus()} />
                      </label>
                      <button type="button" onClick={resetSimulation} className="w-full rounded-xl border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">Reset simulation</button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-slate-500">Scenario</div>
                    <div className="space-y-2">
                      {scenarioOptions.map((option) => (
                        <button key={option.value} type="button" onClick={() => setScenario(option.value as ScenarioType)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ${scenario === option.value ? 'border-slate-500 bg-slate-800 text-white' : 'border-slate-700 text-slate-300'}`}>
                          <span>{option.label}</span>
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === 'Bolus Sensor Monitoring' && (
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Bolus cutaway</div>
                      <h2 className="mt-1 text-xl font-semibold text-white">Internal electronics</h2>
                    </div>
                    <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200">Wi-Fi demo</div>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {bolusComponents.map((component) => (
                        <button key={component} type="button" onClick={() => setSelectedComponent(component)} className={`rounded-xl border p-3 text-left text-sm ${selectedComponent === component ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100' : 'border-slate-700 bg-slate-900/70 text-slate-200'}`}>
                          {component}
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-center">
                      <div className="relative h-52 w-52 rounded-[36%] border border-emerald-500/50 bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-950 p-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <div className="absolute inset-4 rounded-[28%] border border-emerald-400/70" />
                        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-500/60 bg-amber-500/10" />
                        <div className="absolute inset-x-10 top-7 h-8 rounded-full bg-white/5" />
                        <div className="absolute inset-x-14 bottom-11 h-14 rounded-full bg-emerald-500/20 blur-md" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <InfoPanel icon={<Thermometer className="h-4 w-4" />} title="Temperature" value={`${temperatureC.toFixed(1)}°C`} note="Normal baseline 38.5°C. Drinking water can cause short-term rises." />
                  <InfoPanel icon={<Gauge className="h-4 w-4" />} title="Movement" value={`ACC ${movementIndex.toFixed(2)}`} note="Activity index is an estimate from internal accelerometer data, not a direct chewing or lameness diagnosis." />
                  <InfoPanel icon={<Waves className="h-4 w-4" />} title="Future pH-enabled bolus" value={`pH ${readings[readings.length - 1]?.ph.toFixed(2) ?? '6.70'}`} note="Abnormal acidity warning requires a suitable pH sensor and veterinary interpretation." />
                </div>
              </div>
            )}

            {page === 'AI Health Analysis' && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Demonstration intelligence</div>
                      <h2 className="mt-1 text-xl font-semibold text-white">Prototype Health Analysis</h2>
                    </div>
                    <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">rule-based AI</div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    {['Sensor data received','Data validated','Baseline compared','Abnormal patterns identified','Risk assessed','Farmer notification generated'].map((stage, index) => (
                      <div key={stage} className={`rounded-2xl border p-3 ${index < 5 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-50' : 'border-slate-700 bg-slate-950/60 text-slate-300'}`}>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Stage {index + 1}</div>
                        <div className="mt-2 text-sm font-medium">{stage}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-slate-500">Disease selector</div>
                    <div className="space-y-2">
                      {scenarioOptions.map((option) => (
                        <button key={option.value} type="button" onClick={() => setScenario(option.value as ScenarioType)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${scenario === option.value ? 'border-red-500/40 bg-red-500/10 text-red-100' : 'border-slate-700 bg-slate-950/60 text-slate-200'}`}>
                          <span>{option.label}</span>
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">AI explanation panel</div>
                        <h3 className="mt-1 text-xl font-semibold text-white">{getScenarioLabel(scenario)}</h3>
                      </div>
                      <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${healthAssessment.status === 'Urgent' ? 'bg-red-500/15 text-red-200' : healthAssessment.status === 'Attention' ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>
                        {healthAssessment.status}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Current status</div><div className="mt-2 text-lg font-semibold text-white">{healthAssessment.status}</div></div>
                      <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Risk category</div><div className="mt-2 text-lg font-semibold text-white">{healthAssessment.riskCategory}</div></div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Abnormal readings</div>
                      <ul className="mt-2 space-y-2 text-sm text-slate-200">
                        {healthAssessment.abnormalReadings.length > 0 ? healthAssessment.abnormalReadings.map((item) => <li key={item}>• {item}</li>) : <li>• No current abnormal readings detected.</li>}
                      </ul>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Trend</div><div className="mt-2 text-sm text-slate-200">{healthAssessment.trendComparison}</div></div>
                      <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Contributing factors</div><ul className="mt-2 space-y-2 text-sm text-slate-200">{healthAssessment.contributingFactors.map((factor) => <li key={factor}>• {factor}</li>)}</ul></div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-100">
                      {scenario === 'fmd' ? 'Urgent veterinary assessment required — signs compatible with possible FMD.' : healthAssessment.explanation}
                    </div>
                    <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100">{healthAssessment.recommendedAction}</div>
                  </div>
                </div>
              </div>
            )}

            {page === 'Farmer Dashboard' && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard label="Total cattle" value={String(herdProfiles.length)} tone="neutral" />
                  <MetricCard label="Healthy" value={String(healthyCount)} tone="success" />
                  <MetricCard label="Cattle requiring attention" value={String(attentionCount)} tone="warning" />
                  <MetricCard label="Urgent alerts" value={String(urgentCount)} tone="urgent" />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-white">Herd overview</h2>
                      <button type="button" className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-200">Export</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm text-slate-200">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2">Cow</th>
                            <th>Activity</th>
                            <th>Temp</th>
                            <th>Status</th>
                            <th>Last</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {herdProfiles.map((cow) => (
                            <tr key={cow.id} className="border-b border-slate-800/80">
                              <td className="py-3 font-medium text-white">{cow.id}</td>
                              <td>{cow.activity}</td>
                              <td>{cow.temperature.toFixed(1)}°C</td>
                              <td><span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.15em] ${cow.health === 'Urgent' ? 'bg-red-500/15 text-red-200' : cow.health === 'Monitoring' ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'}`}>{cow.health}</span></td>
                              <td>{cow.lastReading}</td>
                              <td><button type="button" className="rounded-lg border border-slate-700 px-2 py-1 text-xs">View</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Notifications</div>
                        <h2 className="mt-1 text-xl font-semibold text-white">Farmer action centre</h2>
                      </div>
                      <Bell className="h-4 w-4 text-amber-300" />
                    </div>
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div key={alert.id} className={`rounded-2xl border p-3 ${alert.type === 'urgent' ? 'border-red-500/30 bg-red-500/10' : alert.type === 'warning' ? 'border-amber-500/30 bg-amber-500/10' : 'border-slate-700 bg-slate-950/60'}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-white">{alert.title}</div>
                            {!alert.read && <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">{alert.timestamp}</div>
                          <div className="mt-2 text-sm text-slate-200">{alert.message}</div>
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <button type="button" onClick={() => acknowledgeAlert(alert.id)} className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200">{alert.read ? 'Acknowledged' : 'Acknowledge'}</button>
                            <button type="button" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100">View cow</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === 'Outbreak Monitoring' && (
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Herd outbreak map</div>
                      <h2 className="mt-1 text-xl font-semibold text-white">Potential cluster monitoring</h2>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200"><MapPinned className="h-3.5 w-3.5" /> exposure watch</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {['North pasture','Water trough','Shade area','Holding pen','Gate lane','South pasture'].map((zone, index) => (
                      <div key={zone} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{zone}</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{index % 2 === 0 ? '3' : '2'}</div>
                        <div className="mt-1 text-xs text-slate-300">animals watched</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Timeline of abnormal readings</div>
                    <div className="mt-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                          <XAxis dataKey="time" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip />
                          <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                          <Line type="monotone" dataKey="movement" stroke="#34d399" strokeWidth={2.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Warning summary</div>
                    <div className="mt-2 text-2xl font-semibold text-white">4 animals requiring observation</div>
                    <div className="mt-2 text-sm text-slate-300">Clustering is an early-warning signal, not proof of infectious transmission.</div>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Alert intensity</div>
                    <div className="mt-3 h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" data={[{name:'Healthy',value:70},{name:'Monitoring',value:20},{name:'Urgent',value:10}]} innerRadius={42} outerRadius={70} paddingAngle={2}>
                            {['#34d399','#fbbf24','#ef4444'].map((color) => <Cell key={color} fill={color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Live sensor feed</div>
                    <h2 className="mt-1 text-xl font-semibold text-white">Temperature and activity</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> connected</div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="tempFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                      <XAxis dataKey="time" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Area type="monotone" dataKey="temp" stroke="#f59e0b" fill="url(#tempFill)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-slate-500">Transmission</div>
                <div className="space-y-3">
                  {transmissionPackets.map((packet) => (
                    <div key={packet.packetId} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between text-sm text-white">
                        <span>{packet.packetId}</span>
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-emerald-200">{packet.status}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">{packet.timestamp} • {packet.cowId}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/60 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500"><Wifi className="h-3.5 w-3.5" /> Hardware integration</div>
                  <div className="text-sm text-slate-200">Hardware disconnected. Simulation mode remains active while a future ESP32 payload can be posted to POST /api/readings.</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricTile({ label, value, accent = 'slate' }: { label: string; value: string; accent?: 'slate' | 'emerald' }) {
  const styles = accent === 'emerald' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-slate-800 bg-slate-900/80 text-white';
  return (
    <div className={`rounded-xl border p-3 ${styles}`}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function MetricCard({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'warning' | 'success' | 'urgent' }) {
  const styles = {
    neutral: 'border-slate-700 bg-slate-900/80 text-slate-100',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
    urgent: 'border-red-500/40 bg-red-500/10 text-red-100',
  };
  return (
    <div className={`rounded-3xl border p-4 ${styles[tone]}`}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoPanel({ icon, title, value, note }: { icon: React.ReactNode; title: string; value: string; note: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">{icon} {title}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-300">{note}</div>
    </div>
  );
}

export default App;
