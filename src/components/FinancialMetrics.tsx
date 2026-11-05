import React from 'react';
import { 
  Percent, 
  TrendingUp, 
  Scale, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Landmark,
  PiggyBank,
  LineChart,
  ShieldAlert
} from 'lucide-react';
import { Property, FinancialCalculationResult } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';

interface FinancialMetricsProps {
  property: Property;
  financials: FinancialCalculationResult;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({
  property,
  financials,
}) => {
  // 5-Year & 10-Year Projections (Assuming 3% annual appreciation and 2% rent growth)
  const annualAppreciationRate = 0.03;
  const annualRentGrowthRate = 0.02;
  const currentVal = property.currentValuation || property.purchasePrice || 300000;

  const value5Yr = currentVal * Math.pow(1 + annualAppreciationRate, 5);
  const value10Yr = currentVal * Math.pow(1 + annualAppreciationRate, 10);

  // Cumulative 5-year cash flow
  const cumulative5YrCashFlow = financials.netCashFlowAnnual * 5 * 1.04;
  const cumulative10YrCashFlow = financials.netCashFlowAnnual * 10 * 1.09;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">
            Real Estate Financial Intelligence & Benchmarks
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Key valuation metrics, underwriting ratios, and long-term equity growth projections for {property.name}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            Cash-on-Cash: {formatPercent(financials.cashOnCashReturnPercent)}
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3.5 py-1.5 rounded-xl text-xs font-bold">
            Cap Rate: {formatPercent(financials.capRatePercent)}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Cap Rate */}
        <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Capitalization Rate (Cap Rate)
              </span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {formatPercent(financials.capRatePercent)}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                (Unleveraged ROI)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Measures property yield independent of financing. Calculated as Net Operating Income ({formatCurrency(financials.netOperatingIncomeAnnual)}) divided by Property Value ({formatCurrency(currentVal)}).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Typical Residential Target:</span>
            <span className="font-semibold text-slate-200">5.0% – 8.5%</span>
          </div>
        </div>

        {/* 2. Cash-on-Cash Return */}
        <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Cash-on-Cash Return (CoC)
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${
                financials.cashOnCashReturnPercent >= 8 ? 'text-emerald-400' : 'text-white'
              }`}>
                {formatPercent(financials.cashOnCashReturnPercent)}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Annual Yield on Cash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              The annual cash return earned on actual out-of-pocket cash invested ({formatCurrency(financials.totalInitialInvestment)}). Net cash flow divided by total initial cash.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Annual Pocket Cash:</span>
            <span className="font-semibold text-emerald-400">{formatCurrency(financials.netCashFlowAnnual)}/yr</span>
          </div>
        </div>

        {/* 3. Debt Service Coverage Ratio (DSCR) */}
        <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Debt Service Coverage (DSCR)
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${
                !property.hasMortgage 
                  ? 'text-slate-500' 
                  : financials.debtServiceCoverageRatio >= 1.25 
                  ? 'text-emerald-400' 
                  : 'text-amber-400'
              }`}>
                {property.hasMortgage ? `${financials.debtServiceCoverageRatio.toFixed(2)}x` : 'N/A'}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {property.hasMortgage ? (financials.debtServiceCoverageRatio >= 1.25 ? 'Prime Safety' : 'Moderate Buffer') : 'No Debt'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Lenders use DSCR to evaluate loan default risk. Measures NOI divided by Annual Debt Service ({formatCurrency(financials.annualMortgagePI)}). Minimum qualifying standard is usually 1.20x–1.25x.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Lender Min Threshold:</span>
            <span className="font-semibold text-slate-200">≥ 1.25x</span>
          </div>
        </div>

        {/* 4. Gross Rent Multiplier (GRM) */}
        <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Gross Rent Multiplier (GRM)
              </span>
              <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {financials.grossRentMultiplier.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-400">years</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Property price ({formatCurrency(currentVal)}) divided by Annual Gross Scheduled Rent ({formatCurrency(financials.grossScheduledIncomeAnnual)}). Lower values generally indicate better value per dollar of rent.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Benchmark:</span>
            <span className="font-semibold text-slate-200">6.0 – 12.0 (Lower is better)</span>
          </div>
        </div>

        {/* 5. 1% Rule Screen */}
        <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                The 1% Rule Quick Screen
              </span>
              <div className={`p-1.5 rounded-lg border ${
                financials.onePercentRuleMet ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                {financials.onePercentRuleMet ? <CheckCircle2 className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold ${
                financials.onePercentRuleMet ? 'text-emerald-400' : 'text-white'
              }`}>
                {formatPercent(financials.onePercentRatio)}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                financials.onePercentRuleMet ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}>
                {financials.onePercentRuleMet ? 'Passed (≥ 1%)' : 'Under 1% Standard'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              A classic investor rule of thumb: monthly rent should be at least 1% of purchase price ({formatCurrency(property.purchasePrice * 0.01)}/mo target) for immediate strong cash flow.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">1% Target Rent:</span>
            <span className="font-semibold text-slate-200">{formatCurrency(property.purchasePrice * 0.01)}/mo</span>
          </div>
        </div>

        {/* 6. Break-Even Occupancy */}
        <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Break-Even Occupancy
              </span>
              <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {formatPercent(financials.breakEvenOccupancyPercent, 1)}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Min Occupancy to Break Even
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              The minimum occupancy percentage required to cover all operating expenses and debt service. Any occupancy above this threshold generates net profit.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Safety Cushion:</span>
            <span className="font-semibold text-emerald-400">
              {formatPercent(Math.max(0, 100 - financials.breakEvenOccupancyPercent), 1)} Margin
            </span>
          </div>
        </div>
      </div>

      {/* Long Term Wealth & Equity Projections */}
      <div className="bg-[#161A23] p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <LineChart className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            5 & 10-Year Long Term Wealth Projections
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Estimated wealth accumulation incorporating property appreciation (conservative 3%/yr) and cumulative cash flows.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#11141B] rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block">Today (Year 0)</span>
            <div className="text-xl font-bold text-white mt-1">{formatCurrency(currentVal)}</div>
            <div className="text-xs text-slate-300 mt-2">
              Initial Capital: <strong className="text-slate-100">{formatCurrency(financials.totalInitialInvestment)}</strong>
            </div>
          </div>

          <div className="p-4 bg-[#11141B] rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-emerald-400 block">Year 5 Horizon</span>
            <div className="text-xl font-bold text-white mt-1">{formatCurrency(value5Yr)}</div>
            <div className="text-xs text-emerald-400 mt-2">
              Est. 5-Yr Cumulative Cash: <strong className="text-emerald-300">+{formatCurrency(cumulative5YrCashFlow)}</strong>
            </div>
          </div>

          <div className="p-4 bg-[#11141B] rounded-xl border border-emerald-500/30">
            <span className="text-xs font-semibold text-emerald-400 block">Year 10 Horizon</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(value10Yr)}</div>
            <div className="text-xs text-emerald-400 mt-2">
              Est. 10-Yr Cumulative Cash: <strong className="text-emerald-300">+{formatCurrency(cumulative10YrCashFlow)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
