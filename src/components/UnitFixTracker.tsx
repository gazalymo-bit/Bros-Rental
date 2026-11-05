import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Building2, 
  Home, 
  Calendar, 
  Receipt, 
  DollarSign, 
  Trash2, 
  Filter,
  Hammer,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Edit3
} from 'lucide-react';
import { Property, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';

interface UnitFixTrackerProps {
  property: Property;
  allProperties?: Property[];
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onUpdateTransaction?: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSelectProperty?: (id: string) => void;
  onNavigateToRentCollection?: () => void;
  onClearAllRepairs?: () => void;
}

const REPAIR_PRESETS = [
  'Plumbing',
  'HVAC & Heating',
  'Electrical',
  'Appliance Repair',
  'Painting & Drywall',
  'Roof & Gutters',
  'Flooring / Carpet',
  'Locksmith & Keys',
  'Pest Control',
  'Cleaning',
  'Handyman / General'
];

export const UnitFixTracker: React.FC<UnitFixTrackerProps> = ({
  property,
  allProperties = [],
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onSelectProperty,
  onNavigateToRentCollection,
  onClearAllRepairs,
}) => {
  const availableProperties = useMemo(() => {
    if (allProperties && allProperties.length > 0) return allProperties;
    if (property) return [property];
    return [];
  }, [allProperties, property]);

  // Filter states
  const [selectedPropFilter, setSelectedPropFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fix Modal State (Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [fixPropertyId, setFixPropertyId] = useState<string>(property.id);
  const [fixUnitId, setFixUnitId] = useState<string>(property.units?.[0]?.id || `prop-entire:${property.id}`);
  const [fixCategory, setFixCategory] = useState<string>('Repairs & Maintenance');
  const [fixRepairType, setFixRepairType] = useState<string>('Plumbing');
  const [fixAmount, setFixAmount] = useState<string>('');
  const [fixDescription, setFixDescription] = useState<string>('');
  const [fixVendor, setFixVendor] = useState<string>('');
  const [fixReceipt, setFixReceipt] = useState<string>('');
  const [fixDate, setFixDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter repair transactions
  const repairTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const isRepair = t.isRepair === true || 
        t.category.toLowerCase().includes('repair') || 
        t.category.toLowerCase().includes('maintenance') ||
        t.category.toLowerCase().includes('capex');

      if (!isRepair) return false;

      if (selectedPropFilter !== 'all' && t.propertyId !== selectedPropFilter) {
        return false;
      }

      if (selectedCategoryFilter !== 'all') {
        const descMatch = (t.description || '').toLowerCase().includes(selectedCategoryFilter.toLowerCase());
        const catMatch = (t.category || '').toLowerCase().includes(selectedCategoryFilter.toLowerCase());
        if (!descMatch && !catMatch) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const unit = (t.unitName || '').toLowerCase();
        const vendor = (t.paidByOrTo || '').toLowerCase();
        const receipt = (t.receiptNumber || '').toLowerCase();
        if (!desc.includes(q) && !unit.includes(q) && !vendor.includes(q) && !receipt.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedPropFilter, selectedCategoryFilter, searchQuery]);

  // Statistics
  const totalRepairSpend = useMemo(() => {
    return repairTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [repairTransactions]);

  const averageRepairCost = useMemo(() => {
    if (repairTransactions.length === 0) return 0;
    return totalRepairSpend / repairTransactions.length;
  }, [repairTransactions, totalRepairSpend]);

  const handleOpenModal = (presetCategory?: string) => {
    setEditingTxId(null);
    setFixPropertyId(property.id);
    setFixUnitId(property.units?.[0]?.id || `prop-entire:${property.id}`);
    if (presetCategory) {
      setFixRepairType(presetCategory);
      setFixDescription(presetCategory === 'Cleaning' ? 'Cleaning' : `${presetCategory} repair in unit`);
    } else {
      setFixRepairType('Plumbing');
      setFixDescription('');
    }
    setFixCategory('Repairs & Maintenance');
    setFixAmount('');
    setFixVendor('');
    setFixReceipt('');
    setFixDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleEditFix = (tx: Transaction) => {
    setEditingTxId(tx.id);
    const targetPropId = tx.propertyId || property.id;
    setFixPropertyId(targetPropId);
    
    // Match the unit in dropdown or default to entire property
    if (tx.unitId) {
      setFixUnitId(tx.unitId);
    } else {
      setFixUnitId(`prop-entire:${targetPropId}`);
    }

    setFixCategory(tx.category || 'Repairs & Maintenance');

    // Detect matched preset or default
    const matchedPreset = REPAIR_PRESETS.find((p) => 
      (tx.description || '').toLowerCase().includes(p.toLowerCase())
    );
    setFixRepairType(matchedPreset || 'Handyman / General');

    setFixAmount(String(tx.amount || ''));
    setFixDescription(tx.description || '');
    setFixVendor(tx.paidByOrTo || '');
    setFixReceipt(tx.receiptNumber || '');
    setFixDate(tx.date || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleSaveFix = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(fixAmount);
    if (!amount || amount <= 0) return;

    let resolvedPropId = fixPropertyId || property.id;
    let resolvedUnitId: string | undefined = undefined;
    let resolvedUnitName: string = 'Entire Property';

    if (fixUnitId.startsWith('prop-entire:')) {
      resolvedPropId = fixUnitId.replace('prop-entire:', '');
      const propObj = availableProperties.find((p) => p.id === resolvedPropId) || property;
      resolvedUnitName = `${propObj.name} (Entire Property)`;
    } else if (fixUnitId) {
      for (const p of availableProperties) {
        const u = p.units?.find((unit) => unit.id === fixUnitId);
        if (u) {
          resolvedPropId = p.id;
          resolvedUnitId = u.id;
          resolvedUnitName = u.name;
          break;
        }
      }
    }

    if (editingTxId) {
      const updatedTx: Transaction = {
        id: editingTxId,
        propertyId: resolvedPropId,
        unitId: resolvedUnitId,
        unitName: resolvedUnitName,
        date: fixDate || new Date().toISOString().split('T')[0],
        type: 'expense',
        category: fixCategory,
        amount,
        description: fixDescription.trim() || `${fixRepairType} in ${resolvedUnitName}`,
        paidByOrTo: fixVendor.trim() || undefined,
        receiptNumber: fixReceipt.trim() || undefined,
        isRepair: true,
      };

      if (onUpdateTransaction) {
        onUpdateTransaction(updatedTx);
      } else {
        onDeleteTransaction(editingTxId);
        onAddTransaction(updatedTx);
      }
    } else {
      const newTx: Transaction = {
        id: `tx-fix-${Date.now()}`,
        propertyId: resolvedPropId,
        unitId: resolvedUnitId,
        unitName: resolvedUnitName,
        date: fixDate || new Date().toISOString().split('T')[0],
        type: 'expense',
        category: fixCategory,
        amount,
        description: fixDescription.trim() || `${fixRepairType} in ${resolvedUnitName}`,
        paidByOrTo: fixVendor.trim() || undefined,
        receiptNumber: fixReceipt.trim() || undefined,
        isRepair: true,
      };

      onAddTransaction(newTx);
    }

    setIsModalOpen(false);
    setEditingTxId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Bar: Dedicated Log Unit Fix Bar */}
      <div className="bg-[#11141B] border border-amber-500/30 rounded-2xl p-5 shadow-lg shadow-amber-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Unit Fix & Maintenance Tracker
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Repairs Log
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Log and monitor all unit repairs, fixes, contractor receipts, and maintenance costs across your portfolio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToRentCollection && (
              <button
                type="button"
                onClick={onNavigateToRentCollection}
                className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors"
              >
                &larr; Back to Rent Collection
              </button>
            )}
            {repairTransactions && repairTransactions.length > 0 && onClearAllRepairs && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete all recorded repairs and maintenance records? This action cannot be undone.')) {
                    onClearAllRepairs();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer shrink-0"
                title="Delete all repair records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Repairs</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ Log Unit Fix</span>
            </button>
          </div>
        </div>

        {/* Quick-Log Preset Pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Hammer className="w-3.5 h-3.5 text-amber-400" />
            Quick Fix Presets:
          </span>
          {REPAIR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleOpenModal(preset)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/30 whitespace-nowrap transition-colors cursor-pointer"
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Repair Expenses</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {formatCurrency(totalRepairSpend)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Deducted from gross rental income
          </span>
        </div>

        <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Unit Fixes Logged</span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {repairTransactions.length}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Repair & maintenance orders completed
          </span>
        </div>

        <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Average Cost Per Fix</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300 mt-1">
            {formatCurrency(averageRepairCost)}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Average expense per unit maintenance incident
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#161A23] p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Property Filter */}
          {availableProperties.length > 1 && (
            <div className="flex items-center gap-1.5 bg-[#11141B] px-3 py-1.5 rounded-lg border border-slate-800">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={selectedPropFilter}
                onChange={(e) => setSelectedPropFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white cursor-pointer focus:outline-none"
              >
                <option value="all" className="bg-[#161A23] text-white">All Properties</option>
                {availableProperties.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#161A23] text-white">{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, vendor, unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#11141B] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="text-xs text-slate-400 self-end sm:self-auto font-medium">
          Showing <span className="text-white font-bold">{repairTransactions.length}</span> repair record{repairTransactions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Repairs Table / Records List */}
      <div className="bg-[#161A23] rounded-xl border border-slate-800 shadow-md overflow-hidden">
        {repairTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No Unit Fixes Logged Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Keep your properties well-maintained and track expenses accurately by logging repairs as they occur.
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Log Your First Unit Fix</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#11141B] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Property & Unit</th>
                  <th className="py-3 px-4">Repair Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor / Handyman</th>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {repairTransactions.map((tx) => {
                  const prop = availableProperties.find((p) => p.id === tx.propertyId) || property;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">
                          {tx.unitName || 'Entire Property'}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {prop.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200 max-w-xs">
                        {tx.description.replace(/Unit\s+Unit\s+/gi, 'Unit ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {tx.paidByOrTo || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {tx.receiptNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-300">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditFix(tx)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit fix record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete fix record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Logging a Unit Fix with Single Dropdown */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#161A23] border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingTxId ? 'Edit Unit Fix & Expense' : 'Log Unit Fix & Expense'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingTxId 
                      ? 'Update repair cost, category, contractor, or unit assignment' 
                      : 'Records a repair cost and automatically links it to the property ledger'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFix} className="space-y-4 text-xs">
              {/* Single Property & Unit Dropdown */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    Property / Unit Where Item Was Fixed *
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {availableProperties.length} Properties
                  </span>
                </label>
                <select
                  value={fixUnitId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFixUnitId(val);
                    if (val.startsWith('prop-entire:')) {
                      setFixPropertyId(val.replace('prop-entire:', ''));
                    } else {
                      for (const p of availableProperties) {
                        if (p.units?.some((u) => u.id === val)) {
                          setFixPropertyId(p.id);
                          break;
                        }
                      }
                    }
                  }}
                  className="w-full bg-[#11141B] border border-slate-800 rounded-xl px-3 py-2.5 text-white font-semibold focus:ring-1 focus:ring-amber-500 cursor-pointer text-xs"
                >
                  {availableProperties.map((p) => (
                    <optgroup key={p.id} label={`🏢 Property: ${p.name}`}>
                      <option value={`prop-entire:${p.id}`} className="bg-[#161A23] text-amber-300 font-semibold">
                        📍 Entire Property — {p.name} (General Maintenance)
                      </option>
                      {p.units?.map((u) => (
                        <option key={u.id} value={u.id} className="bg-[#161A23] text-white">
                          &nbsp;&nbsp;↳ Unit: {u.name} {u.tenantName ? `(${u.tenantName})` : '(Vacant)'}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Quick Repair Type Presets */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  What was repaired?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REPAIR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setFixRepairType(preset);
                        if (!fixDescription || REPAIR_PRESETS.some((p) => fixDescription.startsWith(p)) || fixDescription === 'Cleaning' || fixDescription.includes('repair in unit')) {
                          setFixDescription(preset === 'Cleaning' ? 'Cleaning' : `${preset} repair in unit`);
                        }
                      }}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        fixRepairType === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-[#11141B] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Cost / Amount ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={fixAmount}
                      onChange={(e) => setFixAmount(e.target.value)}
                      required
                      className="w-full bg-[#11141B] border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-white font-bold focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Date of Repair *
                  </label>
                  <input
                    type="date"
                    value={fixDate}
                    onChange={(e) => setFixDate(e.target.value)}
                    required
                    className="w-full bg-[#11141B] border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description of Item Fixed
                </label>
                <input
                  type="text"
                  placeholder="e.g., Replaced leaking kitchen sink faucet cartridge"
                  value={fixDescription}
                  onChange={(e) => setFixDescription(e.target.value)}
                  className="w-full bg-[#11141B] border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Vendor & Receipt */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Contractor / Handyman
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., City Plumbing Pros"
                    value={fixVendor}
                    onChange={(e) => setFixVendor(e.target.value)}
                    className="w-full bg-[#11141B] border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Invoice / Receipt #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., INV-8492"
                    value={fixReceipt}
                    onChange={(e) => setFixReceipt(e.target.value)}
                    className="w-full bg-[#11141B] border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!fixAmount || parseFloat(fixAmount) <= 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>{editingTxId ? 'Update Unit Fix' : 'Save Unit Fix'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
