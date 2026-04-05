import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string; 
  color?: 'blue' | 'amber' | 'red' | 'purple';
}

// React.memo prevents unnecessary re-renders for pure components
export const StatCard = React.memo(({ title, value, change, color = 'blue' }: StatCardProps) => {
  const themes = {
    blue: 'text-blue-900 border-blue-100 bg-blue-50/20',
    amber: 'text-amber-700 border-amber-100 bg-amber-50/20',
    red: 'text-red-700 border-red-100 bg-red-50/20',
    purple: 'text-purple-700 border-purple-100 bg-purple-50/20'
  };

  const badgeThemes = {
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700'
  };

  return (
    <article className={`p-5 md:p-8 rounded-[30px] border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 bg-white ${themes[color]}`}>
      <h3 className="text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] mb-2 md:mb-3">
        {title}
      </h3>
      <p className="text-2xl md:text-3xl font-black tracking-tighter leading-none">
        {value}
      </p>
      {change && (
        <div className="mt-4">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${badgeThemes[color]}`}>
            {change}
          </span>
        </div>
      )}
    </article>
  );
});

StatCard.displayName = 'StatCard';