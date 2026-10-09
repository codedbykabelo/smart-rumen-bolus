import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  tone?: 'neutral' | 'warning' | 'success' | 'urgent';
  detail?: string;
  icon?: ReactNode;
}

export function MetricCard({ label, value, tone = 'neutral', detail, icon }: MetricCardProps) {
  const toneClass = {
    neutral: 'border-slate-700 bg-slate-900/50 text-slate-100',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
    urgent: 'border-red-500/40 bg-red-500/10 text-red-100',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-lg ${toneClass[tone]}`}>
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-300">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      {detail ? <div className="mt-2 text-xs text-slate-300">{detail}</div> : null}
    </div>
  );
}
