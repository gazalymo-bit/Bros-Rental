import React from 'react';
import { 
  Building2, 
  Home, 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Scale, 
  Coins 
} from 'lucide-react';
import { Property, FinancialCalculationResult, RentPaymentRecord, UnitRental, Transaction } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';

export interface ActualFinancesData {
  matchedPayments: RentPaymentRecord[];
  matchedTxs: Transaction[];
  actualRentCollected: number;
  actualRentExpected: number;
  actualRentUncollected: number;
  collectionRate: number;
  otherIncomeTxs: Transaction[];
  actualOtherIncome: number;
  actualTotalIncome: number;
  operatingExpenseTxs: Transaction[];
  actualTotalOpEx: number;
  debtServiceTxs: Transaction[];
  actualDebtService: number;
  actualExpensesList: { category: string; amount: number; count: number; items: Transaction[] }[];
  actualNoi: number;
  actualNetCashFlow: number;
  propActuals: {
    property: Property;
    unitsCount: number;
    rentExpected: number;
    rentCollected: number;
    otherIncome: number;
    totalIncome: number;
    opEx: number;
    debtService: number;
    noi: number;
    netCashFlow: number;
    collectionRate: number;
  }[];
  unitActuals: {
    unit: any;
    expected: number;
    paid: number;
    balanceDue: number;
    status: string;
    paymentRecord?: RentPaymentRecord;
  }[];
  hasActualData: boolean;
  calculatedPropertyTaxes?: number;
  calculatedHoaFees?: number;
  calculatedEscrowTotal?: number;
  includeCalculatedEscrow?: boolean;
}

export interface BudgetBaselineData {
  grossRent: number;
  extraIncome: number;
  vacancyLoss: number;
  egi: number;
  opEx: number;
  debtService: number;
  noi: number;
  netCashFlow: number;
  periodMultiplier: number;
}

// =========================================================================
// 1. STATEMENT SUMMARY CARDS
// =========================================================================
interface SummaryCardsProps {
  statementMode: 'actual' | 'proforma' | 'variance';
  scope: 'portfolio' | 'property' | 'unit';
  actualFinances: ActualFinancesData;
  budgetBaseline: BudgetBaselineData;
  totalValuation: number;
  portfolioCalculations: any;
  propertyFinances: FinancialCalculationResult | null;
  unitFinancials: any;
  durationMonths: number;
  actualPeriodLabel: string;
}

export const StatementSummaryCards: React.FC<SummaryCardsProps> = ({
  statementMode,
  scope,
  actualFinances,
  budgetBaseline,
  totalValuation,
  portfolioCalculations,
  propertyFinances,
  unitFinancials,
  durationMonths,
  actualPeriodLabel,
}) => {
  if (statementMode === 'actual') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#161B26] print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-300">
        {/* Card 1: Expected Rent Roll */}
        <div className="border-r border-slate-700/60 print:border-slate-300 pr-2">
          <span className="text-[11px] text-slate-400 print:text-slate-600 block">
            Expected Rent Roll
          </span>
          <span className="text-base sm:text-lg font-black text-white print:text-black block mt-0.5">
            {formatCurrency(actualFinances.actualRentExpected)}
          </span>
          <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">
            Scheduled Monthly Rent
          </span>
        </div>

        {/* Card 2: Actual Realized Revenue */}
        <div className="border-r border-slate-700/60 print:border-slate-300 pr-2 pl-1 sm:pl-2">
          <span className="text-[11px] text-slate-400 print:text-slate-600 block">
            Actual Cash Collected
          </span>
          <span className={`text-base sm:text-lg font-black block mt-0.5 ${actualFinances.actualTotalIncome > 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-slate-300 print:text-slate-700'}`}>
            {formatCurrency(actualFinances.actualTotalIncome)}
          </span>
          <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium truncate block">
            {actualFinances.actualTotalIncome > 0 
              ? `${actualFinances.collectionRate.toFixed(0)}% of expected rent`
              : 'Zero actual collections'}
          </span>
        </div>

        {/* Card 3: Actual Expenses Paid */}
        <div className="border-r border-slate-700/60 print:border-slate-300 pr-2 pl-1 sm:pl-2">
          <span className="text-[11px] text-slate-400 print:text-slate-600 block">
            Actual Expenses Paid
          </span>
          <span className={`text-base sm:text-lg font-black block mt-0.5 ${actualFinances.actualTotalOpEx > 0 ? 'text-rose-400 print:text-rose-800' : 'text-slate-300 print:text-slate-700'}`}>
            {actualFinances.actualTotalOpEx > 0 ? `-${formatCurrency(actualFinances.actualTotalOpEx)}` : '$0.00'}
          </span>
          <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium truncate block">
            {actualFinances.calculatedEscrowTotal && actualFinances.calculatedEscrowTotal > 0
              ? `Incl. ${formatCurrency(actualFinances.calculatedEscrowTotal)} Taxes/HOA`
              : actualFinances.actualTotalOpEx > 0 
              ? 'Realized Expenses' 
              : 'Zero actual expenses'}
          </span>
        </div>

        {/* Card 4: Actual Realized Net Cash Flow */}
        <div className="pl-1 sm:pl-2">
          <span className="text-[11px] text-slate-400 print:text-slate-600 block">
            Net Realized Cash Flow
          </span>
          <span
            className={`text-base sm:text-lg font-black block mt-0.5 ${
              actualFinances.actualNetCashFlow > 0
                ? 'text-emerald-400 print:text-emerald-800'
                : actualFinances.actualNetCashFlow < 0
                ? 'text-rose-400 print:text-rose-800'
                : 'text-slate-300 print:text-slate-700'
            }`}
          >
            {formatCurrency(actualFinances.actualNetCashFlow)}
          </span>
          <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium block">
            {actualFinances.calculatedEscrowTotal && actualFinances.calculatedEscrowTotal > 0
              ? 'After Taxes, HOA & Debt'
              : actualFinances.hasActualData ? 'Realized Cash' : 'No actual cash flow'}
          </span>
        </div>
      </div>
    );
  }

  if (statementMode === 'variance') {
    const dollarVar = actualFinances.actualNetCashFlow - budgetBaseline.netCashFlow;
    const pctVar = budgetBaseline.netCashFlow !== 0 ? (dollarVar / Math.abs(budgetBaseline.netCashFlow)) * 100 : 0;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#161B26] print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-300">
        <div className="border-r border-slate-700/60 print:border-slate-300 pr-2">
          <span className="text-[11px] text-slate-400 print:text-slate-600 block">Budget Net Cash Flow</span>
          <span className="text-base sm:text-lg font-black text-blue-400 print:text-blue-800 block mt-0.5">
            {formatCurrency(budgetBaseline.netCashFlow)}
          </span>
          <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">Underwriting Target</span>
        </div>

        <div className="border-r border-slate-700/60 print:border-slate-300 pr-2 pl-1 sm:pl-2">
          <span className="text-[11px] text-slate-400 print:text-slate-600 block">Actual Realized Cash</span>
          <span className={`text-base sm:text-lg font-black block mt-0.5 ${actualFinances.actualNetCashFlow >= 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}`}>
            {formatCurrency(actualFinances.actualNetCashFlow)}
          </span>
          <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">Realized Collections</span>
        </div>

        <div className="border-r border-slate-700/60 print:border-slate-300 pr-2 pl-1 sm:pl-2">
          <span className="text-[11px] text-slate-400 print:text-slate-600 block">Dollar Variance</span>
          <span className={`text-base sm:text-lg font-black block mt-0.5 ${dollarVar >= 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}`}>
            {dollarVar >= 0 ? `+${formatCurrency(dollarVar)}` : formatCurrency(dollarVar)}
          </span>
          <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">Actual vs Budget</span>
        </div>

        <div className="pl-1 sm:pl-2">
          <span className="text-[11px] text-slate-400 print:text-slate-600 block">Percentage Variance</span>
          <span className={`text-base sm:text-lg font-black block mt-0.5 ${pctVar >= 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}`}>
            {pctVar >= 0 ? `+${pctVar.toFixed(1)}%` : `${pctVar.toFixed(1)}%`}
          </span>
          <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">
            {dollarVar >= 0 ? 'Favorable Performance' : 'Unfavorable Variance'}
          </span>
        </div>
      </div>
    );
  }

  // PRO-FORMA MODE (Existing Budget Projections)
  const proformaNetMonthly = scope === 'portfolio' && portfolioCalculations
    ? portfolioCalculations.totalNetCashFlowMonthly
    : scope === 'unit' && unitFinancials
    ? unitFinancials.unitNetCashFlowMonthly
    : (propertyFinances?.netCashFlowMonthly || 0);

  const capRate = scope === 'portfolio' && portfolioCalculations
    ? portfolioCalculations.portfolioCapRate
    : scope === 'unit' && unitFinancials
    ? unitFinancials.unitCapRate
    : (propertyFinances?.capRatePercent || 0);

  const coc = scope === 'portfolio' && portfolioCalculations
    ? portfolioCalculations.portfolioCoc
    : scope === 'unit' && unitFinancials
    ? unitFinancials.unitCoc
    : (propertyFinances?.cashOnCashReturnPercent || 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#161B26] print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-300">
      <div className="border-r border-slate-700/60 print:border-slate-300 pr-2">
        <span className="text-[11px] text-slate-400 print:text-slate-600 block">Total Asset Valuation</span>
        <span className="text-base sm:text-lg font-black text-white print:text-black block mt-0.5">
          {formatCurrency(totalValuation)}
        </span>
        <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">Underwriting Appraisal</span>
      </div>

      <div className="border-r border-slate-700/60 print:border-slate-300 pr-2 pl-1 sm:pl-2">
        <span className="text-[11px] text-slate-400 print:text-slate-600 block">
          Net Free Cash Flow ({durationMonths}M)
        </span>
        <span className={`text-base sm:text-lg font-black block mt-0.5 ${proformaNetMonthly >= 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}`}>
          {formatCurrency(proformaNetMonthly * durationMonths)}
        </span>
        <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">
          {formatCurrency(proformaNetMonthly)}/mo Pro-Forma
        </span>
      </div>

      <div className="border-r border-slate-700/60 print:border-slate-300 pr-2 pl-1 sm:pl-2">
        <span className="text-[11px] text-slate-400 print:text-slate-600 block">Cap Rate</span>
        <span className="text-base sm:text-lg font-black text-blue-400 print:text-blue-800 block mt-0.5">
          {formatPercent(capRate)}
        </span>
        <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">Unleveraged Yield</span>
      </div>

      <div className="pl-1 sm:pl-2">
        <span className="text-[11px] text-slate-400 print:text-slate-600 block">Cash-on-Cash Return</span>
        <span className="text-base sm:text-lg font-black text-emerald-400 print:text-emerald-800 block mt-0.5">
          {formatPercent(coc)}
        </span>
        <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">On Initial Capital</span>
      </div>
    </div>
  );
};

// =========================================================================
// 2. STATEMENT INCOME SCHEDULE
// =========================================================================
interface IncomeScheduleProps {
  statementMode: 'actual' | 'proforma' | 'variance';
  scope: 'portfolio' | 'property' | 'unit';
  actualFinances: ActualFinancesData;
  portfolioCalculations: any;
  propertyFinances: FinancialCalculationResult | null;
  unitFinancials: any;
  activePropertyUnits: UnitRental[];
  selectedUnit: UnitRental | null;
  durationMonths: number;
  actualPeriodLabel: string;
  propList: Property[];
}

export const StatementIncomeSchedule: React.FC<IncomeScheduleProps> = ({
  statementMode,
  scope,
  actualFinances,
  portfolioCalculations,
  propertyFinances,
  unitFinancials,
  activePropertyUnits,
  selectedUnit,
  durationMonths,
  actualPeriodLabel,
  propList,
}) => {
  if (statementMode === 'actual') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
          <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
            <span>1. Actual Realized Income & Rental Collections Schedule</span>
            {scope === 'unit' && selectedUnit && (
              <span className="text-[10px] text-emerald-400 print:text-emerald-800 normal-case font-semibold">
                (Unit: {selectedUnit.name})
              </span>
            )}
          </h2>
          <span className="text-[10px] text-emerald-400 print:text-emerald-800 font-semibold">
            Actual Cash Basis • {actualPeriodLabel}
          </span>
        </div>

        {/* Informational banner when actual collections are $0 */}
        {actualFinances.actualTotalIncome === 0 && (
          <div className="bg-[#121620] print:bg-slate-50 p-3 rounded-lg border border-slate-700/80 print:border-slate-300 text-xs text-slate-300 print:text-slate-700 flex items-center gap-2.5 my-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400 print:text-amber-700 shrink-0" />
            <div>
              <span className="font-bold text-white print:text-black">
                No actual rent collections or income recorded for this period ($0.00).
              </span>
              <span className="text-slate-400 print:text-slate-600 block text-[11px] mt-0.5">
                There are zero verified payment transactions in the ledger for this property and timeframe. To view budgeted estimates, switch to "Pro-Forma Underwriting" mode above.
              </span>
            </div>
          </div>
        )}

        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
              <th className="text-left pb-1 font-semibold">Income Category / Source</th>
              <th className="text-right pb-1 font-semibold">Expected / Scheduled ($)</th>
              <th className="text-right pb-1 font-semibold text-emerald-400 print:text-emerald-800">Actual Collected ($)</th>
              <th className="text-right pb-1 font-semibold">Uncollected / Balance ($)</th>
              <th className="text-right pb-1 font-semibold">Collection Rate (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 print:divide-slate-200">
            {/* Primary Rent Collections Line */}
            <tr>
              <td className="py-2 text-slate-300 print:text-slate-700 font-medium">
                Base Rent Collections
              </td>
              <td className="py-2 text-right text-slate-300 print:text-slate-700">
                {formatCurrency(actualFinances.actualRentExpected)}
              </td>
              <td className="py-2 text-right font-bold text-emerald-400 print:text-emerald-800">
                {formatCurrency(actualFinances.actualRentCollected)}
              </td>
              <td className={`py-2 text-right font-medium ${actualFinances.actualRentUncollected > 0 ? 'text-amber-400 print:text-amber-700' : 'text-slate-400 print:text-slate-500'}`}>
                {formatCurrency(actualFinances.actualRentUncollected)}
              </td>
              <td className="py-2 text-right font-semibold text-white print:text-black">
                {actualFinances.collectionRate.toFixed(1)}%
              </td>
            </tr>

            {/* Other Ancillary Income Lines (Only when actually present) */}
            {actualFinances.otherIncomeTxs.map((t) => (
              <tr key={t.id}>
                <td className="py-1.5 text-slate-300 print:text-slate-700">
                  {t.description || t.category} <span className="text-[10px] text-slate-500 font-normal">({t.category})</span>
                </td>
                <td className="py-1.5 text-right text-slate-400">-</td>
                <td className="py-1.5 text-right font-bold text-emerald-400 print:text-emerald-800">
                  +{formatCurrency(t.amount)}
                </td>
                <td className="py-1.5 text-right text-slate-400">$0.00</td>
                <td className="py-1.5 text-right font-semibold text-emerald-400">100.0%</td>
              </tr>
            ))}

            {/* Total Actual Cash Inflow Row */}
            <tr className="font-bold bg-emerald-500/10 print:bg-emerald-50/60 text-emerald-400 print:text-emerald-900 border border-emerald-500/20 print:border-none">
              <td className="py-2.5 px-2 rounded-l">
                Total Actual Realized Cash Inflow
              </td>
              <td className="py-2.5 text-right text-slate-300 print:text-slate-700">
                {formatCurrency(actualFinances.actualRentExpected)}
              </td>
              <td className="py-2.5 text-right font-black text-emerald-300 print:text-emerald-950 text-sm">
                +{formatCurrency(actualFinances.actualTotalIncome)}
              </td>
              <td className="py-2.5 text-right">
                {formatCurrency(actualFinances.actualRentUncollected)}
              </td>
              <td className="py-2.5 px-2 text-right rounded-r font-black">
                {actualFinances.collectionRate.toFixed(1)}% Realized
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // PRO-FORMA / UNDERWRITING BUDGET MODE
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
        <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
          <span>1. Pro-Forma Income & Underwriting Schedule</span>
          {scope === 'unit' && selectedUnit && (
            <span className="text-[10px] text-blue-400 print:text-blue-800 normal-case font-semibold">
              (Unit: {selectedUnit.name})
            </span>
          )}
        </h2>
        <span className="text-[10px] text-slate-400 print:text-slate-500 font-medium">
          Period: {durationMonths} Month{durationMonths > 1 ? 's' : ''} Projection
        </span>
      </div>

      <div className="bg-blue-500/10 print:bg-blue-50/60 p-2.5 rounded-lg border border-blue-500/20 print:border-blue-200 text-xs text-blue-300 print:text-blue-900 flex items-center gap-2">
        <Coins className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          <strong>Pro-Forma Underwriting Model:</strong> Figures below reflect scheduled rents at 100% occupancy and budgeted allowances, not actual realized ledger transactions.
        </span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
            <th className="text-left pb-1 font-semibold">Income Category / Source</th>
            <th className="text-right pb-1 font-semibold">Monthly ($/mo)</th>
            <th className="text-right pb-1 font-semibold text-emerald-400 print:text-emerald-800">{durationMonths}-Month Total ($)</th>
            <th className="text-right pb-1 font-semibold">Annualized (12M)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
          {scope === 'portfolio' && portfolioCalculations ? (
            <>
              <tr>
                <td className="py-2 text-slate-300 print:text-slate-700">
                  Gross Scheduled Rent ({propList.length} Properties @ 100% Occupancy)
                </td>
                <td className="py-2 text-right font-medium text-white print:text-black">
                  {formatCurrency(portfolioCalculations.totalGrossRentMonthly)}
                </td>
                <td className="py-2 text-right font-bold text-emerald-400 print:text-emerald-800">
                  {formatCurrency(portfolioCalculations.totalGrossRentMonthly * durationMonths)}
                </td>
                <td className="py-2 text-right font-medium text-white print:text-black">
                  {formatCurrency(portfolioCalculations.totalGrossRentAnnual)}
                </td>
              </tr>
              {portfolioCalculations.totalExtraIncomeMonthly > 0 && (
                <tr>
                  <td className="py-2 text-slate-300 print:text-slate-700">
                    Portfolio Ancillary Income (Laundry, Pet Rent, Storage, Parking, etc.)
                  </td>
                  <td className="py-2 text-right font-medium text-emerald-400 print:text-emerald-700">
                    +{formatCurrency(portfolioCalculations.totalExtraIncomeMonthly)}
                  </td>
                  <td className="py-2 text-right font-bold text-emerald-400 print:text-emerald-700">
                    +{formatCurrency(portfolioCalculations.totalExtraIncomeMonthly * durationMonths)}
                  </td>
                  <td className="py-2 text-right font-medium text-emerald-400 print:text-emerald-700">
                    +{formatCurrency(portfolioCalculations.totalExtraIncomeAnnual)}
                  </td>
                </tr>
              )}
              {portfolioCalculations.totalVacancyLossMonthly > 0 && (
                <tr>
                  <td className="py-2 text-slate-300 print:text-slate-700">
                    Less: Portfolio Vacancy & Credit Loss Reserve
                  </td>
                  <td className="py-2 text-right font-medium text-rose-400 print:text-rose-700">
                    -{formatCurrency(portfolioCalculations.totalVacancyLossMonthly)}
                  </td>
                  <td className="py-2 text-right font-bold text-rose-400 print:text-rose-700">
                    -{formatCurrency(portfolioCalculations.totalVacancyLossMonthly * durationMonths)}
                  </td>
                  <td className="py-2 text-right font-medium text-rose-400 print:text-rose-700">
                    -{formatCurrency(portfolioCalculations.totalVacancyLossAnnual)}
                  </td>
                </tr>
              )}
              <tr className="font-bold bg-emerald-500/10 print:bg-emerald-50/60 text-emerald-400 print:text-emerald-900 border border-emerald-500/20 print:border-none">
                <td className="py-2.5 px-2 rounded-l">
                  Effective Gross Income (EGI Pro-Forma)
                </td>
                <td className="py-2.5 text-right">
                  {formatCurrency(portfolioCalculations.totalEgiMonthly)}/mo
                </td>
                <td className="py-2.5 text-right font-black text-emerald-300 print:text-emerald-950 text-sm">
                  {formatCurrency(portfolioCalculations.totalEgiMonthly * durationMonths)}
                </td>
                <td className="py-2.5 px-2 text-right rounded-r">
                  {formatCurrency(portfolioCalculations.totalEgiAnnual)}/yr
                </td>
              </tr>
            </>
          ) : scope === 'property' && propertyFinances ? (
            <>
              <tr>
                <td className="py-2 text-slate-300 print:text-slate-700">
                  Gross Scheduled Rent (@ 100% Occupancy)
                </td>
                <td className="py-2 text-right font-medium text-white print:text-black">
                  {formatCurrency(propertyFinances.grossScheduledIncomeMonthly)}
                </td>
                <td className="py-2 text-right font-bold text-emerald-400 print:text-emerald-800">
                  {formatCurrency(propertyFinances.grossScheduledIncomeMonthly * durationMonths)}
                </td>
                <td className="py-2 text-right font-medium text-white print:text-black">
                  {formatCurrency(propertyFinances.grossScheduledIncomeAnnual)}
                </td>
              </tr>
              {propertyFinances.extraIncomeMonthly > 0 && (
                <tr>
                  <td className="py-2 text-slate-300 print:text-slate-700">
                    Ancillary Income (Pet Rent, Storage, Parking, etc.)
                  </td>
                  <td className="py-2 text-right font-medium text-emerald-400 print:text-emerald-700">
                    +{formatCurrency(propertyFinances.extraIncomeMonthly)}
                  </td>
                  <td className="py-2 text-right font-bold text-emerald-400 print:text-emerald-700">
                    +{formatCurrency(propertyFinances.extraIncomeMonthly * durationMonths)}
                  </td>
                  <td className="py-2 text-right font-medium text-emerald-400 print:text-emerald-700">
                    +{formatCurrency(propertyFinances.extraIncomeAnnual)}
                  </td>
                </tr>
              )}
              {propertyFinances.vacancyLossMonthly > 0 && (
                <tr>
                  <td className="py-2 text-slate-300 print:text-slate-700">
                    Less: Vacancy & Credit Loss Reserve ({propertyFinances.vacancyRatePercent}%)
                  </td>
                  <td className="py-2 text-right font-medium text-rose-400 print:text-rose-700">
                    -{formatCurrency(propertyFinances.vacancyLossMonthly)}
                  </td>
                  <td className="py-2 text-right font-bold text-rose-400 print:text-rose-700">
                    -{formatCurrency(propertyFinances.vacancyLossMonthly * durationMonths)}
                  </td>
                  <td className="py-2 text-right font-medium text-rose-400 print:text-rose-700">
                    -{formatCurrency(propertyFinances.vacancyLossAnnual)}
                  </td>
                </tr>
              )}
              <tr className="font-bold bg-emerald-500/10 print:bg-emerald-50/60 text-emerald-400 print:text-emerald-900 border border-emerald-500/20 print:border-none">
                <td className="py-2.5 px-2 rounded-l">
                  Effective Gross Income (EGI Pro-Forma)
                </td>
                <td className="py-2.5 text-right">
                  {formatCurrency(propertyFinances.effectiveGrossIncomeMonthly)}/mo
                </td>
                <td className="py-2.5 text-right font-black text-emerald-300 print:text-emerald-950 text-sm">
                  {formatCurrency(propertyFinances.effectiveGrossIncomeMonthly * durationMonths)}
                </td>
                <td className="py-2.5 px-2 text-right rounded-r">
                  {formatCurrency(propertyFinances.effectiveGrossIncomeAnnual)}/yr
                </td>
              </tr>
            </>
          ) : scope === 'unit' && unitFinancials ? (
            <>
              <tr>
                <td className="py-2 text-slate-300 print:text-slate-700">
                  Scheduled Unit Rent ({selectedUnit?.name || 'Unit'})
                </td>
                <td className="py-2 text-right font-medium text-white print:text-black">
                  {formatCurrency(unitFinancials.unitRentMonthly)}
                </td>
                <td className="py-2 text-right font-bold text-emerald-400 print:text-emerald-800">
                  {formatCurrency(unitFinancials.unitRentMonthly * durationMonths)}
                </td>
                <td className="py-2 text-right font-medium text-white print:text-black">
                  {formatCurrency(unitFinancials.unitRentAnnual)}
                </td>
              </tr>
              {unitFinancials.unitVacancyMonthly > 0 && (
                <tr>
                  <td className="py-2 text-slate-300 print:text-slate-700">
                    Less: Unit Vacancy Allowance
                  </td>
                  <td className="py-2 text-right font-medium text-rose-400 print:text-rose-700">
                    -{formatCurrency(unitFinancials.unitVacancyMonthly)}
                  </td>
                  <td className="py-2 text-right font-bold text-rose-400 print:text-rose-700">
                    -{formatCurrency(unitFinancials.unitVacancyMonthly * durationMonths)}
                  </td>
                  <td className="py-2 text-right font-medium text-rose-400 print:text-rose-700">
                    -{formatCurrency(unitFinancials.unitVacancyMonthly * 12)}
                  </td>
                </tr>
              )}
              <tr className="font-bold bg-emerald-500/10 print:bg-emerald-50/60 text-emerald-400 print:text-emerald-900 border border-emerald-500/20 print:border-none">
                <td className="py-2.5 px-2 rounded-l">Effective Unit Gross Income (EGI)</td>
                <td className="py-2.5 text-right">{formatCurrency(unitFinancials.unitEgiMonthly)}/mo</td>
                <td className="py-2.5 text-right font-black text-emerald-300 print:text-emerald-950 text-sm">{formatCurrency(unitFinancials.unitEgiMonthly * durationMonths)}</td>
                <td className="py-2.5 px-2 text-right rounded-r">{formatCurrency(unitFinancials.unitEgiAnnual)}/yr</td>
              </tr>
            </>
          ) : null}
        </tbody>
      </table>
    </div>
  );
};

// =========================================================================
// 3. STATEMENT OPERATING EXPENSES (OpEx)
// =========================================================================
interface OpExScheduleProps {
  statementMode: 'actual' | 'proforma' | 'variance';
  scope: 'portfolio' | 'property' | 'unit';
  actualFinances: ActualFinancesData;
  portfolioCalculations: any;
  propertyFinances: FinancialCalculationResult | null;
  unitFinancials: any;
  activeProperty: Property | null;
  durationMonths: number;
  actualPeriodLabel: string;
}

export const StatementOpExSchedule: React.FC<OpExScheduleProps> = ({
  statementMode,
  scope,
  actualFinances,
  portfolioCalculations,
  propertyFinances,
  unitFinancials,
  activeProperty,
  durationMonths,
  actualPeriodLabel,
}) => {
  if (statementMode === 'actual') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
          <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
            {scope === 'portfolio' 
              ? '4. Actual Portfolio Operating Expenses'
              : scope === 'property'
              ? '3. Actual Property Operating Expenses Schedule'
              : '2. Actual Unit Operating Expenses'}
          </h2>
          <span className="text-[10px] text-rose-400 print:text-rose-800 font-semibold">
            Actual Incurred Cash Expenses • {actualPeriodLabel}
          </span>
        </div>

        {/* Informational banner when actual expenses are $0 */}
        {actualFinances.actualTotalOpEx === 0 ? (
          <div className="bg-[#121620] print:bg-slate-50 p-3 rounded-lg border border-slate-700/80 print:border-slate-300 text-xs text-slate-300 print:text-slate-700 flex items-center gap-2.5 my-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-emerald-700 shrink-0" />
            <div>
              <span className="font-bold text-white print:text-black">
                No actual operating expenses recorded for this period ($0.00).
              </span>
              <span className="text-slate-400 print:text-slate-600 block text-[11px] mt-0.5">
                There are zero expense transactions logged in the ledger for this timeframe. (To view budgeted allowances, switch to "Pro-Forma Underwriting" mode).
              </span>
            </div>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
                <th className="text-left pb-1 font-semibold">Actual Expense Category</th>
                <th className="text-right pb-1 font-semibold text-rose-400 print:text-rose-800 font-bold">Total Incurred ($)</th>
                <th className="text-right pb-1 font-semibold">Share of Expenses (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {actualFinances.actualExpensesList.map((item) => {
                const sharePct = actualFinances.actualTotalOpEx > 0 ? (item.amount / actualFinances.actualTotalOpEx) * 100 : 0;
                const isRepairCategory = item.category.toLowerCase().includes('repair') || 
                  item.category.toLowerCase().includes('maintenance') || 
                  item.category.toLowerCase().includes('fix');
                const isTaxCategory = item.category === 'Property Taxes' || item.category.toLowerCase().includes('tax');
                const isHoaCategory = item.category === 'HOA / Condo Fees' || item.category.toLowerCase().includes('hoa') || item.category.toLowerCase().includes('condo');

                return (
                  <tr key={item.category}>
                    <td className="py-1.5 text-slate-300 print:text-slate-700 font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{item.category}</span>
                      </div>
                      {(isRepairCategory || isTaxCategory || isHoaCategory) && item.items && item.items.length > 0 && (
                        <div className="mt-1 space-y-0.5 pl-2 border-l border-slate-700 print:border-slate-300 text-[10px] font-normal text-slate-400 print:text-slate-600">
                          {item.items.map((sub) => {
                            const pName = actualFinances.propActuals.find((pa) => pa.property.id === sub.propertyId)?.property.name;
                            const cleanDesc = sub.description
                              .replace(/Calculated\s+/gi, '')
                              .replace(/Auto-Calculated\s+/gi, '')
                              .replace(/\s*-\s*Unit\s*(\w+|\d+)?/gi, '')
                              .replace(/\bUnit\s+Unit\s*\w*/gi, '')
                              .replace(/\bUnit\s+\d+\b/gi, '')
                              .replace(/\s*-\s*Entire Property/gi, '')
                              .replace(/\s*\(41\d{2}[^)]*\)/g, '')
                              .replace(/\s{2,}/g, ' ')
                              .trim();
                            return (
                              <div key={sub.id} className="flex items-center justify-between gap-2">
                                <span>
                                  {scope === 'portfolio' && pName && <strong className="text-white print:text-black font-semibold mr-1">{pName}:</strong>}
                                  {cleanDesc}
                                </span>
                                <span className="font-mono text-rose-400 print:text-rose-700 shrink-0">
                                  -{formatCurrency(sub.amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-right font-bold text-rose-400 print:text-rose-800 align-top">
                      -{formatCurrency(item.amount)}
                    </td>
                    <td className="py-1.5 text-right font-medium text-slate-300 print:text-slate-700 align-top">
                      {sharePct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}

              <tr className="font-bold bg-rose-500/10 print:bg-rose-50/60 text-rose-400 print:text-rose-900 border border-rose-500/20 print:border-none">
                <td className="py-2.5 px-2 rounded-l">Total Actual Operating Expenses</td>
                <td className="py-2.5 text-right font-black text-rose-300 print:text-rose-950 text-sm">
                  -{formatCurrency(actualFinances.actualTotalOpEx)}
                </td>
                <td className="py-2.5 px-2 text-right rounded-r">100.0%</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // PRO-FORMA / BUDGETED EXPENSES MODE
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
        <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
          {scope === 'portfolio' 
            ? '4. Portfolio Operating Expenses (Pro-Forma)'
            : scope === 'property'
            ? '3. Property Operating Expenses Schedule (Pro-Forma)'
            : '2. Allocated Unit Operating Expenses (Pro-Forma)'}
        </h2>
        <span className="text-[10px] text-slate-400 print:text-slate-500">
          IRS Schedule E Standard Categories ({durationMonths} Month{durationMonths > 1 ? 's' : ''})
        </span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
            <th className="text-left pb-1 font-semibold">Expense Category</th>
            <th className="text-right pb-1 font-semibold">Monthly ($/mo)</th>
            <th className="text-right pb-1 font-semibold text-rose-400 print:text-rose-800 font-bold">{durationMonths}-Month Total ($)</th>
            <th className="text-right pb-1 font-semibold">Annualized (12M)</th>
            {scope === 'unit' && <th className="text-right pb-1 font-semibold">Property Total</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
          {scope === 'portfolio' && portfolioCalculations ? (
            <>
              {portfolioCalculations.consolidatedExpensesList.map((exp: any) => (
                <tr key={exp.name}>
                  <td className="py-1 text-slate-300 print:text-slate-700">{exp.name}</td>
                  <td className="py-1 text-right text-slate-200 print:text-slate-800">{formatCurrency(exp.monthly)}</td>
                  <td className="py-1 text-right font-bold text-rose-400 print:text-rose-800">{formatCurrency(exp.monthly * durationMonths)}</td>
                  <td className="py-1 text-right font-medium text-white print:text-black">{formatCurrency(exp.annual)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-rose-500/10 print:bg-rose-50/60 text-rose-400 print:text-rose-900 border border-rose-500/20 print:border-none">
                <td className="py-2.5 px-2 rounded-l">Total Portfolio Operating Expenses</td>
                <td className="py-2.5 text-right">-{formatCurrency(portfolioCalculations.totalOpExMonthly)}/mo</td>
                <td className="py-2.5 text-right font-black text-rose-300 print:text-rose-950">-{formatCurrency(portfolioCalculations.totalOpExMonthly * durationMonths)}</td>
                <td className="py-2.5 px-2 text-right rounded-r">-{formatCurrency(portfolioCalculations.totalOpExAnnual)}/yr</td>
              </tr>
            </>
          ) : scope === 'property' && activeProperty && propertyFinances ? (
            <>
              {(activeProperty.expenses || []).map((exp) => {
                let propMonthly = 0;
                if (exp.isPercentageOfRent && exp.percentageValue !== undefined) {
                  propMonthly = (propertyFinances.grossScheduledIncomeMonthly * exp.percentageValue) / 100;
                } else {
                  propMonthly = exp.frequency === 'annual' ? (Number(exp.amount) || 0) / 12 : Number(exp.amount) || 0;
                }
                return (
                  <tr key={exp.id}>
                    <td className="py-1 text-slate-300 print:text-slate-700">
                      {exp.name} <span className="text-[10px] text-slate-400 print:text-slate-500 font-normal">({exp.category})</span>
                    </td>
                    <td className="py-1 text-right text-slate-200 print:text-slate-800">{formatCurrency(propMonthly)}</td>
                    <td className="py-1 text-right font-bold text-rose-400 print:text-rose-800">{formatCurrency(propMonthly * durationMonths)}</td>
                    <td className="py-1 text-right font-medium text-white print:text-black">{formatCurrency(propMonthly * 12)}</td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-rose-500/10 print:bg-rose-50/60 text-rose-400 print:text-rose-900 border border-rose-500/20 print:border-none">
                <td className="py-2.5 px-2 rounded-l">Total Property Operating Expenses</td>
                <td className="py-2.5 text-right">-{formatCurrency(propertyFinances.operatingExpensesMonthly)}/mo</td>
                <td className="py-2.5 text-right font-black text-rose-300 print:text-rose-950">-{formatCurrency(propertyFinances.operatingExpensesMonthly * durationMonths)}</td>
                <td className="py-2.5 px-2 text-right rounded-r">-{formatCurrency(propertyFinances.operatingExpensesAnnual)}/yr</td>
              </tr>
            </>
          ) : scope === 'unit' && unitFinancials && activeProperty ? (
            <>
              {(activeProperty.expenses || []).map((exp) => {
                let propMonthly = exp.frequency === 'annual' ? (Number(exp.amount) || 0) / 12 : Number(exp.amount) || 0;
                const unitShareMonthly = propMonthly / Math.max(1, activeProperty.units?.length || 1);
                return (
                  <tr key={exp.id}>
                    <td className="py-1 text-slate-300 print:text-slate-700">
                      {exp.name} <span className="text-[10px] text-slate-400 print:text-slate-500 font-normal">({exp.category})</span>
                    </td>
                    <td className="py-1 text-right text-slate-200 print:text-slate-800">{formatCurrency(unitShareMonthly)}</td>
                    <td className="py-1 text-right font-bold text-rose-400 print:text-rose-800">{formatCurrency(unitShareMonthly * durationMonths)}</td>
                    <td className="py-1 text-right font-medium text-white print:text-black">{formatCurrency(unitShareMonthly * 12)}</td>
                    <td className="py-1 text-right text-slate-400 print:text-slate-500">{formatCurrency(propMonthly)}/mo</td>
                  </tr>
                );
              })}
              <tr className="font-bold bg-rose-500/10 print:bg-rose-50/60 text-rose-400 print:text-rose-900 border border-rose-500/20 print:border-none">
                <td className="py-2.5 px-2 rounded-l">Total Unit Allocated Expenses</td>
                <td className="py-2.5 text-right">-{formatCurrency(unitFinancials.unitExpensesMonthly)}/mo</td>
                <td className="py-2.5 text-right font-black text-rose-300 print:text-rose-950">-{formatCurrency(unitFinancials.unitExpensesMonthly * durationMonths)}</td>
                <td className="py-2.5 text-right">-{formatCurrency(unitFinancials.unitExpensesAnnual)}/yr</td>
                <td className="py-2.5 px-2 text-right rounded-r text-slate-400">-</td>
              </tr>
            </>
          ) : null}
        </tbody>
      </table>
    </div>
  );
};

// =========================================================================
// 4. STATEMENT NET CASH FLOW & DEBT SERVICE BREAKDOWN
// =========================================================================
interface CashFlowBreakdownProps {
  statementMode: 'actual' | 'proforma' | 'variance';
  scope: 'portfolio' | 'property' | 'unit';
  actualFinances: ActualFinancesData;
  portfolioCalculations: any;
  propertyFinances: FinancialCalculationResult | null;
  unitFinancials: any;
  durationMonths: number;
  actualPeriodLabel: string;
}

export const StatementCashFlowBreakdown: React.FC<CashFlowBreakdownProps> = ({
  statementMode,
  scope,
  actualFinances,
  portfolioCalculations,
  propertyFinances,
  unitFinancials,
  durationMonths,
  actualPeriodLabel,
}) => {
  if (statementMode === 'actual') {
    return (
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-300 pb-1">
          {scope === 'portfolio' ? '5. Net Realized Cash Flow Breakdown' : '4. Net Realized Cash Flow Breakdown'}
        </h2>
        <table className="w-full text-xs font-medium">
          <tbody className="divide-y divide-slate-800 print:divide-slate-200">
            <tr>
              <td className="py-1.5 text-slate-300 print:text-slate-700">
                Actual Realized Cash Inflow (Rent Collected + Verified Other Income)
                <span className="text-[10px] text-slate-500 print:text-slate-600 block">
                  {formatCurrency(actualFinances.actualRentCollected)} rent + {formatCurrency(actualFinances.actualOtherIncome)} ancillary
                </span>
              </td>
              <td className="py-1.5 text-right text-emerald-400 print:text-emerald-700 font-bold text-sm">
                +{formatCurrency(actualFinances.actualTotalIncome)}
              </td>
            </tr>

            {/* If Taxes or HOA were calculated/included, itemize them clearly */}
            {actualFinances.calculatedEscrowTotal && actualFinances.calculatedEscrowTotal > 0 ? (
              <>
                {actualFinances.calculatedPropertyTaxes && actualFinances.calculatedPropertyTaxes > 0 && (
                  <tr>
                    <td className="py-1.5 text-slate-300 print:text-slate-700 pl-4 border-l-2 border-blue-500/50">
                      Less: Property Taxes
                      <span className="text-[10px] text-slate-500 print:text-slate-600 block">
                        Annual property taxes for period
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-rose-400 print:text-rose-700 font-bold text-sm">
                      -{formatCurrency(actualFinances.calculatedPropertyTaxes)}
                    </td>
                  </tr>
                )}
                {actualFinances.calculatedHoaFees && actualFinances.calculatedHoaFees > 0 && (
                  <tr>
                    <td className="py-1.5 text-slate-300 print:text-slate-700 pl-4 border-l-2 border-amber-500/50">
                      Less: HOA / Condo Fees
                      <span className="text-[10px] text-slate-500 print:text-slate-600 block">
                        Association dues for period
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-rose-400 print:text-rose-700 font-bold text-sm">
                      -{formatCurrency(actualFinances.calculatedHoaFees)}
                    </td>
                  </tr>
                )}
                {/* Other operating expenses (Repairs, appliances, etc.) */}
                {(() => {
                  const otherOpEx = Math.max(0, actualFinances.actualTotalOpEx - (actualFinances.calculatedEscrowTotal || 0));
                  if (otherOpEx > 0) {
                    return (
                      <tr>
                        <td className="py-1.5 text-slate-300 print:text-slate-700 pl-4 border-l-2 border-slate-700">
                          Less: Incurred Repairs &amp; Other Operating Expenses
                        </td>
                        <td className="py-1.5 text-right text-rose-400 print:text-rose-700 font-bold text-sm">
                          -{formatCurrency(otherOpEx)}
                        </td>
                      </tr>
                    );
                  }
                  return null;
                })()}
                <tr className="bg-slate-800/20 print:bg-slate-50/50 text-[11px] font-semibold text-slate-400 print:text-slate-600">
                  <td className="py-1 pl-2">Total Operating Expenses (Taxes, HOA &amp; Incurred OpEx)</td>
                  <td className="py-1 text-right text-rose-400 print:text-rose-800 font-bold">
                    -{formatCurrency(actualFinances.actualTotalOpEx)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td className="py-1.5 text-slate-300 print:text-slate-700">
                  Less: Actual Operating Expenses Paid
                </td>
                <td className="py-1.5 text-right text-rose-400 print:text-rose-700 font-bold text-sm">
                  {actualFinances.actualTotalOpEx > 0 ? `-${formatCurrency(actualFinances.actualTotalOpEx)}` : '$0.00'}
                </td>
              </tr>
            )}

            <tr className="bg-slate-800/40 print:bg-slate-100 font-bold">
              <td className="py-2 text-white print:text-black">
                = Actual Net Operating Income (NOI Realized)
              </td>
              <td className="py-2 text-right text-white print:text-black font-extrabold text-sm">
                {formatCurrency(actualFinances.actualNoi)}
              </td>
            </tr>

            {actualFinances.actualDebtService > 0 && (
              <tr>
                <td className="py-1.5 text-slate-300 print:text-slate-700">
                  Less: Actual Mortgage & Debt Service Paid
                </td>
                <td className="py-1.5 text-right text-rose-400 print:text-rose-700 font-bold text-sm">
                  -{formatCurrency(actualFinances.actualDebtService)}
                </td>
              </tr>
            )}

            <tr className="bg-emerald-500/10 print:bg-emerald-50 text-emerald-400 print:text-emerald-950 font-black border-t-2 border-emerald-500/30 print:border-black text-sm sm:text-base">
              <td className="py-3 px-2 rounded-l">
                ACTUAL REALIZED NET CASH FLOW
                <span className="text-[10px] text-emerald-300 print:text-emerald-800 font-normal block">
                  Cash in pocket after all realized payments and expenses
                </span>
              </td>
              <td className="py-3 px-2 text-right rounded-r font-black">
                {formatCurrency(actualFinances.actualNetCashFlow)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // PRO-FORMA BREAKDOWN
  const egiMo = scope === 'portfolio' && portfolioCalculations
    ? portfolioCalculations.totalEgiMonthly
    : scope === 'unit' && unitFinancials
    ? unitFinancials.unitEgiMonthly
    : (propertyFinances?.effectiveGrossIncomeMonthly || 0);
  const opExMo = scope === 'portfolio' && portfolioCalculations
    ? portfolioCalculations.totalOpExMonthly
    : scope === 'unit' && unitFinancials
    ? unitFinancials.unitExpensesMonthly
    : (propertyFinances?.operatingExpensesMonthly || 0);
  const noiMo = scope === 'portfolio' && portfolioCalculations
    ? portfolioCalculations.totalNoiMonthly
    : scope === 'unit' && unitFinancials
    ? unitFinancials.unitNoiMonthly
    : (propertyFinances?.netOperatingIncomeMonthly || 0);
  const debtMo = scope === 'portfolio' && portfolioCalculations
    ? portfolioCalculations.totalDebtServiceMonthly
    : scope === 'unit' && unitFinancials
    ? unitFinancials.unitMortgageMonthly
    : (propertyFinances?.monthlyMortgagePI || 0);
  const netMo = scope === 'portfolio' && portfolioCalculations
    ? portfolioCalculations.totalNetCashFlowMonthly
    : scope === 'unit' && unitFinancials
    ? unitFinancials.unitNetCashFlowMonthly
    : (propertyFinances?.netCashFlowMonthly || 0);

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider border-b border-slate-800 print:border-slate-300 pb-1">
        {scope === 'portfolio' ? '5. Net Cash Flow & Debt Service Breakdown (Pro-Forma)' : '4. Net Cash Flow & Debt Service Breakdown (Pro-Forma)'}
      </h2>
      <table className="w-full text-xs font-medium">
        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
          <tr>
            <td className="py-1.5 text-slate-300 print:text-slate-700">
              Effective Gross Income (EGI Pro-Forma)
              <span className="text-[10px] text-slate-500 print:text-slate-600 block">
                {formatCurrency(egiMo)}/month &times; {durationMonths} month{durationMonths > 1 ? 's' : ''}
              </span>
            </td>
            <td className="py-1.5 text-right text-emerald-400 print:text-emerald-700 font-bold text-sm">
              +{formatCurrency(egiMo * durationMonths)}
            </td>
          </tr>

          <tr>
            <td className="py-1.5 text-slate-300 print:text-slate-700">
              Less: Total Operating Expenses Budget
              <span className="text-[10px] text-slate-500 print:text-slate-600 block">
                -{formatCurrency(opExMo)}/month &times; {durationMonths} month{durationMonths > 1 ? 's' : ''}
              </span>
            </td>
            <td className="py-1.5 text-right text-rose-400 print:text-rose-700 font-bold text-sm">
              -{formatCurrency(opExMo * durationMonths)}
            </td>
          </tr>

          <tr className="bg-slate-800/40 print:bg-slate-100 font-bold">
            <td className="py-2 text-white print:text-black">
              = Net Operating Income (NOI Pro-Forma)
            </td>
            <td className="py-2 text-right text-white print:text-black font-extrabold text-sm">
              {formatCurrency(noiMo * durationMonths)}
            </td>
          </tr>

          <tr>
            <td className="py-1.5 text-slate-300 print:text-slate-700">
              Less: Principal & Interest Debt Service (Mortgage)
              <span className="text-[10px] text-slate-500 print:text-slate-600 block">
                -{formatCurrency(debtMo)}/month &times; {durationMonths} month{durationMonths > 1 ? 's' : ''}
              </span>
            </td>
            <td className="py-1.5 text-right text-rose-400 print:text-rose-700 font-bold text-sm">
              -{formatCurrency(debtMo * durationMonths)}
            </td>
          </tr>

          <tr className="bg-emerald-500/10 print:bg-emerald-50 text-emerald-400 print:text-emerald-950 font-black border-t-2 border-emerald-500/30 print:border-black text-sm sm:text-base">
            <td className="py-3 px-2 rounded-l">
              NET CASH FLOW (FREE CASH FLOW PRO-FORMA)
              <span className="text-[10px] text-emerald-300 print:text-emerald-800 font-normal block">
                {formatCurrency(netMo)}/month &times; {durationMonths} month{durationMonths > 1 ? 's' : ''}
              </span>
            </td>
            <td className="py-3 px-2 text-right rounded-r font-black">
              {formatCurrency(netMo * durationMonths)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// =========================================================================
// 5. STATEMENT VARIANCE SCHEDULE (DUAL COMPARISON)
// =========================================================================
interface VarianceScheduleProps {
  actualFinances: ActualFinancesData;
  budgetBaseline: BudgetBaselineData;
  actualPeriodLabel: string;
}

export const StatementVarianceSchedule: React.FC<VarianceScheduleProps> = ({
  actualFinances,
  budgetBaseline,
  actualPeriodLabel,
}) => {
  const lineItems = [
    {
      name: 'Gross Scheduled Rent',
      budget: budgetBaseline.grossRent,
      actual: actualFinances.actualRentCollected,
      isExpense: false,
    },
    {
      name: 'Ancillary / Other Income',
      budget: budgetBaseline.extraIncome,
      actual: actualFinances.actualOtherIncome,
      isExpense: false,
    },
    {
      name: 'Total Revenue Inflow',
      budget: budgetBaseline.egi,
      actual: actualFinances.actualTotalIncome,
      isExpense: false,
      isSubtotal: true,
    },
    {
      name: 'Operating Expenses',
      budget: budgetBaseline.opEx,
      actual: actualFinances.actualTotalOpEx,
      isExpense: true,
    },
    {
      name: 'Net Operating Income (NOI)',
      budget: budgetBaseline.noi,
      actual: actualFinances.actualNoi,
      isExpense: false,
      isSubtotal: true,
    },
    {
      name: 'Debt Service (Mortgage)',
      budget: budgetBaseline.debtService,
      actual: actualFinances.actualDebtService,
      isExpense: true,
    },
    {
      name: 'Net Realized Cash Flow',
      budget: budgetBaseline.netCashFlow,
      actual: actualFinances.actualNetCashFlow,
      isExpense: false,
      isTotal: true,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
        <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Actual Realized vs. Underwriting Budget Variance Schedule</span>
        </h2>
        <span className="text-[10px] text-purple-400 print:text-purple-800 font-semibold">
          Reporting Period: {actualPeriodLabel}
        </span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
            <th className="text-left pb-1 font-semibold">Financial Line Item</th>
            <th className="text-right pb-1 font-semibold">Budget (Pro-Forma)</th>
            <th className="text-right pb-1 font-semibold text-emerald-400 print:text-emerald-800">Actual Realized</th>
            <th className="text-right pb-1 font-semibold">Dollar Variance</th>
            <th className="text-right pb-1 font-semibold">Variance (%)</th>
            <th className="text-center pb-1 font-semibold">Variance Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 print:divide-slate-200">
          {lineItems.map((item) => {
            const dollarDiff = item.actual - item.budget;
            // For expenses, paying less than budget is favorable (positive effect)
            const isFavorable = item.isExpense ? dollarDiff <= 0 : dollarDiff >= 0;
            const pctDiff = item.budget !== 0 ? (dollarDiff / Math.abs(item.budget)) * 100 : 0;

            let rowClass = 'py-2';
            if (item.isTotal) {
              rowClass = 'py-2.5 font-black bg-purple-500/10 print:bg-purple-50 text-purple-300 print:text-purple-950 border-t-2 border-purple-500/30';
            } else if (item.isSubtotal) {
              rowClass = 'py-2 font-bold bg-slate-800/40 print:bg-slate-100 text-white print:text-black';
            }

            return (
              <tr key={item.name} className={rowClass}>
                <td className="py-2 text-slate-300 print:text-slate-700 font-medium">
                  {item.name}
                </td>
                <td className="py-2 text-right text-slate-300 print:text-slate-700">
                  {formatCurrency(item.budget)}
                </td>
                <td className="py-2 text-right font-bold text-white print:text-black">
                  {formatCurrency(item.actual)}
                </td>
                <td className={`py-2 text-right font-bold ${isFavorable ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}`}>
                  {dollarDiff >= 0 ? `+${formatCurrency(dollarDiff)}` : formatCurrency(dollarDiff)}
                </td>
                <td className={`py-2 text-right font-semibold ${isFavorable ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}`}>
                  {pctDiff >= 0 ? `+${pctDiff.toFixed(1)}%` : `${pctDiff.toFixed(1)}%`}
                </td>
                <td className="py-2 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isFavorable
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {item.actual === 0 && item.budget > 0 
                      ? 'No Actuals ($0)' 
                      : isFavorable 
                      ? 'Favorable' 
                      : 'Unfavorable'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// =========================================================================
// 6. STATEMENT PROPERTY BREAKDOWN (PORTFOLIO SCOPE)
// =========================================================================
interface PropertyBreakdownProps {
  statementMode: 'actual' | 'proforma' | 'variance';
  actualFinances: ActualFinancesData;
  portfolioCalculations: any;
  durationMonths: number;
  propList: Property[];
  actualPeriodLabel: string;
}

export const StatementPropertyBreakdown: React.FC<PropertyBreakdownProps> = ({
  statementMode,
  actualFinances,
  portfolioCalculations,
  durationMonths,
  propList,
  actualPeriodLabel,
}) => {
  if (statementMode === 'actual') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
          <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
            2. Property-by-Property Actual Collections & Realized Performance
          </h2>
          <span className="text-[10px] text-emerald-400 print:text-emerald-800 font-semibold">
            {propList.length} Properties • {actualPeriodLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
                <th className="text-left pb-1">Property Name</th>
                <th className="text-right pb-1">Expected Rent</th>
                <th className="text-right pb-1 text-emerald-400 print:text-emerald-800 font-bold">Actual Collected</th>
                <th className="text-right pb-1 text-rose-400 print:text-rose-800">Actual Expenses</th>
                <th className="text-right pb-1">Actual Debt</th>
                <th className="text-right pb-1">Actual NOI</th>
                <th className="text-right pb-1">Net Realized Cash</th>
                <th className="text-center pb-1">Collection %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {actualFinances.propActuals.map((item) => (
                <tr key={item.property.id}>
                  <td className="py-1.5 font-bold text-white print:text-black">
                    {item.property.name}
                  </td>
                  <td className="py-1.5 text-right text-slate-300 print:text-slate-700">
                    {formatCurrency(item.rentExpected)}
                  </td>
                  <td className="py-1.5 text-right font-bold text-emerald-400 print:text-emerald-800">
                    {formatCurrency(item.rentCollected)}
                  </td>
                  <td className="py-1.5 text-right text-rose-400 print:text-rose-800">
                    {item.opEx > 0 ? `-${formatCurrency(item.opEx)}` : '$0.00'}
                  </td>
                  <td className="py-1.5 text-right text-slate-400">
                    {item.debtService > 0 ? `-${formatCurrency(item.debtService)}` : '$0.00'}
                  </td>
                  <td className="py-1.5 text-right font-semibold text-white print:text-black">
                    {formatCurrency(item.noi)}
                  </td>
                  <td className={`py-1.5 text-right font-bold ${item.netCashFlow >= 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}`}>
                    {formatCurrency(item.netCashFlow)}
                  </td>
                  <td className="py-1.5 text-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      item.collectionRate >= 90
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.collectionRate > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.collectionRate.toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}

              <tr className="font-bold bg-slate-800/60 print:bg-slate-100 text-white print:text-black border-t-2 border-slate-700 print:border-black">
                <td className="py-2 px-1 font-black">TOTAL PORTFOLIO ACTUALS</td>
                <td className="py-2 text-right text-slate-300 print:text-slate-700">
                  {formatCurrency(actualFinances.actualRentExpected)}
                </td>
                <td className="py-2 text-right text-emerald-400 print:text-emerald-900 font-black">
                  {formatCurrency(actualFinances.actualRentCollected)}
                </td>
                <td className="py-2 text-right text-rose-400 print:text-rose-900">
                  {actualFinances.actualTotalOpEx > 0 ? `-${formatCurrency(actualFinances.actualTotalOpEx)}` : '$0.00'}
                </td>
                <td className="py-2 text-right text-slate-300 print:text-slate-900">
                  {actualFinances.actualDebtService > 0 ? `-${formatCurrency(actualFinances.actualDebtService)}` : '$0.00'}
                </td>
                <td className="py-2 text-right text-white print:text-black">
                  {formatCurrency(actualFinances.actualNoi)}
                </td>
                <td className={`py-2 text-right font-black ${actualFinances.actualNetCashFlow >= 0 ? 'text-emerald-400 print:text-emerald-900' : 'text-rose-400 print:text-rose-900'}`}>
                  {formatCurrency(actualFinances.actualNetCashFlow)}
                </td>
                <td className="py-2 text-center text-[11px] font-bold text-emerald-400 print:text-emerald-900">
                  {actualFinances.collectionRate.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // PRO-FORMA BREAKDOWN
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
        <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
          2. Property-by-Property Performance Breakdown (Pro-Forma {durationMonths}M Totals)
        </h2>
        <span className="text-[10px] text-slate-400 print:text-slate-500">
          {propList.length} Active Properties
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
              <th className="text-left pb-1">Property Name</th>
              <th className="text-right pb-1">Rent ({durationMonths}M)</th>
              <th className="text-right pb-1">Expenses ({durationMonths}M)</th>
              <th className="text-right pb-1">Debt Service ({durationMonths}M)</th>
              <th className="text-right pb-1">NOI ({durationMonths}M)</th>
              <th className="text-right pb-1">Net Cash Flow ({durationMonths}M)</th>
              <th className="text-right pb-1">Cap Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 print:divide-slate-200">
            {portfolioCalculations.propertyBreakdown.map((item: any) => (
              <tr key={item.property.id}>
                <td className="py-1.5 font-bold text-white print:text-black">
                  {item.property.name}
                </td>
                <td className="py-1.5 text-right font-medium text-emerald-400 print:text-emerald-800">
                  {formatCurrency(item.rentMonthly * durationMonths)}
                </td>
                <td className="py-1.5 text-right text-rose-400 print:text-rose-800">
                  -{formatCurrency(item.finances.operatingExpensesMonthly * durationMonths)}
                </td>
                <td className="py-1.5 text-right text-slate-300 print:text-slate-700">
                  {item.finances.monthlyMortgagePI > 0 
                    ? `-${formatCurrency(item.finances.monthlyMortgagePI * durationMonths)}`
                    : 'Paid Off'}
                </td>
                <td className="py-1.5 text-right font-semibold text-blue-400 print:text-blue-800">
                  {formatCurrency(item.finances.netOperatingIncomeMonthly * durationMonths)}
                </td>
                <td className="py-1.5 text-right font-bold">
                  {(() => {
                    const ncf = item.finances.netCashFlowMonthly * durationMonths;
                    return (
                      <span className={ncf >= 0 ? 'text-emerald-400 print:text-emerald-800' : 'text-rose-400 print:text-rose-800'}>
                        {formatCurrency(ncf)}
                      </span>
                    );
                  })()}
                </td>
                <td className="py-1.5 text-right font-medium text-slate-200 print:text-slate-800">
                  {formatPercent(item.finances.capRatePercent)}
                </td>
              </tr>
            ))}
            <tr className="font-bold bg-slate-800/60 print:bg-slate-100 text-white print:text-black">
              <td className="py-2 px-1">TOTAL PORTFOLIO ({durationMonths}M)</td>
              <td className="py-2 text-right text-emerald-400 print:text-emerald-900">
                {formatCurrency(portfolioCalculations.totalGrossRentMonthly * durationMonths)}
              </td>
              <td className="py-2 text-right text-rose-400 print:text-rose-900">
                -{formatCurrency(portfolioCalculations.totalOpExMonthly * durationMonths)}
              </td>
              <td className="py-2 text-right text-slate-300 print:text-slate-900">
                -{formatCurrency(portfolioCalculations.totalDebtServiceMonthly * durationMonths)}
              </td>
              <td className="py-2 text-right text-blue-400 print:text-blue-900">
                {formatCurrency(portfolioCalculations.totalNoiMonthly * durationMonths)}
              </td>
              <td className="py-2 text-right text-emerald-400 print:text-emerald-900">
                {formatCurrency(portfolioCalculations.totalNetCashFlowMonthly * durationMonths)}
              </td>
              <td className="py-2 text-right">
                {formatPercent(portfolioCalculations.portfolioCapRate)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// 7. STATEMENT RENT ROLL SECTION
// =========================================================================
interface RentRollProps {
  statementMode: 'actual' | 'proforma' | 'variance';
  scope: 'portfolio' | 'property' | 'unit';
  actualFinances: ActualFinancesData;
  portfolioCalculations: any;
  activePropertyUnits: UnitRental[];
  durationMonths: number;
  actualPeriodLabel: string;
}

export const StatementRentRollSection: React.FC<RentRollProps> = ({
  statementMode,
  scope,
  actualFinances,
  portfolioCalculations,
  activePropertyUnits,
  durationMonths,
  actualPeriodLabel,
}) => {
  if (statementMode === 'actual') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
          <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
            {scope === 'portfolio' ? '3. Portfolio Rent Roll & Realized Collections' : '2. Property Rent Roll & Realized Collections'}
          </h2>
          <span className="text-[10px] text-emerald-400 print:text-emerald-800 font-semibold">
            {actualPeriodLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
                {scope === 'portfolio' && <th className="text-left pb-1">Property</th>}
                <th className="text-left pb-1">Resident / Tenant</th>
                <th className="text-right pb-1">Expected Rent</th>
                <th className="text-right pb-1 text-emerald-400 print:text-emerald-800 font-bold">Actual Paid</th>
                <th className="text-right pb-1">Balance Due</th>
                <th className="text-center pb-1">Status</th>
                <th className="text-left pb-1 hidden sm:table-cell">Payment Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {actualFinances.unitActuals.map((item) => {
                const u = item.unit;
                return (
                  <tr key={u.id + (u.propertyId || '')}>
                    {scope === 'portfolio' && (
                      <td className="py-1.5 font-medium text-slate-300 print:text-slate-800">
                        {u.propertyName}
                      </td>
                    )}
                    <td className="py-1.5 text-slate-300 print:text-slate-700">
                      {item.paymentRecord?.tenantName || u.tenantName || (u.isOccupied ? 'Occupied' : 'Vacant')}
                    </td>
                    <td className="py-1.5 text-right font-medium text-slate-300 print:text-slate-700">
                      {formatCurrency(item.expected)}
                    </td>
                    <td className="py-1.5 text-right font-bold text-emerald-400 print:text-emerald-800">
                      {formatCurrency(item.paid)}
                    </td>
                    <td className={`py-1.5 text-right font-medium ${item.balanceDue > 0 ? 'text-amber-400 print:text-amber-700' : 'text-slate-400 print:text-slate-500'}`}>
                      {formatCurrency(item.balanceDue)}
                    </td>
                    <td className="py-1.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800'
                          : item.status === 'partial'
                          ? 'bg-amber-500/20 text-amber-400 print:text-amber-800'
                          : item.status === 'overdue'
                          ? 'bg-rose-500/20 text-rose-400 print:text-rose-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-1.5 text-[11px] text-slate-400 print:text-slate-600 hidden sm:table-cell">
                      {item.paymentRecord 
                        ? `${item.paymentRecord.paymentMethod || 'Direct'} • ${item.paymentRecord.paidDate || 'Paid'}`
                        : item.paid > 0
                        ? 'Recorded payment'
                        : 'No payment recorded'}
                    </td>
                  </tr>
                );
              })}

              <tr className="font-bold bg-slate-800/60 print:bg-slate-100 text-white print:text-black border-t-2 border-slate-700 print:border-black">
                {scope === 'portfolio' && <td className="py-2 px-1">TOTAL</td>}
                <td className="py-2 font-black">
                  {actualFinances.unitActuals.length} Total Records
                </td>
                <td className="py-2 text-right text-slate-200 print:text-slate-900 font-bold">
                  {formatCurrency(actualFinances.actualRentExpected)}
                </td>
                <td className="py-2 text-right text-emerald-300 print:text-emerald-950 font-black">
                  {formatCurrency(actualFinances.actualRentCollected)}
                </td>
                <td className="py-2 text-right text-amber-400 print:text-amber-900 font-bold">
                  {formatCurrency(actualFinances.actualRentUncollected)}
                </td>
                <td className="py-2 text-center text-[11px] text-emerald-400 print:text-emerald-900">
                  {actualFinances.collectionRate.toFixed(0)}% Rate
                </td>
                <td className="py-2 hidden sm:table-cell text-slate-400 text-[11px]">
                  Realized Cash
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // PRO-FORMA RENT ROLL
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
        <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider">
          {scope === 'portfolio' ? '3. Portfolio Rent Roll Schedule' : '2. Property Rent Roll Schedule'}
        </h2>
        <span className="text-[10px] text-slate-400 print:text-slate-500">
          {scope === 'portfolio' ? `${portfolioCalculations?.propertyBreakdown?.length || 0} Active Properties` : 'Rental Schedule'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
              {scope === 'portfolio' && <th className="text-left pb-1">Property</th>}
              <th className="text-left pb-1">Resident / Tenant</th>
              <th className="text-left pb-1 hidden sm:table-cell">Lease / Due</th>
              <th className="text-right pb-1">Monthly Rent</th>
              <th className="text-right pb-1 text-emerald-400 print:text-emerald-800 font-bold">{durationMonths}-Month Total</th>
              <th className="text-right pb-1">Annualized</th>
              <th className="text-center pb-1">Status</th>
              <th className="text-right pb-1">Share %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 print:divide-slate-200">
            {(scope === 'portfolio' ? (portfolioCalculations?.allUnitsFlat || []) : activePropertyUnits).map((unit: any) => {
              const totalRentBase = scope === 'portfolio' 
                ? (portfolioCalculations?.totalGrossRentMonthly || 1)
                : (activePropertyUnits.reduce((s, u) => s + (Number(u.rent) || 0), 0) || 1);
              const sharePct = (Number(unit.rent) / totalRentBase) * 100;

              return (
                <tr key={unit.id + (unit.propertyId || '')}>
                  {scope === 'portfolio' && (
                    <td className="py-1.5 font-medium text-slate-300 print:text-slate-800">
                      {unit.propertyName}
                    </td>
                  )}
                  <td className="py-1.5 text-slate-300 print:text-slate-700">
                    <div className="font-semibold text-white print:text-black">
                      {unit.tenantName || 'Unassigned / Vacant'}
                    </div>
                    {unit.tenantPhone && (
                      <div className="text-[10px] text-emerald-400/90 print:text-emerald-800 font-mono mt-0.5">
                        {unit.tenantPhone}
                      </div>
                    )}
                  </td>
                  <td className="py-1.5 text-[11px] text-slate-400 print:text-slate-600 hidden sm:table-cell">
                    {unit.leaseEnd ? (
                      <div>
                        <span className="font-medium text-slate-200 print:text-black">Exp: {unit.leaseEnd}</span>
                        {unit.leaseStart && (
                          <span className="block text-[9px] text-slate-500">From {unit.leaseStart}</span>
                        )}
                      </div>
                    ) : unit.rentDueDay ? (
                      `Due ${unit.rentDueDay}th`
                    ) : (
                      'Month-to-Month'
                    )}
                  </td>
                  <td className="py-1.5 text-right font-medium text-slate-200 print:text-slate-800">
                    {formatCurrency(unit.rent)}/mo
                  </td>
                  <td className="py-1.5 text-right font-bold text-emerald-400 print:text-emerald-800">
                    {formatCurrency(unit.rent * durationMonths)}
                  </td>
                  <td className="py-1.5 text-right font-medium text-slate-300 print:text-slate-700">
                    {formatCurrency(unit.rent * 12)}/yr
                  </td>
                  <td className="py-1.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      unit.isOccupied
                        ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800'
                        : 'bg-amber-500/20 text-amber-400 print:text-amber-800'
                    }`}>
                      {unit.isOccupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-slate-400 print:text-slate-600 font-medium">
                    {sharePct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
            {(() => {
              const unitsList = scope === 'portfolio' ? (portfolioCalculations?.allUnitsFlat || []) : activePropertyUnits;
              const sumMonthlyRent = unitsList.reduce((acc: number, u: any) => acc + (Number(u.rent) || 0), 0);
              const sumPeriodRent = sumMonthlyRent * durationMonths;
              const sumAnnualRent = sumMonthlyRent * 12;
              const countOccupied = unitsList.filter((u: any) => u.isOccupied).length;

              return (
                <tr className="font-bold bg-slate-800/60 print:bg-slate-100 text-white print:text-black border-t-2 border-slate-700 print:border-black">
                  {scope === 'portfolio' && <td className="py-2 px-1">TOTAL</td>}
                  <td className="py-2 font-black">
                    {unitsList.length} Total Records
                  </td>
                  <td className="py-2 hidden sm:table-cell text-slate-400 print:text-slate-600 font-normal">
                    Portfolio-wide
                  </td>
                  <td className="py-2 text-right text-emerald-400 print:text-emerald-900 font-bold">
                    {formatCurrency(sumMonthlyRent)}/mo
                  </td>
                  <td className="py-2 text-right text-emerald-300 print:text-emerald-950 font-black">
                    {formatCurrency(sumPeriodRent)}
                  </td>
                  <td className="py-2 text-right text-slate-200 print:text-slate-900 font-medium">
                    {formatCurrency(sumAnnualRent)}/yr
                  </td>
                  <td className="py-2 text-center text-[11px] text-emerald-400 print:text-emerald-900">
                    {countOccupied}/{unitsList.length} Occ
                  </td>
                  <td className="py-2 text-right font-black">
                    100.0%
                  </td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

