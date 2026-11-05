import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Printer, 
  X, 
  Building2, 
  Calendar, 
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  User,
  Home,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Wrench,
  Hammer,
  Coins,
  Scale,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Property, FinancialCalculationResult, RentPaymentRecord, UnitRental, ExpenseCategory, Transaction } from '../types';
import { formatCurrency, formatPercent, calculatePropertyFinances } from '../utils/calculations';
import { downloadPdfDocument, downloadHtmlDocument, printElement } from '../utils/printHelper';
import {
  StatementSummaryCards,
  StatementIncomeSchedule,
  StatementOpExSchedule,
  StatementCashFlowBreakdown,
  StatementVarianceSchedule,
  StatementPropertyBreakdown,
  StatementRentRollSection,
} from './ExportStatementSections';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  allProperties?: Property[];
  financials?: FinancialCalculationResult | null;
  rentPayments?: RentPaymentRecord[];
  initialUnitId?: string;
  initialMonthYear?: string;
  initialScope?: 'portfolio' | 'property' | 'unit';
  transactions?: Transaction[];
}

// Helper to get live current month key according to system date
const getLiveCurrentMonthKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  property: propFromProps,
  allProperties = [],
  financials: finFromProps,
  rentPayments = [],
  initialUnitId,
  initialMonthYear,
  initialScope,
  transactions = [],
}) => {
  // Available properties list
  const propList: Property[] = useMemo(() => {
    if (allProperties && allProperties.length > 0) {
      return allProperties;
    }
    if (propFromProps) {
      return [propFromProps];
    }
    return [];
  }, [allProperties, propFromProps]);

  // Selected property state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    propFromProps?.id || (propList.length > 0 ? propList[0].id : '')
  );

  // Scope: 'portfolio' (All Properties & All Units) | 'property' (All Units on Selected Property) | 'unit' (Single Unit)
  const [scope, setScope] = useState<'portfolio' | 'property' | 'unit'>(initialScope || 'portfolio');

  // Selected Unit ID for Single Unit mode
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  // Duration in Months: 1, 2, 3, 6, 12, 24, 36, etc.
  const [durationMonths, setDurationMonths] = useState<number>(1);

  // Statement Accounting Mode: 'actual' (Pure Realized Cash Basis) | 'proforma' (Underwriting Budget Projections) | 'variance' (Dual Comparison)
  const [statementMode, setStatementMode] = useState<'actual' | 'proforma' | 'variance'>('actual');

  // Selected Month (YYYY-MM): e.g. '2026-10', etc.
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonthYear || getLiveCurrentMonthKey());

  // Actuals Reporting Period: '2026-10' | any YYYY-MM | 'last3' | 'ytd' | 'all'
  const [actualPeriod, setActualPeriod] = useState<string>(initialMonthYear || getLiveCurrentMonthKey());

  // Custom Statement Date Range (Start Date & End Date)
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const liveYm = getLiveCurrentMonthKey();
    return `${liveYm}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  // Custom Statement Issue Date (Date printed on header)
  const [customStatementDate, setCustomStatementDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [includeStatementDate, setIncludeStatementDate] = useState<boolean>(true);

  // Toggle for calculating Property Taxes and HOA escrow/dues on statement
  const [includeCalculatedEscrow, setIncludeCalculatedEscrow] = useState<boolean>(true);

  // Helper to extract monthly Property Taxes configured on a property
  const getPropertyTaxMonthly = useCallback((p: Property): number => {
    if (!p.expenses || p.expenses.length === 0) return 0;
    const taxItems = p.expenses.filter(
      (e) => e.category === 'Property Taxes' || (!e.name.toLowerCase().includes('insurance') && (e.name.toLowerCase().includes('tax') || e.name.toLowerCase().includes('real estate tax')))
    );
    return taxItems.reduce((sum, item) => {
      if (item.isPercentageOfRent && item.percentageValue !== undefined) {
        const grossRent = p.units && p.units.length > 0 
          ? p.units.reduce((s, u) => s + (Number(u.rent) || 0), 0)
          : Number(p.baseMonthlyRent) || 0;
        return sum + (grossRent * (Number(item.percentageValue) || 0)) / 100;
      }
      const amt = Number(item.amount) || 0;
      return sum + (item.frequency === 'annual' ? amt / 12 : amt);
    }, 0);
  }, []);

  // Helper to extract monthly HOA / Condo Fees configured on a property
  const getPropertyHoaMonthly = useCallback((p: Property): number => {
    if (!p.expenses || p.expenses.length === 0) return 0;
    const hoaItems = p.expenses.filter(
      (e) => e.category === 'HOA / Condo Fees' || e.name.toLowerCase().includes('hoa') || e.name.toLowerCase().includes('condo fee') || e.name.toLowerCase().includes('association')
    );
    return hoaItems.reduce((sum, item) => {
      if (item.isPercentageOfRent && item.percentageValue !== undefined) {
        const grossRent = p.units && p.units.length > 0 
          ? p.units.reduce((s, u) => s + (Number(u.rent) || 0), 0)
          : Number(p.baseMonthlyRent) || 0;
        return sum + (grossRent * (Number(item.percentageValue) || 0)) / 100;
      }
      const amt = Number(item.amount) || 0;
      return sum + (item.frequency === 'annual' ? amt / 12 : amt);
    }, 0);
  }, []);

  // Helper to format custom statement date nicely
  const formatCustomDateDisplay = (dStr: string) => {
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  // UI status states
  const [copied, setCopied] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // When modal opens or initialUnitId / initialMonthYear changes, reset scope & period intelligently
  useEffect(() => {
    if (!isOpen) return;

    // Default to actual cash basis whenever statement opens
    setStatementMode('actual');

    const liveMonth = getLiveCurrentMonthKey();
    if (initialMonthYear) {
      setSelectedMonth(initialMonthYear);
      setActualPeriod(initialMonthYear);
    } else {
      setSelectedMonth(liveMonth);
      setActualPeriod(liveMonth);
    }

    if (initialScope) {
      setScope(initialScope);
      if (initialScope === 'unit' && initialUnitId) {
        setSelectedUnitId(initialUnitId);
      }
    } else if (initialUnitId) {
      // Find property containing this specific unit
      const parentProp = propList.find((p) => p.units?.some((u) => u.id === initialUnitId));
      if (parentProp) {
        setSelectedPropertyId(parentProp.id);
      }
      setSelectedUnitId(initialUnitId);
      setScope('unit');
    } else if (propFromProps) {
      // Direct focus on the user's active property and its units
      setSelectedPropertyId(propFromProps.id);
      setScope('property');
      if (propFromProps.units && propFromProps.units.length > 0) {
        setSelectedUnitId(propFromProps.units[0].id);
      }
    } else if (propList.length === 1) {
      setSelectedPropertyId(propList[0].id);
      setScope('property');
      if (propList[0].units && propList[0].units.length > 0) {
        setSelectedUnitId(propList[0].units[0].id);
      }
    } else {
      // Opened from portfolio overview without specific property
      setScope('portfolio');
    }
  }, [isOpen, initialUnitId, initialMonthYear, initialScope, propList, propFromProps]);

  // Active property lookup
  const activeProperty: Property | null = useMemo(() => {
    if (propList.length > 0 && selectedPropertyId) {
      return propList.find((p) => p.id === selectedPropertyId) || propList[0];
    }
    return propFromProps || (propList.length > 0 ? propList[0] : null);
  }, [propList, selectedPropertyId, propFromProps]);

  // Units list for active single property
  const activePropertyUnits: UnitRental[] = useMemo(() => {
    if (!activeProperty) return [];
    if (activeProperty.units && activeProperty.units.length > 0) {
      return activeProperty.units.map((u, i) => ({
        ...u,
        tenantName: u.tenantName || (i === 0 ? activeProperty.tenantName : '') || '',
        tenantPhone: u.tenantPhone || (i === 0 ? activeProperty.tenantPhone : undefined),
        leaseStart: u.leaseStart || (i === 0 ? activeProperty.leaseStart : undefined),
        leaseEnd: u.leaseEnd || (i === 0 ? activeProperty.leaseEnd : undefined),
      }));
    }
    return [
      {
        id: `${activeProperty.id}-main`,
        name: activeProperty.unitsCount > 1 ? 'Unit 1' : 'Main Rental Unit',
        rent: Number(activeProperty.baseMonthlyRent) || 0,
        isOccupied: (activeProperty as any).isOccupied !== false && (Number(activeProperty.baseMonthlyRent) || 0) > 0,
        tenantName: activeProperty.tenantName || 'Primary Resident',
        tenantPhone: activeProperty.tenantPhone,
        leaseStart: activeProperty.leaseStart,
        leaseEnd: activeProperty.leaseEnd,
        rentDueDay: 1,
      },
    ];
  }, [activeProperty]);

  // Keep selectedUnitId valid
  useEffect(() => {
    if (activePropertyUnits.length > 0 && !activePropertyUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(activePropertyUnits[0].id);
    }
  }, [activePropertyUnits, selectedUnitId]);

  // Selected Unit object
  const selectedUnit: UnitRental | null = useMemo(() => {
    return activePropertyUnits.find((u) => u.id === selectedUnitId) || activePropertyUnits[0] || null;
  }, [activePropertyUnits, selectedUnitId]);

  // Single active property calculated finances
  const propertyFinances = useMemo(() => {
    if (!activeProperty) return null;
    return calculatePropertyFinances(activeProperty);
  }, [activeProperty]);

  // Single unit pro-rata financial breakdown
  const unitFinancials = useMemo(() => {
    if (!activeProperty || !propertyFinances || !selectedUnit) return null;

    const propertyTotalGrossRent = activePropertyUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0) || Number(activeProperty.baseMonthlyRent) || 1;
    const unitRentMonthly = Number(selectedUnit.rent) || 0;
    const unitShareRatio = propertyTotalGrossRent > 0 ? unitRentMonthly / propertyTotalGrossRent : 1 / (activePropertyUnits.length || 1);

    const unitExtraIncomeMonthly = propertyFinances.extraIncomeMonthly * unitShareRatio;
    const unitGrossMonthly = unitRentMonthly + unitExtraIncomeMonthly;

    const vacancyRate = (Number(activeProperty.vacancyRatePercent) || 0) / 100;
    const unitVacancyLossMonthly = unitRentMonthly * vacancyRate;
    const unitEgiMonthly = Math.max(0, unitGrossMonthly - unitVacancyLossMonthly);

    const unitExpensesMonthly = propertyFinances.operatingExpensesMonthly * unitShareRatio;
    const unitExpensesAnnual = unitExpensesMonthly * 12;

    const unitNoiMonthly = unitEgiMonthly - unitExpensesMonthly;
    const unitNoiAnnual = unitNoiMonthly * 12;

    const unitMortgageMonthly = propertyFinances.monthlyMortgagePI * unitShareRatio;
    const unitMortgageAnnual = unitMortgageMonthly * 12;

    const unitNetCashFlowMonthly = unitNoiMonthly - unitMortgageMonthly;
    const unitNetCashFlowAnnual = unitNetCashFlowMonthly * 12;

    const propertyVal = Number(activeProperty.currentValuation) || Number(activeProperty.purchasePrice) || 1;
    const unitValuation = propertyVal * unitShareRatio;
    const unitInitialInvestment = propertyFinances.totalInitialInvestment * unitShareRatio;

    const unitCapRate = unitValuation > 0 ? (unitNoiAnnual / unitValuation) * 100 : 0;
    const unitCoc = unitInitialInvestment > 0 ? (unitNetCashFlowAnnual / unitInitialInvestment) * 100 : 0;

    return {
      unitRentMonthly,
      unitRentAnnual: unitRentMonthly * 12,
      unitShareRatio,
      unitSharePercent: unitShareRatio * 100,
      unitExtraIncomeMonthly,
      unitExtraIncomeAnnual: unitExtraIncomeMonthly * 12,
      unitGrossMonthly,
      unitGrossAnnual: unitGrossMonthly * 12,
      unitVacancyLossMonthly,
      unitVacancyLossAnnual: unitVacancyLossMonthly * 12,
      unitEgiMonthly,
      unitEgiAnnual: unitEgiMonthly * 12,
      unitExpensesMonthly,
      unitExpensesAnnual,
      unitNoiMonthly,
      unitNoiAnnual,
      unitMortgageMonthly,
      unitMortgageAnnual,
      unitNetCashFlowMonthly,
      unitNetCashFlowAnnual,
      unitValuation,
      unitInitialInvestment,
      unitCapRate,
      unitCoc,
    };
  }, [activeProperty, propertyFinances, selectedUnit, activePropertyUnits]);

  // =========================================================================
  // PORTFOLIO-WIDE AGGREGATIONS (ALL PROPERTIES & ALL UNITS)
  // =========================================================================
  const portfolioCalculations = useMemo(() => {
    const list = propList;
    if (list.length === 0) return null;

    let totalValuation = 0;
    let totalPurchasePrice = 0;
    let totalInitialInvestment = 0;
    let totalGrossRentMonthly = 0;
    let totalExtraIncomeMonthly = 0;
    let totalVacancyLossMonthly = 0;
    let totalEgiMonthly = 0;
    let totalOpExMonthly = 0;
    let totalDebtServiceMonthly = 0;
    let totalNoiMonthly = 0;
    let totalNetCashFlowMonthly = 0;
    let totalUnitsCount = 0;
    let totalOccupiedUnits = 0;

    const propertyBreakdown = list.map((p) => {
      const fin = calculatePropertyFinances(p);
      const units = p.units && p.units.length > 0 ? p.units : [
        {
          id: `${p.id}-main`,
          name: 'Main Unit',
          rent: Number(p.baseMonthlyRent) || 0,
          isOccupied: true,
          tenantName: 'Primary Resident',
        }
      ];

      const occupied = units.filter((u) => u.isOccupied).length;
      const valuation = Number(p.currentValuation) || Number(p.purchasePrice) || 0;
      const rentMonthly = units.reduce((s, u) => s + (Number(u.rent) || 0), 0) || Number(p.baseMonthlyRent) || 0;

      totalValuation += valuation;
      totalPurchasePrice += Number(p.purchasePrice) || 0;
      totalInitialInvestment += fin.totalInitialInvestment;
      totalGrossRentMonthly += rentMonthly;
      totalExtraIncomeMonthly += fin.extraIncomeMonthly;
      totalVacancyLossMonthly += fin.vacancyLossMonthly;
      totalEgiMonthly += fin.effectiveGrossIncomeMonthly;
      totalOpExMonthly += fin.operatingExpensesMonthly;
      totalDebtServiceMonthly += fin.monthlyMortgagePI;
      totalNoiMonthly += fin.netOperatingIncomeMonthly;
      totalNetCashFlowMonthly += fin.netCashFlowMonthly;
      totalUnitsCount += units.length;
      totalOccupiedUnits += occupied;

      return {
        property: p,
        finances: fin,
        units,
        valuation,
        rentMonthly,
        occupied,
        unitsCount: units.length,
      };
    });

    // All units flat list across the entire portfolio
    const allUnitsFlat = list.flatMap((p) => {
      const units = p.units && p.units.length > 0 ? p.units : [
        {
          id: `${p.id}-main`,
          name: 'Main Unit',
          rent: Number(p.baseMonthlyRent) || 0,
          isOccupied: (p as any).isOccupied !== false && (Number(p.baseMonthlyRent) || 0) > 0,
          tenantName: p.tenantName || 'Primary Resident',
          tenantPhone: p.tenantPhone,
          leaseStart: p.leaseStart,
          leaseEnd: p.leaseEnd,
        }
      ];
      return units.map((u, idx) => ({
        ...u,
        tenantName: u.tenantName || (idx === 0 ? p.tenantName : '') || '',
        tenantPhone: u.tenantPhone || (idx === 0 ? p.tenantPhone : undefined),
        leaseStart: u.leaseStart || (idx === 0 ? p.leaseStart : undefined),
        leaseEnd: u.leaseEnd || (idx === 0 ? p.leaseEnd : undefined),
        propertyName: p.name,
        propertyId: p.id,
      }));
    });

    // Consolidated OpEx grouped by standard category
    const expenseCategoriesMap: Record<string, { name: string; monthly: number; annual: number }> = {};

    list.forEach((p) => {
      const fin = calculatePropertyFinances(p);
      (p.expenses || []).forEach((exp) => {
        let monthlyAmt = 0;
        if (exp.isPercentageOfRent && exp.percentageValue !== undefined) {
          monthlyAmt = (fin.grossScheduledIncomeMonthly * exp.percentageValue) / 100;
        } else {
          monthlyAmt = exp.frequency === 'annual' ? (Number(exp.amount) || 0) / 12 : Number(exp.amount) || 0;
        }

        const catKey = exp.category || 'Other Expenses';
        if (!expenseCategoriesMap[catKey]) {
          expenseCategoriesMap[catKey] = {
            name: catKey,
            monthly: 0,
            annual: 0,
          };
        }
        expenseCategoriesMap[catKey].monthly += monthlyAmt;
        expenseCategoriesMap[catKey].annual += monthlyAmt * 12;
      });
    });

    const consolidatedExpensesList = Object.values(expenseCategoriesMap).sort((a, b) => b.annual - a.annual);

    const portfolioCapRate = totalValuation > 0 ? ((totalNoiMonthly * 12) / totalValuation) * 100 : 0;
    const portfolioCoc = totalInitialInvestment > 0 ? ((totalNetCashFlowMonthly * 12) / totalInitialInvestment) * 100 : 0;
    const occupancyPercent = totalUnitsCount > 0 ? (totalOccupiedUnits / totalUnitsCount) * 100 : 100;

    return {
      totalValuation,
      totalPurchasePrice,
      totalInitialInvestment,
      totalGrossRentMonthly,
      totalGrossRentAnnual: totalGrossRentMonthly * 12,
      totalExtraIncomeMonthly,
      totalExtraIncomeAnnual: totalExtraIncomeMonthly * 12,
      totalVacancyLossMonthly,
      totalVacancyLossAnnual: totalVacancyLossMonthly * 12,
      totalEgiMonthly,
      totalEgiAnnual: totalEgiMonthly * 12,
      totalOpExMonthly,
      totalOpExAnnual: totalOpExMonthly * 12,
      totalDebtServiceMonthly,
      totalDebtServiceAnnual: totalDebtServiceMonthly * 12,
      totalNoiMonthly,
      totalNoiAnnual: totalNoiMonthly * 12,
      totalNetCashFlowMonthly,
      totalNetCashFlowAnnual: totalNetCashFlowMonthly * 12,
      totalUnitsCount,
      totalOccupiedUnits,
      occupancyPercent,
      portfolioCapRate,
      portfolioCoc,
      propertyBreakdown,
      allUnitsFlat,
      consolidatedExpensesList,
    };
  }, [propList]);

  // Helper to format any "YYYY-MM" into "September 2026", etc.
  const formatMonthLong = (ym: string): string => {
    if (!ym) return '';
    if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
    try {
      const [year, month] = ym.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  // Step month delta (-1, +1)
  const stepMonth = (currentYm: string, delta: number): string => {
    try {
      const ym = /^\d{4}-\d{2}$/.test(currentYm) ? currentYm : getLiveCurrentMonthKey();
      const [yearStr, monthStr] = ym.split('-');
      let y = parseInt(yearStr, 10);
      let m = parseInt(monthStr, 10) + delta;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      return `${y}-${String(m).padStart(2, '0')}`;
    } catch {
      return currentYm;
    }
  };

  // All months with recorded transactions or rent payments (plus standard popular months)
  const availableDataMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) monthsSet.add(selectedMonth);
    if (actualPeriod && /^\d{4}-\d{2}$/.test(actualPeriod)) monthsSet.add(actualPeriod);
    if (initialMonthYear && /^\d{4}-\d{2}$/.test(initialMonthYear)) monthsSet.add(initialMonthYear);
    (rentPayments || []).forEach((p) => {
      if (p.monthYear && /^\d{4}-\d{2}$/.test(p.monthYear)) monthsSet.add(p.monthYear);
      if (p.paidDate && /^\d{4}-\d{2}/.test(p.paidDate)) monthsSet.add(p.paidDate.slice(0, 7));
    });
    (transactions || []).forEach((t) => {
      if (t.date && /^\d{4}-\d{2}/.test(t.date)) monthsSet.add(t.date.slice(0, 7));
    });
    // Add current and surrounding 2026/2027 months
    monthsSet.add(getLiveCurrentMonthKey());
    monthsSet.add('2026-09');
    monthsSet.add('2026-10');
    monthsSet.add('2026-11');
    monthsSet.add('2026-12');
    monthsSet.add('2026-08');
    monthsSet.add('2026-07');
    return Array.from(monthsSet).sort().reverse();
  }, [rentPayments, transactions, selectedMonth, actualPeriod, initialMonthYear]);

  // Actuals Period Label Helper
  const getActualPeriodLabel = (p: string) => {
    if (p === 'custom') {
      return `${formatCustomDateDisplay(customStartDate)} – ${formatCustomDateDisplay(customEndDate)}`;
    }
    if (p === 'last3') {
      const anchor = /^\d{4}-\d{2}$/.test(selectedMonth) ? selectedMonth : '2026-10';
      return `Last 3 Months (${formatMonthLong(stepMonth(anchor, -2))} – ${formatMonthLong(anchor)})`;
    }
    if (p === 'ytd') {
      const y = selectedMonth ? selectedMonth.split('-')[0] : '2026';
      return `${y} Year-to-Date`;
    }
    if (p === 'all') return 'All Recorded History (Cumulative)';
    if (/^\d{4}-\d{2}$/.test(p)) {
      return formatMonthLong(p);
    }
    return p;
  };

  const normalizeDateKey = (dateStr?: string): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    const match = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (match) {
      return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }
    const matchUS = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (matchUS) {
      return `${matchUS[3]}-${matchUS[1].padStart(2, '0')}-${matchUS[2].padStart(2, '0')}`;
    }
    return trimmed.slice(0, 10);
  };

  const isInScope = useCallback((propId: string, unitId?: string, unitName?: string) => {
    if (scope === 'unit' && selectedUnit && activeProperty) {
      if (propId !== activeProperty.id) return false;
      return unitId === selectedUnit.id || unitName === selectedUnit.name;
    }
    if (scope === 'property' && activeProperty) {
      return propId === activeProperty.id;
    }
    return true; // portfolio
  }, [scope, selectedUnit, activeProperty]);

  const isInPeriod = useCallback((dateOrMonth?: string) => {
    if (!dateOrMonth) return false;
    if (actualPeriod === 'all') return true;
    if (actualPeriod === 'custom') {
      const start = normalizeDateKey(customStartDate);
      const end = normalizeDateKey(customEndDate);
      const minDate = start <= end ? start : end;
      const maxDate = start <= end ? end : start;

      const norm = normalizeDateKey(dateOrMonth);
      if (norm.length >= 10) {
        return norm >= minDate && norm <= maxDate;
      }
      if (norm.length === 7) {
        return norm >= minDate.slice(0, 7) && norm <= maxDate.slice(0, 7);
      }
      return norm >= minDate && norm <= maxDate;
    }
    if (actualPeriod === 'ytd') {
      const y = selectedMonth ? selectedMonth.split('-')[0] : '2026';
      return dateOrMonth.startsWith(y);
    }
    if (actualPeriod === 'last3') {
      const anchor = /^\d{4}-\d{2}$/.test(selectedMonth) ? selectedMonth : '2026-10';
      const m1 = anchor;
      const m2 = stepMonth(anchor, -1);
      const m3 = stepMonth(anchor, -2);
      return (
        dateOrMonth.startsWith(m1) ||
        dateOrMonth.startsWith(m2) ||
        dateOrMonth.startsWith(m3)
      );
    }
    return dateOrMonth.startsWith(actualPeriod);
  }, [actualPeriod, customStartDate, customEndDate, selectedMonth]);

  // Strict payment period matcher:
  // For a single month statement (e.g. '2026-10'), strictly match by the rent's monthYear so other months' payments do not leak in.
  const isPaymentInPeriod = useCallback((pMonthYear?: string, pPaidDate?: string): boolean => {
    if (actualPeriod === 'custom') {
      const start = normalizeDateKey(customStartDate);
      const end = normalizeDateKey(customEndDate);
      const minDate = start <= end ? start : end;
      const maxDate = start <= end ? end : start;

      // 1. Strict check if concrete paidDate exists (e.g. 2026-10-03)
      if (pPaidDate && pPaidDate.trim().length >= 8) {
        const pDate = normalizeDateKey(pPaidDate);
        return pDate >= minDate && pDate <= maxDate;
      }

      // 2. Fallback to monthYear if no specific payment date is recorded
      if (pMonthYear && /^\d{4}-\d{2}$/.test(pMonthYear.trim())) {
        const ym = pMonthYear.trim();
        return ym >= minDate.slice(0, 7) && ym <= maxDate.slice(0, 7);
      }

      return false;
    }
    const targetMonth = /^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth;
    if (/^\d{4}-\d{2}$/.test(targetMonth)) {
      if (pMonthYear) {
        return pMonthYear === targetMonth;
      }
      return pPaidDate ? pPaidDate.startsWith(targetMonth) : false;
    }
    return isInPeriod(pMonthYear) || isInPeriod(pPaidDate);
  }, [actualPeriod, customStartDate, customEndDate, selectedMonth, isInPeriod]);

  // Payment history filtering: ONLY verified payments that have been paid for this period
  const relevantRentPayments = useMemo(() => {
    if (!rentPayments || rentPayments.length === 0) return [];

    const targetMonth = /^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth;
    const isSpecificMonth = /^\d{4}-\d{2}$/.test(targetMonth) && actualPeriod !== 'custom';

    const filtered = rentPayments.filter((rp) => {
      if (!isInScope(rp.propertyId, rp.unitId, rp.unitName)) return false;

      // MUST be a verified payment with actual collected cash
      if (Number(rp.paidAmount) <= 0) return false;
      if (rp.status !== 'paid' && rp.status !== 'partial') return false;

      // Match the period strictly so out-of-period payments don't leak into printed statement
      if (isSpecificMonth) {
        if (rp.monthYear) return rp.monthYear === targetMonth;
        return rp.paidDate ? rp.paidDate.startsWith(targetMonth) : false;
      }

      return isPaymentInPeriod(rp.monthYear, rp.paidDate);
    });

    // Deduplicate by (propertyId + unitId + paidDate/monthYear) or id
    const uniquePayments: RentPaymentRecord[] = [];
    const seen = new Set<string>();
    for (const p of filtered) {
      const key = p.unitId
        ? `${p.propertyId}-${p.unitId}-${p.paidDate || p.monthYear || targetMonth}`
        : (p.id || `${p.propertyId}-${p.tenantName}-${p.paidDate || p.monthYear || targetMonth}`);
      if (!seen.has(key)) {
        seen.add(key);
        uniquePayments.push(p);
      }
    }

    return uniquePayments.sort((a, b) => (b.paidDate || b.monthYear).localeCompare(a.paidDate || a.monthYear));
  }, [rentPayments, scope, selectedUnit, activeProperty, statementMode, actualPeriod, selectedMonth, customStartDate, customEndDate, isPaymentInPeriod, isInScope]);

  // Appliance purchases from units within scope and period, automatically calculated as Maintenance, Fixes & Repairs
  const applianceExpenseTxs = useMemo(() => {
    const list: (Transaction & { propertyName: string })[] = [];
    propList.forEach((p) => {
      (p.units || []).forEach((u) => {
        (u.appliances || []).forEach((app) => {
          const price = Number(app.purchasePrice) || 0;
          if (price > 0 && isInScope(p.id, u.id, u.name)) {
            const appDate = app.boughtDate || app.createdAt?.split('T')[0] || '';
            if (appDate && isInPeriod(appDate)) {
              const alreadyExists = (transactions || []).some(
                (t) =>
                  t.id === `appliance-${app.id}` ||
                  t.id === `tx-sync-appliance-${app.id}` ||
                  t.id === `tx-appliance-${app.id}` ||
                  (t.propertyId === p.id && t.description && t.description.toLowerCase().includes(app.name.toLowerCase()) && Math.abs((Number(t.amount) || 0) - price) < 0.01)
              );
              if (!alreadyExists) {
                list.push({
                  id: `appliance-${app.id}`,
                  propertyId: p.id,
                  propertyName: p.name,
                  unitId: u.id,
                  unitName: u.name,
                  date: appDate,
                  amount: price,
                  type: 'expense',
                  category: 'Repairs & Maintenance',
                  description: `Appliance: ${app.name}${app.brand ? ` (${app.brand})` : ''}`,
                  isRepair: true,
                  repairType: undefined,
                  paidByOrTo: app.vendorOrStore || 'Appliance Retailer / Store',
                  receiptNumber: app.warrantyPolicyNumber ? `APP-${app.warrantyPolicyNumber}` : (app.modelNumber ? `Model #${app.modelNumber}` : undefined),
                  receiptUrl: app.receiptUrl,
                  notes: app.notes || 'Unit Appliances',
                } as any);
              }
            }
          }
        });
      });
    });
    return list;
  }, [propList, transactions, isInScope, isInPeriod]);

  // Filter transactions for unit fixes & maintenance expenses (including auto-calculated appliances)
  const relevantRepairs = useMemo(() => {
    const fromTransactions = (transactions || [])
      .filter((t) => {
        if (t.type !== 'expense') return false;
        // MUST be a verified repair or maintenance expense
        const isRepair = t.isRepair === true || 
          t.category?.toLowerCase().includes('repair') || 
          t.category?.toLowerCase().includes('maintenance') ||
          t.category?.toLowerCase().includes('fix') ||
          t.category?.toLowerCase().includes('capex') ||
          t.category?.toLowerCase().includes('appliance');
        if (!isRepair) return false;

        if (!isInScope(t.propertyId, t.unitId, t.unitName)) return false;

        // Match the period so out-of-period or sample repairs don't leak into printed statement
        if (!isInPeriod(t.date)) {
          return false;
        }

        return true;
      })
      .map((t) => {
        const prop = allProperties.find((p) => p.id === t.propertyId) || (activeProperty?.id === t.propertyId ? activeProperty : null);
        const cleanDesc = (t.description || '')
          .replace(/\s*-\s*Unit\s*(\w+|\d+)?/gi, '')
          .replace(/\s*-\s*Entire Property/gi, '')
          .replace(/\bUnit\s+Unit\s*\w*/gi, '')
          .replace(/\bUnit\s+\d+\b/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        return {
          ...t,
          description: cleanDesc,
          propertyName: prop?.name || 'Rental Property',
        };
      });

    return [...fromTransactions, ...applianceExpenseTxs].sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, applianceExpenseTxs, scope, selectedUnit, activeProperty, allProperties, customStartDate, customEndDate, isInPeriod, isInScope]);

  const totalRepairsAmount = useMemo(() => {
    return relevantRepairs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [relevantRepairs]);

  // Comprehensive Actual Realized Financials (Cash Basis from Ledger & Rent Collections)
  const actualFinances = useMemo(() => {
    const targetMonth = /^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth;
    const isSpecificMonth = /^\d{4}-\d{2}$/.test(targetMonth) && actualPeriod !== 'custom';

    // 1. Matched rent payments in scope & period (strictly for the chosen month)
    const matchedPayments = (rentPayments || []).filter((p) => {
      if (!isInScope(p.propertyId, p.unitId, p.unitName)) return false;
      if (isSpecificMonth) {
        if (p.monthYear) return p.monthYear === targetMonth;
        return p.paidDate ? p.paidDate.startsWith(targetMonth) : false;
      }
      return isPaymentInPeriod(p.monthYear, p.paidDate);
    });

    // Only payments with confirmed paid amounts count toward realized collected rent
    const matchedPaidPayments = matchedPayments.filter(
      (p) => (p.status === 'paid' || p.status === 'partial') && Number(p.paidAmount) > 0
    );

    // Deduplicate matched paid payments to ensure each unit payment is counted once
    const uniquePaidPayments: RentPaymentRecord[] = [];
    const seenPaid = new Set<string>();
    for (const p of matchedPaidPayments) {
      const key = p.unitId
        ? `${p.propertyId}-${p.unitId}-${p.paidDate || p.monthYear || targetMonth}`
        : (p.id || `${p.propertyId}-${p.tenantName}-${p.paidDate || p.monthYear || targetMonth}`);
      if (!seenPaid.has(key)) {
        seenPaid.add(key);
        uniquePaidPayments.push(p);
      }
    }

    // Units list for calculations
    const unitsList = scope === 'portfolio'
      ? (portfolioCalculations?.allUnitsFlat || [])
      : activePropertyUnits;
    const scheduledRentSum = unitsList.reduce((sum: number, u: any) => sum + (Number(u.rent) || 0), 0);

    const actualRentCollected = uniquePaidPayments.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    const actualRentExpected = scheduledRentSum > 0 ? scheduledRentSum : matchedPayments.reduce((sum, p) => sum + (Number(p.expectedAmount) || 0), 0);
    const actualRentUncollected = Math.max(0, actualRentExpected - actualRentCollected);
    const collectionRate = actualRentExpected > 0 ? (actualRentCollected / actualRentExpected) * 100 : (actualRentCollected > 0 ? 100 : 0);

    // 2. Matched transactions in scope & period
    const matchedTxs = (transactions || []).filter(
      (t) => isInScope(t.propertyId, t.unitId, t.unitName) && isInPeriod(t.date)
    );

    // Other income (e.g. laundry, pet rent, parking, late fees, not double-counting synced rent)
    const otherIncomeTxs = matchedTxs.filter(
      (t) => t.type === 'income' && !t.id.startsWith('tx-sync-') && !(t as any).isRentSync && t.category !== 'Rent Payment' && t.category !== 'Rent'
    );
    const actualOtherIncome = otherIncomeTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const actualTotalIncome = actualRentCollected + actualOtherIncome;

    // Expense transactions
    const expenseTxs = matchedTxs.filter((t) => t.type === 'expense');

    // Debt service transactions (mortgage)
    const debtServiceTxs = expenseTxs.filter(
      (t) => t.category === 'Mortgage Payment' || t.category === 'Debt Service' || t.category === 'Mortgage'
    );
    const actualDebtService = debtServiceTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Appliance purchases from units (auto-categorized as Repairs & Maintenance in memoized applianceExpenseTxs)
    // already computed and included in operatingExpenseTxs below

    // Calculate statement duration in months for recurring fixed escrow (Taxes & HOA)
    let periodMultiplier = 1;
    if (statementMode === 'proforma') {
      periodMultiplier = durationMonths;
    } else if (actualPeriod === 'last3') {
      periodMultiplier = 3;
    } else if (actualPeriod === 'ytd') {
      const ymParts = (/^\d{4}-\d{2}$/.test(selectedMonth) ? selectedMonth : getLiveCurrentMonthKey()).split('-');
      periodMultiplier = Math.max(1, parseInt(ymParts[1], 10) || 10);
    } else if (actualPeriod === 'all') {
      periodMultiplier = 12;
    } else if (actualPeriod === 'custom') {
      try {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        periodMultiplier = Math.max(0.1, Number((diffDays / 30.4375).toFixed(2)));
      } catch {
        periodMultiplier = 1;
      }
    }

    // Escrow Accrual: Property Taxes & HOA / Condo Fees (Computed per property)
    const calculatedExpenseTxs: Transaction[] = [];
    let totalCalculatedTax = 0;
    let totalCalculatedHoa = 0;

    if (includeCalculatedEscrow) {
      const targetProps = scope === 'portfolio' ? propList : (activeProperty ? [activeProperty] : []);
      
      targetProps.forEach((p) => {
        const unitRatio = scope === 'unit' ? (1 / Math.max(1, p.units?.length || 1)) : 1;
        
        // 1. Property Taxes calculation
        const propTaxMonthly = getPropertyTaxMonthly(p);
        const propTaxPeriod = propTaxMonthly * periodMultiplier * unitRatio;
        
        const existingTaxTxs = matchedTxs.filter(
          (t) => t.propertyId === p.id && (t.category === 'Property Taxes' || (!t.category?.toLowerCase().includes('insurance') && (t.category?.toLowerCase().includes('tax') || t.description?.toLowerCase().includes('tax'))))
        );
        const hasManualTax = existingTaxTxs.length > 0;

        if (!hasManualTax && propTaxPeriod > 0) {
          const roundedTax = Math.round(propTaxPeriod * 100) / 100;
          totalCalculatedTax += roundedTax;
          calculatedExpenseTxs.push({
            id: `calc-tax-${p.id}`,
            propertyId: p.id,
            unitId: scope === 'unit' ? selectedUnit?.id : undefined,
            unitName: scope === 'unit' ? selectedUnit?.name : undefined,
            date: isSpecificMonth ? `${targetMonth}-01` : (customStartDate || '2026-10-01'),
            amount: roundedTax,
            type: 'expense',
            category: 'Property Taxes',
            description: scope === 'portfolio' ? 'Property Taxes' : `Property Taxes (${p.name})`,
          } as Transaction);
        } else if (hasManualTax) {
          totalCalculatedTax += existingTaxTxs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        }

        // 2. HOA / Condo Fees calculation
        const propHoaMonthly = getPropertyHoaMonthly(p);
        const propHoaPeriod = propHoaMonthly * periodMultiplier * unitRatio;

        const existingHoaTxs = matchedTxs.filter(
          (t) => t.propertyId === p.id && (t.category === 'HOA / Condo Fees' || t.category?.toLowerCase().includes('hoa') || t.category?.toLowerCase().includes('condo') || t.description?.toLowerCase().includes('hoa'))
        );
        const hasManualHoa = existingHoaTxs.length > 0;

        if (!hasManualHoa && propHoaPeriod > 0) {
          const roundedHoa = Math.round(propHoaPeriod * 100) / 100;
          totalCalculatedHoa += roundedHoa;
          calculatedExpenseTxs.push({
            id: `calc-hoa-${p.id}`,
            propertyId: p.id,
            unitId: scope === 'unit' ? selectedUnit?.id : undefined,
            unitName: scope === 'unit' ? selectedUnit?.name : undefined,
            date: isSpecificMonth ? `${targetMonth}-01` : (customStartDate || '2026-10-01'),
            amount: roundedHoa,
            type: 'expense',
            category: 'HOA / Condo Fees',
            description: scope === 'portfolio' ? 'HOA / Condo Dues' : `HOA / Condo Dues (${p.name})`,
          } as Transaction);
        } else if (hasManualHoa) {
          totalCalculatedHoa += existingHoaTxs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        }
      });
    }

    // Operating expenses (everything except debt service, plus any appliance purchases and calculated taxes/HOA)
    const baseOperatingExpenseTxs = expenseTxs.filter(
      (t) => t.category !== 'Mortgage Payment' && t.category !== 'Debt Service' && t.category !== 'Mortgage'
    );
    const operatingExpenseTxs = [...baseOperatingExpenseTxs, ...applianceExpenseTxs, ...calculatedExpenseTxs];
    const actualTotalOpEx = operatingExpenseTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Group actual operating expenses by category
    const expenseCatMap: Record<string, { category: string; amount: number; count: number; items: Transaction[] }> = {};
    operatingExpenseTxs.forEach((t) => {
      const cat = t.category || 'General Operating Expense';
      if (!expenseCatMap[cat]) {
        expenseCatMap[cat] = { category: cat, amount: 0, count: 0, items: [] };
      }
      expenseCatMap[cat].amount += Number(t.amount) || 0;
      expenseCatMap[cat].count += 1;
      expenseCatMap[cat].items.push(t);
    });
    const actualExpensesList = Object.values(expenseCatMap).sort((a, b) => b.amount - a.amount);

    // Net Operating Income (NOI) & Net Cash Flow
    const actualNoi = actualTotalIncome - actualTotalOpEx;
    const actualNetCashFlow = actualNoi - actualDebtService;

    // Multi-Property breakdown for portfolio actuals
    const propActuals = propList.map((p) => {
      const propPaidPayments = uniquePaidPayments.filter((pay) => pay.propertyId === p.id);
      const pRentCollected = propPaidPayments.reduce((sum, pay) => sum + (Number(pay.paidAmount) || 0), 0);
      const pUnits = (p.units && p.units.length > 0) ? p.units : [{ id: 'u-base', name: 'Main', rent: p.baseMonthlyRent || 0, isOccupied: true } as UnitRental];
      const pRentExpected: number = pUnits.reduce<number>((sum, u) => sum + (Number(u.rent) || 0), 0);

      const propTxs = matchedTxs.filter((t) => t.propertyId === p.id);
      const pOtherInc = propTxs
        .filter((t) => t.type === 'income' && !t.id.startsWith('tx-sync-') && t.category !== 'Rent Payment')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const pTotalInc = pRentCollected + pOtherInc;

      const propApplianceExps = applianceExpenseTxs.filter((t) => t.propertyId === p.id);
      const propCalcExps = calculatedExpenseTxs.filter((t) => t.propertyId === p.id);
      const pOpEx = propTxs
        .filter((t) => t.type === 'expense' && t.category !== 'Mortgage Payment' && t.category !== 'Debt Service' && t.category !== 'Mortgage')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0) +
        propApplianceExps.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) +
        propCalcExps.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const pDebt = propTxs
        .filter((t) => t.type === 'expense' && (t.category === 'Mortgage Payment' || t.category === 'Debt Service' || t.category === 'Mortgage'))
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const pNoi = pTotalInc - pOpEx;
      const pNet = pNoi - pDebt;
      const pUnitsCount = p.units?.length || p.unitsCount || 1;
      const pRate = pRentExpected > 0 ? (pRentCollected / pRentExpected) * 100 : (pRentCollected > 0 ? 100 : 0);

      return {
        property: p,
        unitsCount: pUnitsCount,
        rentExpected: pRentExpected,
        rentCollected: pRentCollected,
        otherIncome: pOtherInc,
        totalIncome: pTotalInc,
        opEx: pOpEx,
        debtService: pDebt,
        noi: pNoi,
        netCashFlow: pNet,
        collectionRate: pRate,
      };
    });

    // Unit-by-unit actuals
    const unitActuals = unitsList.map((unit: any) => {
      const parentPropId = unit.propertyId || activeProperty?.id || '';
      const unitPayments = uniquePaidPayments.filter(
        (p) => p.propertyId === parentPropId && (p.unitId === unit.id || p.unitName === unit.name)
      );
      const paid = unitPayments.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
      const unitPay = unitPayments[0] || null;
      const expected = Number(unit.rent) || (unitPay ? Number(unitPay.expectedAmount) : 0) || 0;
      const balanceDue = Math.max(0, expected - paid);
      const status = paid >= expected && expected > 0 ? 'paid' : paid > 0 ? 'partial' : 'pending';

      return {
        unit,
        expected,
        paid,
        balanceDue,
        status,
        paymentRecord: unitPay,
      };
    });

    return {
      matchedPayments,
      matchedTxs,
      actualRentCollected,
      actualRentExpected,
      actualRentUncollected,
      collectionRate,
      otherIncomeTxs,
      actualOtherIncome,
      actualTotalIncome,
      operatingExpenseTxs,
      actualTotalOpEx,
      debtServiceTxs,
      actualDebtService,
      actualExpensesList,
      actualNoi,
      actualNetCashFlow,
      propActuals,
      unitActuals,
      hasActualData: actualTotalIncome > 0 || actualTotalOpEx > 0 || actualDebtService > 0 || matchedPayments.length > 0 || matchedTxs.length > 0,
      calculatedPropertyTaxes: totalCalculatedTax,
      calculatedHoaFees: totalCalculatedHoa,
      calculatedEscrowTotal: totalCalculatedTax + totalCalculatedHoa,
      includeCalculatedEscrow,
    };
  }, [scope, selectedUnit, activeProperty, actualPeriod, rentPayments, transactions, propList, portfolioCalculations, activePropertyUnits, customStartDate, customEndDate, isPaymentInPeriod, isInPeriod, isInScope, selectedMonth, includeCalculatedEscrow, durationMonths, statementMode, getPropertyTaxMonthly, getPropertyHoaMonthly]);

  // Budget baseline for Variance calculations and comparison
  const budgetBaseline = useMemo(() => {
    let periodMultiplier = 1;
    if (statementMode === 'proforma') {
      periodMultiplier = durationMonths;
    } else if (actualPeriod === 'last3') {
      periodMultiplier = 3;
    } else if (actualPeriod === 'ytd') {
      periodMultiplier = 9;
    } else if (actualPeriod === 'all') {
      periodMultiplier = 12;
    } else if (actualPeriod === 'custom') {
      try {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        periodMultiplier = Math.max(0.1, Number((diffDays / 30.4375).toFixed(2)));
      } catch {
        periodMultiplier = 1;
      }
    }

    if (scope === 'portfolio' && portfolioCalculations) {
      return {
        grossRent: portfolioCalculations.totalGrossRentMonthly * periodMultiplier,
        extraIncome: portfolioCalculations.totalExtraIncomeMonthly * periodMultiplier,
        vacancyLoss: portfolioCalculations.totalVacancyLossMonthly * periodMultiplier,
        egi: portfolioCalculations.totalEgiMonthly * periodMultiplier,
        opEx: portfolioCalculations.totalOpExMonthly * periodMultiplier,
        debtService: portfolioCalculations.totalDebtServiceMonthly * periodMultiplier,
        noi: portfolioCalculations.totalNoiMonthly * periodMultiplier,
        netCashFlow: portfolioCalculations.totalNetCashFlowMonthly * periodMultiplier,
        periodMultiplier,
      };
    }
    if (scope === 'unit' && unitFinancials) {
      return {
        grossRent: unitFinancials.unitRentMonthly * periodMultiplier,
        extraIncome: 0,
        vacancyLoss: unitFinancials.unitVacancyMonthly * periodMultiplier,
        egi: unitFinancials.unitEgiMonthly * periodMultiplier,
        opEx: unitFinancials.unitExpensesMonthly * periodMultiplier,
        debtService: unitFinancials.unitMortgageMonthly * periodMultiplier,
        noi: unitFinancials.unitNoiMonthly * periodMultiplier,
        netCashFlow: unitFinancials.unitNetCashFlowMonthly * periodMultiplier,
        periodMultiplier,
      };
    }
    if (propertyFinances) {
      return {
        grossRent: propertyFinances.grossScheduledIncomeMonthly * periodMultiplier,
        extraIncome: propertyFinances.extraIncomeMonthly * periodMultiplier,
        vacancyLoss: propertyFinances.vacancyLossMonthly * periodMultiplier,
        egi: propertyFinances.effectiveGrossIncomeMonthly * periodMultiplier,
        opEx: propertyFinances.operatingExpensesMonthly * periodMultiplier,
        debtService: propertyFinances.monthlyMortgagePI * periodMultiplier,
        noi: propertyFinances.netOperatingIncomeMonthly * periodMultiplier,
        netCashFlow: propertyFinances.netCashFlowMonthly * periodMultiplier,
        periodMultiplier,
      };
    }
    return {
      grossRent: 0,
      extraIncome: 0,
      vacancyLoss: 0,
      egi: 0,
      opEx: 0,
      debtService: 0,
      noi: 0,
      netCashFlow: 0,
      periodMultiplier: 1,
    };
  }, [scope, portfolioCalculations, unitFinancials, propertyFinances, statementMode, durationMonths, actualPeriod, customStartDate, customEndDate]);

  const totalValuation = useMemo(() => {
    if (scope === 'portfolio' && portfolioCalculations) {
      return portfolioCalculations.totalValuation;
    }
    if (scope === 'unit' && unitFinancials) {
      return unitFinancials.unitValuation;
    }
    return activeProperty?.currentValuation || activeProperty?.purchasePrice || 0;
  }, [scope, portfolioCalculations, unitFinancials, activeProperty]);

  if (!isOpen || propList.length === 0) return null;

  // Title helpers
  const getPeriodLabel = (m: number, startYm?: string) => {
    const startStr = startYm && /^\d{4}-\d{2}$/.test(startYm) ? formatMonthLong(startYm) : 'September 2026';
    if (m === 1) return `1-Month Statement (${startStr})`;
    if (m === 3) {
      const endStr = startYm ? formatMonthLong(stepMonth(startYm, 2)) : 'November 2026';
      return `3-Month Quarterly (${startStr} – ${endStr})`;
    }
    if (m === 6) {
      const endStr = startYm ? formatMonthLong(stepMonth(startYm, 5)) : 'February 2027';
      return `6-Month Half-Year (${startStr} – ${endStr})`;
    }
    if (m === 12) return `12-Month Annual Pro-Forma (from ${startStr})`;
    if (m === 24) return `24-Month Projection (from ${startStr})`;
    if (m === 36) return `36-Month Projection (from ${startStr})`;
    if (m === 60) return `60-Month (5-Year Projection)`;
    if (m === 120) return `120-Month (10-Year Master)`;
    return `${m}-Month Statement (${startStr})`;
  };

  const getDocumentTitle = () => {
    const modeLabel = statementMode === 'actual' ? 'Actual Cash Basis' : statementMode === 'variance' ? 'Variance Report' : `${durationMonths}M Pro-Forma`;
    const periodStr = statementMode === 'proforma' ? getPeriodLabel(durationMonths, selectedMonth) : getActualPeriodLabel(actualPeriod);
    if (scope === 'portfolio') {
      return `Portfolio Statement (${modeLabel} - ${periodStr} - All ${propList.length} Properties)`;
    }
    if (scope === 'property' && activeProperty) {
      return `${activeProperty.name} Statement (${modeLabel} - ${periodStr})`;
    }
    if (scope === 'unit' && selectedUnit && activeProperty) {
      return `${activeProperty.name} - ${selectedUnit.name} (${modeLabel} - ${periodStr})`;
    }
    return `Rental Statement (${modeLabel} - ${periodStr})`;
  };

  const handlePrint = () => {
    printElement('printable-statement', getDocumentTitle());
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const monthSlug = (/^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth).replace('-', '_');
    let safeName = `Portfolio_${statementMode === 'proforma' ? `${durationMonths}M` : 'Cash'}_Statement_${monthSlug}.pdf`;
    if (scope === 'property' && activeProperty) {
      safeName = `${activeProperty.name.replace(/\s+/g, '_')}_${statementMode === 'proforma' ? `${durationMonths}M` : 'Cash'}_Statement_${monthSlug}.pdf`;
    } else if (scope === 'unit' && selectedUnit && activeProperty) {
      safeName = `${activeProperty.name.replace(/\s+/g, '_')}_${selectedUnit.name.replace(/\s+/g, '_')}_${statementMode === 'proforma' ? `${durationMonths}M` : 'Cash'}_Statement_${monthSlug}.pdf`;
    }

    try {
      await downloadPdfDocument('printable-statement', safeName, getDocumentTitle());
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyText = () => {
    const el = document.getElementById('printable-statement');
    if (!el) return;
    const text = el.innerText;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportCSV = () => {
    const monthSlug = (/^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth).replace('-', '_');
    if (scope === 'portfolio' && portfolioCalculations) {
      const headers = [
        'Property Name',
        'Units Count',
        'Monthly Rent ($/mo)',
        `Period Rent (${durationMonths}M Total $)`,
        'Monthly OpEx ($/mo)',
        `Period OpEx (${durationMonths}M Total $)`,
        'Monthly Debt ($/mo)',
        `Period Debt (${durationMonths}M Total $)`,
        'Monthly NOI ($/mo)',
        `Period NOI (${durationMonths}M Total $)`,
        'Monthly Net Cash Flow ($/mo)',
        `Period Net Cash Flow (${durationMonths}M Total $)`,
        'Cap Rate (%)',
        'Valuation ($)'
      ];
      const rows = portfolioCalculations.propertyBreakdown.map((item) => [
        `"${item.property.name}"`,
        item.unitsCount,
        item.rentMonthly.toFixed(2),
        (item.rentMonthly * durationMonths).toFixed(2),
        item.finances.operatingExpensesMonthly.toFixed(2),
        (item.finances.operatingExpensesMonthly * durationMonths).toFixed(2),
        item.finances.monthlyMortgagePI.toFixed(2),
        (item.finances.monthlyMortgagePI * durationMonths).toFixed(2),
        item.finances.netOperatingIncomeMonthly.toFixed(2),
        (item.finances.netOperatingIncomeMonthly * durationMonths).toFixed(2),
        item.finances.netCashFlowMonthly.toFixed(2),
        (item.finances.netCashFlowMonthly * durationMonths).toFixed(2),
        item.finances.capRatePercent.toFixed(2),
        item.valuation.toFixed(2),
      ]);
      rows.push([
        '"TOTAL PORTFOLIO"',
        portfolioCalculations.totalUnitsCount,
        portfolioCalculations.totalGrossRentMonthly.toFixed(2),
        (portfolioCalculations.totalGrossRentMonthly * durationMonths).toFixed(2),
        portfolioCalculations.totalOpExMonthly.toFixed(2),
        (portfolioCalculations.totalOpExMonthly * durationMonths).toFixed(2),
        portfolioCalculations.totalDebtServiceMonthly.toFixed(2),
        (portfolioCalculations.totalDebtServiceMonthly * durationMonths).toFixed(2),
        portfolioCalculations.totalNoiMonthly.toFixed(2),
        (portfolioCalculations.totalNoiMonthly * durationMonths).toFixed(2),
        portfolioCalculations.totalNetCashFlowMonthly.toFixed(2),
        (portfolioCalculations.totalNetCashFlowMonthly * durationMonths).toFixed(2),
        portfolioCalculations.portfolioCapRate.toFixed(2),
        portfolioCalculations.totalValuation.toFixed(2),
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `portfolio-statement-${monthSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (activeProperty && propertyFinances) {
      const headers = ['Unit / Item', 'Tenant / Details', 'Monthly Amount ($)', `Selected Period Amount (${durationMonths} Months $)`, 'Annual Amount ($)'];
      const rows = activePropertyUnits.map((u) => [
        `"${u.name}"`,
        `"${u.tenantName || (u.isOccupied ? 'Occupied' : 'Vacant')}"`,
        (Number(u.rent) || 0).toFixed(2),
        ((Number(u.rent) || 0) * durationMonths).toFixed(2),
        ((Number(u.rent) || 0) * 12).toFixed(2),
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const link = document.createElement('a');
      link.setAttribute('href', encodeURI(csvContent));
      link.setAttribute('download', `${activeProperty.name.replace(/\s+/g, '_')}-statement-${monthSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const statementId = `STMT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${(selectedPropertyId || 'PORT').slice(0, 8).toUpperCase()}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="export-report-modal"
        className="bg-[#141822] rounded-2xl border border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-3 sm:p-5 space-y-4 my-2 sm:my-4 text-slate-200 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none print:m-0 print:max-h-none print:overflow-visible"
      >
        {/* =========================================================================
            HEADER TOOLBAR (Controls hidden in print)
           ========================================================================= */}
        <div className="space-y-3.5 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Rental Cash Flow & Income Statement</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {scope === 'portfolio' ? 'All Portfolio (All Units)' : scope === 'property' ? 'Property (All Units)' : 'Single Unit'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Certified Underwriting, P&L Schedule, Rent Roll & Expense Distribution
                </p>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Copy Text */}
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Copy statement text to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {/* PRIMARY: Open Print Window */}
              <button
                type="button"
                id="btn-print-window"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Open dedicated print window with formatted layout and print dialog"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>Print Window</span>
              </button>

              {/* Download CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Export as CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>

              {/* Save PDF */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Save directly as .pdf file"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Save .PDF</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-red-500/20 hover:border-red-500/40 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400 hover:text-red-400" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Scope, Basis & Month Selection Toolbar */}
          <div className="space-y-3 bg-[#0E121A] p-3.5 rounded-xl border border-slate-800">
            {/* 1. PRIMARY STATEMENT MONTH & ACCOUNTING PERIOD SELECTOR */}
            <div className="bg-[#141824] p-3 rounded-xl border border-amber-500/30 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Choose Statement Month &amp; Accounting Period:</span>
                  <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                    {statementMode === 'proforma' ? getPeriodLabel(durationMonths, selectedMonth) : getActualPeriodLabel(actualPeriod)}
                  </span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Select any month to generate real-time cash flow &amp; rent collections
                </span>
              </div>

              {/* Custom Statement Date (From Start Date to End Date) */}
              <div className="bg-[#0C0F17] p-3 rounded-lg border border-amber-500/40 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Statement Custom Date (Start Date &amp; End Date):
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIncludeStatementDate(!includeStatementDate)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                        includeStatementDate
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#161B26] text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {includeStatementDate ? 'Issue Date Shown' : 'Issue Date Hidden'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Start Date */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-300">From (Start Date):</span>
                    <input
                      type="date"
                      id="input-custom-start-date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setActualPeriod('custom');
                      }}
                      className="bg-[#161B26] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:ring-1 focus:ring-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* End Date */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-300">To (End Date):</span>
                    <input
                      type="date"
                      id="input-custom-end-date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setActualPeriod('custom');
                      }}
                      className="bg-[#161B26] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:ring-1 focus:ring-amber-400 cursor-pointer"
                    />
                  </div>

                  {/* Apply / Active Indicator Button */}
                  <button
                    type="button"
                    onClick={() => setActualPeriod('custom')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                      actualPeriod === 'custom'
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                        : 'bg-[#161B26] text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>{actualPeriod === 'custom' ? '✓ Custom Range Active' : 'Apply Custom Date Range'}</span>
                  </button>
                </div>

                {/* Quick Date Range Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-semibold">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('2026-10-01');
                      setCustomEndDate('2026-10-31');
                      setActualPeriod('custom');
                    }}
                    className="px-2 py-0.5 bg-[#161B26] hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    This Month (Oct 1 – Oct 31)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('2026-10-01');
                      setCustomEndDate('2026-10-02');
                      setActualPeriod('custom');
                    }}
                    className="px-2 py-0.5 bg-[#161B26] hover:bg-slate-700 text-amber-300 hover:text-white rounded border border-amber-500/40 transition-colors cursor-pointer font-bold"
                  >
                    Oct 1 – Oct 2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('2026-09-01');
                      setCustomEndDate('2026-09-30');
                      setActualPeriod('custom');
                    }}
                    className="px-2 py-0.5 bg-[#161B26] hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    Last Month (Sep 1 – Sep 30)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('2026-09-04');
                      setCustomEndDate('2026-10-04');
                      setActualPeriod('custom');
                    }}
                    className="px-2 py-0.5 bg-[#161B26] hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('2026-01-01');
                      setCustomEndDate('2026-10-04');
                      setActualPeriod('custom');
                    }}
                    className="px-2 py-0.5 bg-[#161B26] hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors cursor-pointer"
                  >
                    2026 Year-to-Date
                  </button>
                </div>
              </div>

              {/* Month Stepper, Dropdown & Native Calendar */}
              <div className="flex flex-wrap items-center gap-2 bg-[#0C0F17] p-2 rounded-lg border border-slate-700/80">
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    id="btn-prev-month"
                    onClick={() => {
                      const currentYm = /^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth;
                      const nextYm = stepMonth(currentYm, -1);
                      setSelectedMonth(nextYm);
                      setActualPeriod(nextYm);
                    }}
                    title="Previous Month"
                    className="px-2.5 py-1.5 bg-[#161B26] hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prev Month</span>
                  </button>
                </div>

                {/* Dropdown Selector */}
                <div className="flex-1 min-w-[200px]">
                  <select
                    id="statement-month-selector"
                    value={actualPeriod === 'custom' ? 'custom' : (/^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : (['last3', 'ytd', 'all'].includes(actualPeriod) ? actualPeriod : selectedMonth))}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setActualPeriod('custom');
                      } else if (/^\d{4}-\d{2}$/.test(val)) {
                        setSelectedMonth(val);
                        setActualPeriod(val);
                      } else {
                        setActualPeriod(val);
                      }
                    }}
                    className="w-full bg-[#161B26] border border-slate-700 text-white font-bold rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    <optgroup label="Custom Date Range">
                      <option value="custom">📅 Custom Date Range (Start Date – End Date)</option>
                    </optgroup>
                    {/^\d{4}-\d{2}$/.test(actualPeriod) && !availableDataMonths.includes(actualPeriod) && (
                      <option value={actualPeriod}>{formatMonthLong(actualPeriod)} (Selected Month)</option>
                    )}
                    <optgroup label="Months with Collections & Activity">
                      {availableDataMonths.map((ym) => (
                        <option key={ym} value={ym}>
                          {formatMonthLong(ym)} {ym === '2026-10' ? '(Current Month)' : ym === '2026-09' ? '(Previous Month)' : ''}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Multi-Month Reporting Windows">
                      <option value="last3">Last 3 Months (Quarterly Summary)</option>
                      <option value="ytd">2026 Year-to-Date (YTD Cash Basis)</option>
                      <option value="all">All Recorded History (Full Cash Ledger)</option>
                    </optgroup>
                  </select>
                </div>

                {/* HTML5 Native Month Calendar Picker */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Calendar:</span>
                  <input
                    type="month"
                    id="statement-calendar-picker"
                    aria-label="Select Statement Month"
                    value={/^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedMonth(e.target.value);
                        setActualPeriod(e.target.value);
                      }
                    }}
                    className="bg-[#161B26] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold focus:ring-1 focus:ring-amber-400 cursor-pointer"
                    title="Pick any month from calendar"
                  />
                </div>
              </div>

              {/* Quick Presets Row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick Presets:</span>
                {[
                  { id: 'custom', label: '📅 Custom Range' },
                  { id: '2026-10', label: 'Oct 2026 (Current)' },
                  { id: '2026-09', label: 'Sep 2026' },
                  { id: '2026-08', label: 'Aug 2026' },
                  { id: '2026-07', label: 'Jul 2026' },
                  { id: 'last3', label: 'Last 3 Mo' },
                  { id: 'ytd', label: '2026 YTD' },
                  { id: 'all', label: 'All History' },
                ].map((p) => {
                  const isSelected = actualPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (/^\d{4}-\d{2}$/.test(p.id)) {
                          setSelectedMonth(p.id);
                          setActualPeriod(p.id);
                        } else {
                          setActualPeriod(p.id);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-1 ring-amber-400 font-black'
                          : 'bg-[#0E121A] text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Scope Toggle: Portfolio vs Property */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  Statement Scope:
                </label>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {scope === 'portfolio' ? `Consolidating ${propList.length} Properties` : (activeProperty?.name || 'Property')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-[#161A23] p-1 rounded-lg border border-slate-700">
                {/* 1. All Portfolio */}
                <button
                  type="button"
                  id="scope-portfolio-all"
                  onClick={() => {
                    setScope('portfolio');
                    setStatementMode('actual');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    scope === 'portfolio'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Consolidated statement for all properties"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="truncate">All Portfolio ({propList.length} Properties)</span>
                </button>

                {/* 2. Property */}
                <button
                  type="button"
                  id="scope-property-all-units"
                  onClick={() => {
                    setScope('property');
                    setStatementMode('actual');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    scope === 'property'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Statement for selected property"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate">Property ({activeProperty?.name || 'Selected Property'})</span>
                </button>
              </div>
            </div>

            {/* 3. Accounting Mode Selector: Actuals vs Pro-Forma vs Variance */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Statement Data Source &amp; Basis:</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {statementMode === 'actual'
                    ? 'Pure Cash Basis (Ledger & Collected Rent Only)'
                    : statementMode === 'proforma'
                    ? 'Pro-Forma Underwriting (Budget Projections)'
                    : 'Side-by-Side Actual vs Budget Variance'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-[#161A23] p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  id="mode-actual-cash-basis"
                  onClick={() => setStatementMode('actual')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    statementMode === 'actual'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Show only actual recorded rent payments and real logged expenses"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span className="truncate">Actual Realized (Cash Basis)</span>
                </button>

                <button
                  type="button"
                  id="mode-proforma-budget"
                  onClick={() => setStatementMode('proforma')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    statementMode === 'proforma'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Show scheduled rent roll and theoretical pro-forma allowances"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="truncate">Pro-Forma Model (Budget)</span>
                </button>

                <button
                  type="button"
                  id="mode-variance-comparison"
                  onClick={() => setStatementMode('variance')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    statementMode === 'variance'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Side-by-side comparison of actual collections vs underwriting budget"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span className="truncate">Actual vs Budget Variance</span>
                </button>
              </div>
            </div>

            {/* 4. Property Taxes & HOA Escrow Calculation Feature */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-[#141824] rounded-lg border border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-md ${includeCalculatedEscrow ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        Property Taxes &amp; HOA Dues Calculation
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                        Statement Escrow
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Automatically calculates monthly property tax escrow and HOA fees configured on properties
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {includeCalculatedEscrow && (
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-mono font-bold text-amber-300">
                        {formatCurrency(actualFinances.calculatedEscrowTotal || 0)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Taxes: {formatCurrency(actualFinances.calculatedPropertyTaxes || 0)} • HOA: {formatCurrency(actualFinances.calculatedHoaFees || 0)}
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    id="btn-toggle-calculated-escrow"
                    onClick={() => setIncludeCalculatedEscrow(!includeCalculatedEscrow)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      includeCalculatedEscrow
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-xs'
                        : 'bg-[#161B26] text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>
                      {includeCalculatedEscrow
                        ? '✓ Escrow Calculated'
                        : 'Escrow Calculation Off'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Pro-Forma Duration Controls (When Pro-Forma Mode is active) */}
            {statementMode === 'proforma' && (
              <div className="pt-2 border-t border-slate-700/60 bg-[#161B26] p-3 rounded-xl border border-slate-700 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Pro-Forma Projection Horizon:
                  </span>
                  <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    {durationMonths} Month{durationMonths !== 1 ? 's' : ''} (from {formatMonthLong(selectedMonth)})
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: '1 Month', val: 1 },
                      { label: '2 Months', val: 2 },
                      { label: '3 Months (Qtr)', val: 3 },
                      { label: '6 Months (Half-Yr)', val: 6 },
                      { label: '12 Months (1 Yr)', val: 12 },
                      { label: '24 Months (2 Yrs)', val: 24 },
                      { label: '36 Months (3 Yrs)', val: 36 },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setDurationMonths(preset.val)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${
                          durationMonths === preset.val
                            ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-sm font-black'
                            : 'bg-[#0E121A] text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Custom Months:</span>
                    <div className="flex items-center bg-[#0E121A] border border-slate-600 rounded-lg overflow-hidden shadow-inner">
                      <button
                        type="button"
                        onClick={() => setDurationMonths((prev) => Math.max(1, prev - 1))}
                        className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-bold cursor-pointer"
                        title="Decrease by 1 month"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={durationMonths}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= 120) {
                            setDurationMonths(val);
                          } else if (e.target.value === '') {
                            setDurationMonths(1);
                          }
                        }}
                        className="w-12 bg-transparent text-center text-xs font-bold text-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setDurationMonths((prev) => Math.min(120, prev + 1))}
                        className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors font-bold cursor-pointer"
                        title="Increase by 1 month"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-slate-400 text-xs">mos</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Property Selector Bar (when viewing single property or single unit) */}
          {scope !== 'portfolio' && propList.length > 1 && (
            <div className="bg-[#11141D] p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Select Property:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                {propList.map((p) => {
                  const isSelected = activeProperty?.id === p.id;
                  const uCount = p.units?.length || p.unitsCount || 1;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPropertyId(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                          : 'bg-[#161A23] text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      {p.name} ({uCount} units)
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unit Selector Chips (When Single Unit is chosen) */}
          {scope === 'unit' && (
            <div className="bg-[#11141D] p-3 rounded-xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Home className="w-4 h-4" />
                  Select Unit on {activeProperty?.name}:
                </span>
                <span className="text-[11px] text-slate-400">
                  {activePropertyUnits.length} unit{activePropertyUnits.length !== 1 ? 's' : ''} available
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {activePropertyUnits.map((unit) => {
                  const isSelected = selectedUnit?.id === unit.id;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => setSelectedUnitId(unit.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-[#161A23] text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${unit.isOccupied ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <div className="text-left">
                        <div className="font-bold text-white">{unit.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatCurrency(unit.rent)}/mo • {unit.tenantName || (unit.isOccupied ? 'Occupied' : 'Vacant')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Month Switcher Ribbon for Statement Preview (Screen only) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-2.5 p-3 bg-[#131722] rounded-xl border border-amber-500/30 text-xs shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded bg-amber-500/20 text-amber-400">
              <Calendar className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-300 font-medium">Viewing Statement For:</span>
            <span className="font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
              {statementMode === 'proforma' ? getPeriodLabel(durationMonths, selectedMonth) : getActualPeriodLabel(actualPeriod)}
            </span>
            <span className="text-slate-400 text-[11px]">
              ({statementMode === 'actual' ? 'Actual Realized Cash Basis' : statementMode === 'proforma' ? 'Pro-Forma Underwriting' : 'Actual vs Budget Variance'})
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const currentYm = /^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth;
                const nextYm = stepMonth(currentYm, -1);
                setSelectedMonth(nextYm);
                setActualPeriod(nextYm);
              }}
              title="Previous Month"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev Month</span>
            </button>
            <input
              type="month"
              aria-label="Change statement month directly"
              value={/^\d{4}-\d{2}$/.test(actualPeriod) ? actualPeriod : selectedMonth}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonth(e.target.value);
                  setActualPeriod(e.target.value);
                }
              }}
              className="bg-[#161B26] border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white font-bold cursor-pointer"
              title="Change statement month directly"
            />
          </div>
        </div>

        {/* =========================================================================
            PRINTABLE STATEMENT DOCUMENT (High Contrast for Print & Screen)
           ========================================================================= */}
        <div 
          id="printable-statement" 
          className="space-y-6 text-slate-300 print:text-black print:space-y-4 print:text-xs bg-[#10141C] print:bg-white p-4 sm:p-6 rounded-xl border border-slate-800 print:border-none"
        >
          {/* Document Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-700 print:border-black pb-4 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight">
                {scope === 'portfolio' ? 'Bros Rental' : (activeProperty?.name || 'Rental Property')}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-amber-400 print:text-black">
                  Rental Statement
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5">
              <div>Report Period: <strong className="text-slate-200 print:text-black">{statementMode === 'proforma' ? getPeriodLabel(durationMonths, selectedMonth) : getActualPeriodLabel(actualPeriod)}</strong></div>
            </div>
          </div>

          {/* Single Unit Tenant Header Card (Only in Single Unit mode) */}
          {scope === 'unit' && selectedUnit && unitFinancials && activeProperty && (
            <div className="bg-[#141822] print:bg-slate-50 p-4 rounded-xl border border-emerald-500/30 print:border-slate-300 text-xs space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 print:text-slate-500 block">Unit</span>
                  <strong className="text-sm font-bold text-emerald-400 print:text-emerald-800">
                    {selectedUnit.name}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">{activeProperty.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 print:text-slate-500 block">Current Resident</span>
                  <strong className="text-sm font-bold text-white print:text-black">
                    {selectedUnit.tenantName || 'Unassigned / Vacant'}
                  </strong>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${selectedUnit.isOccupied ? 'bg-emerald-500/20 text-emerald-400 print:text-emerald-800' : 'bg-amber-500/20 text-amber-400 print:text-amber-800'}`}>
                    {selectedUnit.isOccupied ? 'Occupied' : 'Vacant'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 print:text-slate-500 block">Scheduled Rent</span>
                  <strong className="text-sm font-bold text-white print:text-black">
                    {formatCurrency(selectedUnit.rent)}/mo
                  </strong>
                  <span className="text-[10px] text-emerald-400 print:text-emerald-700 block font-semibold">
                    {formatCurrency(selectedUnit.rent * durationMonths)} ({durationMonths}M Total)
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 print:text-slate-500 block">Share of Property</span>
                  <strong className="text-sm font-bold text-blue-400 print:text-blue-800">
                    {unitFinancials.unitSharePercent.toFixed(1)}% of Revenue
                  </strong>
                  <span className="text-[10px] text-slate-400 block">
                    Valuation: {formatCurrency(unitFinancials.unitValuation)}
                  </span>
                </div>
              </div>

              {/* Additional Lease & Tenant Details if Available */}
              {(selectedUnit.tenantPhone || selectedUnit.tenantEmail || selectedUnit.leaseEnd || selectedUnit.leaseStart || selectedUnit.rentDueDay) && (
                <div className="pt-2 border-t border-slate-800/80 print:border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 print:text-slate-700">
                  {selectedUnit.leaseEnd && (
                    <div>
                      <span className="text-slate-500 text-[10px] block">Lease Expiration:</span>
                      <span className="font-medium text-slate-200 print:text-black">{selectedUnit.leaseEnd}</span>
                    </div>
                  )}
                  {selectedUnit.rentDueDay && (
                    <div>
                      <span className="text-slate-500 text-[10px] block">Rent Due Day:</span>
                      <span className="font-medium text-slate-200 print:text-black">Day {selectedUnit.rentDueDay} of month</span>
                    </div>
                  )}
                  {selectedUnit.tenantPhone && (
                    <div>
                      <span className="text-slate-500 text-[10px] block">Tenant Phone:</span>
                      <span className="font-mono text-slate-200 print:text-black">{selectedUnit.tenantPhone}</span>
                    </div>
                  )}
                  {selectedUnit.tenantEmail && (
                    <div>
                      <span className="text-slate-500 text-[10px] block">Tenant Email:</span>
                      <span className="text-slate-200 print:text-black">{selectedUnit.tenantEmail}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Statement High-Level Performance KPI Cards */}
          <StatementSummaryCards
            statementMode={statementMode}
            scope={scope}
            actualFinances={actualFinances}
            budgetBaseline={budgetBaseline}
            totalValuation={totalValuation}
            portfolioCalculations={portfolioCalculations}
            propertyFinances={propertyFinances}
            unitFinancials={unitFinancials}
            durationMonths={durationMonths}
            actualPeriodLabel={getActualPeriodLabel(actualPeriod)}
          />

          {/* If Variance Mode: Side-by-Side Comparison Table */}
          {statementMode === 'variance' && (
            <StatementVarianceSchedule
              actualFinances={actualFinances}
              budgetBaseline={budgetBaseline}
              actualPeriodLabel={getActualPeriodLabel(actualPeriod)}
            />
          )}

          {/* Section 1: Income Schedule */}
          <StatementIncomeSchedule
            statementMode={statementMode}
            scope={scope}
            actualFinances={actualFinances}
            portfolioCalculations={portfolioCalculations}
            propertyFinances={propertyFinances}
            unitFinancials={unitFinancials}
            activePropertyUnits={activePropertyUnits}
            selectedUnit={selectedUnit}
            durationMonths={durationMonths}
            actualPeriodLabel={getActualPeriodLabel(actualPeriod)}
            propList={propList}
          />

          {/* Section 2: Property Breakdown (Portfolio Scope) */}
          {scope === 'portfolio' && (
            <StatementPropertyBreakdown
              statementMode={statementMode}
              actualFinances={actualFinances}
              portfolioCalculations={portfolioCalculations}
              durationMonths={durationMonths}
              propList={propList}
              actualPeriodLabel={getActualPeriodLabel(actualPeriod)}
            />
          )}

          {/* Section 3: Rent Roll (Portfolio and Property scopes) */}
          {scope !== 'unit' && (
            <StatementRentRollSection
              statementMode={statementMode}
              scope={scope}
              actualFinances={actualFinances}
              portfolioCalculations={portfolioCalculations}
              activePropertyUnits={activePropertyUnits}
              durationMonths={durationMonths}
              actualPeriodLabel={getActualPeriodLabel(actualPeriod)}
            />
          )}

          {/* Section 4: Operating Expenses Schedule */}
          <StatementOpExSchedule
            statementMode={statementMode}
            scope={scope}
            actualFinances={actualFinances}
            portfolioCalculations={portfolioCalculations}
            propertyFinances={propertyFinances}
            unitFinancials={unitFinancials}
            activeProperty={activeProperty}
            durationMonths={durationMonths}
            actualPeriodLabel={getActualPeriodLabel(actualPeriod)}
          />

          {/* Section 5: Net Cash Flow & Debt Service Breakdown */}
          <StatementCashFlowBreakdown
            statementMode={statementMode}
            scope={scope}
            actualFinances={actualFinances}
            portfolioCalculations={portfolioCalculations}
            propertyFinances={propertyFinances}
            unitFinancials={unitFinancials}
            durationMonths={durationMonths}
            actualPeriodLabel={getActualPeriodLabel(actualPeriod)}
          />

          {/* =====================================================================
              SECTION: RECENT RENT COLLECTION & LEDGER LOGS (If Available)
             ===================================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
              <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 print:text-emerald-700" />
                <span>{scope === 'portfolio' ? '6. Verified Payment Records & Collection History' : '5. Verified Payment Records & Collection History'}</span>
              </h2>
              <span className="text-[10px] text-slate-400 print:text-slate-500 font-semibold">
                {relevantRentPayments.length} Verified Payment{relevantRentPayments.length !== 1 ? 's' : ''} for {getActualPeriodLabel(actualPeriod)} • Total: {formatCurrency(relevantRentPayments.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0))}
              </span>
            </div>

            {relevantRentPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
                      <th className="text-left pb-1">Date / Month</th>
                      {scope === 'portfolio' && <th className="text-left pb-1">Property</th>}
                      <th className="text-left pb-1">Resident / Tenant</th>
                      <th className="text-left pb-1">Method / Ref</th>
                      <th className="text-right pb-1">Expected</th>
                      <th className="text-right pb-1 text-emerald-400 print:text-emerald-800 font-bold">Paid Amount</th>
                      <th className="text-center pb-1">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                    {relevantRentPayments.map((p) => {
                      const prop = propList.find((pr) => pr.id === p.propertyId);
                      return (
                        <tr key={p.id}>
                          <td className="py-1.5 text-slate-300 print:text-slate-700">
                            {p.paidDate || p.monthYear}
                          </td>
                          {scope === 'portfolio' && (
                            <td className="py-1.5 font-medium text-slate-300 print:text-slate-800">
                              {prop?.name || 'Property'}
                            </td>
                          )}
                          <td className="py-1.5 font-medium text-white print:text-black">
                            <div className="font-semibold text-white print:text-black">
                              {p.tenantName || 'Tenant'}
                            </div>
                            {(() => {
                              const pUnits = prop?.units || [];
                              const matchedU = pUnits.find((u) => u.id === p.unitId || u.tenantName === p.tenantName);
                              const phone = matchedU?.tenantPhone || (p.tenantName === prop?.tenantName ? prop?.tenantPhone : undefined) || pUnits[0]?.tenantPhone;
                              const leaseEnd = matchedU?.leaseEnd || (p.tenantName === prop?.tenantName ? prop?.leaseEnd : undefined) || pUnits[0]?.leaseEnd;
                              if (!phone && !leaseEnd) return null;
                              return (
                                <div className="text-[10px] text-slate-400 print:text-slate-600 flex items-center gap-2 mt-0.5">
                                  {phone && (
                                    <span className="font-mono text-emerald-400/90 print:text-emerald-800">
                                      {phone}
                                    </span>
                                  )}
                                  {leaseEnd && (
                                    <span className="text-rose-400/90 print:text-rose-800">
                                      Exp: {leaseEnd}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-1.5 text-slate-400 print:text-slate-600">
                            {p.paymentMethod} {p.referenceNumber && `(${p.referenceNumber})`}
                          </td>
                          <td className="py-1.5 text-right text-slate-400 print:text-slate-600">
                            {formatCurrency(p.expectedAmount)}
                          </td>
                          <td className="py-1.5 text-right font-bold text-emerald-400 print:text-emerald-800">
                            {formatCurrency(p.paidAmount)}
                          </td>
                          <td className="py-1.5 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 print:text-emerald-800 border border-emerald-500/30">
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[#121620] print:bg-slate-50 p-3 rounded-lg border border-slate-700/80 print:border-slate-300 text-xs text-slate-400 print:text-slate-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  No verified rent payment records found for {getActualPeriodLabel(actualPeriod)} ($0.00 collected).
                </span>
              </div>
            )}
          </div>

          {/* =====================================================================
              SECTION: MAINTENANCE, FIXES & REPAIRS (RECORDED ACTUALS)
             ===================================================================== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 print:border-slate-300 pb-1">
              <h2 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-400 print:text-amber-700" />
                <span>Maintenance, Fixes & Repair Expenses (Actuals)</span>
              </h2>
              <span className="text-[10px] text-slate-400 print:text-slate-500">
                Total: {formatCurrency(totalRepairsAmount)}
              </span>
            </div>

            {relevantRepairs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 print:text-slate-500 font-semibold text-[11px] border-b border-slate-800/60 print:border-slate-200">
                      <th className="text-left pb-1">Date</th>
                      {scope === 'portfolio' && <th className="text-left pb-1">Property Name</th>}
                      <th className="text-left pb-1">Repair Description</th>
                      <th className="text-left pb-1">Contractor / Vendor</th>
                      <th className="text-left pb-1">Ref / Receipt #</th>
                      <th className="text-right pb-1 text-rose-400 print:text-rose-800 font-bold">Cost ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                    {relevantRepairs.map((repair) => (
                      <tr key={repair.id}>
                        <td className="py-1.5 font-mono text-slate-300 print:text-slate-700">
                          {repair.date}
                        </td>
                        {scope === 'portfolio' && (
                          <td className="py-1.5 font-bold text-white print:text-black">
                            {repair.propertyName}
                          </td>
                        )}
                        <td className="py-1.5 text-slate-300 print:text-slate-800">
                          <span className="font-semibold text-white print:text-black">
                            {repair.description
                              .replace(/\s*-\s*Unit\s*(\w+|\d+)?/gi, '')
                              .replace(/\s*-\s*Entire Property/gi, '')
                              .replace(/\bUnit\s+Unit\s*\w*/gi, '')
                              .replace(/\bUnit\s+\d+\b/gi, '')
                              .replace(/\s{2,}/g, ' ')
                              .trim()}
                          </span>
                          {repair.repairType &&
                           repair.repairType !== 'Appliance Installation' &&
                           !repair.repairType.toLowerCase().includes('appliance') && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 print:bg-amber-50 print:text-amber-800 border border-amber-500/20 font-medium">
                              {repair.repairType}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 text-slate-400 print:text-slate-600">
                          {repair.paidByOrTo || '—'}
                        </td>
                        <td className="py-1.5 font-mono text-[11px] text-slate-400 print:text-slate-600">
                          {repair.receiptNumber || '—'}
                        </td>
                        <td className="py-1.5 text-right font-bold text-rose-400 print:text-rose-800">
                          -{formatCurrency(repair.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-amber-500/10 print:bg-amber-50/60 text-amber-300 print:text-amber-900 border-t border-amber-500/20">
                      <td colSpan={scope === 'portfolio' ? 5 : 4} className="py-2 px-1">
                        TOTAL RECORDED REPAIRS & MAINTENANCE
                      </td>
                      <td className="py-2 text-right font-black text-rose-400 print:text-rose-900">
                        -{formatCurrency(totalRepairsAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[#11141B] print:bg-slate-50 border border-slate-800 print:border-slate-200 rounded-xl p-3 text-center text-xs text-slate-400 print:text-slate-600">
                <p className="font-semibold text-slate-300 print:text-slate-800">No repair or maintenance expenses recorded for this period ($0.00).</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  All maintenance and repair records are fully reconciled.
                </p>
              </div>
            )}
          </div>

          {/* Statement Footer / Signature Stamp */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 print:text-slate-600 gap-2">
            <div>
              <span>Generated by Bros Rental Flow Pro • Official Landlord Financial Record</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Verified Valid on: {formatCustomDateDisplay(customStatementDate)}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in print) */}
        <div className="flex items-center justify-between pt-2 print:hidden gap-3 flex-wrap">
          <div className="text-xs text-slate-400">
            Current view: <strong className="text-emerald-400 font-semibold">{getDocumentTitle()}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Open dedicated print preview window"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Window</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save .PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 hover:border-slate-600 border border-slate-700 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
