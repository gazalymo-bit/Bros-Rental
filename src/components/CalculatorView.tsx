import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Percent, 
  ShieldCheck, 
  Wrench, 
  HelpCircle,
  Building,
  Sparkles,
  Calculator,
  ChevronRight,
  RefreshCw,
  Landmark,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ShieldX,
  User,
  Phone,
  Clock,
  Wallet,
  FileText,
  UploadCloud,
  X,
  Eye
} from 'lucide-react';
import { Property, ExpenseItem, ExtraIncomeItem, UnitRental, ExpenseCategory, FinancialCalculationResult, ApplianceItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { UnitAppliancesModal } from './UnitAppliancesModal';
import { QuickReceiptUploadModal } from './QuickReceiptUploadModal';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface CalculatorViewProps {
  property: Property;
  financials: FinancialCalculationResult;
  onUpdateProperty: (updated: Property) => void;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Property Taxes',
  'Property Insurance',
  'Property Management',
  'Repairs & Maintenance',
  'Capital Expenditures (CapEx)',
  'HOA / Condo Fees',
  'Water & Sewer',
  'Trash Collection',
  'Gas & Electricity',
  'Landscaping & Snow',
  'Pest Control',
  'Legal & Accounting',
  'Advertising / Leasing',
  'Other Operating Expense',
];

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  property,
  financials,
  onUpdateProperty,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'income' | 'appliances' | 'expenses' | 'financing'>('all');
  const [showUnitDetails, setShowUnitDetails] = useState<boolean>((property.units && property.units.length > 1) || false);
  const [selectedApplianceUnit, setSelectedApplianceUnit] = useState<UnitRental | null>(null);

  // Quick Receipt upload & viewer states
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState<boolean>(false);
  const [viewerAppliance, setViewerAppliance] = useState<ApplianceItem | null>(null);
  const [viewerUnitName, setViewerUnitName] = useState<string>('');
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [uploadToastMessage, setUploadToastMessage] = useState<string | null>(null);

  const handleDirectCardUpload = (unitId: string, applianceId: string, file: File) => {
    if (file.size > 4.5 * 1024 * 1024) {
      alert('Receipt file is too large (max 4.5 MB). Please take a smaller photo or compress PDF.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const receiptData = {
        receiptUrl: dataUrl,
        receiptFileName: file.name,
        receiptFileType: file.type || 'image/jpeg',
        receiptFileSize: file.size,
        receiptUploadedAt: new Date().toISOString(),
      };
      handleSaveQuickReceipt(unitId, applianceId, receiptData);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQuickReceipt = (
    unitId: string,
    applianceId: string,
    receiptData: {
      receiptUrl: string;
      receiptFileName: string;
      receiptFileType: string;
      receiptFileSize: number;
      receiptUploadedAt: string;
    }
  ) => {
    let appName = 'Appliance';
    const updatedUnits = (property.units || []).map((u) => {
      if (u.id !== unitId) return u;
      const updatedAppliances = (u.appliances || []).map((a) => {
        if (a.id !== applianceId) return a;
        appName = a.name;
        return {
          ...a,
          ...receiptData,
          updatedAt: new Date().toISOString(),
        };
      });
      return { ...u, appliances: updatedAppliances };
    });

    onUpdateProperty({
      ...property,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });

    setUploadToastMessage(`Receipt uploaded and saved for ${appName}!`);
    setTimeout(() => {
      setUploadToastMessage((prev) => (prev ? null : prev));
    }, 4500);
  };

  const totalPropertyAppliancesCount = (property.units || []).reduce(
    (acc, u) => acc + (u.appliances || []).length,
    0
  );

  const handleUpdateApplianceUnit = (updatedUnit: UnitRental) => {
    handleUpdateUnit(updatedUnit.id, updatedUnit);
    setSelectedApplianceUnit(updatedUnit);
  };

  // Income updates
  const handleBaseRentChange = (val: number) => {
    const rentVal = Math.max(0, isNaN(val) ? 0 : val);
    let updatedUnits = property.units ? [...property.units] : [];
    if (updatedUnits.length <= 1) {
      if (updatedUnits.length === 0) {
        updatedUnits = [
          {
            id: `u-${Date.now()}`,
            name: 'Main Residence',
            rent: rentVal,
            isOccupied: true,
            appliances: [],
          },
        ];
      } else {
        updatedUnits[0] = { ...updatedUnits[0], rent: rentVal };
      }
    }
    // Automatically recalculate all percentage-of-rent expenses with new rent
    const updatedExpenses = (property.expenses || []).map((exp) => {
      if (exp.isPercentageOfRent && exp.percentageValue !== undefined) {
        return {
          ...exp,
          amount: Math.round((rentVal * exp.percentageValue) / 100),
        };
      }
      return exp;
    });

    onUpdateProperty({
      ...property,
      baseMonthlyRent: rentVal,
      units: updatedUnits,
      expenses: updatedExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleVacancyChange = (val: number) => {
    onUpdateProperty({
      ...property,
      vacancyRatePercent: val,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateTenantInfo = (updates: { 
    tenantName?: string; 
    tenantPhone?: string; 
    leaseStart?: string; 
    leaseEnd?: string;
    securityDeposit?: number;
    tenantNotes?: string;
  }) => {
    let updatedUnits = property.units ? [...property.units] : [];
    if (updatedUnits.length <= 1) {
      if (updatedUnits.length === 0) {
        updatedUnits = [
          {
            id: `u-${Date.now()}`,
            name: 'Main Residence',
            rent: property.baseMonthlyRent || 0,
            isOccupied: true,
            appliances: [],
            ...updates,
          },
        ];
      } else {
        updatedUnits[0] = {
          ...updatedUnits[0],
          ...updates,
          isOccupied: updates.tenantName !== undefined ? Boolean(updates.tenantName.trim()) : updatedUnits[0].isOccupied,
        };
      }
    } else {
      updatedUnits[0] = {
        ...updatedUnits[0],
        ...updates,
      };
    }

    onUpdateProperty({
      ...property,
      ...updates,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleQuickLeaseDuration = (months: number) => {
    let startD: Date;
    const curStart = property.leaseStart || property.units?.[0]?.leaseStart;
    if (curStart) {
      const parts = curStart.split('-');
      if (parts.length === 3) {
        startD = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        startD = new Date(curStart);
      }
    } else {
      startD = new Date();
    }

    const endD = new Date(startD);
    endD.setMonth(endD.getMonth() + months);
    endD.setDate(endD.getDate() - 1);
    const endY = endD.getFullYear();
    const endM = String(endD.getMonth() + 1).padStart(2, '0');
    const endDay = String(endD.getDate()).padStart(2, '0');

    const startY = startD.getFullYear();
    const startM = String(startD.getMonth() + 1).padStart(2, '0');
    const startDay = String(startD.getDate()).padStart(2, '0');

    handleUpdateTenantInfo({
      leaseStart: `${startY}-${startM}-${startDay}`,
      leaseEnd: `${endY}-${endM}-${endDay}`,
    });
  };

  const handleAddExtraIncome = () => {
    const newItem: ExtraIncomeItem = {
      id: `inc-${Date.now()}`,
      name: 'Pet Rent / Storage / Parking',
      amount: 50,
      frequency: 'monthly',
    };
    onUpdateProperty({
      ...property,
      extraIncomes: [...(property.extraIncomes || []), newItem],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateExtraIncome = (id: string, updates: Partial<ExtraIncomeItem>) => {
    const updated = (property.extraIncomes || []).map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    onUpdateProperty({
      ...property,
      extraIncomes: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteExtraIncome = (id: string) => {
    onUpdateProperty({
      ...property,
      extraIncomes: (property.extraIncomes || []).filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    });
  };

  // Unit details updates
  const handleAddUnit = () => {
    const unitIndex = (property.units || []).length + 1;
    const newUnit: UnitRental = {
      id: `u-${Date.now()}`,
      name: `Unit ${unitIndex}`,
      rent: 1200,
      isOccupied: true,
      tenantName: '',
    };
    const newUnits = [...(property.units || []), newUnit];
    const totalRent = newUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
    onUpdateProperty({
      ...property,
      unitsCount: newUnits.length,
      units: newUnits,
      baseMonthlyRent: totalRent,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateUnit = (id: string, updates: Partial<UnitRental>) => {
    const newUnits = (property.units || []).map((u) =>
      u.id === id ? { ...u, ...updates } : u
    );
    const totalRent = newUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
    onUpdateProperty({
      ...property,
      units: newUnits,
      baseMonthlyRent: totalRent,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteUnit = (id: string) => {
    const newUnits = (property.units || []).filter((u) => u.id !== id);
    const totalRent = newUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
    onUpdateProperty({
      ...property,
      unitsCount: Math.max(1, newUnits.length),
      units: newUnits,
      baseMonthlyRent: totalRent || property.baseMonthlyRent,
      updatedAt: new Date().toISOString(),
    });
  };

  // Expense updates
  const handleAddExpense = (cat: ExpenseCategory = 'Other Operating Expense') => {
    const grossRent =
      financials.grossScheduledIncomeMonthly > 0
        ? financials.grossScheduledIncomeMonthly
        : (property.baseMonthlyRent || 0);
    const isMgmt = cat === 'Property Management';
    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: cat,
      name: isMgmt ? 'Property Management (8%)' : cat,
      amount: isMgmt ? Math.round(grossRent * 0.08) : 100,
      frequency: 'monthly',
      isPercentageOfRent: isMgmt,
      percentageValue: isMgmt ? 8 : undefined,
    };
    onUpdateProperty({
      ...property,
      expenses: [...(property.expenses || []), newExp],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    const grossRent =
      financials.grossScheduledIncomeMonthly > 0
        ? financials.grossScheduledIncomeMonthly
        : (property.baseMonthlyRent || 0);

    const updated = (property.expenses || []).map((e) => {
      if (e.id !== id) return e;
      const merged = { ...e, ...updates };

      // If category switched to Property Management and isPercentageOfRent is undefined, auto-default to percentage
      if (updates.category === 'Property Management' && updates.isPercentageOfRent === undefined && !merged.isPercentageOfRent) {
        merged.isPercentageOfRent = true;
        merged.percentageValue = merged.percentageValue || 8;
        merged.name = merged.name === e.category ? `Property Management (${merged.percentageValue}%)` : merged.name;
        merged.amount = Math.round((grossRent * merged.percentageValue) / 100);
      }

      // If percentageValue is updated, calculate exact dollar amount
      if (merged.isPercentageOfRent && updates.percentageValue !== undefined) {
        merged.amount = Math.round((grossRent * (Number(updates.percentageValue) || 0)) / 100);
      }

      // If switched to percentage of rent
      if (updates.isPercentageOfRent === true) {
        const pct =
          updates.percentageValue ??
          (merged.percentageValue ||
            (grossRent > 0 && merged.amount > 0 ? parseFloat(((merged.amount / grossRent) * 100).toFixed(1)) : 8));
        merged.percentageValue = pct;
        merged.amount = Math.round((grossRent * pct) / 100);
      }

      // If switched to fixed dollar amount
      if (updates.isPercentageOfRent === false) {
        if (updates.amount === undefined && merged.percentageValue) {
          merged.amount = Math.round((grossRent * merged.percentageValue) / 100);
        }
      }

      return merged;
    });

    onUpdateProperty({
      ...property,
      expenses: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateProperty({
      ...property,
      expenses: (property.expenses || []).filter((e) => e.id !== id),
      updatedAt: new Date().toISOString(),
    });
  };

  // Quick Property Tax, HOA, and Property Management helpers
  const taxExpense = (property.expenses || []).find(
    (e) => e.category === 'Property Taxes' || e.name.toLowerCase().includes('tax')
  );
  const currentTaxAnnual = taxExpense
    ? taxExpense.frequency === 'monthly'
      ? (Number(taxExpense.amount) || 0) * 12
      : Number(taxExpense.amount) || 0
    : 0;

  const hoaExpense = (property.expenses || []).find(
    (e) => e.category === 'HOA / Condo Fees' || e.name.toLowerCase().includes('hoa')
  );
  const currentHoaMonthly = hoaExpense
    ? hoaExpense.frequency === 'annual'
      ? Math.round((Number(hoaExpense.amount) || 0) / 12)
      : Number(hoaExpense.amount) || 0
    : 0;

  const mgmtExpense = (property.expenses || []).find(
    (e) => e.category === 'Property Management' || e.name.toLowerCase().includes('management')
  );
  const currentGrossRent =
    financials.grossScheduledIncomeMonthly > 0
      ? financials.grossScheduledIncomeMonthly
      : (property.baseMonthlyRent || 0);

  const currentMgmtPercent = mgmtExpense
    ? (mgmtExpense.isPercentageOfRent && mgmtExpense.percentageValue !== undefined
        ? mgmtExpense.percentageValue
        : (currentGrossRent > 0 && mgmtExpense.amount > 0
            ? parseFloat(((mgmtExpense.amount / currentGrossRent) * 100).toFixed(1))
            : 0))
    : 0;

  const currentMgmtMonthly = mgmtExpense
    ? (mgmtExpense.isPercentageOfRent && mgmtExpense.percentageValue !== undefined
        ? (currentGrossRent * mgmtExpense.percentageValue) / 100
        : (mgmtExpense.frequency === 'annual' ? (Number(mgmtExpense.amount) || 0) / 12 : Number(mgmtExpense.amount) || 0))
    : 0;

  const handleQuickMgmtChange = (newPercent: number) => {
    const existingExpenses = [...(property.expenses || [])];
    const idx = existingExpenses.findIndex(
      (e) => e.category === 'Property Management' || e.name.toLowerCase().includes('management')
    );
    const calculatedMonthly = Math.round((currentGrossRent * newPercent) / 100);

    if (idx >= 0) {
      if (newPercent > 0) {
        existingExpenses[idx] = {
          ...existingExpenses[idx],
          category: 'Property Management',
          name: `Property Management (${newPercent}%)`,
          amount: calculatedMonthly,
          frequency: 'monthly',
          isPercentageOfRent: true,
          percentageValue: newPercent,
        };
      } else {
        existingExpenses[idx] = {
          ...existingExpenses[idx],
          category: 'Property Management',
          name: 'Self-Managed (0%)',
          amount: 0,
          frequency: 'monthly',
          isPercentageOfRent: true,
          percentageValue: 0,
        };
      }
    } else if (newPercent > 0) {
      existingExpenses.push({
        id: `exp-mgmt-${Date.now()}`,
        category: 'Property Management',
        name: `Property Management (${newPercent}%)`,
        amount: calculatedMonthly,
        frequency: 'monthly',
        isPercentageOfRent: true,
        percentageValue: newPercent,
      });
    }

    onUpdateProperty({
      ...property,
      expenses: existingExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleQuickTaxChange = (newAnnual: number) => {
    const existingExpenses = [...(property.expenses || [])];
    const idx = existingExpenses.findIndex(
      (e) => e.category === 'Property Taxes' || e.name.toLowerCase().includes('tax')
    );
    if (idx >= 0) {
      existingExpenses[idx] = {
        ...existingExpenses[idx],
        category: 'Property Taxes',
        amount: newAnnual,
        frequency: 'annual',
        isPercentageOfRent: false,
      };
    } else {
      existingExpenses.unshift({
        id: `exp-tax-${Date.now()}`,
        category: 'Property Taxes',
        name: 'Property Taxes',
        amount: newAnnual,
        frequency: 'annual',
        isPercentageOfRent: false,
      });
    }
    onUpdateProperty({
      ...property,
      expenses: existingExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleQuickHoaChange = (newMonthly: number) => {
    const existingExpenses = [...(property.expenses || [])];
    const idx = existingExpenses.findIndex(
      (e) => e.category === 'HOA / Condo Fees' || e.name.toLowerCase().includes('hoa')
    );
    if (idx >= 0) {
      if (newMonthly > 0) {
        existingExpenses[idx] = {
          ...existingExpenses[idx],
          category: 'HOA / Condo Fees',
          amount: newMonthly,
          frequency: 'monthly',
          isPercentageOfRent: false,
        };
      } else {
        existingExpenses.splice(idx, 1);
      }
    } else if (newMonthly > 0) {
      existingExpenses.push({
        id: `exp-hoa-${Date.now()}`,
        category: 'HOA / Condo Fees',
        name: 'HOA / Condo Dues',
        amount: newMonthly,
        frequency: 'monthly',
        isPercentageOfRent: false,
      });
    }
    onUpdateProperty({
      ...property,
      expenses: existingExpenses,
      updatedAt: new Date().toISOString(),
    });
  };

  // Preset bundle application
  const applyStandardIndustryExpenses = () => {
    const standardPreset: ExpenseItem[] = [
      {
        id: `exp-${Date.now()}-tax`,
        category: 'Property Taxes',
        name: 'Annual Property Tax (Est. 1.2%)',
        amount: Math.round((property.purchasePrice || 300000) * 0.012),
        frequency: 'annual',
        isPercentageOfRent: false,
      },
      {
        id: `exp-${Date.now()}-ins`,
        category: 'Property Insurance',
        name: 'Hazard & Landlord Insurance',
        amount: 1400,
        frequency: 'annual',
        isPercentageOfRent: false,
      },
      {
        id: `exp-${Date.now()}-mgmt`,
        category: 'Property Management',
        name: 'Property Management (8%)',
        amount: 0,
        frequency: 'monthly',
        isPercentageOfRent: true,
        percentageValue: 8,
      },
      {
        id: `exp-${Date.now()}-maint`,
        category: 'Repairs & Maintenance',
        name: 'Maintenance & Repairs (5%)',
        amount: 0,
        frequency: 'monthly',
        isPercentageOfRent: true,
        percentageValue: 5,
      },
      {
        id: `exp-${Date.now()}-capex`,
        category: 'Capital Expenditures (CapEx)',
        name: 'CapEx Major Replacement Reserve (5%)',
        amount: 0,
        frequency: 'monthly',
        isPercentageOfRent: true,
        percentageValue: 5,
      },
    ];

    onUpdateProperty({
      ...property,
      expenses: standardPreset,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Section Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161A23] p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'all'
                ? 'bg-slate-700 text-white'
                : 'bg-[#11141B] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            All Sections
          </button>
          <button
            onClick={() => setActiveSection('income')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'income'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#11141B] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            1. Rental Income ({formatCurrency(financials.grossScheduledIncomeMonthly)}/mo)
          </button>
          <button
            onClick={() => setActiveSection('expenses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'expenses'
                ? 'bg-rose-600 text-white'
                : 'bg-[#11141B] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            2. Operating Expenses ({formatCurrency(financials.operatingExpensesMonthly)}/mo)
          </button>
          <button
            onClick={() => setActiveSection('appliances')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'appliances'
                ? 'bg-blue-600 text-white'
                : 'bg-[#11141B] text-blue-400 hover:bg-slate-800 hover:text-blue-300 border border-slate-800/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Unit Appliances & Warranties ({totalPropertyAppliancesCount})</span>
          </button>
          <button
            onClick={() => setActiveSection('financing')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'financing'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#11141B] text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            4. Purchase & Financing ({property.hasMortgage ? `${formatCurrency(financials.monthlyMortgagePI)}/mo` : 'Cash'})
          </button>
        </div>

        <div className="text-xs font-medium text-slate-500">
          Auto-saves in real-time
        </div>
      </div>

      {/* 1. RENTAL INCOME SECTION */}
      {(activeSection === 'all' || activeSection === 'income') && (
        <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-[#11141B] px-5 sm:px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Rental Income Streams</h3>
                <p className="text-xs text-slate-400">Gross scheduled rents, vacancy rate allowance & auxiliary revenues</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Effective Gross Income</span>
              <span className="text-lg font-bold text-emerald-400">
                {formatCurrency(financials.effectiveGrossIncomeMonthly)}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Rent Mode Switch */}
            <div className="flex items-center justify-between bg-[#11141B] p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">
                  {showUnitDetails ? 'Itemized Multi-Unit Rent Schedule' : 'Single Consolidated Monthly Rent'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowUnitDetails(!showUnitDetails)}
                className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {showUnitDetails ? 'Switch to Simple Rent' : 'Split into Multiple Units'}
              </button>
            </div>

            {/* If Single Rent */}
            {!showUnitDetails ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Monthly Gross Rent ($)
                    </label>
                    <div className="relative rounded-lg">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        $
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={isNaN(property.baseMonthlyRent) ? '' : (property.baseMonthlyRent || '')}
                        onChange={(e) => handleBaseRentChange(parseFloat(e.target.value) || 0)}
                        placeholder="2400"
                        className="block w-full pl-8 pr-16 py-2.5 text-sm font-semibold text-white bg-[#0E121A] border border-slate-800 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-600"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-slate-400">
                        / month
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Annual: <strong className="text-slate-300">{formatCurrency((property.baseMonthlyRent || 0) * 12)}/year</strong>
                    </span>
                  </div>

                  {/* Vacancy Rate Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Estimated Vacancy & Credit Loss (%)
                      </label>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {property.vacancyRatePercent || 0}% ({formatCurrency(financials.vacancyLossMonthly)}/mo)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={isNaN(property.vacancyRatePercent) ? 0 : (property.vacancyRatePercent || 0)}
                      onChange={(e) => handleVacancyChange(parseFloat(e.target.value) || 0)}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>0% (Full occupancy)</span>
                      <span>5% (Industry standard)</span>
                      <span>10%</span>
                      <span>20%</span>
                    </div>
                  </div>
                </div>

                {/* Active Tenant & Lease Agreement in Single Rent Mode */}
                <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Active Tenant & Lease Information
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickLeaseDuration(12)}
                        className="px-2 py-0.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors"
                      >
                        1-Year Lease
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLeaseDuration(6)}
                        className="px-2 py-0.5 text-[11px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-md transition-colors"
                      >
                        6-Month Lease
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Tenant Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        Tenant Full Name
                      </label>
                      <input
                        type="text"
                        value={property.tenantName || property.units?.[0]?.tenantName || ''}
                        onChange={(e) => handleUpdateTenantInfo({ tenantName: e.target.value })}
                        placeholder="e.g. Sarah & David Miller"
                        className="w-full text-xs font-semibold text-white bg-[#0E121A] px-2.5 py-1.5 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                      />
                    </div>

                    {/* Tenant Phone */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={property.tenantPhone || property.units?.[0]?.tenantPhone || ''}
                        onChange={(e) => handleUpdateTenantInfo({ tenantPhone: e.target.value })}
                        placeholder="e.g. (217) 555-0192"
                        className="w-full text-xs font-semibold text-white bg-[#0E121A] px-2.5 py-1.5 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                      />
                    </div>

                    {/* Lease Start Date */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        Lease Start Date
                      </label>
                      <input
                        type="date"
                        value={property.leaseStart || property.units?.[0]?.leaseStart || ''}
                        onChange={(e) => handleUpdateTenantInfo({ leaseStart: e.target.value })}
                        className="w-full text-xs font-semibold text-white bg-[#0E121A] px-2.5 py-1.5 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Lease Expiration Date */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-rose-400" />
                        Lease Expiration Date
                      </label>
                      <input
                        type="date"
                        value={property.leaseEnd || property.units?.[0]?.leaseEnd || ''}
                        onChange={(e) => handleUpdateTenantInfo({ leaseEnd: e.target.value })}
                        className="w-full text-xs font-semibold text-white bg-[#0E121A] px-2.5 py-1.5 border border-slate-800 rounded-lg focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Security Deposit and Notes Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2.5 border-t border-slate-800/60">
                    {/* Security Deposit */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-emerald-400" />
                          Security Deposit ($)
                        </label>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleUpdateTenantInfo({ securityDeposit: property.baseMonthlyRent || 0 })}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                            title="Set to 1 month rent"
                          >
                            1-Mo
                          </button>
                          <span className="text-slate-600">&bull;</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateTenantInfo({ securityDeposit: 0 })}
                            className="text-slate-400 hover:text-slate-200 cursor-pointer"
                            title="Waived ($0)"
                          >
                            $0
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={
                            property.securityDeposit !== undefined 
                              ? (isNaN(property.securityDeposit) ? '' : property.securityDeposit) 
                              : (property.units?.[0]?.securityDeposit !== undefined ? property.units[0].securityDeposit : '')
                          }
                          onChange={(e) => handleUpdateTenantInfo({ securityDeposit: parseFloat(e.target.value) || 0 })}
                          placeholder="e.g. 2400"
                          className="w-full text-xs font-semibold text-white bg-[#0E121A] pl-6 pr-2.5 py-1.5 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Refundable damage / escrow deposit
                      </span>
                    </div>

                    {/* Tenant & Lease Notes */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-blue-400" />
                          Tenant & Lease Agreement Notes
                        </label>
                        <span className="text-[10px] text-slate-500">
                          Pet agreement, deposit terms, parking, emergency contacts
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={property.tenantNotes || property.units?.[0]?.tenantNotes || ''}
                        onChange={(e) => handleUpdateTenantInfo({ tenantNotes: e.target.value })}
                        placeholder="e.g. Security deposit held in dedicated escrow account. 2 dogs approved with pet rent. Assigned parking space #4B. Move-in walkthrough signed."
                        className="w-full text-xs text-white bg-[#0E121A] px-2.5 py-1.5 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 placeholder-slate-600 resize-y"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Itemized Units Schedule */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Property Units ({property.units?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Unit
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(property.units || []).map((unit, idx) => (
                    <div
                      key={unit.id}
                      className="p-3 rounded-xl border border-slate-800 bg-[#11141B] space-y-2.5"
                    >
                      {/* Top Row: Unit Name, Tenant Name, Rent, Occupied & Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        <div className="w-full sm:w-36">
                          <input
                            type="text"
                            value={unit.name}
                            onChange={(e) => handleUpdateUnit(unit.id, { name: e.target.value })}
                            placeholder={`Unit ${idx + 1}`}
                            className="text-xs font-semibold text-white bg-[#0E121A] px-2.5 py-1.5 border border-slate-800 rounded-md w-full focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={unit.tenantName || ''}
                            onChange={(e) => handleUpdateUnit(unit.id, { tenantName: e.target.value })}
                            placeholder="Tenant full name"
                            className="text-xs text-slate-200 bg-[#0E121A] px-2.5 py-1.5 border border-slate-800 rounded-md w-full focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
                          />
                        </div>

                        <div className="relative w-full sm:w-32">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={isNaN(unit.rent) ? '' : (unit.rent || '')}
                            onChange={(e) => handleUpdateUnit(unit.id, { rent: parseFloat(e.target.value) || 0 })}
                            placeholder="Rent"
                            className="text-xs font-semibold text-white bg-[#0E121A] pl-6 pr-2 py-1.5 border border-slate-800 rounded-md w-full focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex items-center justify-between sm:justify-start gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={unit.isOccupied}
                              onChange={(e) => handleUpdateUnit(unit.id, { isOccupied: e.target.checked })}
                              className="rounded text-emerald-500 focus:ring-emerald-500 bg-[#0E121A] border-slate-700"
                            />
                            <span>Occupied</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setSelectedApplianceUnit(unit)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-md transition-colors cursor-pointer"
                            title="View and manage appliances bought date and warranty information"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{unit.appliances && unit.appliances.length > 0 ? `${unit.appliances.length} Appl` : '+ Appliance'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUnit(unit.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                            title="Remove Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Second Row: Tenant Phone, Lease Start, Lease Expiration */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5 border-t border-slate-800/60 text-xs">
                        <div className="flex items-center gap-1.5 bg-[#0E121A] px-2.5 py-1 rounded-md border border-slate-800/80">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <input
                            type="tel"
                            value={unit.tenantPhone || ''}
                            onChange={(e) => handleUpdateUnit(unit.id, { tenantPhone: e.target.value })}
                            placeholder="Phone number"
                            className="bg-transparent text-slate-200 text-xs w-full focus:outline-none placeholder-slate-600"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#0E121A] px-2.5 py-1 rounded-md border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold shrink-0">Start:</span>
                          <input
                            type="date"
                            value={unit.leaseStart || ''}
                            onChange={(e) => handleUpdateUnit(unit.id, { leaseStart: e.target.value })}
                            className="bg-transparent text-slate-200 text-xs w-full focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#0E121A] px-2.5 py-1 rounded-md border border-slate-800/80">
                          <span className="text-[10px] text-rose-400/80 uppercase font-semibold shrink-0">Expires:</span>
                          <input
                            type="date"
                            value={unit.leaseEnd || ''}
                            onChange={(e) => handleUpdateUnit(unit.id, { leaseEnd: e.target.value })}
                            className="bg-transparent text-slate-200 text-xs w-full focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vacancy Rate Slider under units */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Vacancy Allowance (%)
                    </label>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {property.vacancyRatePercent || 0}% ({formatCurrency(financials.vacancyLossMonthly)}/mo)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={isNaN(property.vacancyRatePercent) ? 0 : (property.vacancyRatePercent || 0)}
                    onChange={(e) => handleVacancyChange(parseFloat(e.target.value) || 0)}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Extra Auxiliary Income Streams */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Additional Income Sources (Parking, Storage, Pet Rent, Laundry)
                  </h4>
                  <p className="text-[11px] text-slate-500">Add ancillary recurring revenue items</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExtraIncome}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Income Stream
                </button>
              </div>

              {(property.extraIncomes || []).length === 0 ? (
                <div className="text-center py-3 bg-[#11141B] rounded-xl border border-dashed border-slate-800 text-xs text-slate-500">
                  No additional income streams configured. (Optional)
                </div>
              ) : (
                <div className="space-y-2">
                  {(property.extraIncomes || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg border border-slate-800 bg-[#11141B]"
                    >
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateExtraIncome(item.id, { name: e.target.value })}
                        placeholder="Income description (e.g. Pet Fee)"
                        className="text-xs text-white bg-[#0E121A] px-2 py-1.5 border border-slate-800 rounded-md flex-1 focus:ring-1 focus:ring-emerald-500 placeholder-slate-600"
                      />

                      <div className="relative w-full sm:w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          min="0"
                          value={isNaN(item.amount) ? '' : (item.amount || '')}
                          onChange={(e) =>
                            handleUpdateExtraIncome(item.id, { amount: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="Amount"
                          className="text-xs font-semibold text-white bg-[#0E121A] pl-5 pr-2 py-1.5 border border-slate-800 rounded-md w-full focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <select
                        value={item.frequency}
                        onChange={(e) =>
                          handleUpdateExtraIncome(item.id, { frequency: e.target.value as 'monthly' | 'annual' })
                        }
                        className="text-xs text-slate-300 px-2 py-1.5 border border-slate-800 rounded-md bg-[#0E121A]"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteExtraIncome(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. OPERATING EXPENSES SECTION */}
      {(activeSection === 'all' || activeSection === 'expenses') && (
        <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-[#11141B] px-5 sm:px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Operating Expenses (OpEx)</h3>
                <p className="text-xs text-slate-400">Taxes, Insurance, Management, Reserves & Maintenance (Schedule E Compatible)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Monthly Expenses</span>
              <span className="text-lg font-bold text-rose-400">
                {formatCurrency(financials.operatingExpensesMonthly)}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Quick Overheads Tuning Cards: Property Tax, HOA & Property Management */}
            <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-rose-400" />
                  Key Fixed Property Escrows & Overhead Tuners
                </span>
                <span className="text-[11px] text-slate-400">Directly configured for {property.name}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Property Taxes Quick Tuner */}
                <div className="bg-[#161A23] p-3 rounded-lg border border-rose-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      Annual Property Tax
                    </label>
                    <span className="text-[11px] text-rose-400 font-bold">
                      {formatCurrency(currentTaxAnnual / 12)} / month
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={isNaN(currentTaxAnnual) ? '' : (currentTaxAnnual || '')}
                      onChange={(e) => handleQuickTaxChange(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 3600"
                      className="w-full text-xs font-bold text-white bg-[#0E121A] pl-7 pr-16 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 placeholder-slate-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">/ yr</span>
                  </div>
                </div>

                {/* HOA / Condo Fees Quick Tuner */}
                <div className="bg-[#161A23] p-3 rounded-lg border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Monthly HOA / Condo Fee
                    </label>
                    <span className="text-[11px] text-amber-400 font-bold">
                      {currentHoaMonthly > 0 ? `${formatCurrency(currentHoaMonthly * 12)} / year` : 'No HOA ($0)'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={isNaN(currentHoaMonthly) ? '' : (currentHoaMonthly || '')}
                      onChange={(e) => handleQuickHoaChange(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-xs font-bold text-white bg-[#0E121A] pl-7 pr-16 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder-slate-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">/ mo</span>
                  </div>
                </div>

                {/* Property Management Quick Tuner */}
                <div className="bg-[#161A23] p-3 rounded-lg border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      Property Management Fee
                    </label>
                    <span className="text-[11px] text-purple-400 font-bold">
                      {currentMgmtMonthly > 0
                        ? `${formatCurrency(currentMgmtMonthly)} / mo`
                        : 'Self-Managed ($0)'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={isNaN(currentMgmtPercent) ? '' : (currentMgmtPercent || '')}
                      onChange={(e) => handleQuickMgmtChange(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 8"
                      className="w-full text-xs font-bold text-white bg-[#0E121A] pl-3 pr-20 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 placeholder-slate-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold">
                      % of Rent
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <span className="text-[10px] text-slate-400">Presets:</span>
                    <div className="flex items-center gap-1">
                      {[0, 6, 8, 10, 12].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleQuickMgmtChange(pct)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                            currentMgmtPercent === pct
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {pct === 0 ? '0% Self' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddExpense('Property Taxes')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  Add Custom Expense
                </button>

                <button
                  type="button"
                  onClick={applyStandardIndustryExpenses}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-colors"
                  title="Apply recommended bundle: 1.2% Property Tax, Insurance, 8% Management, 5% Maintenance, 5% CapEx"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Standard Pro-Forma Bundle
                </button>
              </div>

              <div className="text-xs text-slate-400 font-medium">
                {property.expenses?.length || 0} itemized expenses
              </div>
            </div>

            {/* Expenses List */}
            <div className="space-y-3">
              {(property.expenses || []).map((item) => {
                const isPct = item.isPercentageOfRent;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-[#11141B] hover:border-slate-700 transition-all space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3"
                  >
                    {/* Category Selector */}
                    <div className="w-full sm:w-44">
                      <select
                        value={item.category}
                        onChange={(e) =>
                          handleUpdateExpense(item.id, {
                            category: e.target.value as ExpenseCategory,
                            name: item.name === item.category ? e.target.value : item.name,
                          })
                        }
                        className="w-full text-xs font-semibold text-slate-200 bg-[#0E121A] border border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-rose-500"
                      >
                        {EXPENSE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expense Name / Description */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateExpense(item.id, { name: e.target.value })}
                        placeholder="Expense description"
                        className="w-full text-xs text-white bg-[#0E121A] border border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-rose-500 placeholder-slate-600"
                      />
                    </div>

                    {/* Type Toggle: Fixed $ vs % of Rent */}
                    <div className="flex items-center gap-1 bg-[#0E121A] border border-slate-800 p-0.5 rounded-lg shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateExpense(item.id, { isPercentageOfRent: false })}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${
                          !isPct ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        $ Fixed
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateExpense(item.id, {
                            isPercentageOfRent: true,
                            percentageValue: item.percentageValue || 5,
                          })
                        }
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${
                          isPct ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        % of Rent
                      </button>
                    </div>

                    {/* Amount Input */}
                    {!isPct ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={isNaN(item.amount) ? '' : (item.amount || '')}
                            onChange={(e) =>
                              handleUpdateExpense(item.id, { amount: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="Amount"
                            className="w-full text-xs font-semibold text-white pl-5 pr-2 py-2 border border-slate-800 rounded-lg bg-[#0E121A] focus:ring-1 focus:ring-rose-500"
                          />
                        </div>

                        <select
                          value={item.frequency}
                          onChange={(e) =>
                            handleUpdateExpense(item.id, { frequency: e.target.value as 'monthly' | 'annual' })
                          }
                          className="text-xs text-slate-200 bg-[#0E121A] border border-slate-800 rounded-lg p-2"
                        >
                          <option value="monthly">/mo</option>
                          <option value="annual">/yr</option>
                        </select>

                        {item.category === 'Property Management' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateExpense(item.id, {
                                isPercentageOfRent: true,
                                percentageValue:
                                  currentGrossRent > 0 && item.amount > 0
                                    ? parseFloat(((item.amount / currentGrossRent) * 100).toFixed(1))
                                    : 8,
                              })
                            }
                            className="text-[10px] text-purple-400 hover:text-purple-300 underline font-medium whitespace-nowrap"
                            title="Switch to automatic % calculation of rent"
                          >
                            Auto %
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative w-24">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={isNaN(Number(item.percentageValue)) ? 8 : (item.percentageValue ?? 8)}
                            onChange={(e) =>
                              handleUpdateExpense(item.id, { percentageValue: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full text-xs font-semibold text-white pl-3 pr-6 py-2 border border-slate-800 rounded-lg bg-[#0E121A] focus:ring-1 focus:ring-rose-500"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="text-xs font-bold text-rose-400 block">
                            = {formatCurrency(Math.round((currentGrossRent * (item.percentageValue || 0)) / 100))}/mo
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            of {formatCurrency(currentGrossRent)} rent
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-rose-500/10 self-end sm:self-center"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* OpEx Summary Summary Card */}
            <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-white">
                  Operating Expense Ratio (OER): <span className="text-rose-400">{formatPercent(financials.operatingExpenseRatioPercent, 1)}</span>
                </div>
                <div className="text-slate-400">
                  50% Rule Benchmark Estimate: <span className="text-slate-300">{formatCurrency(financials.fiftyPercentRuleEstimateExpense)}/mo</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-slate-400 block">Monthly OpEx</span>
                  <span className="text-sm font-bold text-rose-400">{formatCurrency(financials.operatingExpensesMonthly)}</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-400 block">Annual OpEx</span>
                  <span className="text-sm font-bold text-rose-400">{formatCurrency(financials.operatingExpensesAnnual)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. UNIT APPLIANCES & WARRANTIES SECTION */}
      {(activeSection === 'all' || activeSection === 'appliances') && (
        <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-[#11141B] px-5 sm:px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Unit Appliances & Warranties</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {totalPropertyAppliancesCount} Items Tracked
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Track purchase dates, serial numbers, warranty terms, and service providers for each unit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  let targetUnit = property.units?.[0];
                  if (!targetUnit) {
                    targetUnit = {
                      id: `u-${Date.now()}`,
                      name: 'Main Residence',
                      rent: property.baseMonthlyRent,
                      isOccupied: true,
                      appliances: [],
                    };
                    onUpdateProperty({ ...property, units: [targetUnit] });
                  }
                  setIsQuickUploadOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-sm transition-colors cursor-pointer"
                title="Upload purchase receipt or warranty document"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>+ Upload Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  let targetUnit = property.units?.[0];
                  if (!targetUnit) {
                    targetUnit = {
                      id: `u-${Date.now()}`,
                      name: 'Main Residence',
                      rent: property.baseMonthlyRent,
                      isOccupied: true,
                      appliances: [],
                    };
                    onUpdateProperty({ ...property, units: [targetUnit] });
                  }
                  setSelectedApplianceUnit(targetUnit);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add / Manage Appliances</span>
              </button>
            </div>
          </div>

          {/* Success Toast Banner */}
          {uploadToastMessage && (
            <div className="mx-5 sm:mx-6 mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadToastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadToastMessage(null)}
                className="p-1 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-4">
            {totalPropertyAppliancesCount === 0 ? (
              <div className="bg-[#11141B] border border-dashed border-slate-800 rounded-xl p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Appliances Logged for this Property</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Record refrigerators, dishwashers, HVAC, water heaters, and washers/dryers to track warranty expirations and store policy numbers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    let targetUnit = property.units?.[0];
                    if (!targetUnit) {
                      targetUnit = {
                        id: `u-${Date.now()}`,
                        name: 'Main Residence',
                        rent: property.baseMonthlyRent,
                        isOccupied: true,
                        appliances: [],
                      };
                      onUpdateProperty({ ...property, units: [targetUnit] });
                    }
                    setSelectedApplianceUnit(targetUnit);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Appliance</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(property.units || []).map((unit) => {
                  const unitAppliances = unit.appliances || [];
                  if (unitAppliances.length === 0) return null;

                  return (
                    <div key={unit.id} className="bg-[#11141B] border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-bold text-white">{unit.name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            {unitAppliances.length} {unitAppliances.length === 1 ? 'appliance' : 'appliances'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedApplianceUnit(unit)}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                        >
                          Manage Unit Appliances &rarr;
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unitAppliances.map((app) => {
                          const isLifetime = app.warrantyType === 'Lifetime';
                          const hasExp = app.hasWarranty && !isLifetime && app.warrantyExpirationDate;
                          const expDate = hasExp ? new Date(app.warrantyExpirationDate!) : null;
                          const isExpiringSoon = expDate ? (expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 60 && (expDate.getTime() - Date.now()) >= 0 : false;
                          const isExpired = expDate ? expDate.getTime() < Date.now() : false;

                          return (
                            <div
                              key={app.id}
                              onClick={() => setSelectedApplianceUnit(unit)}
                              className="bg-[#0E121A] border border-slate-800/90 hover:border-blue-500/40 p-3 rounded-xl cursor-pointer transition-colors space-y-2 group"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div>
                                  <h5 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                                    {app.name}
                                  </h5>
                                  <span className="text-[11px] text-slate-400">
                                    {app.brand || 'Unspecified'} {app.modelNumber && `• ${app.modelNumber}`}
                                  </span>
                                </div>
                                {app.hasWarranty ? (
                                  isLifetime ? (
                                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                      Lifetime
                                    </span>
                                  ) : isExpired ? (
                                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                      Expired
                                    </span>
                                  ) : isExpiringSoon ? (
                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                      Expiring Soon
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                      Warranty Active
                                    </span>
                                  )
                                ) : (
                                  <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                    No Warranty
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-400 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span>Bought: {app.boughtDate || 'N/A'}</span>
                                  {app.purchasePrice && (
                                    <span className="font-semibold text-slate-200">{formatCurrency(app.purchasePrice)}</span>
                                  )}
                                </div>
                                {app.serialNumber && (
                                  <div className="font-mono text-[10px] text-slate-400 truncate">
                                    SN: {app.serialNumber}
                                  </div>
                                )}
                              </div>

                              {/* Receipt Status Bar with 1-Click Upload and View */}
                              {app.receiptUrl ? (
                                <div 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewerAppliance(app);
                                      setViewerUnitName(unit.name);
                                      setIsViewerOpen(true);
                                    }}
                                    className="text-emerald-400 font-bold flex items-center gap-1.5 hover:text-emerald-300 transition-colors cursor-pointer"
                                    title="View full receipt"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Receipt Saved (View)</span>
                                  </button>
                                  <label 
                                    className="text-slate-400 hover:text-white font-medium cursor-pointer flex items-center gap-1 text-[10px] bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors" 
                                    title="Replace receipt"
                                  >
                                    <span>Replace</span>
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDirectCardUpload(unit.id, app.id, file);
                                      }}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <div 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]"
                                >
                                  <span className="text-slate-500 italic text-[10px]">No receipt document</span>
                                  <label 
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-2.5 py-1 rounded-md cursor-pointer transition-colors shadow-xs"
                                    title="Choose receipt image or PDF"
                                  >
                                    <UploadCloud className="w-3 h-3" />
                                    <span>Upload Receipt</span>
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDirectCardUpload(unit.id, app.id, file);
                                      }}
                                    />
                                  </label>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PURCHASE & FINANCING (MORTGAGE) SECTION */}
      {(activeSection === 'all' || activeSection === 'financing') && (
        <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-[#11141B] px-5 sm:px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Purchase Price & Financing (Debt Service)</h3>
                <p className="text-xs text-slate-400">Loan principal, interest rate, down payment & initial capital investment</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Monthly Debt Service (P&I)</span>
              <span className="text-lg font-bold text-blue-400">
                {property.hasMortgage ? formatCurrency(financials.monthlyMortgagePI) : '$0'}
                <span className="text-xs font-normal text-slate-500">/mo</span>
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Purchase Price & Valuation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purchase Price ($)
                </label>
                <div className="relative rounded-lg">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={isNaN(property.purchasePrice) ? '' : (property.purchasePrice || '')}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateProperty({
                        ...property,
                        purchasePrice: val,
                        downPaymentAmount: val * ((property.downPaymentPercent || 20) / 100),
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    placeholder="300000"
                    className="block w-full pl-7 pr-3 py-2 text-xs font-semibold text-white bg-[#0E121A] border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Market Valuation ($)
                </label>
                <div className="relative rounded-lg">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={isNaN(property.currentValuation || property.purchasePrice) ? '' : (property.currentValuation || property.purchasePrice || '')}
                    onChange={(e) =>
                      onUpdateProperty({
                        ...property,
                        currentValuation: parseFloat(e.target.value) || 0,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                    placeholder="320000"
                    className="block w-full pl-7 pr-3 py-2 text-xs font-semibold text-white bg-[#0E121A] border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Closing Costs ($)
                </label>
                <div className="relative rounded-lg">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={isNaN(property.closingCosts) ? '' : (property.closingCosts || '')}
                    onChange={(e) =>
                      onUpdateProperty({
                        ...property,
                        closingCosts: parseFloat(e.target.value) || 0,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                    placeholder="6000"
                    className="block w-full pl-7 pr-3 py-2 text-xs font-semibold text-white bg-[#0E121A] border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Make-Ready / Repairs ($)
                </label>
                <div className="relative rounded-lg">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={isNaN(property.initialRepairCosts) ? '' : (property.initialRepairCosts || '')}
                    onChange={(e) =>
                      onUpdateProperty({
                        ...property,
                        initialRepairCosts: parseFloat(e.target.value) || 0,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                    placeholder="5000"
                    className="block w-full pl-7 pr-3 py-2 text-xs font-semibold text-white bg-[#0E121A] border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Mortgage Toggle */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={property.hasMortgage}
                    onChange={(e) =>
                      onUpdateProperty({
                        ...property,
                        hasMortgage: e.target.checked,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                    className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-[#0E121A] border-slate-700"
                  />
                  <span>Property has an active Mortgage / Loan</span>
                </label>
                {!property.hasMortgage && (
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    100% Cash / Debt-Free Asset
                  </span>
                )}
              </div>

              {property.hasMortgage && (
                <div className="p-4 bg-[#11141B] rounded-xl border border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Down Payment % and $ */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Down Payment (%)
                      </label>
                      <div className="relative rounded-lg">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={isNaN(property.downPaymentPercent) ? 20 : (property.downPaymentPercent || 20)}
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value) || 0;
                            const amt = (property.purchasePrice || 0) * (pct / 100);
                            onUpdateProperty({
                              ...property,
                              downPaymentPercent: pct,
                              downPaymentAmount: amt,
                              updatedAt: new Date().toISOString(),
                            });
                          }}
                          className="block w-full pl-3 pr-7 py-2 text-xs font-semibold text-white border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 bg-[#0E121A]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        = <strong className="text-slate-200">{formatCurrency(property.downPaymentAmount || (property.purchasePrice * 0.2))}</strong>
                      </span>
                    </div>

                    {/* Interest Rate */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Annual Interest Rate (%)
                      </label>
                      <div className="relative rounded-lg">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={isNaN(property.interestRate) ? 6.5 : (property.interestRate || 6.5)}
                          onChange={(e) =>
                            onUpdateProperty({
                              ...property,
                              interestRate: parseFloat(e.target.value) || 0,
                              updatedAt: new Date().toISOString(),
                            })
                          }
                          className="block w-full pl-3 pr-7 py-2 text-xs font-semibold text-white border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 bg-[#0E121A]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                      </div>
                    </div>

                    {/* Loan Term */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Loan Term (Years)
                      </label>
                      <select
                        value={isNaN(property.loanTermYears) ? 30 : (property.loanTermYears || 30)}
                        onChange={(e) =>
                          onUpdateProperty({
                            ...property,
                            loanTermYears: parseInt(e.target.value) || 30,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="block w-full px-3 py-2 text-xs font-semibold text-white border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 bg-[#0E121A]"
                      >
                        <option value={30}>30 Years (Fixed)</option>
                        <option value={25}>25 Years (Fixed)</option>
                        <option value={20}>20 Years (Fixed)</option>
                        <option value={15}>15 Years (Fixed)</option>
                        <option value={10}>10 Years (Commercial)</option>
                      </select>
                    </div>

                    {/* Loan Amount summary */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Calculated Loan Principal
                      </label>
                      <div className="p-2 bg-[#0E121A] rounded-lg border border-slate-800 text-xs font-bold text-white">
                        {formatCurrency(financials.loanAmount)}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Monthly P&I: <strong className="text-blue-400">{formatCurrency(financials.monthlyMortgagePI)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Manual Mortgage Override Checkbox */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80">
                    <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={property.mortgageManualOverride}
                        onChange={(e) =>
                          onUpdateProperty({
                            ...property,
                            mortgageManualOverride: e.target.checked,
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="rounded text-blue-500 focus:ring-blue-500 bg-[#0E121A] border-slate-700"
                      />
                      <span>Override with custom monthly payment amount (e.g. including private escrow)</span>
                    </label>

                    {property.mortgageManualOverride && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Custom Payment:</span>
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={isNaN(property.monthlyMortgageAmount) ? '' : (property.monthlyMortgageAmount || '')}
                            onChange={(e) =>
                              onUpdateProperty({
                                ...property,
                                monthlyMortgageAmount: parseFloat(e.target.value) || 0,
                                updatedAt: new Date().toISOString(),
                              })
                            }
                            className="w-full pl-5 pr-2 py-1 text-xs font-semibold text-white border border-slate-800 rounded bg-[#0E121A]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unit Appliances & Warranties Modal */}
      {selectedApplianceUnit && (
        <UnitAppliancesModal
          property={property}
          unit={selectedApplianceUnit}
          isOpen={true}
          onClose={() => setSelectedApplianceUnit(null)}
          onUpdateUnit={handleUpdateApplianceUnit}
        />
      )}

      {/* Quick Standalone Receipt Upload Modal */}
      <QuickReceiptUploadModal
        isOpen={isQuickUploadOpen}
        onClose={() => setIsQuickUploadOpen(false)}
        property={property}
        onSaveReceipt={(unitId, applianceId, receiptData) => {
          handleSaveQuickReceipt(unitId, applianceId, receiptData);
        }}
      />

      {/* Receipt & Warranty Document Viewer Modal */}
      <ReceiptViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewerAppliance(null);
        }}
        appliance={viewerAppliance}
        unitName={viewerUnitName}
        propertyName={property.name}
        onDeleteReceipt={() => {
          if (!viewerAppliance) return;
          const targetUnit = (property.units || []).find((u) =>
            (u.appliances || []).some((a) => a.id === viewerAppliance.id)
          );
          if (!targetUnit) return;

          const updatedUnits = (property.units || []).map((u) => {
            if (u.id !== targetUnit.id) return u;
            const updatedAppliances = (u.appliances || []).map((a) => {
              if (a.id !== viewerAppliance.id) return a;
              return {
                ...a,
                receiptUrl: undefined,
                receiptFileName: undefined,
                receiptFileType: undefined,
                receiptFileSize: undefined,
                receiptUploadedAt: undefined,
                updatedAt: new Date().toISOString(),
              };
            });
            return { ...u, appliances: updatedAppliances };
          });

          onUpdateProperty({
            ...property,
            units: updatedUnits,
            updatedAt: new Date().toISOString(),
          });

          setIsViewerOpen(false);
          setViewerAppliance(null);
          setUploadToastMessage('Receipt removed.');
          setTimeout(() => setUploadToastMessage(null), 3000);
        }}
        onReplaceReceipt={(file: File) => {
          if (!viewerAppliance) return;
          const targetUnit = (property.units || []).find((u) =>
            (u.appliances || []).some((a) => a.id === viewerAppliance.id)
          );
          if (!targetUnit) return;
          handleDirectCardUpload(targetUnit.id, viewerAppliance.id, file);
          setIsViewerOpen(false);
          setViewerAppliance(null);
        }}
      />
    </div>
  );
};
