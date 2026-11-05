import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  MapPin, 
  Home, 
  Coins, 
  Scale, 
  Sparkles, 
  TrendingUp, 
  AlertCircle,
  Landmark,
  DollarSign,
  Layers,
  Edit3,
  CheckCircle2,
  Receipt,
  Clock,
  Building2,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  Wallet,
  FileText
} from 'lucide-react';
import { Property, FinancialCalculationResult, RentPaymentRecord } from '../types';
import { formatCurrency, formatPercent, calculatePropertyFinances } from '../utils/calculations';

interface PropertyOverviewProps {
  property: Property;
  financials: FinancialCalculationResult;
  onOpenEditModal: () => void;
  allProperties?: Property[];
  onSelectProperty?: (id: string) => void;
  rentPayments?: RentPaymentRecord[];
  onNavigateToCollection?: () => void;
  onNavigateToPortfolio?: () => void;
}

export const PropertyOverview: React.FC<PropertyOverviewProps> = ({
  property,
  financials,
  onOpenEditModal,
  allProperties,
  onSelectProperty,
  rentPayments = [],
  onNavigateToCollection,
  onNavigateToPortfolio,
}) => {
  const [showPortfolioMatrix, setShowPortfolioMatrix] = useState(false);

  const isCashFlowPositive = financials.netCashFlowMonthly >= 0;
  const isHealthyDSCR = financials.debtServiceCoverageRatio >= 1.25;

  // Calculate current month's collection status according to date
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const thisMonthPayments = rentPayments.filter(
    (p) => p.propertyId === property.id && p.monthYear === currentMonthKey
  );
  const unitsCount = property.units?.length || 1;
  const totalRentExpected = property.units?.length
    ? property.units.reduce((sum, u) => sum + u.rent, 0)
    : property.baseMonthlyRent || 0;
  const totalRentCollectedThisMonth = thisMonthPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.paidAmount, 0);
  const isMonthFullyPaid = totalRentCollectedThisMonth >= totalRentExpected && totalRentExpected > 0;
  const paidCount = thisMonthPayments.filter((p) => p.status === 'paid').length;

  // Extract Tax, HOA, Insurance for this active property
  const taxExpense = (property.expenses || []).find(
    (e) => e.category === 'Property Taxes' || e.name.toLowerCase().includes('tax')
  );
  const annualTax = taxExpense
    ? taxExpense.frequency === 'monthly'
      ? (Number(taxExpense.amount) || 0) * 12
      : Number(taxExpense.amount) || 0
    : 0;

  const hoaExpense = (property.expenses || []).find(
    (e) => e.category === 'HOA / Condo Fees' || e.name.toLowerCase().includes('hoa')
  );
  const monthlyHoa = hoaExpense
    ? hoaExpense.frequency === 'annual'
      ? Math.round((Number(hoaExpense.amount) || 0) / 12)
      : Number(hoaExpense.amount) || 0
    : 0;

  const insExpense = (property.expenses || []).find(
    (e) => e.category === 'Property Insurance' || e.name.toLowerCase().includes('insurance')
  );
  const annualInsurance = insExpense
    ? insExpense.frequency === 'monthly'
      ? (Number(insExpense.amount) || 0) * 12
      : Number(insExpense.amount) || 0
    : 0;

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getLeaseExpirationInfo = (leaseEnd?: string) => {
    if (!leaseEnd) return null;
    try {
      const end = new Date(leaseEnd);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        return { text: `Expired (${Math.abs(diffDays)}d ago)`, isExpired: true, isUrgent: true, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      }
      if (diffDays <= 30) {
        return { text: `Expiring Soon (${diffDays}d left)`, isExpired: false, isUrgent: true, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      }
      return { text: `Active (${diffDays}d remaining)`, isExpired: false, isUrgent: false, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    } catch {
      return null;
    }
  };

  const primaryTenantName = property.tenantName || property.units?.[0]?.tenantName;
  const primaryTenantPhone = property.tenantPhone || property.units?.[0]?.tenantPhone;
  const primaryLeaseStart = property.leaseStart || property.units?.[0]?.leaseStart;
  const primaryLeaseEnd = property.leaseEnd || property.units?.[0]?.leaseEnd;
  const primaryLeaseStatus = getLeaseExpirationInfo(primaryLeaseEnd);
  const primarySecurityDeposit = property.securityDeposit !== undefined 
    ? property.securityDeposit 
    : property.units?.[0]?.securityDeposit;
  const primaryTenantNotes = property.tenantNotes || property.units?.[0]?.tenantNotes;

  return (
    <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md p-5 sm:p-6 mb-6 space-y-5">
      {/* Top Property Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 mt-0.5">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {property.name}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {property.propertyType}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {property.unitsCount || (property.units ? property.units.length : 1)} {property.unitsCount === 1 ? 'Unit' : 'Units'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{property.address || 'No address specified'}</span>
            </p>
          </div>
        </div>

        {/* Valuation & Overheads Edit CTA + Rent Collection Status */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {onNavigateToCollection && (
            <button
              onClick={onNavigateToCollection}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                isMonthFullyPaid
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {isMonthFullyPaid ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>
                Sep 2026 Rent:{' '}
                {isMonthFullyPaid
                  ? `All Paid (${formatCurrency(totalRentCollectedThisMonth)})`
                  : `${paidCount}/${unitsCount} Paid (${formatCurrency(totalRentCollectedThisMonth)}/${formatCurrency(totalRentExpected)})`}
              </span>
            </button>
          )}

          <button
            onClick={onOpenEditModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            Edit Property & Overheads
          </button>

          {onNavigateToPortfolio && (
            <button
              onClick={onNavigateToPortfolio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
              title="View all properties on one screen with total income and expenses"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>All Properties Portfolio</span>
            </button>
          )}

          {allProperties && allProperties.length > 1 && (
            <button
              onClick={() => setShowPortfolioMatrix(!showPortfolioMatrix)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                showPortfolioMatrix
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#11141B] text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {showPortfolioMatrix ? 'Hide Quick Grid' : 'Quick Compare'}
            </button>
          )}
        </div>
      </div>

      {/* Tenant & Active Lease Agreement Section */}
      <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Tenant & Active Lease Agreement
            </span>
            {unitsCount > 1 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                  {unitsCount} Units Schedule
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  (property.units || []).some(u => !u.isOccupied || Number(u.rent) === 0)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {(property.units || []).filter(u => u.isOccupied && Number(u.rent) > 0).length}/{unitsCount} Occupied
                  {(property.units || []).some(u => !u.isOccupied || Number(u.rent) === 0)
                    ? ` (${(property.units || []).filter(u => !u.isOccupied || Number(u.rent) === 0).length} Vacant)`
                    : ' (Full)'}
                </span>
              </div>
            ) : (
              (!property.units?.[0]?.isOccupied || financials.grossScheduledIncomeMonthly === 0) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  CURRENTLY VACANT ($0)
                </span>
              )
            )}
          </div>

          <button
            type="button"
            onClick={onOpenEditModal}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30 transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit Tenant & Lease</span>
          </button>
        </div>

        {/* If Single Unit or General Lease */}
        {unitsCount <= 1 || !property.units || property.units.length <= 1 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 text-xs">
              {/* 1. Tenant Full Name */}
              <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-400" />
                  Active Tenant
                </span>
                <div className="font-bold text-sm text-white truncate">
                  {primaryTenantName || <span className="text-slate-500 font-normal italic">No tenant assigned</span>}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {primaryTenantName ? 'Primary occupant' : 'Vacant or pending lease'}
                </span>
              </div>

              {/* 2. Tenant Phone Number */}
              <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  Contact Phone
                </span>
                <div className="font-bold text-sm text-white">
                  {primaryTenantPhone ? (
                    <a
                      href={`tel:${primaryTenantPhone}`}
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                      title="Click to call tenant"
                    >
                      <span>{primaryTenantPhone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-500 font-normal italic">No phone recorded</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {primaryTenantPhone ? 'Direct phone contact' : 'Add phone in property edit'}
                </span>
              </div>

              {/* 3. Lease Start Date */}
              <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  Lease Start Date
                </span>
                <div className="font-bold text-sm text-white">
                  {formatDateDisplay(primaryLeaseStart) || <span className="text-slate-500 font-normal italic">Not specified</span>}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {primaryLeaseStart ? 'Lease commencement' : 'Date lease started'}
                </span>
              </div>

              {/* 4. Lease Expiration Date & Countdown */}
              <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-rose-400" />
                    Lease Expiration
                  </span>
                  {primaryLeaseStatus && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${primaryLeaseStatus.color}`}>
                      {primaryLeaseStatus.text}
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-white">
                  {formatDateDisplay(primaryLeaseEnd) || (
                    <span className="text-slate-500 font-normal italic">Month-to-month</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {primaryLeaseEnd ? `Term end date` : 'No fixed expiration date'}
                </span>
              </div>

              {/* 5. Security Deposit Paid / Escrow */}
              <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-emerald-400" />
                    Security Deposit
                  </span>
                  {primarySecurityDeposit !== undefined && primarySecurityDeposit > 0 ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Paid
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      $0 Waived
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-emerald-400">
                  {primarySecurityDeposit !== undefined && primarySecurityDeposit > 0 
                    ? formatCurrency(primarySecurityDeposit) 
                    : '$0'}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {primarySecurityDeposit !== undefined && primarySecurityDeposit > 0 
                    ? 'Refundable deposit held in escrow' 
                    : 'No deposit collected'}
                </span>
              </div>
            </div>

            {/* Tenant & Lease Agreement Notes Section */}
            <div className="bg-[#161A23] p-3 sm:p-3.5 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tenant & Lease Agreement Notes:</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenEditModal}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>{primaryTenantNotes ? 'Edit Notes' : '+ Add Notes'}</span>
                </button>
              </div>
              {primaryTenantNotes ? (
                <div className="text-xs text-slate-200 bg-[#0E121A] p-2.5 rounded-md border border-slate-800/80 leading-relaxed font-normal whitespace-pre-line">
                  {primaryTenantNotes}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic bg-[#0E121A]/50 p-2 rounded-md border border-slate-800/40 flex items-center justify-between">
                  <span>No special lease notes, pet addendums, or deposit conditions recorded yet.</span>
                  <button
                    type="button"
                    onClick={onOpenEditModal}
                    className="text-[11px] text-blue-400 hover:underline font-medium not-italic ml-2 cursor-pointer"
                  >
                    + Add notes
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Multi-unit Itemized Tenant Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {property.units.map((unit, idx) => {
              const uStatus = getLeaseExpirationInfo(unit.leaseEnd);
              const isVac = !unit.isOccupied || Number(unit.rent) === 0;
              return (
                <div
                  key={unit.id}
                  className={`p-3 rounded-xl border space-y-2 transition-all ${
                    isVac
                      ? 'bg-[#121620] border-amber-500/40 ring-1 ring-amber-500/20'
                      : 'bg-[#161A23] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{unit.name || `Unit ${idx + 1}`}</span>
                      <span className={`text-[11px] font-bold ${isVac ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatCurrency(unit.rent)}/mo
                      </span>
                    </div>
                    {isVac ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        VACANT ($0)
                      </span>
                    ) : uStatus ? (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${uStatus.color}`}>
                        {uStatus.text}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        Occupied
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Tenant Name:</span>
                      <strong className={isVac ? 'text-amber-300 italic' : 'text-slate-200'}>
                        {isVac ? 'Vacant (Available for Lease)' : (unit.tenantName || 'Unassigned')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Phone Number:</span>
                      {unit.tenantPhone ? (
                        <a href={`tel:${unit.tenantPhone}`} className="text-emerald-400 hover:underline">
                          {unit.tenantPhone}
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Security Deposit:</span>
                      <span className="font-semibold text-emerald-400">
                        {unit.securityDeposit !== undefined && unit.securityDeposit > 0 ? formatCurrency(unit.securityDeposit) : '$0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Lease Start:</span>
                      <span className="text-slate-300">{formatDateDisplay(unit.leaseStart) || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block">Lease Expires:</span>
                      <span className="text-slate-300">{formatDateDisplay(unit.leaseEnd) || 'Month-to-month'}</span>
                    </div>
                  </div>

                  {unit.tenantNotes && (
                    <div className="text-[10px] text-slate-300 bg-[#0E121A] p-2 rounded-md border border-slate-800/80 mt-1 leading-snug">
                      <span className="text-slate-500 font-medium mr-1">Notes:</span>
                      {unit.tenantNotes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Property-Specific Financial DNA & Fixed Escrows Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#11141B] p-3.5 rounded-xl border border-slate-800">
        {/* 1. Monthly Rent */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            Rental Income
          </span>
          <div className="text-sm sm:text-base font-bold text-emerald-400">
            {formatCurrency(financials.grossScheduledIncomeMonthly)}
            <span className="text-[11px] font-normal text-slate-400"> /mo</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {formatCurrency(financials.grossScheduledIncomeAnnual)}/yr
          </span>
        </div>

        {/* 2. Property Taxes */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Landmark className="w-3 h-3 text-rose-400" />
            Property Tax
          </span>
          <div className="text-sm sm:text-base font-bold text-white">
            {formatCurrency(annualTax)}
            <span className="text-[11px] font-normal text-slate-400"> /yr</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            ≈ {formatCurrency(annualTax / 12)}/mo
          </span>
        </div>

        {/* 3. HOA / Condo Fees */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Home className="w-3 h-3 text-amber-400" />
            HOA / Condo Dues
          </span>
          <div className="text-sm sm:text-base font-bold text-amber-400">
            {monthlyHoa > 0 ? (
              <>
                {formatCurrency(monthlyHoa)}
                <span className="text-[11px] font-normal text-slate-400"> /mo</span>
              </>
            ) : (
              <span className="text-slate-400 text-xs font-semibold">No HOA ($0)</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            {monthlyHoa > 0 ? `${formatCurrency(monthlyHoa * 12)}/yr` : 'Single fee exempt'}
          </span>
        </div>

        {/* 4. Hazard Insurance */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Percent className="w-3 h-3 text-blue-400" />
            Insurance
          </span>
          <div className="text-sm sm:text-base font-bold text-white">
            {formatCurrency(annualInsurance)}
            <span className="text-[11px] font-normal text-slate-400"> /yr</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            ≈ {formatCurrency(annualInsurance / 12)}/mo
          </span>
        </div>
      </div>

      {/* Portfolio Matrix Comparison Table (Toggled) */}
      {showPortfolioMatrix && allProperties && (
        <div className="bg-[#11141B] p-4 rounded-xl border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              All Properties Portfolio Breakdown (Income, HOA & Taxes)
            </h4>
            <span className="text-[11px] text-slate-400">Click any row to switch active property</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold pb-2">
                  <th className="pb-2">Property</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Rent / mo</th>
                  <th className="pb-2 text-right">Property Tax / yr</th>
                  <th className="pb-2 text-right">HOA / mo</th>
                  <th className="pb-2 text-right">Total OpEx / mo</th>
                  <th className="pb-2 text-right">Net Cash Flow</th>
                  <th className="pb-2 text-right">Cap Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allProperties.map((p) => {
                  const pFin = calculatePropertyFinances(p);
                  const pTax = (p.expenses || []).find(
                    (e) => e.category === 'Property Taxes' || e.name.toLowerCase().includes('tax')
                  );
                  const pAnnualTax = pTax
                    ? pTax.frequency === 'monthly'
                      ? (Number(pTax.amount) || 0) * 12
                      : Number(pTax.amount) || 0
                    : 0;

                  const pHoa = (p.expenses || []).find(
                    (e) => e.category === 'HOA / Condo Fees' || e.name.toLowerCase().includes('hoa')
                  );
                  const pMonthlyHoa = pHoa
                    ? pHoa.frequency === 'annual'
                      ? Math.round((Number(pHoa.amount) || 0) / 12)
                      : Number(pHoa.amount) || 0
                    : 0;

                  const isActive = p.id === property.id;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProperty && onSelectProperty(p.id)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-slate-800/80 font-bold text-white ring-1 ring-blue-500/40'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-400">{p.propertyType}</td>
                      <td className="py-2.5 text-right font-semibold text-emerald-400">
                        {formatCurrency(pFin.grossScheduledIncomeMonthly)}
                      </td>
                      <td className="py-2.5 text-right text-rose-400">
                        {formatCurrency(pAnnualTax)}
                      </td>
                      <td className="py-2.5 text-right text-amber-400">
                        {pMonthlyHoa > 0 ? formatCurrency(pMonthlyHoa) : '$0'}
                      </td>
                      <td className="py-2.5 text-right text-slate-300">
                        {formatCurrency(pFin.operatingExpensesMonthly)}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${
                        pFin.netCashFlowMonthly >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatCurrency(pFin.netCashFlowMonthly)}/mo
                      </td>
                      <td className="py-2.5 text-right text-blue-400">
                        {formatPercent(pFin.capRatePercent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Core KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Net Cash Flow */}
        <div className={`p-4 rounded-xl border transition-all ${
          isCashFlowPositive 
            ? 'bg-[#11141B] border-emerald-500/30' 
            : 'bg-[#11141B] border-rose-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Net Cash Flow (Monthly)</span>
            <div className={`p-1.5 rounded-lg ${isCashFlowPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isCashFlowPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isCashFlowPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(financials.netCashFlowMonthly)}
            </span>
            <span className="text-xs font-medium text-slate-500">/ mo</span>
          </div>
          <div className="text-xs font-medium text-slate-400 mt-1 flex items-center justify-between">
            <span>Annualized:</span>
            <span className={`font-semibold ${isCashFlowPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(financials.netCashFlowAnnual)}/yr
            </span>
          </div>
        </div>

        {/* 2. Cap Rate */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#11141B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cap Rate (Unleveraged)</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-400">
              {formatPercent(financials.capRatePercent)}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Annual NOI:</span>
            <span className="font-semibold text-slate-200">{formatCurrency(financials.netOperatingIncomeAnnual)}</span>
          </div>
        </div>

        {/* 3. Cash on Cash Return */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#11141B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cash-on-Cash ROI</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              financials.cashOnCashReturnPercent >= 8 ? 'text-emerald-400' : 'text-purple-400'
            }`}>
              {formatPercent(financials.cashOnCashReturnPercent)}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>On {formatCurrency(financials.totalInitialInvestment, true)} cash:</span>
            <span className="font-semibold text-slate-200">{formatCurrency(financials.netCashFlowAnnual)}</span>
          </div>
        </div>

        {/* 4. Operating Expense Ratio & DSCR */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#11141B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Expense Ratio / DSCR</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                {formatPercent(financials.operatingExpenseRatioPercent, 1)}
              </span>
              <span className="text-[10px] text-slate-500 block">OpEx Ratio</span>
            </div>
            {property.hasMortgage && (
              <div className="text-right">
                <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                  isHealthyDSCR ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {financials.debtServiceCoverageRatio.toFixed(2)}x
                </span>
                <span className="text-[10px] text-slate-500 block">DSCR Ratio</span>
              </div>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {property.hasMortgage 
              ? (isHealthyDSCR ? 'Strong lender coverage' : 'Caution: Tight debt coverage')
              : 'Unencumbered (No mortgage)'}
          </div>
        </div>
      </div>

      {/* Cash Flow Waterfall Breakdown Bar */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mb-2 gap-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            Monthly Revenue Flow Waterfall
          </span>
          <span className="text-slate-400">
            Gross Income: <strong className="text-white">{formatCurrency(financials.grossScheduledIncomeMonthly)}/mo</strong>
          </span>
        </div>

        {/* Visual Multi-segment Progress Bar */}
        <div className="h-3.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex shadow-inner">
          {/* Operating Expenses */}
          <div
            style={{
              width: `${Math.min(100, (financials.operatingExpensesMonthly / (financials.grossScheduledIncomeMonthly || 1)) * 100)}%`,
            }}
            className="bg-rose-500 hover:bg-rose-400 transition-all"
            title={`Operating Expenses: ${formatCurrency(financials.operatingExpensesMonthly)}`}
          />
          {/* Vacancy Loss */}
          <div
            style={{
              width: `${Math.min(100, (financials.vacancyLossMonthly / (financials.grossScheduledIncomeMonthly || 1)) * 100)}%`,
            }}
            className="bg-amber-500 hover:bg-amber-400 transition-all"
            title={`Vacancy Loss: ${formatCurrency(financials.vacancyLossMonthly)}`}
          />
          {/* Mortgage P&I */}
          {property.hasMortgage && (
            <div
              style={{
                width: `${Math.min(100, (financials.monthlyMortgagePI / (financials.grossScheduledIncomeMonthly || 1)) * 100)}%`,
              }}
              className="bg-blue-500 hover:bg-blue-400 transition-all"
              title={`Mortgage P&I: ${formatCurrency(financials.monthlyMortgagePI)}`}
            />
          )}
          {/* Remaining Net Cash Flow */}
          {isCashFlowPositive && (
            <div
              style={{
                width: `${Math.min(100, (financials.netCashFlowMonthly / (financials.grossScheduledIncomeMonthly || 1)) * 100)}%`,
              }}
              className="bg-emerald-500 hover:bg-emerald-400 transition-all flex-1"
              title={`Net Cash Flow: ${formatCurrency(financials.netCashFlowMonthly)}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-400 mt-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span>Operating Expenses: <strong className="text-slate-200">{formatCurrency(financials.operatingExpensesMonthly)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>Vacancy Buffer ({property.vacancyRatePercent}%): <strong className="text-slate-200">{formatCurrency(financials.vacancyLossMonthly)}</strong></span>
          </div>
          {property.hasMortgage && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>Mortgage P&I: <strong className="text-slate-200">{formatCurrency(financials.monthlyMortgagePI)}</strong></span>
            </div>
          )}
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Pocket Cash Flow: <strong>{formatCurrency(financials.netCashFlowMonthly)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
