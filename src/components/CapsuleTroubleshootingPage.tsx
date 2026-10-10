import { useState } from 'react';
import { CheckCircle2, Radio, RefreshCw, TriangleAlert, Wrench } from 'lucide-react';
import { getLatestCowReading, useSimulationStore } from '../store/useSimulationStore';
import type { MonitoredCow } from '../store/useSimulationStore';

export function CapsuleDataNotice({ cow }: { cow: MonitoredCow }) {
  const setPage = useSimulationStore(state => state.setPage);
  if (cow.capsule.status === 'Online') return null;
  return <div className="capsule-data-notice" role="status"><div><strong>{cow.id} · {cow.capsule.status === 'Troubleshooting' ? 'Capsule troubleshooting' : 'Capsule not sending data'}</strong><p>These are last received readings from {getLatestCowReading(cow).time} SAST. Live health status is unavailable until transmission returns.</p></div><button onClick={() => setPage('Capsule troubleshooting')}>Open troubleshooting</button></div>;
}

export function CapsuleTroubleshootingPage() {
  const { cows, capsuleEvents, startCapsuleTroubleshooting, simulateCapsuleFault, selectCow, setPage } = useSimulationStore();
  const [cowId, setCowId] = useState('COW-003');
  const [fault, setFault] = useState<'link' | 'hardware'>('link');
  const affected = cows.filter(cow => cow.capsule.status !== 'Online');
  return <div className="capsule-diagnostics">
    <div className="capsule-diagnostics-heading"><div><p className="bolus-eyebrow">DEVICE HEALTH · SIMULATED TROUBLESHOOTING</p><h2>Capsule troubleshooting</h2><p className="bolus-muted">Cows whose capsules are not sending data. Successfully restored capsules leave this list automatically.</p></div><span className="capsule-count">{affected.length} need attention</span></div>
    <div className="capsule-diagnostics-summary"><span><Radio size={17} />{cows.filter(c => c.capsule.status === 'Online').length} transmitting</span><span><RefreshCw size={17} />{affected.filter(c => c.capsule.status === 'Troubleshooting').length} troubleshooting</span><span><TriangleAlert size={17} />{affected.filter(c => c.capsule.status === 'Offline').length} not sending data</span></div>
    <section className="capsule-fault-list" aria-label="Capsules not sending data">
      {affected.length === 0 ? <div className="capsule-all-online" role="status"><CheckCircle2 size={30} /><h3>All capsules are transmitting</h3><p>No cows remain on the troubleshooting list.</p></div> : affected.map(cow => {
        const running = cow.capsule.status === 'Troubleshooting';
        return <article key={cow.id} className="capsule-fault-card" aria-label={`Capsule issue for ${cow.id}`}>
          <div className="capsule-fault-heading"><div><h3>{cow.id} <span>Tag {cow.tag}</span></h3><p className="bolus-muted">Last received {getLatestCowReading(cow).time} SAST · {cow.capsule.fault === 'hardware' ? 'Sensor self-test fault' : 'LoRaWAN link interrupted'}</p></div><span className={`capsule-device-status ${running ? 'capsule-checking' : 'capsule-offline'}`}>{running ? 'Troubleshooting' : 'Not sending data'}</span></div>
          <ol className="capsule-checks">{['Check gateway link', 'Request capsule response', 'Verify sensor data'].map((label, i) => <li key={label} className={cow.capsule.step > i ? 'capsule-check-complete' : running && cow.capsule.step === i ? 'capsule-check-active' : ''}><span>{cow.capsule.step > i ? '✓' : i + 1}</span>{label}{running && cow.capsule.step === i && <small>Checking…</small>}</li>)}</ol>
          <p className="capsule-diagnostic-message" role="status">{cow.capsule.message}</p>
          <div className="capsule-fault-actions"><button disabled={running} onClick={() => startCapsuleTroubleshooting(cow.id)}><Wrench size={16} />{running ? 'Troubleshooting…' : cow.capsule.step > 0 ? 'Retry troubleshooting' : 'Troubleshoot capsule'}</button><button onClick={() => { selectCow(cow.id); setPage('Live Cow Simulation'); }}>View last cow readings</button></div>
        </article>;
      })}
    </section>
    <section className="capsule-recovery-log" aria-label="Restored capsules"><h3>Successful recoveries</h3>{capsuleEvents.length === 0 ? <p className="bolus-muted">Recovered capsules will appear here after fresh data is received.</p> : <ul aria-live="polite">{capsuleEvents.map(event => <li key={event.id}><CheckCircle2 size={18} /><div><strong>{event.cowId} · Transmission restored</strong><p>{event.message} · {event.at} SAST</p></div></li>)}</ul>}</section>
    <details className="capsule-demo-tools"><summary>Demonstration controls</summary><p className="bolus-muted">Create a simulated fault to show recovery or a failed self-test. This does not operate real hardware.</p><div><label>Cow<select aria-label="Cow for simulated capsule fault" value={cowId} onChange={e => setCowId(e.target.value)}>{cows.map(cow => <option key={cow.id} value={cow.id}>{cow.id}</option>)}</select></label><label>Fault<select aria-label="Simulated capsule fault type" value={fault} onChange={e => setFault(e.target.value as 'link' | 'hardware')}><option value="link">Signal interruption · recoverable</option><option value="hardware">Sensor self-test fault · inspection needed</option></select></label><button onClick={() => simulateCapsuleFault(cowId, fault)}>Simulate capsule fault</button></div></details>
  </div>;
}
