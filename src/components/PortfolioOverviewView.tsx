import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Layers, 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  ChevronRight, 
  ChevronDown, 
  ShieldCheck, 
  Receipt, 
  Home, 
  PieChart as PieChartIcon, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Zap,
  Check,
  Trash2,
  Copy,
  PlusCircle,
  X,
  Sliders,
  Wallet,
  Tag,
  Save,
  RotateCcw,
  User,
  Phone,
  Calendar,
  Clock
} from 'lucide-react';
import { Property, FinancialCalculationResult, RentPaymentRecord, ExpenseCategory, ExpenseItem, UnitRental, ExtraIncomeItem, PropertyType } from '../types';
import { calculatePropertyFinances, formatCurrency, formatPercent } from '../utils/calculations';
import { UnitAppliancesModal } from './UnitAppliancesModal';

interface PortfolioOverviewViewProps {
  properties: Property[];
  rentPayments: RentPaymentRecord[];
  onSelectProperty: (id: string) => void;
  onNavigateToTab: (tab: 'calculator' | 'collection' | 'unit-fix' | 'appliances' | 'ledger' | 'metrics' | 'scenario') => void;
  onOpenNewPropertyModal: () => void;
  onOpenEditPropertyModal: (property: Property) => void;
  onUpdateProperty?: (updated: Property) => void;
  onDuplicateProperty?: (property: Property) => void;
  onDeleteProperty?: (id: string) => void;
  onOpenStatementModal?: (monthYear?: string) => void;
}

export const PortfolioOverviewView: React.FC<PortfolioOverviewViewProps> = ({
  properties,
  rentPayments,
  onSelectProperty,
  onNavigateToTab,
  onOpenNewPropertyModal,
  onOpenEditPropertyModal,
  onUpdateProperty,
  onDuplicateProperty,
  onDeleteProperty,
  onOpenStatementModal,
}) => {
  const [timeframe, setTimeframe] = useState<'monthly' | 'annual'>('monthly');
  const [activeSubView, setActiveSubView] = useState<'table' | 'cards' | 'charts'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedPropId, setExpandedPropId] = useState<string | null>(null);
  const [isQuickEditMode, setIsQuickEditMode] = useState<boolean>(false);
  const [excludeDebt, setExcludeDebt] = useState<boolean>(true); // Defaults to true: Debt/mortgage taken OUT of portfolio income
  const [applianceModalData, setApplianceModalData] = useState<{ property: Property; unit: UnitRental } | null>(null);
  const [savedToastMessage, setSavedToastMessage] = useState<string | null>(null);
  const [newExpenseForms, setNewExpenseForms] = useState<Record<string, { name: string; category: ExpenseCategory; amount: string; frequency: 'monthly' | 'annual' }>>({});
  const [newIncomeForms, setNewIncomeForms] = useState<Record<string, { name: string; amount: string; frequency: 'monthly' | 'annual' }>>({});

  // Trigger toast on update
  const showSavedToast = (message: string) => {
    setSavedToastMessage(message);
    setTimeout(() => {
      setSavedToastMessage((prev) => (prev === message ? null : prev));
    }, 2500);
  };

  // Direct property update helper
  const handleUpdatePropertyDirect = (updatedProp: Property, note?: string) => {
    if (onUpdateProperty) {
      onUpdateProperty({
        ...updatedProp,
        updatedAt: new Date().toISOString(),
      });
      if (note) {
        showSavedToast(note);
      }
    }
  };

  // Update Gross Scheduled Rent (prorating units if present)
  const handleUpdateGrossRent = (prop: Property, val: number) => {
    const rawVal = isNaN(val) ? 0 : Math.max(0, val);
    const monthlyVal = timeframe === 'annual' ? rawVal / 12 : rawVal;
    let updatedUnits = prop.units ? [...prop.units] : [];
    
    if (updatedUnits.length === 1) {
      updatedUnits = [{ ...updatedUnits[0], rent: monthlyVal }];
    } else if (updatedUnits.length > 1) {
      const currentTotal = updatedUnits.reduce((s, u) => s + (Number(u.rent) || 0), 0);
      if (currentTotal > 0) {
        const ratio = monthlyVal / currentTotal;
        updatedUnits = updatedUnits.map(u => ({ ...u, rent: Math.round((Number(u.rent) || 0) * ratio) }));
      } else {
        const each = Math.round(monthlyVal / updatedUnits.length);
        updatedUnits = updatedUnits.map(u => ({ ...u, rent: each }));
      }
    }

    handleUpdatePropertyDirect({
      ...prop,
      baseMonthlyRent: monthlyVal,
      units: updatedUnits,
    }, `Updated gross rent to ${formatCurrency(monthlyVal)}/mo for ${prop.name}`);
  };

  // Helper to match an expense to its specific category without cross-collision
  const matchExpenseCategory = (e: ExpenseItem, category: ExpenseCategory): boolean => {
    if (e.category === category) return true;
    const nameLower = (e.name || '').toLowerCase();
    if (category === 'Property Taxes') {
      return !nameLower.includes('insurance') && !nameLower.includes('management') && nameLower.includes('tax');
    }
    if (category === 'Property Insurance') {
      return !nameLower.includes('tax') && nameLower.includes('insurance');
    }
    if (category === 'Property Management') {
      return nameLower.includes('management');
    }
    if (category === 'HOA / Condo Fees') {
      return nameLower.includes('hoa') || nameLower.includes('condo');
    }
    if (category === 'Repairs & Maintenance') {
      return nameLower.includes('repair') || nameLower.includes('maintenance');
    }
    if (category === 'Capital Expenditures (CapEx)') {
      return nameLower.includes('capex') || nameLower.includes('capital');
    }
    return false;
  };

  // Update Itemized Expense Category (handles zero/deletion cleanly)
  const handleUpdateExpenseCategory = (prop: Property, category: ExpenseCategory, val: number, defaultName?: string) => {
    const rawVal = isNaN(val) ? 0 : Math.max(0, val);
    const storedAmount = rawVal;
    const existingExpenses = [...(prop.expenses || [])];
    const idx = existingExpenses.findIndex((e) => matchExpenseCategory(e, category));

    if (idx >= 0) {
      if (storedAmount === 0) {
        // Zeroing out an expense removes it from the list
        existingExpenses.splice(idx, 1);
      } else {
        const prev = existingExpenses[idx];
        const monthlyAmt = timeframe === 'annual' ? storedAmount / 12 : storedAmount;
        const grossRent = Number(prop.baseMonthlyRent) || (prop.units || []).reduce((s, u) => s + (Number(u.rent) || 0), 0);
        const newPct = grossRent > 0 ? parseFloat(((monthlyAmt / grossRent) * 100).toFixed(1)) : 8;

        existingExpenses[idx] = {
          ...prev,
          category,
          amount: storedAmount,
          frequency: timeframe,
          isPercentageOfRent: prev.isPercentageOfRent ?? (category === 'Property Management'),
          percentageValue: prev.isPercentageOfRent || category === 'Property Management' ? newPct : prev.percentageValue,
        };
      }
    } else if (storedAmount > 0) {
      const monthlyAmt = timeframe === 'annual' ? storedAmount / 12 : storedAmount;
      const grossRent = Number(prop.baseMonthlyRent) || (prop.units || []).reduce((s, u) => s + (Number(u.rent) || 0), 0);
      const newPct = grossRent > 0 ? parseFloat(((monthlyAmt / grossRent) * 100).toFixed(1)) : 8;
      const isMgmt = category === 'Property Management';

      existingExpenses.push({
        id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        category,
        name: defaultName || category,
        amount: storedAmount,
        frequency: timeframe,
        isPercentageOfRent: isMgmt,
        percentageValue: isMgmt ? newPct : undefined,
      });
    }

    handleUpdatePropertyDirect({
      ...prop,
      expenses: existingExpenses,
    }, storedAmount === 0 ? `Removed ${category} for ${prop.name}` : `Updated ${category} to ${formatCurrency(storedAmount)} for ${prop.name}`);
  };

  // Update Mortgage / Debt Service
  const handleUpdateMortgageDebt = (prop: Property, val: number) => {
    const rawVal = isNaN(val) ? 0 : Math.max(0, val);
    const monthlyVal = timeframe === 'annual' ? rawVal / 12 : rawVal;
    
    if (monthlyVal <= 0) {
      handleUpdatePropertyDirect({
        ...prop,
        hasMortgage: false,
        monthlyMortgageAmount: 0,
        mortgageManualOverride: true,
      }, `Marked mortgage as Paid Off for ${prop.name}`);
    } else {
      handleUpdatePropertyDirect({
        ...prop,
        hasMortgage: true,
        mortgageManualOverride: true,
        monthlyMortgageAmount: monthlyVal,
      }, `Updated mortgage payment to ${formatCurrency(monthlyVal)}/mo for ${prop.name}`);
    }
  };

  // Simple Field Mutators
  const handleUpdateName = (prop: Property, name: string) => {
    if (!name.trim()) return;
    handleUpdatePropertyDirect({ ...prop, name: name.trim() }, `Renamed property to "${name.trim()}"`);
  };

  const handleUpdateAddress = (prop: Property, address: string) => {
    handleUpdatePropertyDirect({ ...prop, address: address.trim() }, `Updated address for ${prop.name}`);
  };

  const handleUpdatePropertyType = (prop: Property, propertyType: PropertyType) => {
    handleUpdatePropertyDirect({ ...prop, propertyType }, `Updated type to ${propertyType} for ${prop.name}`);
  };

  const handleUpdateUnitsCount = (prop: Property, unitsCount: number) => {
    const count = Math.max(1, isNaN(unitsCount) ? 1 : unitsCount);
    let updatedUnits = prop.units ? [...prop.units] : [];
    
    if (count > updatedUnits.length) {
      const needed = count - updatedUnits.length;
      for (let i = 0; i < needed; i++) {
        const idx = updatedUnits.length + 1;
        const avgRent = prop.baseMonthlyRent ? Math.round(prop.baseMonthlyRent / count) : 1200;
        updatedUnits.push({
          id: `unit-${Date.now()}-${idx}`,
          name: `Unit ${idx}`,
          rent: avgRent,
          isOccupied: true,
          tenantName: `Tenant ${idx}`,
        });
      }
    } else if (count < updatedUnits.length) {
      updatedUnits = updatedUnits.slice(0, count);
    }

    handleUpdatePropertyDirect({
      ...prop,
      unitsCount: count,
      units: updatedUnits,
    }, `Updated units count to ${count} for ${prop.name}`);
  };

  const handleUpdateValuation = (prop: Property, val: number) => {
    const num = Math.max(0, isNaN(val) ? 0 : val);
    handleUpdatePropertyDirect({ ...prop, currentValuation: num }, `Updated valuation for ${prop.name}`);
  };

  const handleUpdatePurchasePrice = (prop: Property, val: number) => {
    const num = Math.max(0, isNaN(val) ? 0 : val);
    handleUpdatePropertyDirect({ ...prop, purchasePrice: num }, `Updated purchase price for ${prop.name}`);
  };

  const handleUpdateVacancyRate = (prop: Property, percent: number) => {
    const num = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
    handleUpdatePropertyDirect({ ...prop, vacancyRatePercent: num }, `Updated vacancy rate to ${num}% for ${prop.name}`);
  };

  // Itemized Expense Operations
  const handleAddExpenseItem = (prop: Property, name: string, category: ExpenseCategory, amount: number, frequency: 'monthly' | 'annual') => {
    if (!name.trim() || amount <= 0) return;
    const newExp = {
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category,
      name: name.trim(),
      amount: amount,
      frequency,
      isPercentageOfRent: false,
    };
    handleUpdatePropertyDirect({
      ...prop,
      expenses: [...(prop.expenses || []), newExp],
    }, `Added expense "${name}" to ${prop.name}`);
  };

  const handleDeleteExpenseItem = (prop: Property, expId: string) => {
    const updated = (prop.expenses || []).filter((e) => e.id !== expId);
    handleUpdatePropertyDirect({
      ...prop,
      expenses: updated,
    }, `Removed expense from ${prop.name}`);
  };

  const handleUpdateExpenseItemDirect = (prop: Property, expId: string, updates: Partial<ExpenseItem>) => {
    const updated = (prop.expenses || []).map((e) => (e.id === expId ? { ...e, ...updates } : e));
    handleUpdatePropertyDirect({
      ...prop,
      expenses: updated,
    });
  };

  // Itemized Extra Income Operations
  const handleAddExtraIncome = (prop: Property, name: string, amount: number, frequency: 'monthly' | 'annual') => {
    if (!name.trim() || amount <= 0) return;
    const newInc: ExtraIncomeItem = {
      id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      amount,
      frequency,
    };
    handleUpdatePropertyDirect({
      ...prop,
      extraIncomes: [...(prop.extraIncomes || []), newInc],
    }, `Added income "${name}" to ${prop.name}`);
  };

  const handleDeleteExtraIncome = (prop: Property, incId: string) => {
    const updated = (prop.extraIncomes || []).filter((i) => i.id !== incId);
    handleUpdatePropertyDirect({
      ...prop,
      extraIncomes: updated,
    }, `Removed income line from ${prop.name}`);
  };

  // Unit Itemized Operations
  const handleUpdateUnitItem = (prop: Property, unitId: string, updates: Partial<UnitRental>) => {
    const updatedUnits = (prop.units || []).map((u) => (u.id === unitId ? { ...u, ...updates } : u));
    const totalRent = updatedUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
    handleUpdatePropertyDirect({
      ...prop,
      units: updatedUnits,
      baseMonthlyRent: totalRent > 0 ? totalRent : prop.baseMonthlyRent,
    });
  };

  const handleAddUnitItem = (prop: Property) => {
    const units = prop.units ? [...prop.units] : [];
    const nextIdx = units.length + 1;
    const newUnit: UnitRental = {
      id: `unit-${Date.now()}-${nextIdx}`,
      name: `Unit ${nextIdx}`,
      rent: 1200,
      isOccupied: true,
      tenantName: `Tenant ${nextIdx}`,
    };
    const updated = [...units, newUnit];
    const totalRent = updated.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
    handleUpdatePropertyDirect({
      ...prop,
      unitsCount: updated.length,
      units: updated,
      baseMonthlyRent: totalRent,
    }, `Added ${newUnit.name} to ${prop.name}`);
  };

  const handleDeleteUnitItem = (prop: Property, unitId: string) => {
    const updated = (prop.units || []).filter((u) => u.id !== unitId);
    const totalRent = updated.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
    handleUpdatePropertyDirect({
      ...prop,
      unitsCount: Math.max(1, updated.length),
      units: updated,
      baseMonthlyRent: totalRent > 0 ? totalRent : prop.baseMonthlyRent,
    }, `Removed unit from ${prop.name}`);
  };

  // Appliance and warranty management handler
  const handleUpdateApplianceUnit = (updatedUnit: UnitRental) => {
    if (!applianceModalData) return;
    const { property } = applianceModalData;
    const updatedUnits = (property.units || []).map((u) => (u.id === updatedUnit.id ? updatedUnit : u));
    handleUpdatePropertyDirect(
      {
        ...property,
        units: updatedUnits,
      },
      `Updated appliances & warranty for ${updatedUnit.name}`
    );
    setApplianceModalData({ property, unit: updatedUnit });
  };

  // Clear all debt / set portfolio to free and clear
  const handleClearAllMortgages = () => {
    if (window.confirm('Set all properties in portfolio to free & clear ($0 debt/mortgage)?')) {
      properties.forEach((p) => {
        if (p.hasMortgage || (p.monthlyMortgageAmount && p.monthlyMortgageAmount > 0)) {
          handleUpdatePropertyDirect({
            ...p,
            hasMortgage: false,
            monthlyMortgageAmount: 0,
            mortgageManualOverride: true,
          });
        }
      });
      showSavedToast('All properties set to 100% Free & Clear ($0 Debt)!');
    }
  };

  // Multiplier for monthly vs annual display
  const multiplier = timeframe === 'annual' ? 12 : 1;
  const labelSuffix = timeframe === 'annual' ? '/yr' : '/mo';

  // Current Month Key for live collections according to actual date
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Always show current month according to date when tab is opened
  useEffect(() => {
    const d = new Date();
    setSelectedMonthYear(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  const currentMonthKey = selectedMonthYear;

  // Calculate finances for each property
  const portfolioData = useMemo(() => {
    return properties.map((prop) => {
      const fin = calculatePropertyFinances(prop);
      const valuation = prop.currentValuation || prop.purchasePrice || 0;
      const loanBalance = prop.hasMortgage ? Math.max(0, (prop.purchasePrice || 0) - (prop.downPaymentAmount || 0)) : 0;
      const equity = Math.max(0, valuation - loanBalance);

      // Rent collections this month
      const propPayments = rentPayments.filter(
        (p) => p.propertyId === prop.id && p.monthYear === currentMonthKey
      );
      const totalCollectedThisMonth = propPayments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.paidAmount, 0);
      const totalExpectedThisMonth = prop.units?.length
        ? prop.units.reduce((sum, u) => sum + (Number(u.rent) || 0), 0)
        : Number(prop.baseMonthlyRent) || 0;

      // Extract specific expense buckets for the table
      const getExpenseCategoryAmt = (catName: ExpenseCategory) => {
        const matchingItems = (prop.expenses || []).filter((e) => matchExpenseCategory(e, catName));
        if (matchingItems.length === 0) return 0;
        return matchingItems.reduce((acc, item) => {
          if (item.isPercentageOfRent && item.percentageValue !== undefined) {
            const rentBase = Number(fin.grossScheduledIncomeMonthly) || Number(prop.baseMonthlyRent) || 0;
            return acc + (rentBase * item.percentageValue) / 100;
          }
          const amt = Number(item.amount) || 0;
          return acc + (item.frequency === 'annual' ? amt / 12 : amt);
        }, 0);
      };

      const taxMonthly = getExpenseCategoryAmt('Property Taxes');
      const insMonthly = getExpenseCategoryAmt('Property Insurance');
      const hoaMonthly = getExpenseCategoryAmt('HOA / Condo Fees');
      const mgmtMonthly = getExpenseCategoryAmt('Property Management');
      const repairsMonthly = getExpenseCategoryAmt('Repairs & Maintenance');
      const capexMonthly = getExpenseCategoryAmt('Capital Expenditures (CapEx)');
      const utilMonthly = (prop.expenses || [])
        .filter((e) => ['Water & Sewer', 'Trash Collection', 'Gas & Electricity'].includes(e.category))
        .reduce((acc, e) => {
          const amt = Number(e.amount) || 0;
          return acc + (e.frequency === 'annual' ? amt / 12 : amt);
        }, 0);

      const otherExpensesMonthly = Math.max(
        0,
        fin.operatingExpensesMonthly - (taxMonthly + insMonthly + hoaMonthly + mgmtMonthly + repairsMonthly + capexMonthly + utilMonthly)
      );

      const totalUnits = prop.units?.length || prop.unitsCount || 1;
      const occupiedUnits = prop.units?.length 
        ? prop.units.filter((u) => u.isOccupied).length 
        : totalUnits;

      // Canonical underwriting NOI and Net Cash Flow (accounts for vacancy & all income streams)
      const pnlNOIMonthly = fin.netOperatingIncomeMonthly;
      const pnlNetCashFlowMonthly = fin.netCashFlowMonthly;

      return {
        property: prop,
        finances: fin,
        valuation,
        loanBalance,
        equity,
        totalUnits,
        occupiedUnits,
        totalCollectedThisMonth,
        totalExpectedThisMonth,
        taxMonthly,
        insMonthly,
        hoaMonthly,
        mgmtMonthly,
        repairsMonthly,
        capexMonthly,
        utilMonthly,
        otherExpensesMonthly,
        pnlNOIMonthly,
        pnlNetCashFlowMonthly,
      };
    });
  }, [properties, rentPayments]);

  // Filtered properties
  const filteredData = useMemo(() => {
    return portfolioData.filter(({ property }) => {
      const matchesSearch = 
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.propertyType.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || property.propertyType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [portfolioData, searchQuery, typeFilter]);

  // Aggregate Totals across ALL properties (unfiltered or filtered based on user preference)
  const totals = useMemo(() => {
    const sum = {
      grossIncomeMonthly: 0,
      extraIncomeMonthly: 0,
      vacancyLossMonthly: 0,
      effectiveGrossIncomeMonthly: 0,
      operatingExpensesMonthly: 0,
      debtServiceMonthly: 0,
      netOperatingIncomeMonthly: 0,
      netCashFlowMonthly: 0,
      valuation: 0,
      loanBalance: 0,
      equity: 0,
      totalUnits: 0,
      occupiedUnits: 0,
      totalCollectedThisMonth: 0,
      totalExpectedThisMonth: 0,
      taxMonthly: 0,
      insMonthly: 0,
      hoaMonthly: 0,
      mgmtMonthly: 0,
      repairsMonthly: 0,
      capexMonthly: 0,
      utilMonthly: 0,
      otherExpensesMonthly: 0,
    };

    portfolioData.forEach((item) => {
      sum.grossIncomeMonthly += item.finances.grossScheduledIncomeMonthly;
      sum.extraIncomeMonthly += item.finances.extraIncomeMonthly;
      sum.vacancyLossMonthly += item.finances.vacancyLossMonthly;
      sum.effectiveGrossIncomeMonthly += item.finances.effectiveGrossIncomeMonthly;
      sum.operatingExpensesMonthly += item.finances.operatingExpensesMonthly;
      sum.debtServiceMonthly += item.finances.debtServiceMonthly;
      sum.netOperatingIncomeMonthly += item.finances.netOperatingIncomeMonthly;
      sum.netCashFlowMonthly += item.finances.netCashFlowMonthly;
      sum.valuation += item.valuation;
      sum.loanBalance += item.loanBalance;
      sum.equity += item.equity;
      sum.totalUnits += item.totalUnits;
      sum.occupiedUnits += item.occupiedUnits;
      sum.totalCollectedThisMonth += item.totalCollectedThisMonth;
      sum.totalExpectedThisMonth += item.totalExpectedThisMonth;
      sum.taxMonthly += item.taxMonthly;
      sum.insMonthly += item.insMonthly;
      sum.hoaMonthly += item.hoaMonthly;
      sum.mgmtMonthly += item.mgmtMonthly;
      sum.repairsMonthly += item.repairsMonthly;
      sum.capexMonthly += item.capexMonthly;
      sum.utilMonthly += item.utilMonthly;
      sum.otherExpensesMonthly += item.otherExpensesMonthly;
    });

    const blendedCapRate = sum.valuation > 0 ? ((sum.netOperatingIncomeMonthly * 12) / sum.valuation) * 100 : 0;
    const overallOER = sum.grossIncomeMonthly > 0 ? (sum.operatingExpensesMonthly / sum.grossIncomeMonthly) * 100 : 0;
    const overallOccupancyRate = sum.totalUnits > 0 ? (sum.occupiedUnits / sum.totalUnits) * 100 : 100;
    const collectionProgress = sum.totalExpectedThisMonth > 0 ? (sum.totalCollectedThisMonth / sum.totalExpectedThisMonth) * 100 : 0;

    return {
      ...sum,
      blendedCapRate,
      overallOER,
      overallOccupancyRate,
      collectionProgress,
    };
  }, [portfolioData]);

  // Aggregate Category breakdown for visual charts
  const categoryBreakdown = useMemo(() => {
    const categories: Record<string, number> = {
      'Property Taxes': totals.taxMonthly * multiplier,
      'Property Insurance': totals.insMonthly * multiplier,
      'Repairs & Maintenance': totals.repairsMonthly * multiplier,
      'Management Fees': totals.mgmtMonthly * multiplier,
      'HOA / Condo Fees': totals.hoaMonthly * multiplier,
      'CapEx Reserves': totals.capexMonthly * multiplier,
      'Utilities (Water/Trash/Gas)': totals.utilMonthly * multiplier,
      'Other Expenses': totals.otherExpensesMonthly * multiplier,
    };

    const totalExp = totals.operatingExpensesMonthly * multiplier;
    return Object.entries(categories)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [totals, multiplier]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'Property Name',
      'Type',
      'Units',
      'Gross Scheduled Rent',
      'Other Income',
      'Total Gross Income',
      'Property Taxes',
      'Insurance',
      'HOA Fees',
      'Management',
      'Maintenance & CapEx',
      'Utilities & Other',
      'Total Operating Expenses',
      ...(excludeDebt ? [] : ['Mortgage / Debt']),
      'Net Operating Income (NOI)',
      excludeDebt ? 'Net Income (Debt Excluded)' : 'Net Cash Flow',
      'Cap Rate (%)',
      'Valuation'
    ];

    const rows = portfolioData.map((item) => [
      `"${item.property.name.replace(/"/g, '""')}"`,
      `"${item.property.propertyType}"`,
      item.totalUnits,
      (item.finances.grossScheduledIncomeMonthly * multiplier).toFixed(2),
      (item.finances.extraIncomeMonthly * multiplier).toFixed(2),
      (item.finances.grossScheduledIncomeMonthly * multiplier).toFixed(2),
      (item.taxMonthly * multiplier).toFixed(2),
      (item.insMonthly * multiplier).toFixed(2),
      (item.hoaMonthly * multiplier).toFixed(2),
      (item.mgmtMonthly * multiplier).toFixed(2),
      ((item.repairsMonthly + item.capexMonthly) * multiplier).toFixed(2),
      ((item.utilMonthly + item.otherExpensesMonthly) * multiplier).toFixed(2),
      (item.finances.operatingExpensesMonthly * multiplier).toFixed(2),
      ...(excludeDebt ? [] : [(item.finances.debtServiceMonthly * multiplier).toFixed(2)]),
      (item.finances.netOperatingIncomeMonthly * multiplier).toFixed(2),
      ((excludeDebt ? item.finances.netOperatingIncomeMonthly : item.finances.netCashFlowMonthly) * multiplier).toFixed(2),
      item.finances.capRatePercent.toFixed(2),
      item.valuation.toFixed(2),
    ]);

    // Add Totals row
    rows.push([
      '"TOTAL PORTFOLIO"',
      '""',
      totals.totalUnits,
      (totals.grossIncomeMonthly * multiplier).toFixed(2),
      (totals.extraIncomeMonthly * multiplier).toFixed(2),
      (totals.grossIncomeMonthly * multiplier).toFixed(2),
      (totals.taxMonthly * multiplier).toFixed(2),
      (totals.insMonthly * multiplier).toFixed(2),
      (totals.hoaMonthly * multiplier).toFixed(2),
      (totals.mgmtMonthly * multiplier).toFixed(2),
      ((totals.repairsMonthly + totals.capexMonthly) * multiplier).toFixed(2),
      ((totals.utilMonthly + totals.otherExpensesMonthly) * multiplier).toFixed(2),
      (totals.operatingExpensesMonthly * multiplier).toFixed(2),
      ...(excludeDebt ? [] : [(totals.debtServiceMonthly * multiplier).toFixed(2)]),
      (totals.netOperatingIncomeMonthly * multiplier).toFixed(2),
      ((excludeDebt ? totals.netOperatingIncomeMonthly : totals.netCashFlowMonthly) * multiplier).toFixed(2),
      totals.blendedCapRate.toFixed(2),
      totals.valuation.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `portfolio-income-expense-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (onOpenStatementModal) {
      onOpenStatementModal(selectedMonthYear);
    } else {
      window.print();
    }
  };

  const uniquePropertyTypes = Array.from(new Set(properties.map((p) => p.propertyType)));

  return (
    <div className="space-y-6">
      {/* Portfolio Master Header Banner */}
      <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 mt-0.5">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Portfolio Income & Expense Command Center
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {properties.length} {properties.length === 1 ? 'Property' : 'Properties'} Active
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {totals.totalUnits} Total Units
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time multi-property financial aggregation, income rollups, expense distribution, debt obligations, and net cash flow.
              </p>
            </div>
          </div>

          {/* Timeframe & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Quick Edit Ledger Toggle */}
            <button
              id="toggle-quick-edit-ledger"
              onClick={() => setIsQuickEditMode(!isQuickEditMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                isQuickEditMode
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 font-extrabold shadow-amber-500/20'
                  : 'bg-[#0E121A] text-amber-400 border border-amber-500/40 hover:bg-amber-500/10'
              }`}
              title="Toggle inline editing for all rows and cells in the multi-property ledger"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isQuickEditMode ? 'Quick Edit: ACTIVE' : '⚡ Quick Edit Ledger'}</span>
            </button>

            {/* Monthly / Annual Toggle */}
            <div className="bg-[#0E121A] p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                id="toggle-timeframe-monthly"
                onClick={() => setTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeframe === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly ($/mo)
              </button>
              <button
                id="toggle-timeframe-annual"
                onClick={() => setTimeframe('annual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeframe === 'annual'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Annual ($/yr)
              </button>
            </div>

            {/* Export CSV */}
            <button
              id="export-portfolio-csv-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-[#0E121A] hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors shadow-sm"
              title="Export complete portfolio data to CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Print / PDF */}
            <button
              id="print-portfolio-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-[#0E121A] hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors shadow-sm"
              title="Print portfolio report"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print / PDF</span>
            </button>

            {/* Add Property */}
            <button
              id="portfolio-add-property-btn"
              onClick={onOpenNewPropertyModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm shadow-emerald-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Property</span>
            </button>
          </div>
        </div>

        {/* Live Saved Notification Banner */}
        {savedToastMessage && (
          <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-300 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{savedToastMessage}</span>
            </div>
            <span className="text-[10px] text-emerald-400/70 font-mono">Auto-saved to portfolio</span>
          </div>
        )}

        {/* Aggregate KPI Financial Cards (Grid of 5 or 6) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${excludeDebt ? 'xl:grid-cols-5' : 'xl:grid-cols-6'} gap-3.5 pt-5`}>
          {/* 1. Total Gross Income */}
          <div className="bg-[#0E121A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400">
                Total Gross Income
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white tracking-tight">
              {formatCurrency(totals.grossIncomeMonthly * multiplier)}
              <span className="text-[11px] font-normal text-slate-500 ml-1">{labelSuffix}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span>{properties.length} Properties</span>
              <span className="text-emerald-400 font-semibold">{totals.totalUnits} Units</span>
            </div>
          </div>

          {/* 2. Total Operating Expenses */}
          <div className="bg-[#0E121A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-rose-500/40 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-rose-400">
                Total Expenses
              </span>
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-300 tracking-tight">
              {formatCurrency(totals.operatingExpensesMonthly * multiplier)}
              <span className="text-[11px] font-normal text-slate-500 ml-1">{labelSuffix}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span>OER (Expense Ratio)</span>
              <span className="text-rose-400 font-semibold">{totals.overallOER.toFixed(1)}%</span>
            </div>
          </div>

          {/* 3. Total Net Operating Income (NOI) */}
          <div className="bg-[#0E121A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-blue-400">
                Net Operating Income (NOI)
              </span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-black text-blue-300 tracking-tight">
              {formatCurrency(totals.netOperatingIncomeMonthly * multiplier)}
              <span className="text-[11px] font-normal text-slate-500 ml-1">{labelSuffix}</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span>Blended Cap Rate</span>
              <span className="text-blue-400 font-semibold">{totals.blendedCapRate.toFixed(2)}%</span>
            </div>
          </div>

          {/* 4. Debt Status / Mortgages (Hidden when debt is taken out) */}
          {!excludeDebt && (
            <div className="bg-[#0E121A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400">
                  Debt / Mortgages
                </span>
                <Percent className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-amber-300 tracking-tight">
                {formatCurrency(totals.debtServiceMonthly * multiplier)}
                <span className="text-[11px] font-normal text-slate-500 ml-1">
                  {labelSuffix}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                <span>Loan Balances</span>
                <span className="font-semibold text-slate-300">
                  {formatCurrency(totals.loanBalance)}
                </span>
              </div>
            </div>
          )}

          {/* 5. Net Monthly/Annual Cash Flow */}
          {(() => {
            const netCashFlowDisplay = (excludeDebt ? totals.netOperatingIncomeMonthly : totals.netCashFlowMonthly) * multiplier;
            const isProfit = netCashFlowDisplay >= 0;
            return (
              <div className={`p-4 rounded-xl border relative overflow-hidden group transition-colors ${
                isProfit
                  ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/60'
                  : 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
              }`}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-semibold uppercase tracking-wider text-[11px] ${
                    isProfit ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {excludeDebt ? 'Net Operating Cash Flow' : 'Net Cash Flow (Profit)'}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isProfit ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {isProfit ? 'Positive' : 'Negative'}
                  </span>
                </div>
                <div className={`text-xl font-black tracking-tight ${
                  isProfit ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(netCashFlowDisplay)}
                  <span className="text-[11px] font-normal text-slate-500 ml-1">{labelSuffix}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span>{excludeDebt ? 'Operating Profit' : 'Annualized Profit'}</span>
                  <span className={`font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency((excludeDebt ? totals.netOperatingIncomeMonthly : totals.netCashFlowMonthly) * 12)}/yr
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 6. Portfolio Valuation & Equity */}
          <div className="bg-[#0E121A] p-4 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-purple-400">
                Portfolio Valuation
              </span>
              <Home className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-300 tracking-tight">
              {formatCurrency(totals.valuation)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
              <span>Combined Equity</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(totals.equity)}</span>
            </div>
          </div>
        </div>

        {/* Live Rent Collection Progress Bar across all properties */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 bg-[#0E121A]/60 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  September 2026 Collection Status:
                </span>
                <span className="text-xs font-black text-emerald-400">
                  {formatCurrency(totals.totalCollectedThisMonth)}
                </span>
                <span className="text-xs text-slate-500">
                  of {formatCurrency(totals.totalExpectedThisMonth)} expected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {totals.collectionProgress >= 100 
                  ? 'All rent collected for current cycle.' 
                  : `${formatCurrency(Math.max(0, totals.totalExpectedThisMonth - totals.totalCollectedThisMonth))} outstanding across portfolio.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 min-w-[200px] lg:min-w-[260px]">
            <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, totals.collectionProgress))}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-400 min-w-[45px] text-right">
              {totals.collectionProgress.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation & Filters Bar */}
      <div className="bg-[#161A23] rounded-xl border border-slate-800 p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* View Mode Buttons (Table, Cards, Charts) */}
        <div className="flex items-center gap-1.5 bg-[#0E121A] p-1 rounded-lg border border-slate-800 w-full md:w-auto">
          <button
            id="view-mode-table"
            onClick={() => setActiveSubView('table')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubView === 'table'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Financial Table (P&L)</span>
          </button>

          <button
            id="view-mode-cards"
            onClick={() => setActiveSubView('cards')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubView === 'cards'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Property Cards</span>
          </button>

          <button
            id="view-mode-charts"
            onClick={() => setActiveSubView('charts')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeSubView === 'charts'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Charts & Analytics</span>
          </button>
        </div>

        {/* Search & Property Type Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search properties or addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs text-white bg-[#0E121A] border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-[#0E121A] border border-slate-800 text-slate-300 text-xs font-semibold rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Property Types</option>
              {uniquePropertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* VIEW 1: MASTER MULTI-PROPERTY FINANCIAL TABLE (P&L SPREADSHEET) */}
      {activeSubView === 'table' && (
        <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
          {/* Table Header Controls & Quick Edit Mode Notice */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Multi-Property Income & Expense Ledger</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({timeframe === 'annual' ? 'Annualized Values' : 'Monthly Values'})
                  </span>
                </h3>
                {isQuickEditMode && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm animate-pulse">
                    <Zap className="w-3 h-3 fill-current" />
                    Quick Edit Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isQuickEditMode 
                  ? '⚡ Edit any gross income, expense bucket, mortgage, or property parameter directly in the cells below. All totals and calculations update in real time.'
                  : 'Click on any row or expand button to open the full itemized line-item ledger editor, or turn on Quick Edit to edit cells inline.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="table-toggle-quick-edit-mode-btn"
                onClick={() => setIsQuickEditMode(!isQuickEditMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isQuickEditMode
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 ring-1 ring-amber-300'
                    : 'bg-[#0E121A] text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isQuickEditMode ? 'Exit Quick Edit' : '⚡ Enable Inline Editing'}</span>
              </button>

              <div className="text-xs text-slate-400 whitespace-nowrap hidden sm:block">
                Showing <span className="text-white font-semibold">{filteredData.length}</span> of {properties.length} properties
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0E121A] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="py-3 px-4 min-w-[200px]">Property & Type</th>
                  <th className="py-3 px-3 text-right min-w-[80px]">Units</th>
                  <th className="py-3 px-3 text-right text-emerald-400 min-w-[110px]">
                    Gross Income {isQuickEditMode && <span className="text-[9px] text-amber-400">(edit)</span>}
                  </th>
                  <th className="py-3 px-3 text-right text-slate-300 min-w-[95px]">
                    Property Tax {isQuickEditMode && <span className="text-[9px] text-amber-400">(edit)</span>}
                  </th>
                  <th className="py-3 px-3 text-right text-slate-300 min-w-[95px]">
                    Insurance {isQuickEditMode && <span className="text-[9px] text-amber-400">(edit)</span>}
                  </th>
                  <th className="py-3 px-3 text-right text-slate-300 min-w-[85px]">
                    HOA {isQuickEditMode && <span className="text-[9px] text-amber-400">(edit)</span>}
                  </th>
                  <th className="py-3 px-3 text-right text-purple-300 min-w-[95px]">
                    Management {isQuickEditMode && <span className="text-[9px] text-amber-400">(edit)</span>}
                  </th>
                  <th className="py-3 px-3 text-right text-slate-300 min-w-[100px]">
                    Maintenance {isQuickEditMode && <span className="text-[9px] text-amber-400">(edit)</span>}
                  </th>
                  <th className="py-3 px-3 text-right text-rose-400 min-w-[100px]">Total Expenses</th>
                  {!excludeDebt && (
                    <th className="py-3 px-3 text-right text-amber-400 min-w-[105px]">
                      Mortgage {isQuickEditMode && <span className="text-[9px] text-amber-400">(edit)</span>}
                    </th>
                  )}
                  <th className="py-3 px-3 text-right text-emerald-400 font-bold min-w-[110px]">
                    {excludeDebt ? 'Net Income' : 'Net Cash Flow'}
                  </th>
                  <th className="py-3 px-3 text-right text-slate-300 min-w-[85px]">Cap Rate</th>
                  <th className="py-3 px-4 text-center min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredData.map(({ property, finances, valuation, taxMonthly, insMonthly, hoaMonthly, mgmtMonthly, repairsMonthly, capexMonthly, utilMonthly, otherExpensesMonthly, totalUnits, occupiedUnits, pnlNOIMonthly, pnlNetCashFlowMonthly }) => {
                  const isExpanded = expandedPropId === property.id;
                  const isPositive = finances.netCashFlowMonthly >= 0;

                  return (
                    <React.Fragment key={property.id}>
                      <tr 
                        className={`hover:bg-[#1C2230] transition-colors ${
                          isExpanded ? 'bg-[#1C2230]/70' : ''
                        }`}
                      >
                        {/* Property Name & Type */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              id={`expand-ledger-row-${property.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPropId(isExpanded ? null : property.id);
                              }}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title={isExpanded ? 'Collapse line-item details' : 'Expand full itemized ledger breakdown'}
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              {isQuickEditMode ? (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={property.name}
                                    onChange={(e) => handleUpdateName(property, e.target.value)}
                                    className="w-full bg-[#0E121A] text-white font-bold text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    placeholder="Property Name"
                                  />
                                  <input
                                    type="text"
                                    value={property.address || ''}
                                    onChange={(e) => handleUpdateAddress(property, e.target.value)}
                                    className="w-full bg-[#0E121A] text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-800 focus:border-emerald-500"
                                    placeholder="Address / Location"
                                  />
                                </div>
                              ) : (
                                <div 
                                  className="cursor-pointer"
                                  onClick={() => setExpandedPropId(isExpanded ? null : property.id)}
                                >
                                  <div className="font-bold text-white text-xs hover:text-emerald-400 transition-colors flex items-center gap-1.5 flex-wrap">
                                    <span>{property.name}</span>
                                    <span className="text-[10px] font-normal text-slate-500">({property.propertyType})</span>
                                    {property.companyName && (
                                      <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                                        🏢 {property.companyName}
                                      </span>
                                    )}
                                  </div>
                                  {property.address && property.address.trim().toLowerCase() !== property.name.trim().toLowerCase() && (
                                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                      {property.address}
                                    </div>
                                  )}
                                  {(() => {
                                    const tName = property.tenantName || property.units?.[0]?.tenantName;
                                    const tPhone = property.tenantPhone || property.units?.[0]?.tenantPhone;
                                    const tLeaseEnd = property.leaseEnd || property.units?.[0]?.leaseEnd;
                                    if (!tName && !tPhone && !tLeaseEnd) return null;
                                    return (
                                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-400/90 mt-0.5">
                                        {tName && (
                                          <span className="flex items-center gap-0.5 font-medium">
                                            <User className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                                            <span className="truncate max-w-[90px]">{tName}</span>
                                          </span>
                                        )}
                                        {tPhone && (
                                          <span className="flex items-center gap-0.5 text-slate-400">
                                            <Phone className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                            <span>{tPhone}</span>
                                          </span>
                                        )}
                                        {tLeaseEnd && (
                                          <span className="flex items-center gap-0.5 text-slate-400">
                                            <Calendar className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                                            <span>Exp: {tLeaseEnd}</span>
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Units / Occupancy */}
                        <td className="py-3.5 px-3 text-right text-slate-300">
                          {isQuickEditMode ? (
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={isNaN(totalUnits) ? 1 : totalUnits}
                              onChange={(e) => handleUpdateUnitsCount(property, parseInt(e.target.value) || 1)}
                              className="w-16 bg-[#0E121A] text-right font-semibold text-white text-xs px-1.5 py-1 rounded border border-slate-700 focus:border-emerald-500"
                              title="Total rental units"
                            />
                          ) : (
                            <div 
                              className="cursor-pointer"
                              onClick={() => setExpandedPropId(isExpanded ? null : property.id)}
                            >
                              <span className="font-semibold text-white">{totalUnits}</span>
                              <span className="text-[10px] text-slate-500 ml-1">({occupiedUnits} occ)</span>
                            </div>
                          )}
                        </td>

                        {/* Gross Income */}
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                          {isQuickEditMode ? (
                            <div className="relative inline-block w-24">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-emerald-500/70 text-[10px] pointer-events-none">$</span>
                              <input
                                type="number"
                                min="0"
                                step="25"
                                value={isNaN(finances.grossScheduledIncomeMonthly) ? 0 : Math.round(finances.grossScheduledIncomeMonthly * multiplier)}
                                onChange={(e) => handleUpdateGrossRent(property, parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#0E121A] text-right font-bold text-emerald-400 text-xs pl-4 pr-1.5 py-1 rounded border border-emerald-500/50 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                                title={`Gross Scheduled Rent (${timeframe})`}
                              />
                            </div>
                          ) : (
                            <span 
                              className="cursor-pointer hover:underline"
                              onClick={() => setExpandedPropId(isExpanded ? null : property.id)}
                            >
                              {formatCurrency(finances.grossScheduledIncomeMonthly * multiplier)}
                            </span>
                          )}
                        </td>

                        {/* Property Tax */}
                        <td className="py-3.5 px-3 text-right text-slate-300">
                          {isQuickEditMode ? (
                            <div className="relative inline-block w-20">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">$</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={isNaN(taxMonthly) ? 0 : Math.round(taxMonthly * multiplier)}
                                onChange={(e) => handleUpdateExpenseCategory(property, 'Property Taxes', parseFloat(e.target.value) || 0, 'Property Taxes')}
                                className="w-full bg-[#0E121A] text-right text-slate-200 text-xs pl-4 pr-1.5 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                title={`Property Tax (${timeframe})`}
                              />
                            </div>
                          ) : (
                            formatCurrency((isNaN(taxMonthly) ? 0 : taxMonthly) * multiplier)
                          )}
                        </td>

                        {/* Insurance */}
                        <td className="py-3.5 px-3 text-right text-slate-300">
                          {isQuickEditMode ? (
                            <div className="relative inline-block w-20">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">$</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={isNaN(insMonthly) ? 0 : Math.round(insMonthly * multiplier)}
                                onChange={(e) => handleUpdateExpenseCategory(property, 'Property Insurance', parseFloat(e.target.value) || 0, 'Property Insurance')}
                                className="w-full bg-[#0E121A] text-right text-slate-200 text-xs pl-4 pr-1.5 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                title={`Property Insurance (0 = delete) (${timeframe})`}
                              />
                            </div>
                          ) : insMonthly > 0 ? (
                            formatCurrency(insMonthly * multiplier)
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* HOA */}
                        <td className="py-3.5 px-3 text-right text-slate-300">
                          {isQuickEditMode ? (
                            <div className="relative inline-block w-18">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">$</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={isNaN(hoaMonthly) ? 0 : Math.round(hoaMonthly * multiplier)}
                                onChange={(e) => handleUpdateExpenseCategory(property, 'HOA / Condo Fees', parseFloat(e.target.value) || 0, 'HOA / Condo Fees')}
                                className="w-full bg-[#0E121A] text-right text-slate-200 text-xs pl-4 pr-1.5 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                title={`HOA / Condo Fees (${timeframe})`}
                              />
                            </div>
                          ) : (
                            hoaMonthly > 0 ? formatCurrency(hoaMonthly * multiplier) : <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Property Management Fee */}
                        <td className="py-3.5 px-3 text-right text-slate-300">
                          {isQuickEditMode ? (
                            <div className="relative inline-block w-20">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">$</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={isNaN(mgmtMonthly) ? 0 : Math.round(mgmtMonthly * multiplier)}
                                onChange={(e) => handleUpdateExpenseCategory(property, 'Property Management', parseFloat(e.target.value) || 0, 'Property Management')}
                                className="w-full bg-[#0E121A] text-right text-purple-300 text-xs pl-4 pr-1.5 py-1 rounded border border-slate-700 focus:border-purple-500"
                                title={`Property Management Fee (${timeframe})`}
                              />
                            </div>
                          ) : (
                            mgmtMonthly > 0 ? (
                              <span className="text-purple-300 font-medium">
                                {formatCurrency(mgmtMonthly * multiplier)}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          )}
                        </td>

                        {/* Maintenance */}
                        <td className="py-3.5 px-3 text-right text-slate-300">
                          {isQuickEditMode ? (
                            <div className="relative inline-block w-20">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">$</span>
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={isNaN(repairsMonthly + capexMonthly) ? 0 : Math.round(((isNaN(repairsMonthly) ? 0 : repairsMonthly) + (isNaN(capexMonthly) ? 0 : capexMonthly)) * multiplier)}
                                onChange={(e) => handleUpdateExpenseCategory(property, 'Repairs & Maintenance', parseFloat(e.target.value) || 0, 'Repairs & Maintenance')}
                                className="w-full bg-[#0E121A] text-right text-slate-200 text-xs pl-4 pr-1.5 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                title={`Maintenance (${timeframe})`}
                              />
                            </div>
                          ) : (
                            formatCurrency(((isNaN(repairsMonthly) ? 0 : repairsMonthly) + (isNaN(capexMonthly) ? 0 : capexMonthly)) * multiplier)
                          )}
                        </td>

                        {/* Total Operating Expenses (Live Auto-Computed) */}
                        <td className="py-3.5 px-3 text-right font-bold text-rose-400">
                          {formatCurrency(finances.operatingExpensesMonthly * multiplier)}
                        </td>

                        {/* Mortgage */}
                        {!excludeDebt && (
                          <td className="py-3.5 px-3 text-right text-amber-400">
                            {isQuickEditMode ? (
                              <div className="relative inline-block w-22">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-amber-500/70 text-[10px] pointer-events-none">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="25"
                                  value={isNaN(finances.debtServiceMonthly) ? 0 : Math.round(finances.debtServiceMonthly * multiplier)}
                                  onChange={(e) => handleUpdateMortgageDebt(property, parseFloat(e.target.value) || 0)}
                                  className="w-full bg-[#0E121A] text-right text-amber-400 text-xs pl-4 pr-1.5 py-1 rounded border border-amber-500/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                  title={`Monthly Debt Service (0 = Paid Off) (${timeframe})`}
                                />
                              </div>
                            ) : finances.debtServiceMonthly > 0 ? (
                              formatCurrency(finances.debtServiceMonthly * multiplier)
                            ) : (
                              <span className="text-slate-600">Paid Off</span>
                            )}
                          </td>
                        )}

                        {/* Net Cash Flow / Net Income (Live Auto-Computed: Income - Expenses) */}
                        {(() => {
                          const rowNetCashFlow = (excludeDebt ? pnlNOIMonthly : pnlNetCashFlowMonthly) * multiplier;
                          const isRowPos = rowNetCashFlow >= 0;
                          return (
                            <td className={`py-3.5 px-3 text-right font-black text-sm ${
                              isRowPos ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {formatCurrency(rowNetCashFlow)}
                            </td>
                          );
                        })()}

                        {/* Cap Rate */}
                        {(() => {
                          const rowCapRate = finances.capRatePercent;
                          return (
                            <td className="py-3.5 px-3 text-right font-semibold text-blue-400">
                              {rowCapRate > 0 ? `${rowCapRate.toFixed(2)}%` : '—'}
                            </td>
                          );
                        })()}

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Toggle Drilldown Drawer */}
                            <button
                              id={`open-drawer-${property.id}-btn`}
                              onClick={() => setExpandedPropId(isExpanded ? null : property.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isExpanded 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                              title={isExpanded ? 'Collapse line-item editor' : 'Expand full itemized line-item ledger'}
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>

                            {/* Open Underwriting Calculator */}
                            <button
                              id={`open-property-${property.id}-btn`}
                              onClick={() => {
                                onSelectProperty(property.id);
                                onNavigateToTab('calculator');
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Open in underwriting calculator"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Open Appliances & Warranties */}
                            <button
                              id={`open-appliances-${property.id}-btn`}
                              onClick={() => {
                                onSelectProperty(property.id);
                                onNavigateToTab('appliances');
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="View & manage appliances and warranties"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* Full Edit Modal */}
                            <button
                              id={`edit-property-modal-${property.id}-btn`}
                              onClick={() => onOpenEditPropertyModal(property)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                              title="Open full property configuration modal"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate Property */}
                            {onDuplicateProperty && (
                              <button
                                id={`duplicate-property-${property.id}-btn`}
                                onClick={() => onDuplicateProperty(property)}
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Duplicate property"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Property */}
                            {onDeleteProperty && (
                              <button
                                id={`delete-property-${property.id}-btn`}
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${property.name}" from your portfolio?`)) {
                                    onDeleteProperty(property.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete property"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Deep Itemized Line-Item Ledger Editor */}
                      {isExpanded && (
                        <tr className="bg-[#11141D] text-slate-300">
                          <td colSpan={excludeDebt ? 12 : 13} className="p-4 sm:p-6 border-y border-slate-800/80">
                            <div className="space-y-4">
                              {/* Header inside drawer */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                  <Sliders className="w-4 h-4 text-emerald-400" />
                                  <span className="font-bold text-white text-sm">
                                    Itemized Financial & Line-Item Ledger: {property.name}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    (Directly edit any income, unit, expense category, or financing parameter)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-slate-400">{excludeDebt ? 'Net Income (NOI):' : 'Net Cash Flow:'}</span>
                                  {(() => {
                                    const drawerNet = (excludeDebt ? pnlNOIMonthly : pnlNetCashFlowMonthly) * multiplier;
                                    return (
                                      <span className={`font-black ${drawerNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatCurrency(drawerNet)}{labelSuffix}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* 3 Main Detailed Section Cards */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
                                
                                {/* 1. Income & Multi-Unit Breakdown Card */}
                                <div className="bg-[#161A23] p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                                      <span className="flex items-center gap-1.5">
                                        <Wallet className="w-3.5 h-3.5" />
                                        <span>Income & Tenant Rent Roll</span>
                                      </span>
                                      <span className="text-sm">{formatCurrency(finances.grossScheduledIncomeMonthly * multiplier)}{labelSuffix}</span>
                                    </div>

                                    {/* Base Monthly Rent & Vacancy Inputs */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                                          Base Scheduled Rent ($/mo):
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="50"
                                          value={isNaN(property.baseMonthlyRent) ? 0 : Math.round(property.baseMonthlyRent || 0)}
                                          onChange={(e) => handleUpdateGrossRent(property, parseFloat(e.target.value) || 0)}
                                          className="w-full bg-[#0E121A] text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1">
                                          Vacancy Allowance (%):
                                        </label>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={isNaN(property.vacancyRatePercent) ? 0 : (property.vacancyRatePercent || 0)}
                                            onChange={(e) => handleUpdateVacancyRate(property, parseFloat(e.target.value) || 0)}
                                            className="w-full bg-[#0E121A] text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-emerald-500"
                                          />
                                          <span className="text-slate-500 font-bold">%</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Tenant & Lease Agreement in Drawer */}
                                    <div className="p-2.5 bg-[#0E121A] rounded-lg border border-slate-800 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                                          <User className="w-3 h-3 text-blue-400" />
                                          Tenant & Lease Agreement
                                        </span>
                                        {(property.leaseEnd || property.units?.[0]?.leaseEnd) && (
                                          <span className="text-[10px] text-rose-400 font-semibold">
                                            Expires: {property.leaseEnd || property.units?.[0]?.leaseEnd}
                                          </span>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-0.5">Tenant Name:</label>
                                          <input
                                            type="text"
                                            value={property.tenantName || property.units?.[0]?.tenantName || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const updatedUnits = (property.units || []).map((u, i) => i === 0 ? { ...u, tenantName: val } : u);
                                              handleUpdatePropertyDirect({ ...property, tenantName: val, units: updatedUnits });
                                            }}
                                            placeholder="Tenant Full Name"
                                            className="w-full bg-[#161A23] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-blue-500 placeholder-slate-600"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-0.5">Phone Number:</label>
                                          <input
                                            type="tel"
                                            value={property.tenantPhone || property.units?.[0]?.tenantPhone || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const updatedUnits = (property.units || []).map((u, i) => i === 0 ? { ...u, tenantPhone: val } : u);
                                              handleUpdatePropertyDirect({ ...property, tenantPhone: val, units: updatedUnits });
                                            }}
                                            placeholder="(555) 000-0000"
                                            className="w-full bg-[#161A23] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-blue-500 placeholder-slate-600"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-0.5">Lease Start Date:</label>
                                          <input
                                            type="date"
                                            value={property.leaseStart || property.units?.[0]?.leaseStart || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const updatedUnits = (property.units || []).map((u, i) => i === 0 ? { ...u, leaseStart: val } : u);
                                              handleUpdatePropertyDirect({ ...property, leaseStart: val, units: updatedUnits });
                                            }}
                                            className="w-full bg-[#161A23] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-slate-400 block mb-0.5">Lease Expiration:</label>
                                          <input
                                            type="date"
                                            value={property.leaseEnd || property.units?.[0]?.leaseEnd || ''}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const updatedUnits = (property.units || []).map((u, i) => i === 0 ? { ...u, leaseEnd: val } : u);
                                              handleUpdatePropertyDirect({ ...property, leaseEnd: val, units: updatedUnits });
                                            }}
                                            className="w-full bg-[#161A23] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-rose-500"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Extra Income Items List */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                                        <span>Other Income Streams:</span>
                                        <span className="text-emerald-400 font-bold">
                                          +{formatCurrency(finances.extraIncomeMonthly * multiplier)}{labelSuffix}
                                        </span>
                                      </div>

                                      {(property.extraIncomes && property.extraIncomes.length > 0) ? (
                                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                          {property.extraIncomes.map((inc) => (
                                            <div key={inc.id} className="flex items-center justify-between gap-1.5 bg-[#0E121A] px-2 py-1 rounded-md text-[11px] border border-slate-800">
                                              <input
                                                type="text"
                                                value={inc.name}
                                                onChange={(e) => {
                                                  const updated = (property.extraIncomes || []).map((i) => (i.id === inc.id ? { ...i, name: e.target.value } : i));
                                                  handleUpdatePropertyDirect({ ...property, extraIncomes: updated });
                                                }}
                                                className="bg-transparent text-slate-200 flex-1 focus:outline-none"
                                              />
                                              <div className="flex items-center gap-1">
                                                <span className="text-slate-500">$</span>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  value={isNaN(inc.amount) ? 0 : (inc.amount || 0)}
                                                  onChange={(e) => {
                                                    const updated = (property.extraIncomes || []).map((i) => (i.id === inc.id ? { ...i, amount: parseFloat(e.target.value) || 0 } : i));
                                                    handleUpdatePropertyDirect({ ...property, extraIncomes: updated });
                                                  }}
                                                  className="w-14 bg-transparent text-emerald-400 font-bold text-right focus:outline-none"
                                                />
                                                <span className="text-[10px] text-slate-500">/{inc.frequency === 'annual' ? 'yr' : 'mo'}</span>
                                                <button
                                                  onClick={() => handleDeleteExtraIncome(property, inc.id)}
                                                  className="text-slate-500 hover:text-rose-400 p-0.5 ml-1"
                                                  title="Delete income item"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-[11px] text-slate-500 italic">No extra incomes recorded (e.g. Laundry, Storage, Parking).</div>
                                      )}

                                      {/* Quick Add Extra Income Form */}
                                      <div className="flex items-center gap-1.5 pt-1">
                                        <input
                                          type="text"
                                          placeholder="Income Name (e.g. Parking)"
                                          value={newIncomeForms[property.id]?.name || ''}
                                          onChange={(e) => setNewIncomeForms({
                                            ...newIncomeForms,
                                            [property.id]: {
                                              name: e.target.value,
                                              amount: newIncomeForms[property.id]?.amount || '',
                                              frequency: newIncomeForms[property.id]?.frequency || 'monthly'
                                            }
                                          })}
                                          className="flex-1 bg-[#0E121A] text-white text-[11px] px-2 py-1 rounded border border-slate-700 focus:border-emerald-500 placeholder-slate-600"
                                        />
                                        <input
                                          type="number"
                                          placeholder="$ Amt"
                                          value={newIncomeForms[property.id]?.amount || ''}
                                          onChange={(e) => setNewIncomeForms({
                                            ...newIncomeForms,
                                            [property.id]: {
                                              name: newIncomeForms[property.id]?.name || '',
                                              amount: e.target.value,
                                              frequency: newIncomeForms[property.id]?.frequency || 'monthly'
                                            }
                                          })}
                                          className="w-16 bg-[#0E121A] text-white text-[11px] px-2 py-1 rounded border border-slate-700 focus:border-emerald-500 placeholder-slate-600"
                                        />
                                        <button
                                          onClick={() => {
                                            const form = newIncomeForms[property.id];
                                            if (form && form.name && parseFloat(form.amount) > 0) {
                                              handleAddExtraIncome(property, form.name, parseFloat(form.amount), form.frequency || 'monthly');
                                              setNewIncomeForms({ ...newIncomeForms, [property.id]: { name: '', amount: '', frequency: 'monthly' } });
                                            }
                                          }}
                                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors"
                                        >
                                          + Add
                                        </button>
                                      </div>
                                    </div>

                                    {/* Multi-Unit Rent Roll Table (if multi-unit) */}
                                    {property.units && property.units.length > 0 && (
                                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                                          <span>Itemized Units & Tenants:</span>
                                          <button
                                            onClick={() => handleAddUnitItem(property)}
                                            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>Add Unit</span>
                                          </button>
                                        </div>

                                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                          {property.units.map((unit) => (
                                            <div key={unit.id} className="bg-[#0E121A] p-1.5 rounded-lg border border-slate-800 flex items-center justify-between gap-1 text-[11px]">
                                              <input
                                                type="text"
                                                value={unit.name}
                                                onChange={(e) => handleUpdateUnitItem(property, unit.id, { name: e.target.value })}
                                                className="w-20 bg-transparent text-white font-bold focus:outline-none"
                                              />
                                              <input
                                                type="text"
                                                placeholder="Tenant Name"
                                                value={unit.tenantName || ''}
                                                onChange={(e) => handleUpdateUnitItem(property, unit.id, { tenantName: e.target.value })}
                                                className="w-24 bg-transparent text-slate-300 focus:outline-none"
                                              />
                                              <div className="flex items-center gap-1">
                                                <span className="text-slate-500">$</span>
                                                <input
                                                  type="number"
                                                  value={isNaN(unit.rent) ? 0 : (unit.rent || 0)}
                                                  onChange={(e) => handleUpdateUnitItem(property, unit.id, { rent: parseFloat(e.target.value) || 0 })}
                                                  className="w-14 bg-transparent text-right font-bold text-emerald-400 focus:outline-none"
                                                />
                                              </div>
                                              <button
                                                onClick={() => handleUpdateUnitItem(property, unit.id, { isOccupied: !unit.isOccupied })}
                                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                  unit.isOccupied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                                }`}
                                              >
                                                {unit.isOccupied ? 'Occ' : 'Vac'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setApplianceModalData({ property, unit })}
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30 transition-colors cursor-pointer"
                                                title="Manage appliances bought date & warranty information"
                                              >
                                                <ShieldCheck className="w-3 h-3" />
                                                <span>{unit.appliances?.length || 0} Appl</span>
                                              </button>
                                              {property.units && property.units.length > 1 && (
                                                <button
                                                  onClick={() => handleDeleteUnitItem(property, unit.id)}
                                                  className="text-slate-500 hover:text-rose-400 p-0.5"
                                                  title="Delete unit"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* EGI Summary */}
                                  <div className="p-2 bg-[#0E121A] rounded-lg border border-slate-800 flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-300">Effective Gross Income (EGI):</span>
                                    <span className="text-emerald-400">{formatCurrency(finances.effectiveGrossIncomeMonthly * multiplier)}{labelSuffix}</span>
                                  </div>
                                </div>

                                {/* 2. Itemized Operating Expenses Card */}
                                <div className="bg-[#161A23] p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between text-rose-400 font-bold border-b border-slate-800 pb-2">
                                      <span className="flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5" />
                                        <span>Itemized Operating Expenses</span>
                                      </span>
                                      <span className="text-sm">{formatCurrency(finances.operatingExpensesMonthly * multiplier)}{labelSuffix}</span>
                                    </div>

                                    {/* Standard Core Expense Category Grid */}
                                    <div className="grid grid-cols-2 gap-2 text-xs max-h-56 overflow-y-auto pr-1">
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-[11px] text-slate-400 font-medium">Property Taxes:</label>
                                          {taxMonthly > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateExpenseCategory(property, 'Property Taxes', 0)}
                                              className="text-[10px] text-slate-500 hover:text-rose-400"
                                              title="Clear / Delete property tax"
                                            >
                                              Clear ($0)
                                            </button>
                                          )}
                                        </div>
                                        <input
                                          type="number"
                                          min="0"
                                          value={isNaN(taxMonthly) ? 0 : Math.round(taxMonthly * multiplier)}
                                          onChange={(e) => handleUpdateExpenseCategory(property, 'Property Taxes', parseFloat(e.target.value) || 0, 'Property Taxes')}
                                          className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-[11px] text-slate-400 font-medium">Property Insurance:</label>
                                          {insMonthly > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateExpenseCategory(property, 'Property Insurance', 0)}
                                              className="text-[10px] text-rose-400 hover:text-rose-300 font-medium"
                                              title="Delete insurance (set to $0)"
                                            >
                                              Delete ($0)
                                            </button>
                                          )}
                                        </div>
                                        <input
                                          type="number"
                                          min="0"
                                          value={isNaN(insMonthly) ? 0 : Math.round(insMonthly * multiplier)}
                                          onChange={(e) => handleUpdateExpenseCategory(property, 'Property Insurance', parseFloat(e.target.value) || 0, 'Property Insurance')}
                                          placeholder="0"
                                          className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-[11px] text-slate-400 font-medium">HOA / Condo Dues:</label>
                                          {hoaMonthly > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateExpenseCategory(property, 'HOA / Condo Fees', 0)}
                                              className="text-[10px] text-slate-500 hover:text-rose-400"
                                              title="Remove HOA dues"
                                            >
                                              Clear ($0)
                                            </button>
                                          )}
                                        </div>
                                        <input
                                          type="number"
                                          min="0"
                                          value={isNaN(hoaMonthly) ? 0 : Math.round(hoaMonthly * multiplier)}
                                          onChange={(e) => handleUpdateExpenseCategory(property, 'HOA / Condo Fees', parseFloat(e.target.value) || 0, 'HOA / Condo Fees')}
                                          className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-[11px] text-slate-400 font-medium">Management Fees:</label>
                                          {mgmtMonthly > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateExpenseCategory(property, 'Property Management', 0)}
                                              className="text-[10px] text-slate-500 hover:text-rose-400"
                                              title="Remove management fees"
                                            >
                                              Clear ($0)
                                            </button>
                                          )}
                                        </div>
                                        <input
                                          type="number"
                                          min="0"
                                          value={isNaN(mgmtMonthly) ? 0 : Math.round(mgmtMonthly * multiplier)}
                                          onChange={(e) => handleUpdateExpenseCategory(property, 'Property Management', parseFloat(e.target.value) || 0, 'Property Management')}
                                          className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1">Repairs & Maintenance:</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={isNaN(repairsMonthly) ? 0 : Math.round(repairsMonthly * multiplier)}
                                          onChange={(e) => handleUpdateExpenseCategory(property, 'Repairs & Maintenance', parseFloat(e.target.value) || 0, 'Repairs & Maintenance')}
                                          className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1">CapEx Reserves:</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={isNaN(capexMonthly) ? 0 : Math.round(capexMonthly * multiplier)}
                                          onChange={(e) => handleUpdateExpenseCategory(property, 'Capital Expenditures (CapEx)', parseFloat(e.target.value) || 0, 'Capital Expenditures (CapEx)')}
                                          className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1">Utilities (Water/Trash):</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={isNaN(utilMonthly) ? 0 : Math.round(utilMonthly * multiplier)}
                                          onChange={(e) => handleUpdateExpenseCategory(property, 'Water & Sewer', parseFloat(e.target.value) || 0, 'Water & Sewer')}
                                          className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1">Other Operations:</label>
                                        <input
                                          type="number"
                                          min="0"
                                          value={isNaN(otherExpensesMonthly) ? 0 : Math.round(otherExpensesMonthly * multiplier)}
                                          onChange={(e) => handleUpdateExpenseCategory(property, 'Other Operating Expense', parseFloat(e.target.value) || 0, 'Other Operating Expense')}
                                          className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>

                                    {/* Custom Expenses List (with delete and edit) */}
                                    {property.expenses && property.expenses.length > 0 && (
                                      <div className="space-y-1 pt-2 border-t border-slate-800/80">
                                        <span className="text-[11px] text-slate-400 font-semibold block">All Line-Item Expenses:</span>
                                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                          {property.expenses.map((exp) => (
                                            <div key={exp.id} className="flex items-center justify-between bg-[#0E121A] px-2 py-1 rounded text-[11px] border border-slate-800">
                                              <span className="text-slate-300 truncate max-w-[130px]">{exp.name}</span>
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-rose-400 font-semibold">{formatCurrency(exp.amount)}</span>
                                                <span className="text-[10px] text-slate-500">/{exp.frequency === 'annual' ? 'yr' : 'mo'}</span>
                                                <button
                                                  onClick={() => handleDeleteExpenseItem(property, exp.id)}
                                                  className="text-slate-500 hover:text-rose-400 p-0.5 ml-1"
                                                  title="Delete expense"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Add Custom Expense Line Item Form */}
                                    <div className="pt-2 border-t border-slate-800">
                                      <span className="text-[11px] text-slate-300 font-semibold block mb-1">+ Add Custom Expense Line Item:</span>
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <input
                                          type="text"
                                          placeholder="Name (e.g. Lawn Care)"
                                          value={newExpenseForms[property.id]?.name || ''}
                                          onChange={(e) => setNewExpenseForms({
                                            ...newExpenseForms,
                                            [property.id]: {
                                              name: e.target.value,
                                              category: newExpenseForms[property.id]?.category || 'Landscaping & Grounds',
                                              amount: newExpenseForms[property.id]?.amount || '',
                                              frequency: newExpenseForms[property.id]?.frequency || 'monthly'
                                            }
                                          })}
                                          className="bg-[#0E121A] text-white text-[11px] px-2 py-1 rounded border border-slate-700 focus:border-emerald-500 placeholder-slate-600 col-span-2"
                                        />
                                        <input
                                          type="number"
                                          placeholder="$ Amount"
                                          value={newExpenseForms[property.id]?.amount || ''}
                                          onChange={(e) => setNewExpenseForms({
                                            ...newExpenseForms,
                                            [property.id]: {
                                              name: newExpenseForms[property.id]?.name || '',
                                              category: newExpenseForms[property.id]?.category || 'Landscaping & Grounds',
                                              amount: e.target.value,
                                              frequency: newExpenseForms[property.id]?.frequency || 'monthly'
                                            }
                                          })}
                                          className="bg-[#0E121A] text-white text-[11px] px-2 py-1 rounded border border-slate-700 focus:border-emerald-500 placeholder-slate-600"
                                        />
                                      </div>
                                      <div className="flex items-center justify-between gap-1.5 mt-1.5">
                                        <select
                                          value={newExpenseForms[property.id]?.category || 'Landscaping & Grounds'}
                                          onChange={(e) => setNewExpenseForms({
                                            ...newExpenseForms,
                                            [property.id]: {
                                              name: newExpenseForms[property.id]?.name || '',
                                              category: e.target.value as ExpenseCategory,
                                              amount: newExpenseForms[property.id]?.amount || '',
                                              frequency: newExpenseForms[property.id]?.frequency || 'monthly'
                                            }
                                          })}
                                          className="bg-[#0E121A] text-slate-300 text-[10px] px-2 py-1 rounded border border-slate-700 flex-1"
                                        >
                                          <option value="Landscaping & Grounds">Landscaping & Grounds</option>
                                          <option value="Pest Control">Pest Control</option>
                                          <option value="Legal & Professional">Legal & Professional</option>
                                          <option value="Advertising & Marketing">Advertising & Marketing</option>
                                          <option value="Water & Sewer">Water & Sewer</option>
                                          <option value="Trash Collection">Trash Collection</option>
                                          <option value="Gas & Electricity">Gas & Electricity</option>
                                          <option value="Other Operating Expense">Other Operating Expense</option>
                                        </select>
                                        <button
                                          onClick={() => {
                                            const form = newExpenseForms[property.id];
                                            if (form && form.name && parseFloat(form.amount) > 0) {
                                              handleAddExpenseItem(property, form.name, form.category || 'Other Operating Expense', parseFloat(form.amount), form.frequency || 'monthly');
                                              setNewExpenseForms({ ...newExpenseForms, [property.id]: { name: '', category: 'Landscaping & Grounds', amount: '', frequency: 'monthly' } });
                                            }
                                          }}
                                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold transition-colors"
                                        >
                                          Add Expense
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* NOI Summary */}
                                  <div className="p-2 bg-[#0E121A] rounded-lg border border-slate-800 flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-300">Net Operating Income (NOI):</span>
                                    <span className="text-blue-400">{formatCurrency(finances.netOperatingIncomeMonthly * multiplier)}{labelSuffix}</span>
                                  </div>
                                </div>

                                {/* 3. Valuation, Financing & Debt Obligations Card */}
                                <div className="bg-[#161A23] p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between text-blue-400 font-bold border-b border-slate-800 pb-2">
                                      <span className="flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span>Valuation, Debt & Returns</span>
                                      </span>
                                      <span className="text-sm">{formatCurrency(valuation)}</span>
                                    </div>

                                    {/* Valuation & Purchase Price Inputs */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1">Market Valuation ($):</label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="5000"
                                          value={isNaN(property.currentValuation || property.purchasePrice) ? 0 : Math.round(property.currentValuation || property.purchasePrice || 0)}
                                          onChange={(e) => handleUpdateValuation(property, parseFloat(e.target.value) || 0)}
                                          className="w-full bg-[#0E121A] text-white font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1">Purchase Price ($):</label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="5000"
                                          value={isNaN(property.purchasePrice) ? 0 : Math.round(property.purchasePrice || 0)}
                                          onChange={(e) => handleUpdatePurchasePrice(property, parseFloat(e.target.value) || 0)}
                                          className="w-full bg-[#0E121A] text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-emerald-500"
                                        />
                                      </div>
                                    </div>

                                    {/* Mortgage Debt Controls */}
                                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-300 font-semibold">Mortgage / Debt Service:</span>
                                        <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={property.hasMortgage}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                handleUpdateMortgageDebt(property, 1200);
                                              } else {
                                                handleUpdateMortgageDebt(property, 0);
                                              }
                                            }}
                                            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                          />
                                          <span>Has Active Mortgage</span>
                                        </label>
                                      </div>

                                      {property.hasMortgage && (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <label className="text-[10px] text-slate-400 block mb-0.5">Monthly Debt Payment ($/mo):</label>
                                            <input
                                              type="number"
                                              min="0"
                                              step="50"
                                              value={isNaN(finances.debtServiceMonthly) ? 0 : Math.round(finances.debtServiceMonthly || 0)}
                                              onChange={(e) => handleUpdateMortgageDebt(property, parseFloat(e.target.value) || 0)}
                                              className="w-full bg-[#0E121A] text-amber-400 font-bold text-xs px-2 py-1 rounded border border-slate-700 focus:border-amber-500"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-slate-400 block mb-0.5">Interest Rate (%):</label>
                                            <input
                                              type="number"
                                              min="0"
                                              max="25"
                                              step="0.125"
                                              value={isNaN(property.interestRate) ? 6.5 : (property.interestRate || 6.5)}
                                              onChange={(e) => handleUpdatePropertyDirect({ ...property, interestRate: parseFloat(e.target.value) || 6.5 })}
                                              className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Live Financial Return Indicators */}
                                    <div className="space-y-1 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                                      <div className="flex justify-between">
                                        <span>Cap Rate:</span>
                                        <span className="text-white font-bold">{finances.capRatePercent.toFixed(2)}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Cash-on-Cash Return:</span>
                                        <span className="text-emerald-400 font-bold">{finances.cashOnCashReturnPercent.toFixed(2)}%</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>DSCR (Debt Coverage):</span>
                                        <span className={`font-bold ${finances.debtServiceCoverageRatio >= 1.25 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                          {finances.debtServiceCoverageRatio.toFixed(2)}x
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Navigation Action Buttons */}
                                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                                    <button
                                      id={`drawer-open-calc-${property.id}`}
                                      onClick={() => {
                                        onSelectProperty(property.id);
                                        onNavigateToTab('calculator');
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors"
                                    >
                                      <span>Underwriting Calculator</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      id={`drawer-open-rent-${property.id}`}
                                      onClick={() => {
                                        onSelectProperty(property.id);
                                        onNavigateToTab('collection');
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      <span>Rent Tracker</span>
                                    </button>
                                    <button
                                      id={`drawer-open-appliances-${property.id}`}
                                      onClick={() => {
                                        onSelectProperty(property.id);
                                        onNavigateToTab('appliances');
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>Appliances</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* PINNED SUMMARY / TOTALS FOOTER ROW */}
              <tfoot className="bg-[#0E121A] text-white font-black border-t-2 border-slate-700 text-xs">
                <tr>
                  <td className="py-4 px-4 uppercase tracking-wider text-emerald-400">
                    PORTFOLIO TOTALS ({portfolioData.length} Properties)
                  </td>
                  <td className="py-4 px-3 text-right text-slate-200">
                    {totals.totalUnits} Units
                  </td>
                  <td className="py-4 px-3 text-right text-emerald-400 text-sm">
                    {formatCurrency(totals.grossIncomeMonthly * multiplier)}
                  </td>
                  <td className="py-4 px-3 text-right text-slate-300">
                    {formatCurrency(totals.taxMonthly * multiplier)}
                  </td>
                  <td className="py-4 px-3 text-right text-slate-300">
                    {formatCurrency(totals.insMonthly * multiplier)}
                  </td>
                  <td className="py-4 px-3 text-right text-slate-300">
                    {formatCurrency(totals.hoaMonthly * multiplier)}
                  </td>
                  <td className="py-4 px-3 text-right text-purple-300">
                    {formatCurrency(totals.mgmtMonthly * multiplier)}
                  </td>
                  <td className="py-4 px-3 text-right text-slate-300">
                    {formatCurrency((totals.repairsMonthly + totals.capexMonthly) * multiplier)}
                  </td>
                  <td className="py-4 px-3 text-right text-rose-400 text-sm">
                    {formatCurrency(totals.operatingExpensesMonthly * multiplier)}
                  </td>
                  {!excludeDebt && (
                    <td className="py-4 px-3 text-right text-amber-400">
                      {formatCurrency(totals.debtServiceMonthly * multiplier)}
                    </td>
                  )}
                  {(() => {
                    const totalNetVal = (excludeDebt ? totals.netOperatingIncomeMonthly : totals.netCashFlowMonthly) * multiplier;
                    return (
                      <td className={`py-4 px-3 text-right text-base ${
                        totalNetVal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatCurrency(totalNetVal)}
                      </td>
                    );
                  })()}
                  <td className="py-4 px-3 text-right text-blue-400 font-semibold">
                    {totals.blendedCapRate.toFixed(2)}%
                  </td>
                  <td className="py-4 px-4 text-center text-slate-500 text-[11px]">
                    All-in Rollup
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-PROPERTY CARDS GRID */}
      {activeSubView === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map(({ property, finances, valuation, taxMonthly, insMonthly, hoaMonthly, totalUnits, occupiedUnits }) => {
            const isPositive = finances.netCashFlowMonthly >= 0;
            const isVacant = occupiedUnits === 0 || finances.grossScheduledIncomeMonthly === 0 || (property as any).isOccupied === false;
            return (
              <div
                key={property.id}
                className={`bg-[#161A23] rounded-2xl border-2 ${
                  isVacant ? 'border-rose-500 shadow-md shadow-rose-950/40' : 'border-slate-800 hover:border-slate-700'
                } shadow-md p-5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-black/40 group`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                            {property.name}
                          </h4>
                          {property.companyName && (
                            <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded shrink-0">
                              🏢 {property.companyName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">
                          {property.address || 'Address on file'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {property.propertyType}
                    </span>
                  </div>

                  {/* Tenant & Active Lease Strip */}
                  {(() => {
                    const tName = property.tenantName || property.units?.[0]?.tenantName;
                    const tPhone = property.tenantPhone || property.units?.[0]?.tenantPhone;
                    const tLeaseEnd = property.leaseEnd || property.units?.[0]?.leaseEnd;
                    return (
                      <div className="mt-3 p-2 bg-[#0E121A] rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="font-semibold text-white truncate">
                            {tName || <span className="text-slate-500 font-normal italic">No tenant assigned</span>}
                          </span>
                          {tPhone && (
                            <span className="text-[11px] text-slate-400 shrink-0">&bull; {tPhone}</span>
                          )}
                        </div>
                        {tLeaseEnd && (
                          <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 shrink-0">
                            Exp: {tLeaseEnd}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Income vs Expense Quick Meters */}
                  <div className="grid grid-cols-2 gap-3 py-4 border-b border-slate-800">
                    <div className="bg-[#0E121A] p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                        Gross Income
                      </span>
                      <span className="text-base font-black text-white">
                        {formatCurrency(finances.grossScheduledIncomeMonthly * multiplier)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{labelSuffix}</span>
                    </div>

                    <div className="bg-[#0E121A] p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                        Total Expenses
                      </span>
                      <span className="text-base font-black text-rose-300">
                        {formatCurrency(finances.operatingExpensesMonthly * multiplier)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{labelSuffix}</span>
                    </div>
                  </div>

                  {/* Financial Breakdown List */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Units & Occupancy:</span>
                      <span className="font-semibold text-white">
                        {totalUnits} Units ({occupiedUnits} occupied)
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Net Operating Income (NOI):</span>
                      <span className="font-semibold text-blue-400">
                        {formatCurrency(finances.netOperatingIncomeMonthly * multiplier)}{labelSuffix}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Mortgage / Debt Service:</span>
                      <span className="font-semibold text-amber-400">
                        {finances.debtServiceMonthly > 0 ? (
                          `${formatCurrency(finances.debtServiceMonthly * multiplier)}${labelSuffix}`
                        ) : (
                          'None'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Cap Rate / CoC:</span>
                      <span className="font-semibold text-slate-200">
                        {finances.capRatePercent.toFixed(1)}% / {finances.cashOnCashReturnPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Market Valuation:</span>
                      <span className="font-semibold text-purple-300">{formatCurrency(valuation)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Cash Flow Bottom Badge & Action Footer */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className={`p-2.5 rounded-xl flex items-center justify-between ${
                    isPositive ? 'bg-emerald-950/30 border border-emerald-500/30' : 'bg-rose-950/30 border border-rose-500/30'
                  }`}>
                    <span className="text-xs font-bold text-slate-300">Net Cash Flow:</span>
                    <span className={`text-sm font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(finances.netCashFlowMonthly * multiplier)}{labelSuffix}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectProperty(property.id);
                        onNavigateToTab('calculator');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors shadow-sm"
                    >
                      <span>Underwriting</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onOpenEditPropertyModal(property)}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                      title="Edit property parameters"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: VISUAL COMPARATIVE CHARTS & EXPENSE BREAKDOWN */}
      {activeSubView === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Income vs Expense vs Cash Flow Comparison per Property */}
          <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Income vs. Expenses by Property ({timeframe})</span>
              </h3>
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-slate-400">Income</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span className="text-slate-400">Expenses</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  <span className="text-slate-400">Cash Flow</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {portfolioData.map(({ property, finances }) => {
                const inc = finances.grossScheduledIncomeMonthly * multiplier;
                const exp = (finances.operatingExpensesMonthly + finances.debtServiceMonthly) * multiplier;
                const flow = finances.netCashFlowMonthly * multiplier;
                const maxVal = Math.max(...portfolioData.map((d) => d.finances.grossScheduledIncomeMonthly * multiplier), 1);

                return (
                  <div key={property.id} className="space-y-1.5 bg-[#0E121A] p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{property.name}</span>
                      <span className={`font-black text-xs ${flow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        Cash Flow: {formatCurrency(flow)}
                      </span>
                    </div>

                    {/* Bars */}
                    <div className="space-y-1">
                      {/* Income Bar */}
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-16 text-slate-400">Income:</span>
                        <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (inc / maxVal) * 100)}%` }}
                          />
                        </div>
                        <span className="text-emerald-400 font-semibold w-16 text-right">
                          {formatCurrency(inc)}
                        </span>
                      </div>

                      {/* Total Expenses + Debt Bar */}
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-16 text-slate-400">Costs:</span>
                        <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (exp / maxVal) * 100)}%` }}
                          />
                        </div>
                        <span className="text-rose-400 font-semibold w-16 text-right">
                          {formatCurrency(exp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Aggregated Expense Breakdown Distribution */}
          <div className="bg-[#161A23] p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-400" />
                <span>Portfolio Expense Distribution ({timeframe})</span>
              </h3>
              <span className="text-xs font-bold text-rose-400">
                Total: {formatCurrency(totals.operatingExpensesMonthly * multiplier)}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {categoryBreakdown.map((cat, idx) => {
                const colors = [
                  'bg-emerald-500',
                  'bg-blue-500',
                  'bg-amber-500',
                  'bg-purple-500',
                  'bg-rose-500',
                  'bg-cyan-500',
                  'bg-indigo-500',
                  'bg-slate-500',
                ];
                const color = colors[idx % colors.length];

                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{formatCurrency(cat.amount)}</span>
                        <span className="text-slate-500 text-[11px] w-12 text-right font-semibold">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unit Appliances & Warranties Modal */}
      {applianceModalData && (
        <UnitAppliancesModal
          property={applianceModalData.property}
          unit={applianceModalData.unit}
          isOpen={true}
          onClose={() => setApplianceModalData(null)}
          onUpdateUnit={handleUpdateApplianceUnit}
        />
      )}
    </div>
  );
};
