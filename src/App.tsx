import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CloudSun, Pause, Play, Thermometer } from 'lucide-react';
import type { CowAnimationReport } from './components/CowPasture';
import { FarmerDashboardPage, HealthAnalysisPage, LiveSimulationPage, ScannersPage } from './components/SimulationPages';
import {
  getCowHealthAnalysis,
  getLatestCowReading,
  simulationPages,
  useSimulationStore,
} from './store/useSimulationStore';

function App() {
  const {
    page,
    isPlaying,
    clock,
    selectedCowId,
    cows,
    setPage,
    setPlaying,
    selectCow,
    advanceSimulation,
  } = useSimulationStore();
  const [cowModelLoadFailed, setCowModelLoadFailed] = useState(false);
  const [animationReport, setAnimationReport] = useState<CowAnimationReport | null>(null);

  const selectedCow = useMemo(
    () => cows.find((cow) => cow.id === selectedCowId) ?? cows[0],
    [cows, selectedCowId],
  );
  const latest = getLatestCowReading(selectedCow);
  const analysis = getCowHealthAnalysis(selectedCow);

  const reportCowModelError = useCallback(() => setCowModelLoadFailed(true), []);
  const reportAnimations = useCallback((report: CowAnimationReport) => setAnimationReport(report), []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(advanceSimulation, 2200);
    return () => window.clearInterval(timer);
  }, [advanceSimulation, isPlaying]);

  return (
    <div className="min-h-screen bg-[#07100e] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#07100e]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-lime-400 text-slate-950 shadow-lg shadow-emerald-900/30">
              <CloudSun className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-300">Simulated · hackathon prototype</div>
              <div className="truncate text-lg font-semibold text-white">RumiGuard</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="global-cow-selector">Select monitored cow</label>
            <select
              id="global-cow-selector"
              value={selectedCowId}
              onChange={(event) => selectCow(event.target.value)}
              className="max-w-40 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              {cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.id} · {cow.tag}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setPlaying(!isPlaying)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-400/50"
              aria-label={isPlaying ? 'Pause simulation' : 'Resume simulation'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>
          </div>
        </div>
        <nav aria-label="Main navigation" className="mx-auto max-w-[1680px] overflow-x-auto px-4 pb-3 sm:px-6">
          <div className="flex min-w-max gap-2">
            {simulationPages.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setPage(item)}
                aria-current={page === item ? 'page' : undefined}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  page === item
                    ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.06)]'
                    : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 sm:py-7">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Shared live cow summary">
          <SummaryMetric label="Selected cow" value={selectedCow.id} detail={`${selectedCow.location} · ${selectedCow.activity}`} icon={<CloudSun />} />
          <SummaryMetric label="Temperature" value={`${latest.temperatureC.toFixed(1)}°C`} detail={`Updated ${latest.time}`} icon={<Thermometer />} />
          <SummaryMetric label="Movement index" value={latest.movementIndex.toFixed(2)} detail={`Rumen pH ${latest.ph.toFixed(2)} · simulated`} icon={<Activity />} />
          <SummaryMetric label="Rule-based risk" value={analysis.riskLevel} detail={`Simulation tick ${clock} · shared data`} icon={<AlertTriangle />} risk={analysis.riskLevel} />
        </section>

        {page === 'Live Cow Simulation' && (
          <LiveSimulationPage
            cow={selectedCow}
            cows={cows}
            cowAssetAvailable={!cowModelLoadFailed}
            modelLoadFailed={cowModelLoadFailed}
            animationReport={animationReport}
            onCowModelError={reportCowModelError}
            onAnimationReport={reportAnimations}
            onSelectCow={selectCow}
          />
        )}
        {page === 'Scanners' && <ScannersPage cow={selectedCow} />}
        {page === 'Smart Health Analysis Model' && <HealthAnalysisPage cows={cows} selectedCow={selectedCow} onSelectCow={selectCow} />}
        {page === 'Farmer Dashboard' && <FarmerDashboardPage cows={cows} selectedCow={selectedCow} onSelectCow={selectCow} />}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4 text-[10px] text-slate-500">
          <span>SIMULATED DATA · Rule-based prototype · Not a veterinary diagnosis</span>
          <span>{cows.length} monitored cows · {isPlaying ? 'Live updates on' : 'Updates paused'}</span>
        </footer>
      </main>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  icon,
  risk,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  risk?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</div>
        <span className={risk === 'Urgent' ? 'text-rose-300' : risk === 'Attention' ? 'text-amber-300' : 'text-emerald-300'}>{icon}</span>
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 truncate text-xs text-slate-400">{detail}</div>
    </div>
  );
}

export default App;
