import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type {
  ValueType,
  NameType,
  Formatter,
} from 'recharts/types/component/DefaultTooltipContent';
import { formatCurrency } from '../utils/formatters';
import type { Transaction } from '../types/schema';

interface RevenueChartProps {
  transactions: Transaction[];
}

export const RevenueChart = ({ transactions }: RevenueChartProps) => {
  const chartData = useMemo(() => {
    const mpesa = transactions
      .filter((t) => t.method === 'M-Pesa' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const ecocash = transactions
      .filter((t) => t.method === 'EcoCash' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const cash = transactions
      .filter((t) => t.method === 'Cash' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return [
      { name: 'M-Pesa', total: mpesa, color: '#ef4444' },
      { name: 'EcoCash', total: ecocash, color: '#9333ea' },
      { name: 'Cash', total: cash, color: '#10b981' },
    ];
  }, [transactions]);

  // Use exact Formatter type; allow both parameters to be possibly undefined
  const tooltipFormatter: Formatter<ValueType, NameType> = (
    value?: ValueType,
    name?: NameType
  ) => {
    // Normalize numeric value
    let numeric = 0;

    if (value === undefined || value === null) {
      numeric = 0;
    } else if (typeof value === 'number') {
      numeric = value;
    } else if (typeof value === 'string') {
      const parsed = Number(value.trim());
      numeric = Number.isFinite(parsed) ? parsed : 0;
    } else if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === 'number') numeric = first;
      else if (typeof first === 'string') {
        const parsed = Number(first.trim());
        numeric = Number.isFinite(parsed) ? parsed : 0;
      } else numeric = 0;
    } else {
      numeric = 0;
    }

    // Name can be undefined; coerce to string fallback
    const label = name === undefined || name === null ? 'Value' : String(name);

    return [formatCurrency(numeric), label];
  };

  return (
    <div className="bg-white p-8 rounded-[40px] border shadow-sm h-[400px] w-full">
      <div className="mb-6">
        <h3 className="text-xl font-black uppercase italic">Revenue Overview</h3>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          Total Earnings by Channel
        </p>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
            tickFormatter={(value) => `M${value}`}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            }}
            formatter={tooltipFormatter}
          />
          <Bar dataKey="total" radius={[10, 10, 0, 0]} barSize={60}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};