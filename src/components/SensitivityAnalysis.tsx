import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import { Property, FinancialCalculationResult } from '../types';
import { calculatePropertyFinances, formatCurrency, formatPercent } from '../utils/calculations';

interface SensitivityAnalysisProps {
  property: Property;
  baseFinancials: FinancialCalculationResult;
}

export const SensitivityAnalysis: React.FC<SensitivityAnalysisProps> = ({
  property,
  baseFinancials,
}) => {
  // Scenario sliders
  const [rentDeltaPercent, setRentDeltaPercent] = useState<number>(0); // e.g. +5% or -10%
  const [simulatedVacancyRate, setSimulatedVacancyRate] = useState<number>(property.vacancyRatePercent || 5);
  const [expenseDeltaPercent, setExpenseDeltaPercent] = useState<number>(0); // e.g. +10%
  const [simulatedInterestRate, setSimulatedInterestRate] = useState<number>(property.interestRate || 6.5);

  // Construct simulated property
  const simulatedProperty: Property = {
    ...property,
    vacancyRatePercent: simulatedVacancyRate,
    interestRate: simulatedInterestRate,
    baseMonthlyRent: (property.baseMonthlyRent || 0) * (1 + rentDeltaPercent / 100),
    units: (property.units || []).map((u) => ({
      ...u,
      rent: (Number(u.rent) || 0) * (1 + rentDeltaPercent / 100),
    })),
    expenses: (property.expenses || []).map((e) => ({
      ...e,
      amount: e.isPercentageOfRent ? e.amount : (Number(e.amount) || 0) * (1 + expenseDeltaPercent / 100),
    })),
  };

  const simFinancials = calculatePropertyFinances(simulatedProperty);

  const cashFlowDiffMonthly = simFinancials.netCashFlowMonthly - baseFinancials.netCashFlowMonthly;
  const cashFlowDiffAnnual = simFinancials.netCashFlowAnnual - baseFinancials.netCashFlowAnnual;
  const capRateDiff = simFinancials.capRatePercent - baseFinancials.capRatePercent;
  const cocDiff = simFinancials.cashOnCashReturnPercent - baseFinancials.cashOnCashReturnPercent;

  const handleReset = () => {
    setRentDeltaPercent(0);
    setSimulatedVacancyRate(property.vacancyRatePercent || 5);
    setExpenseDeltaPercent(0);
    setSimulatedInterestRate(property.interestRate || 6.5);
  };

  const isChanged =
    rentDeltaPercent !== 0 ||
    simulatedVacancyRate !== (property.vacancyRatePercent || 5) ||
    expenseDeltaPercent !== 0 ||
    simulatedInterestRate !== (property.interestRate || 6.5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Interactive What-If Scenario Stress Tester
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test sensitivity against rent shifts, inflation in operating expenses, vacancy spikes, and interest rate changes.
          </p>
        </div>

        {isChanged && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Base Case
          </button>
        )}
      </div>

      {/* Simulator Controls & Live Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sliders Panel */}
        <div className="lg:col-span-5 bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md space-y-5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Adjust Stress Variables
          </h3>

          {/* 1. Rent Adjustment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Rent Increase / Decrease</span>
              <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                rentDeltaPercent > 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : rentDeltaPercent < 0 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {rentDeltaPercent > 0 ? `+${rentDeltaPercent}%` : `${rentDeltaPercent}%`} (
                {formatCurrency(simFinancials.grossScheduledIncomeMonthly)}/mo)
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="1"
              value={isNaN(rentDeltaPercent) ? 0 : rentDeltaPercent}
              onChange={(e) => setRentDeltaPercent(parseInt(e.target.value) || 0)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-25% (Market Dip)</span>
              <span>0% (Base)</span>
              <span>+25% (Renovation Upside)</span>
            </div>
          </div>

          {/* 2. Vacancy Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Vacancy & Turnover Rate</span>
              <span className="font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-xs">
                {simulatedVacancyRate}% ({formatCurrency(simFinancials.vacancyLossMonthly)}/mo)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={isNaN(simulatedVacancyRate) ? 5 : simulatedVacancyRate}
              onChange={(e) => setSimulatedVacancyRate(parseInt(e.target.value) || 0)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (100% Full)</span>
              <span>5% (Normal)</span>
              <span>15% (High Turnover)</span>
              <span>25% (Major Vacancy)</span>
            </div>
          </div>

          {/* 3. Expense Inflation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">OpEx Inflation / Maintenance Spike</span>
              <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                expenseDeltaPercent > 0 
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                  : expenseDeltaPercent < 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {expenseDeltaPercent > 0 ? `+${expenseDeltaPercent}%` : `${expenseDeltaPercent}%`} (
                {formatCurrency(simFinancials.operatingExpensesMonthly)}/mo)
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="50"
              step="5"
              value={isNaN(expenseDeltaPercent) ? 0 : expenseDeltaPercent}
              onChange={(e) => setExpenseDeltaPercent(parseInt(e.target.value) || 0)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-20%</span>
              <span>0% (Base)</span>
              <span>+25%</span>
              <span>+50% (High Repairs)</span>
            </div>
          </div>

          {/* 4. Mortgage Interest Rate */}
          {property.hasMortgage && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Mortgage Interest Rate</span>
                <span className="font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs">
                  {(isNaN(simulatedInterestRate) ? 6.5 : simulatedInterestRate).toFixed(2)}% ({formatCurrency(simFinancials.monthlyMortgagePI)}/mo)
                </span>
              </div>
              <input
                type="range"
                min="3.0"
                max="10.0"
                step="0.25"
                value={isNaN(simulatedInterestRate) ? 6.5 : simulatedInterestRate}
                onChange={(e) => setSimulatedInterestRate(parseFloat(e.target.value) || 6.5)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>3.0% (Historic Low)</span>
                <span>6.5% (Current)</span>
                <span>10.0% (Stress Peak)</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Comparative Outcome Panel */}
        <div className="lg:col-span-7 bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">
              Scenario vs. Base Case Comparison
            </h3>

            {/* Impact Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
              {/* Cash flow impact */}
              <div className={`p-4 rounded-xl border ${
                simFinancials.netCashFlowMonthly >= 0 
                  ? 'bg-[#11141B] border-emerald-500/30' 
                  : 'bg-[#11141B] border-rose-500/30'
              }`}>
                <div className="text-xs font-semibold text-slate-400">Simulated Net Cash Flow</div>
                <div className="text-2xl font-extrabold text-white mt-1">
                  {formatCurrency(simFinancials.netCashFlowMonthly)}
                  <span className="text-xs font-normal text-slate-500">/mo</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold mt-1.5">
                  {cashFlowDiffMonthly >= 0 ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{formatCurrency(cashFlowDiffMonthly)}/mo vs base
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-0.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {formatCurrency(cashFlowDiffMonthly)}/mo vs base
                    </span>
                  )}
                </div>
              </div>

              {/* Cash-on-Cash Return impact */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#11141B]">
                <div className="text-xs font-semibold text-slate-400">Simulated Cash-on-Cash ROI</div>
                <div className="text-2xl font-extrabold text-white mt-1">
                  {formatPercent(simFinancials.cashOnCashReturnPercent)}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold mt-1.5">
                  {cocDiff >= 0 ? (
                    <span className="text-emerald-400">+{formatPercent(cocDiff)} vs base</span>
                  ) : (
                    <span className="text-rose-400">{formatPercent(cocDiff)} vs base</span>
                  )}
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2 text-right">Base Model</th>
                    <th className="pb-2 text-right">Scenario</th>
                    <th className="pb-2 text-right">Delta ($ / %)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  <tr>
                    <td className="py-2.5 text-slate-300">Effective Gross Income</td>
                    <td className="py-2.5 text-right text-slate-400">{formatCurrency(baseFinancials.effectiveGrossIncomeMonthly)}</td>
                    <td className="py-2.5 text-right font-semibold text-white">{formatCurrency(simFinancials.effectiveGrossIncomeMonthly)}</td>
                    <td className={`py-2.5 text-right font-bold ${simFinancials.effectiveGrossIncomeMonthly >= baseFinancials.effectiveGrossIncomeMonthly ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(simFinancials.effectiveGrossIncomeMonthly - baseFinancials.effectiveGrossIncomeMonthly)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300">Operating Expenses</td>
                    <td className="py-2.5 text-right text-slate-400">{formatCurrency(baseFinancials.operatingExpensesMonthly)}</td>
                    <td className="py-2.5 text-right font-semibold text-white">{formatCurrency(simFinancials.operatingExpensesMonthly)}</td>
                    <td className={`py-2.5 text-right font-bold ${simFinancials.operatingExpensesMonthly <= baseFinancials.operatingExpensesMonthly ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(simFinancials.operatingExpensesMonthly - baseFinancials.operatingExpensesMonthly)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300">Net Operating Income (NOI / yr)</td>
                    <td className="py-2.5 text-right text-slate-400">{formatCurrency(baseFinancials.netOperatingIncomeAnnual)}</td>
                    <td className="py-2.5 text-right font-semibold text-white">{formatCurrency(simFinancials.netOperatingIncomeAnnual)}</td>
                    <td className={`py-2.5 text-right font-bold ${simFinancials.netOperatingIncomeAnnual >= baseFinancials.netOperatingIncomeAnnual ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(simFinancials.netOperatingIncomeAnnual - baseFinancials.netOperatingIncomeAnnual)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300">Cap Rate</td>
                    <td className="py-2.5 text-right text-slate-400">{formatPercent(baseFinancials.capRatePercent)}</td>
                    <td className="py-2.5 text-right font-semibold text-white">{formatPercent(simFinancials.capRatePercent)}</td>
                    <td className={`py-2.5 text-right font-bold ${capRateDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {capRateDiff >= 0 ? `+${formatPercent(capRateDiff)}` : formatPercent(capRateDiff)}
                    </td>
                  </tr>
                  {property.hasMortgage && (
                    <tr>
                      <td className="py-2.5 text-slate-300">Debt Service Coverage (DSCR)</td>
                      <td className="py-2.5 text-right text-slate-400">{baseFinancials.debtServiceCoverageRatio.toFixed(2)}x</td>
                      <td className="py-2.5 text-right font-semibold text-white">{simFinancials.debtServiceCoverageRatio.toFixed(2)}x</td>
                      <td className="py-2.5 text-right font-bold text-slate-300">
                        {(simFinancials.debtServiceCoverageRatio - baseFinancials.debtServiceCoverageRatio).toFixed(2)}x
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>Simulations are recalculating all dependent debt formulas and ratio bounds dynamically.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
