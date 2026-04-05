import { useMemo } from 'react';
import { Calculator, Info } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

// 1. Define the Interface (This fixes the TS2322 error)
interface TaxEstimatorProps {
  totalRevenue: number;
}

export function TaxEstimator({ totalRevenue }: TaxEstimatorProps) {
  // 2. Logic based on Lesotho Tax Brackets:
  // Lower rate: 20% on first M61,080 (Example bracket)
  // Higher rate: 30% on anything above
  const taxCalculation = useMemo(() => {
    const threshold = 61080;
    let estimatedTax = 0;
    

    if (totalRevenue <= threshold) {
      estimatedTax = totalRevenue * 0.20;
    } else {
      estimatedTax = (threshold * 0.20) + ((totalRevenue - threshold) * 0.30);
    }

    return estimatedTax;
  }, [totalRevenue]);

  return (
    <div className="bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl shadow-blue-900/20 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
            <Calculator size={20} />
          </div>
          <h3 className="font-bold text-lg">Tax Forecaster</h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              Estimated Liability
            </p>
            <p className="text-4xl font-black text-white">
              {formatCurrency(taxCalculation)}
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex gap-2 text-blue-300 mb-1">
              <Info size={14} />
              <span className="text-[10px] font-bold uppercase">Lesotho Tax Info</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
  This is an estimated tax for your business in {new Date().getFullYear()}.
</p>
          </div>
        </div>
      </div>

      {/* Decorative Background Element */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl" />
    </div>
  );
}