import { Component, lazy, Suspense, useRef, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Activity, Battery, Box, ChevronRight, Layers, RotateCcw, Thermometer, Waves, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { LiveSimulationPage } from './SimulationPages';
import { getCowHealthAnalysis, getLatestCowReading, getPreviousCowReading, useSimulationStore } from '../store/useSimulationStore';
import type { BolusMode, CameraCommand } from './BolusScene';

const BolusScene = lazy(() => import('./BolusScene'));
const parts = ['Protective casing', 'Antenna', 'ESP32 controller', 'LoRa radio module', 'Temperature sensor', 'Lithium battery', 'pH probe', 'Movement sensor'];
const statusClass = (risk: string) => risk === 'Urgent' ? 'bolus-risk-urgent' : risk === 'Attention' ? 'bolus-risk-attention' : risk === 'Monitoring' ? 'bolus-risk-monitoring' : 'bolus-risk-healthy';

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="bolus-loading" role="status">3D is unavailable on this device. Cow readings and analysis remain available. Try the Cow & kraal view.</div> : this.props.children; }
}

export function BolusSimulationPage(props: ComponentProps<typeof LiveSimulationPage>) {
  const [view, setView] = useState<'bolus' | 'cow'>('bolus');
  const [mode, setMode] = useState<BolusMode>('transparent');
  const [labels, setLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ type: 'reset', sequence: 0 });
  const [sidebarView, setSidebarView] = useState<'readings' | 'cows'>('readings');
  const [fullscreenError, setFullscreenError] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const moveCamera = (type: CameraCommand['type']) => setCameraCommand(c => ({ type, sequence: c.sequence + 1 }));
  const fullscreen = () => {
    const action = document.fullscreenElement ? document.exitFullscreen() : stageRef.current?.requestFullscreen();
    action?.catch(() => setFullscreenError('Fullscreen is unavailable. You can still rotate and zoom here.'));
  };
  const { isPlaying, setPlaying, speed, setSpeed, clock, setPage } = useSimulationStore();
  const current = getLatestCowReading(props.cow);
  const previous = getPreviousCowReading(props.cow);
  const analysis = getCowHealthAnalysis(props.cow);
  return <div className="bolus-page">
    <div className="bolus-page-heading"><div><p className="bolus-eyebrow">LIVESTOCK MONITORING / RUMEN SENSOR</p><h2>Rumen bolus</h2><p className="bolus-muted">A closer look at the technology inside.</p></div>
      <div className="bolus-switch" role="group" aria-label="Simulation view"><button aria-pressed={view === 'bolus'} onClick={() => setView('bolus')}><Box size={16} /> Bolus explorer</button><button aria-pressed={view === 'cow'} onClick={() => setView('cow')}>Cow & kraal</button></div>
    </div>
    {view === 'cow' ? <LiveSimulationPage {...props} /> : <div className="bolus-layout">
      <section className="bolus-device-panel" aria-label="Interactive bolus explorer">
        <div className="bolus-model-heading"><Box size={13} /><span>3D DEVICE VIEW / {mode.toUpperCase()}</span><span>RB–01 · {props.cow.id}</span></div>
        <div ref={stageRef} className="bolus-stage" role="group" aria-label={`${mode} 3D smart bolus for ${props.cow.id}`}>
          <SceneBoundary><Suspense fallback={<div className="bolus-loading" role="status"><div className="bolus-placeholder" /><span>Opening the capsule…</span></div>}><BolusScene cameraCommand={cameraCommand} mode={mode} labels={labels} autoRotate={autoRotate && isPlaying} temperature={current.temperatureC} ph={current.ph} /></Suspense></SceneBoundary>
          <div className="bolus-stage-caption">RB–01 · CONCEPT MODEL · NOT TO SCALE</div>
          <div className="bolus-camera-tools" role="group" aria-label="Camera controls">
            <button onClick={() => moveCamera('zoom-in')} aria-label="Zoom capsule in" title="Zoom in"><ZoomIn size={17} /></button>
            <button onClick={() => moveCamera('zoom-out')} aria-label="Zoom capsule out" title="Zoom out"><ZoomOut size={17} /></button>
            <button onClick={() => moveCamera('reset')} aria-label="Reset capsule camera" title="Reset camera"><RotateCcw size={16} /></button>
            <button onClick={fullscreen} aria-label="Toggle capsule fullscreen" title="Fullscreen"><Maximize size={16} /></button>
          </div>{fullscreenError && <div className="bolus-fullscreen-message" role="status">{fullscreenError}</div>}
        </div>
        <div className="bolus-toolbar"><div className="bolus-switch" role="group" aria-label="Capsule appearance">{(['transparent', 'solid', 'exploded'] as const).map(item => <button key={item} aria-pressed={mode === item} onClick={() => setMode(item)}><Layers size={15} />{item[0].toUpperCase() + item.slice(1)}</button>)}</div><div className="bolus-options"><label><input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} />Labels</label><label><input type="checkbox" checked={autoRotate} onChange={e => setAutoRotate(e.target.checked)} />Auto-rotate</label></div></div>
        <div className="bolus-playback"><button onClick={() => setPlaying(!isPlaying)}>{isPlaying ? 'Pause readings' : 'Resume readings'}</button><span className="bolus-muted">Sample {clock} · {current.time} SAST</span><label>Speed<select aria-label="Simulation speed" value={speed} onChange={e => setSpeed(Number(e.target.value) as 1 | 2 | 5)}><option value={1}>1×</option><option value={2}>2×</option><option value={5}>5×</option></select></label></div>
      </section>
      <aside className="bolus-herd" aria-label="Monitored cows in the kraal">
        <div className="bolus-panel-heading"><div><span className="bolus-eyebrow">{props.cow.id} · SIMULATED</span><h3>Live monitoring</h3></div><span className="bolus-muted">{props.cows.length} cows</span></div><p className="bolus-muted">Readings from the selected cow. Open Cows in kraal to switch animals.</p>
        <div className="bolus-sidebar-tabs bolus-switch" role="group" aria-label="Cow sidebar view"><button aria-pressed={sidebarView === 'readings'} onClick={() => setSidebarView('readings')}>Sample telemetry</button><button aria-pressed={sidebarView === 'cows'} onClick={() => setSidebarView('cows')}>Cows in kraal</button></div>
        <div hidden={sidebarView !== 'readings'}>
        <div className="bolus-telemetry" aria-label="Selected cow capsule readings">
          <Metric icon={<Thermometer size={17} />} label="Temperature" value={`${current.temperatureC.toFixed(1)} °C`} previous={`${previous.temperatureC.toFixed(1)} °C`} delta={current.temperatureC - previous.temperatureC} history={props.cow.readings.map(r => r.temperatureC)} colour="#fb923c" />
          <Metric icon={<Activity size={17} />} label="Movement index" value={current.movementIndex.toFixed(2)} previous={previous.movementIndex.toFixed(2)} delta={current.movementIndex - previous.movementIndex} history={props.cow.readings.map(r => r.movementIndex)} colour="#34d399" />
          <Metric icon={<Waves size={17} />} label="Rumen pH" value={current.ph.toFixed(2)} previous={previous.ph.toFixed(2)} delta={current.ph - previous.ph} history={props.cow.readings.map(r => r.ph)} colour="#c084fc" />
          <div className="bolus-metric"><div className="bolus-metric-label"><Battery size={17} />Battery</div><strong>{current.batteryPercent}%</strong><span>Simulated charge level</span></div>
        </div>
        <div className="bolus-parts"><div className="bolus-panel-heading"><h3>Inside the bolus</h3><button className="bolus-export" onClick={() => exportSample(props.cow.id, current, previous, analysis)}>Export selected cow sample</button></div><ol>{parts.map((part, i) => <li key={part}><span>{String(i + 1).padStart(2, '0')}</span>{part}</li>)}</ol><p className="bolus-muted">Educational hardware concept. Sensor readings are generated by the simulation, not measured from an animal.</p></div>
        </div>
        <div hidden={sidebarView !== 'cows'}>
        <div className="bolus-cow-list">{props.cows.map(cow => {
          const reading = getLatestCowReading(cow); const risk = getCowHealthAnalysis(cow).riskLevel;
          return <button key={cow.id} className="bolus-cow-card" aria-label={`Monitor ${cow.id}`} aria-pressed={props.cow.id === cow.id} onClick={() => props.onSelectCow(cow.id)}><div className="bolus-cow-title"><strong>{cow.id}</strong><span className={`bolus-risk ${statusClass(risk)}`}>{risk}</span></div><span className="bolus-muted">Tag {cow.tag} · {cow.activity}</span><div className="bolus-cow-readings"><span><small>Temp</small>{reading.temperatureC.toFixed(1)}°C</span><span><small>Movement</small>{reading.movementIndex.toFixed(2)}</span><span><small>pH</small>{reading.ph.toFixed(2)}</span></div><span className="bolus-cow-updated">{cow.capsule.status === 'Online' ? 'Updated' : 'Last received'} {reading.time} SAST</span>{cow.capsule.status !== 'Online' && <span className="capsule-inline-state">{cow.capsule.status === 'Troubleshooting' ? 'Capsule troubleshooting…' : 'Capsule not sending data'}</span>}</button>;
        })}</div>        </div>

        <div className={`bolus-analysis ${statusClass(analysis.riskLevel)}`} role={analysis.riskLevel === 'Urgent' ? 'alert' : undefined}><span className="bolus-eyebrow">{props.cow.id} · HEALTH ANALYSIS</span><h3>{analysis.riskLevel}</h3><p>{analysis.concern}</p><p className="bolus-muted">{analysis.action}</p><button onClick={() => setPage('Farmer Dashboard')}>View farmer dashboard<ChevronRight size={16} /></button></div>
        <p className="bolus-muted">Rule-based early warning, not a diagnosis. Veterinary assessment is needed to identify a disease.</p>
      </aside>
    </div>}
  </div>;
}

function Metric({ icon, label, value, previous, delta, history, colour }: { icon: ReactNode; label: string; value: string; previous: string; delta: number; history: number[]; colour: string }) {
  return <div className="bolus-metric"><div className="bolus-metric-label">{icon}{label}</div><strong>{value}</strong><Sparkline values={history} colour={colour} /><span>Previous {previous}</span><span>Change {delta > 0 ? '+' : ''}{delta.toFixed(2)}</span></div>;
}


function Sparkline({ values, colour }: { values: number[]; colour: string }) {
  const history = values.slice(-24);
  const low = Math.min(...history); const span = Math.max(...history) - low || 1;
  const points = history.map((value, i) => `${i / Math.max(1, history.length - 1) * 140},${34 - (value - low) / span * 28}`).join(' ');
  return <svg className="bolus-sparkline" viewBox="0 0 140 40" aria-hidden="true"><path d="M0 38H140" stroke="#333" /><polyline points={points} fill="none" stroke={colour} strokeWidth="2" /></svg>;
}

function exportSample(cowId: string, current: ReturnType<typeof getLatestCowReading>, previous: ReturnType<typeof getPreviousCowReading>, analysis: ReturnType<typeof getCowHealthAnalysis>) {
  const blob = new Blob([JSON.stringify({ simulated: true, cowId, timeZone: 'Africa/Johannesburg', current, previous, analysis }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `${cowId}-simulated-sample.json`; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
