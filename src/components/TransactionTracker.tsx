import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileDown, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Receipt,
  Tag,
  CheckCircle2,
  DollarSign,
  Wrench,
  Home,
  Hammer,
  Sparkles,
  Building2
} from 'lucide-react';
import { Property, Transaction, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/calculations';
import { exportToCSV } from '../utils/storage';

interface TransactionTrackerProps {
  property: Property;
  allProperties?: Property[];
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSelectProperty?: (id: string) => void;
}

const COMMON_CATEGORIES = [
  'Rent Payment',
  'Pet Rent',
  'Late Fee',
  'Laundry / Parking Fee',
  'Property Taxes',
  'Property Insurance',
  'Property Management',
  'Repairs & Maintenance',
  'Plumbing / HVAC',
  'Electrical / Appliance',
  'Appliance',
  'Capital Improvements',
  'HOA / Condo Fees',
  'Water & Sewer',
  'Trash & Recycling',
  'Gas & Electric',
  'Landscaping & Lawn',
  'Pest Control',
  'Legal & Accounting',
  'Supplies & Tools',
  'Mortgage Payment',
  'Other Income',
  'Other Expense',
];

const REPAIR_PRESETS = [
  { label: 'Plumbing', icon: '🔧', desc: 'Plumbing leak, toilet or faucet repair' },
  { label: 'HVAC / AC & Heat', icon: '❄️', desc: 'AC tune-up, filter or heating fix' },
  { label: 'Electrical', icon: '⚡', desc: 'Outlet, light fixture or wiring repair' },
  { label: 'Appliance', icon: '🍳', desc: 'Stove, fridge, dishwasher or disposal fix' },
  { label: 'Doors & Locks', icon: '🚪', desc: 'Lock change, door or window repair' },
  { label: 'Painting & Drywall', icon: '🎨', desc: 'Drywall patch or paint touch-up' },
  { label: 'Handyman / Carpentry', icon: '🔨', desc: 'General handyman carpentry or flooring' },
  { label: 'Supplies / Hardware', icon: '🛒', desc: 'Hardware store parts (Home Depot/Lowes)' },
  { label: 'Pest Control', icon: '🐜', desc: 'Unit pest treatment or extermination' },
];

export const TransactionTracker: React.FC<TransactionTrackerProps> = ({
  property,
  allProperties = [],
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onSelectProperty,
}) => {
  const availableProperties = useMemo(() => {
    if (allProperties && allProperties.length > 0) return allProperties;
    if (property) return [property];
    return [];
  }, [allProperties, property]);

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'repairs'>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New transaction form state
  const [formPropertyId, setFormPropertyId] = useState<string>(property.id);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState<string>('Repairs & Maintenance');
  const [formUnitId, setFormUnitId] = useState<string>('');
  const [formIsRepair, setFormIsRepair] = useState<boolean>(true);
  const [formRepairType, setFormRepairType] = useState<string>('Plumbing');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPaidByTo, setFormPaidByTo] = useState<string>('');
  const [formReceipt, setFormReceipt] = useState<string>('');

  // Filter transactions for this property
  const propTransactions = transactions.filter((t) => t.propertyId === property.id);

  const filteredTransactions = propTransactions.filter((t) => {
    // Type filter
    if (filterType === 'repairs') {
      if (!t.isRepair && t.category !== 'Repairs & Maintenance') return false;
    } else if (filterType !== 'all' && t.type !== filterType) {
      return false;
    }

    // Unit filter
    if (unitFilter !== 'all') {
      if (unitFilter === 'general') {
        if (t.unitId) return false;
      } else if (t.unitId !== unitFilter) {
        return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.unitName && t.unitName.toLowerCase().includes(q)) ||
        (t.paidByOrTo && t.paidByOrTo.toLowerCase().includes(q)) ||
        (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate actuals
  const actualTotalIncome = propTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const actualTotalExpenses = propTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const actualUnitRepairs = propTransactions
    .filter((t) => t.type === 'expense' && (t.isRepair || t.category === 'Repairs & Maintenance' || t.unitId))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const actualNetCashFlow = actualTotalIncome - actualTotalExpenses;

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;

    let resolvedPropId = formPropertyId || property.id;
    let resolvedUnitId: string | undefined = undefined;
    let resolvedUnitName: string | undefined = undefined;

    if (formUnitId.startsWith('prop-entire:')) {
      resolvedPropId = formUnitId.replace('prop-entire:', '');
      const propObj = availableProperties.find((p) => p.id === resolvedPropId) || property;
      resolvedUnitName = `${propObj.name} (Entire Property)`;
    } else if (formUnitId) {
      for (const p of availableProperties) {
        const u = p.units?.find((unit) => unit.id === formUnitId);
        if (u) {
          resolvedPropId = p.id;
          resolvedUnitId = u.id;
          resolvedUnitName = u.name;
          break;
        }
      }
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      propertyId: resolvedPropId,
      unitId: resolvedUnitId,
      unitName: resolvedUnitName,
      date: formDate || new Date().toISOString().split('T')[0],
      type: formType,
      category: formCategory,
      amount: amount,
      description: formDescription.trim() || `${formType === 'income' ? 'Received' : 'Paid'} ${formCategory}`,
      paidByOrTo: formPaidByTo.trim() || undefined,
      receiptNumber: formReceipt.trim() || undefined,
      isRepair: formType === 'expense' && (formIsRepair || formCategory === 'Repairs & Maintenance'),
      repairType: formIsRepair ? formRepairType : undefined,
    };

    onAddTransaction(newTx);
    setShowAddModal(false);
    // Reset form
    setFormAmount('');
    setFormDescription('');
    setFormPaidByTo('');
    setFormReceipt('');
    setFormUnitId('');
  };

  return (
    <div className="space-y-6">
      {/* Actual Cash Flow Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161A23] p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Actual Logged Income</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {formatCurrency(actualTotalIncome)}
            </div>
            <span className="text-[11px] text-slate-500">
              {propTransactions.filter((t) => t.type === 'income').length} deposits logged
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#161A23] p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Actual Logged Expenses</span>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">
              {formatCurrency(actualTotalExpenses)}
            </div>
            <span className="text-[11px] text-slate-500">
              {propTransactions.filter((t) => t.type === 'expense').length} expenses logged
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Unit Repairs & Maintenance Metric */}
        <div className="bg-[#161A23] p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
              <Hammer className="w-3.5 h-3.5" /> Maintenance & Repairs
            </span>
            <div className="text-2xl font-extrabold text-amber-300 mt-1">
              {formatCurrency(actualUnitRepairs)}
            </div>
            <span className="text-[11px] text-slate-500">
              {propTransactions.filter((t) => t.type === 'expense' && (t.isRepair || t.category === 'Repairs & Maintenance' || t.unitId)).length} maintenance items
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Hammer className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#161A23] p-4 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">Actual Net Realized</span>
            <div className={`text-2xl font-extrabold mt-1 ${
              actualNetCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrency(actualNetCashFlow)}
            </div>
            <span className="text-[11px] text-slate-500">
              After repairs & expenses
            </span>
          </div>
          <div className={`p-2.5 rounded-xl border ${
            actualNetCashFlow >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex items-center bg-[#11141B] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'all' ? 'bg-[#161A23] text-white shadow-xs border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({propTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('repairs')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  filterType === 'repairs' ? 'bg-amber-500/20 text-amber-300 shadow-xs border border-amber-500/40' : 'text-slate-400 hover:text-amber-300'
                }`}
                title="Filter by Repairs & Maintenance"
              >
                <Hammer className="w-3 h-3" />
                Maintenance
              </button>
              <button
                type="button"
                onClick={() => setFilterType('income')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'income' ? 'bg-emerald-500/20 text-emerald-400 shadow-xs border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setFilterType('expense')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'expense' ? 'bg-rose-500/20 text-rose-400 shadow-xs border border-rose-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Expenses
              </button>
            </div>

            {/* Unit Filter Dropdown */}
            {property.units && property.units.length > 0 && (
              <div className="flex items-center gap-1 bg-[#11141B] px-2 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#161A23] text-white">All Units & Overhead</option>
                  <option value="general" className="bg-[#161A23] text-white">Entire Property Only</option>
                  {property.units.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#161A23] text-white">
                      {u.name} {u.tenantName ? `(${u.tenantName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search expenses, vendor, receipt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-[#11141B] border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl pl-8 pr-3 py-2 w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportToCSV(propTransactions, property.name)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => {
                setFormType('expense');
                setFormCategory('Repairs & Maintenance');
                setFormIsRepair(true);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No matching transactions found</p>
              <p className="text-slate-500 mt-0.5">Click "Add Transaction" to record an expense or payment.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-[#11141B] border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Unit / Scope</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description / What was Fixed</th>
                  <th className="py-3 px-4">Vendor / Store</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-medium">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.unitName ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
                          <Home className="w-3 h-3 text-blue-400" />
                          {tx.unitName}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Entire Property
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                        tx.type === 'income' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-200">
                      <div className="flex items-center gap-1">
                        <span>{tx.category}</span>
                        {tx.isRepair && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold" title={tx.repairType ? `Fix: ${tx.repairType}` : 'Unit repair'}>
                            <Wrench className="w-2.5 h-2.5" />
                            {tx.repairType || 'Fix'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {tx.description.replace(/Unit\s+Unit\s+/gi, 'Unit ')}
                      {tx.receiptNumber && (
                        <span className="ml-1 text-[10px] text-slate-400 font-mono">
                          (Ref: {tx.receiptNumber})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {tx.paidByOrTo || '—'}
                    </td>
                    <td className={`py-3 px-4 text-right whitespace-nowrap font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {formType === 'expense' ? 'Add Expense Transaction' : 'Record Rental Income'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Record operating expenses, contractor invoices, or rent receipts for {property.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 bg-[#11141B] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('expense');
                    setFormCategory('Repairs & Maintenance');
                    setFormIsRepair(true);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  - Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('income');
                    setFormCategory('Rent Payment');
                    setFormIsRepair(false);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === 'income'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  + Rental Income
                </button>
              </div>

              {/* Single Property & Unit Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    Property / Target Unit *
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {availableProperties.length} Properties
                  </span>
                </label>
                <select
                  value={formUnitId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormUnitId(val);
                    if (val.startsWith('prop-entire:')) {
                      setFormPropertyId(val.replace('prop-entire:', ''));
                    } else {
                      for (const p of availableProperties) {
                        if (p.units?.some((u) => u.id === val)) {
                          setFormPropertyId(p.id);
                          break;
                        }
                      }
                    }
                  }}
                  className="w-full text-xs font-semibold text-white bg-[#161A23] px-3 py-2.5 border border-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                >
                  {availableProperties.map((p) => (
                    <optgroup key={p.id} label={`🏢 Property: ${p.name}`}>
                      <option value={`prop-entire:${p.id}`} className="bg-[#161A23] text-amber-300 font-semibold">
                        📍 Entire Property — {p.name} (General Overhead / Maintenance)
                      </option>
                      {p.units?.map((u) => (
                        <option key={u.id} value={u.id} className="bg-[#161A23] text-white">
                          &nbsp;&nbsp;↳ Unit: {u.name} {u.tenantName ? `(${u.tenantName})` : '(Vacant)'}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select your property or a specific unit within that property.
                </p>
              </div>

              {/* Quick Repair Category Chips (Shown for Expense) */}
              {formType === 'expense' && (
                <div className="space-y-1.5 bg-[#11141B]/80 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Quick Fix Presets: What was repaired?
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {REPAIR_PRESETS.map((preset) => {
                      const isSelected = formRepairType === preset.label && formCategory === 'Repairs & Maintenance';
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setFormCategory('Repairs & Maintenance');
                            setFormRepairType(preset.label);
                            setFormIsRepair(true);
                            if (!formDescription || formDescription.startsWith('Fixed ') || formDescription.includes('repair')) {
                              setFormDescription(preset.desc);
                            }
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                          }`}
                        >
                          <span>{preset.icon}</span>
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Expense / Fix Amount ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="e.g. 150.00"
                      className="w-full text-xs font-bold text-white bg-[#11141B] pl-7 pr-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Repair / Payment *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs text-white bg-[#11141B] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Accounting Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => {
                    setFormCategory(e.target.value);
                    if (e.target.value === 'Repairs & Maintenance' || e.target.value.includes('Plumbing') || e.target.value.includes('Electrical')) {
                      setFormIsRepair(true);
                    }
                  }}
                  className="w-full text-xs font-semibold text-white bg-[#11141B] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                >
                  {COMMON_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#161A23] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description of Fix / Item *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Fixed leaking toilet flapper and replaced shutoff valve in bathroom"
                  className="w-full text-xs text-white bg-[#11141B] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-500"
                />
              </div>

              {/* Paid by/to & Receipt # */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vendor / Store / Handyman
                  </label>
                  <input
                    type="text"
                    value={formPaidByTo}
                    onChange={(e) => setFormPaidByTo(e.target.value)}
                    placeholder="e.g. Home Depot, Ace Plumbing"
                    className="w-full text-xs text-white bg-[#11141B] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Invoice / Receipt #
                  </label>
                  <input
                    type="text"
                    value={formReceipt}
                    onChange={(e) => setFormReceipt(e.target.value)}
                    placeholder="e.g. REC-8491"
                    className="w-full text-xs text-white bg-[#11141B] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
