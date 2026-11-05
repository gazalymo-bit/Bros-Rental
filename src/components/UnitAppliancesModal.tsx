import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Calendar, 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Copy, 
  Phone, 
  Mail, 
  FileText, 
  DollarSign, 
  Store, 
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  UploadCloud,
  Eye,
  Download,
  Paperclip
} from 'lucide-react';
import { UnitRental, ApplianceItem, Property } from '../types';
import { formatCurrency } from '../utils/calculations';
import { ReceiptUploadDropzone } from './ReceiptUploadDropzone';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface UnitAppliancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: UnitRental;
  property: Property;
  onUpdateUnit: (updatedUnit: UnitRental) => void;
}

const COMMON_APPLIANCES = [
  { name: 'Refrigerator', icon: '🧊', defaultBrand: 'Whirlpool' },
  { name: 'Dishwasher', icon: '🍽️', defaultBrand: 'Bosch' },
  { name: 'Oven / Stove / Range', icon: '🍳', defaultBrand: 'GE' },
  { name: 'Microwave', icon: '🍿', defaultBrand: 'Panasonic' },
  { name: 'Clothes Washer', icon: '🧺', defaultBrand: 'Samsung' },
  { name: 'Clothes Dryer', icon: '👕', defaultBrand: 'LG' },
  { name: 'Water Heater', icon: '🚿', defaultBrand: 'Rheem' },
  { name: 'HVAC / Air Conditioner', icon: '❄️', defaultBrand: 'Carrier' },
  { name: 'Garbage Disposal', icon: '⚙️', defaultBrand: 'InSinkErator' },
];

export const UnitAppliancesModal: React.FC<UnitAppliancesModalProps> = ({
  isOpen,
  onClose,
  unit,
  property,
  onUpdateUnit,
}) => {
  const appliances = unit.appliances || [];
  const [filter, setFilter] = useState<'all' | 'warranty' | 'expired'>('all');
  const [isAddingOrEditing, setIsAddingOrEditing] = useState<boolean>(false);
  const [editingApplianceId, setEditingApplianceId] = useState<string | null>(null);
  const [copiedPolicyId, setCopiedPolicyId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState<string>('Refrigerator');
  const [formBrand, setFormBrand] = useState<string>('');
  const [formModelNumber, setFormModelNumber] = useState<string>('');
  const [formSerialNumber, setFormSerialNumber] = useState<string>('');
  const [formBoughtDate, setFormBoughtDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPurchasePrice, setFormPurchasePrice] = useState<string>('');
  const [formVendorOrStore, setFormVendorOrStore] = useState<string>('Home Depot');
  const [formHasWarranty, setFormHasWarranty] = useState<boolean>(true);
  const [formIsLifetimeWarranty, setFormIsLifetimeWarranty] = useState<boolean>(false);
  const [formWarrantyType, setFormWarrantyType] = useState<ApplianceItem['warrantyType']>('Manufacturer');
  const [formWarrantyExpirationDate, setFormWarrantyExpirationDate] = useState<string>('');
  const [formWarrantyProvider, setFormWarrantyProvider] = useState<string>('');
  const [formWarrantyPolicyNumber, setFormWarrantyPolicyNumber] = useState<string>('');
  const [formWarrantyContactPhone, setFormWarrantyContactPhone] = useState<string>('');
  const [formWarrantyContactEmail, setFormWarrantyContactEmail] = useState<string>('');
  const [formWarrantyCoverageNotes, setFormWarrantyCoverageNotes] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Receipt attachment states in form
  const [formReceiptUrl, setFormReceiptUrl] = useState<string | undefined>(undefined);
  const [formReceiptFileName, setFormReceiptFileName] = useState<string | undefined>(undefined);
  const [formReceiptFileType, setFormReceiptFileType] = useState<string | undefined>(undefined);
  const [formReceiptFileSize, setFormReceiptFileSize] = useState<number | undefined>(undefined);
  const [formReceiptUploadedAt, setFormReceiptUploadedAt] = useState<string | undefined>(undefined);

  // Receipt viewer modal state
  const [viewerAppliance, setViewerAppliance] = useState<ApplianceItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleOpenAddForm = (presetName?: string, presetBrand?: string) => {
    setEditingApplianceId(null);
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const defaultExp = nextYear.toISOString().split('T')[0];

    setFormName(presetName || 'Refrigerator');
    setFormBrand(presetBrand || '');
    setFormModelNumber('');
    setFormSerialNumber('');
    setFormBoughtDate(today);
    setFormPurchasePrice('');
    setFormVendorOrStore('Home Depot');
    setFormHasWarranty(true);
    setFormIsLifetimeWarranty(false);
    setFormWarrantyType('Manufacturer');
    setFormWarrantyExpirationDate(defaultExp);
    setFormWarrantyProvider(presetBrand ? `${presetBrand} Care` : 'Manufacturer Warranty');
    setFormWarrantyPolicyNumber('');
    setFormWarrantyContactPhone('');
    setFormWarrantyContactEmail('');
    setFormWarrantyCoverageNotes('1-Year Full Manufacturer Parts & Labor Warranty');
    setFormNotes('');
    setFormReceiptUrl(undefined);
    setFormReceiptFileName(undefined);
    setFormReceiptFileType(undefined);
    setFormReceiptFileSize(undefined);
    setFormReceiptUploadedAt(undefined);
    setIsAddingOrEditing(true);
  };

  const handleOpenEditForm = (app: ApplianceItem) => {
    setEditingApplianceId(app.id);
    setFormName(app.name);
    setFormBrand(app.brand || '');
    setFormModelNumber(app.modelNumber || '');
    setFormSerialNumber(app.serialNumber || '');
    setFormBoughtDate(app.boughtDate);
    setFormPurchasePrice(app.purchasePrice ? String(app.purchasePrice) : '');
    setFormVendorOrStore(app.vendorOrStore || '');
    setFormHasWarranty(app.hasWarranty);
    setFormIsLifetimeWarranty(app.warrantyType === 'Lifetime');
    setFormWarrantyType(app.warrantyType || 'Manufacturer');
    setFormWarrantyExpirationDate(app.warrantyExpirationDate || '');
    setFormWarrantyProvider(app.warrantyProvider || '');
    setFormWarrantyPolicyNumber(app.warrantyPolicyNumber || '');
    setFormWarrantyContactPhone(app.warrantyContactPhone || '');
    setFormWarrantyContactEmail(app.warrantyContactEmail || '');
    setFormWarrantyCoverageNotes(app.warrantyCoverageNotes || '');
    setFormNotes(app.notes || '');
    setFormReceiptUrl(app.receiptUrl);
    setFormReceiptFileName(app.receiptFileName);
    setFormReceiptFileType(app.receiptFileType);
    setFormReceiptFileSize(app.receiptFileSize);
    setFormReceiptUploadedAt(app.receiptUploadedAt);
    setIsAddingOrEditing(true);
  };

  const handleSaveAppliance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBoughtDate) return;

    const priceNum = parseFloat(formPurchasePrice);
    const itemData: ApplianceItem = {
      id: editingApplianceId || `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: formName.trim(),
      brand: formBrand.trim() || undefined,
      modelNumber: formModelNumber.trim() || undefined,
      serialNumber: formSerialNumber.trim() || undefined,
      boughtDate: formBoughtDate,
      purchasePrice: !isNaN(priceNum) && priceNum > 0 ? priceNum : undefined,
      vendorOrStore: formVendorOrStore.trim() || undefined,
      hasWarranty: formHasWarranty,
      warrantyType: formIsLifetimeWarranty ? 'Lifetime' : formWarrantyType,
      warrantyExpirationDate: formIsLifetimeWarranty ? undefined : (formWarrantyExpirationDate || undefined),
      warrantyProvider: formWarrantyProvider.trim() || undefined,
      warrantyPolicyNumber: formWarrantyPolicyNumber.trim() || undefined,
      warrantyContactPhone: formWarrantyContactPhone.trim() || undefined,
      warrantyContactEmail: formWarrantyContactEmail.trim() || undefined,
      warrantyCoverageNotes: formWarrantyCoverageNotes.trim() || undefined,
      notes: formNotes.trim() || undefined,
      receiptUrl: formReceiptUrl,
      receiptFileName: formReceiptFileName,
      receiptFileType: formReceiptFileType,
      receiptFileSize: formReceiptFileSize,
      receiptUploadedAt: formReceiptUploadedAt,
      updatedAt: new Date().toISOString(),
      createdAt: editingApplianceId 
        ? appliances.find((a) => a.id === editingApplianceId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    let updatedList: ApplianceItem[];
    if (editingApplianceId) {
      updatedList = appliances.map((a) => (a.id === editingApplianceId ? itemData : a));
    } else {
      updatedList = [...appliances, itemData];
    }

    onUpdateUnit({
      ...unit,
      appliances: updatedList,
    });

    setIsAddingOrEditing(false);
    setEditingApplianceId(null);
  };

  const handleDeleteAppliance = (id: string) => {
    const updatedList = appliances.filter((a) => a.id !== id);
    onUpdateUnit({
      ...unit,
      appliances: updatedList,
    });
  };

  const handleDirectUploadReceipt = (app: ApplianceItem, file: File) => {
    if (file.size > 4.5 * 1024 * 1024) {
      alert('Receipt file is too large (max 4.5 MB). Please compress or take a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updatedApp: ApplianceItem = {
        ...app,
        receiptUrl: dataUrl,
        receiptFileName: file.name,
        receiptFileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        receiptFileSize: file.size,
        receiptUploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedList = appliances.map((a) => (a.id === updatedApp.id ? updatedApp : a));
      onUpdateUnit({
        ...unit,
        appliances: updatedList,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCopyPolicy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPolicyId(id);
    setTimeout(() => {
      setCopiedPolicyId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  // Helper to determine warranty status
  const getWarrantyStatus = (app: ApplianceItem) => {
    if (!app.hasWarranty) {
      return { status: 'none', label: 'No Warranty', color: 'slate' };
    }
    if (app.warrantyType === 'Lifetime') {
      return { status: 'active', label: 'Lifetime Warranty Active', color: 'emerald' };
    }
    if (!app.warrantyExpirationDate) {
      return { status: 'active', label: 'Warranty On File', color: 'emerald' };
    }

    const today = new Date();
    const exp = new Date(app.warrantyExpirationDate + 'T23:59:59');
    const diffMs = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'expired', 
        label: `Warranty Expired (${app.warrantyExpirationDate})`, 
        color: 'rose', 
        diffDays 
      };
    } else if (diffDays <= 60) {
      return { 
        status: 'expiring', 
        label: `Expiring Soon (${diffDays} days left • ${app.warrantyExpirationDate})`, 
        color: 'amber', 
        diffDays 
      };
    } else {
      const monthsLeft = Math.round(diffDays / 30);
      return { 
        status: 'active', 
        label: `Active Warranty (~${monthsLeft} mos left • until ${app.warrantyExpirationDate})`, 
        color: 'emerald', 
        diffDays 
      };
    }
  };

  // Filtered list
  const filteredAppliances = appliances.filter((app) => {
    const ws = getWarrantyStatus(app);
    if (filter === 'warranty') return ws.status === 'active' || ws.status === 'expiring';
    if (filter === 'expired') return ws.status === 'expired' || ws.status === 'none';
    return true;
  });

  const activeWarrantyCount = appliances.filter((a) => {
    const ws = getWarrantyStatus(a);
    return ws.status === 'active' || ws.status === 'expiring';
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-[#161A23] border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#11141B] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Unit Appliances & Warranty Tracker
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {unit.name}
                </span>
                <span className="text-xs text-slate-400">
                  ({property.name})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage appliance purchase dates, serial numbers, retailers, warranties, policies, and service contacts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Metrics & Preset Quick-Add Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0E121A] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Appliances</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{appliances.length} Items</span>
            </div>

            <div className="bg-[#0E121A] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-400 block">Active Warranties</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{activeWarrantyCount} Covered</span>
            </div>

            <div className="bg-[#0E121A] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Tenant In Unit</span>
              <span className="text-xs font-semibold text-slate-200 mt-1 block truncate">
                {unit.tenantName || (unit.isOccupied ? 'Occupied' : 'Vacant')}
              </span>
            </div>

            <div className="bg-[#0E121A] p-3 rounded-xl border border-slate-800 flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleOpenAddForm()}
                className="w-full h-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Appliance</span>
              </button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Add Common Appliances:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_APPLIANCES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleOpenAddForm(preset.name, preset.defaultBrand)}
                  className="inline-flex items-center gap-1.5 text-xs bg-[#11141B] hover:bg-blue-500/20 hover:text-blue-300 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-blue-500/40 transition-colors cursor-pointer"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add / Edit Form Modal Inline */}
          {isAddingOrEditing && (
            <div className="bg-[#0E121A] border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {editingApplianceId ? 'Edit Appliance & Warranty' : 'Add New Appliance to Unit'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingOrEditing(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAppliance} className="space-y-4">
                {/* 1. Basic Appliance Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Appliance Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Refrigerator, Dishwasher"
                      className="w-full bg-[#161A23] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Brand / Manufacturer
                    </label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Whirlpool, GE, Samsung, Bosch"
                      className="w-full bg-[#161A23] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Bought Date (Purchase Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={formBoughtDate}
                      onChange={(e) => setFormBoughtDate(e.target.value)}
                      className="w-full bg-[#161A23] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 2. Model, Serial, Cost, Vendor */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Model Number
                    </label>
                    <input
                      type="text"
                      value={formModelNumber}
                      onChange={(e) => setFormModelNumber(e.target.value)}
                      placeholder="e.g. WRS325SDHZ"
                      className="w-full bg-[#161A23] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={formSerialNumber}
                      onChange={(e) => setFormSerialNumber(e.target.value)}
                      placeholder="e.g. HR8291048"
                      className="w-full bg-[#161A23] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Purchase Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formPurchasePrice}
                      onChange={(e) => setFormPurchasePrice(e.target.value)}
                      placeholder="e.g. 1199.00"
                      className="w-full bg-[#161A23] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-emerald-400 font-medium block mt-1">
                      ✓ Automatically calculated into Maintenance, Fixes &amp; Repairs expenses on statement
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Purchased From / Vendor
                    </label>
                    <input
                      type="text"
                      value={formVendorOrStore}
                      onChange={(e) => setFormVendorOrStore(e.target.value)}
                      placeholder="e.g. Home Depot, Lowe's"
                      className="w-full bg-[#161A23] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 3. Warranty Option Section */}
                <div className="bg-[#161A23] p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formHasWarranty}
                        onChange={(e) => setFormHasWarranty(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-[#0E121A] border-slate-700"
                      />
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Has Warranty Coverage & Protection Plan</span>
                    </label>

                    {formHasWarranty && (
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsLifetimeWarranty}
                          onChange={(e) => setFormIsLifetimeWarranty(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-emerald-500 bg-[#0E121A] border-slate-700"
                        />
                        <span>Lifetime Warranty</span>
                      </label>
                    )}
                  </div>

                  {formHasWarranty && (
                    <div className="space-y-3 pt-2 border-t border-slate-800 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Warranty Type
                          </label>
                          <select
                            value={formWarrantyType}
                            onChange={(e) => setFormWarrantyType(e.target.value as ApplianceItem['warrantyType'])}
                            className="w-full bg-[#0E121A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="Manufacturer">Manufacturer Warranty (Standard)</option>
                            <option value="Extended">Extended Protection Plan (Allstate / SquareTrade)</option>
                            <option value="Home Warranty">Home Warranty Plan (AHS / Choice)</option>
                            <option value="Store / Retailer">Store / Retailer Plan (Home Depot / Lowe's)</option>
                            <option value="Lifetime">Lifetime Warranty</option>
                            <option value="Other">Other Warranty</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Warranty Expiration Date
                          </label>
                          <input
                            type="date"
                            disabled={formIsLifetimeWarranty}
                            value={formIsLifetimeWarranty ? '' : formWarrantyExpirationDate}
                            onChange={(e) => setFormWarrantyExpirationDate(e.target.value)}
                            placeholder={formIsLifetimeWarranty ? 'Lifetime Warranty' : ''}
                            className="w-full bg-[#0E121A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Warranty Provider / Company
                          </label>
                          <input
                            type="text"
                            value={formWarrantyProvider}
                            onChange={(e) => setFormWarrantyProvider(e.target.value)}
                            placeholder="e.g. Whirlpool Care, American Home Shield"
                            className="w-full bg-[#0E121A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Policy #, Phone, Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Policy / Contract / Claim Number
                          </label>
                          <input
                            type="text"
                            value={formWarrantyPolicyNumber}
                            onChange={(e) => setFormWarrantyPolicyNumber(e.target.value)}
                            placeholder="e.g. WAR-839201-B"
                            className="w-full bg-[#0E121A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Warranty Support Phone #
                          </label>
                          <input
                            type="text"
                            value={formWarrantyContactPhone}
                            onChange={(e) => setFormWarrantyContactPhone(e.target.value)}
                            placeholder="e.g. 1-800-253-1301"
                            className="w-full bg-[#0E121A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Support Email / Portal URL
                          </label>
                          <input
                            type="text"
                            value={formWarrantyContactEmail}
                            onChange={(e) => setFormWarrantyContactEmail(e.target.value)}
                            placeholder="e.g. claims@whirlpool.com"
                            className="w-full bg-[#0E121A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Coverage Details */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Coverage Notes & Claim Instructions
                        </label>
                        <textarea
                          rows={2}
                          value={formWarrantyCoverageNotes}
                          onChange={(e) => setFormWarrantyCoverageNotes(e.target.value)}
                          placeholder="e.g. 100% parts and labor covered. In-home technician service included. Zero deductible."
                          className="w-full bg-[#0E121A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Purchase Receipt & Warranty Document Attachment (Always Available) */}
                <div className="bg-[#11141B] border border-slate-800 rounded-xl p-3 sm:p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Purchase Receipt &amp; Warranty Invoice (Proof of Purchase)</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Saved for Future Claims
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Upload your store purchase receipt, invoice, or extended warranty certificate (PDF or photo) so you always have official proof of purchase ready for claims.
                  </p>
                  <ReceiptUploadDropzone
                    receiptUrl={formReceiptUrl}
                    receiptFileName={formReceiptFileName}
                    receiptFileType={formReceiptFileType}
                    receiptFileSize={formReceiptFileSize}
                    onReceiptChange={(data) => {
                      setFormReceiptUrl(data.receiptUrl);
                      setFormReceiptFileName(data.receiptFileName);
                      setFormReceiptFileType(data.receiptFileType);
                      setFormReceiptFileSize(data.receiptFileSize);
                      setFormReceiptUploadedAt(data.receiptUploadedAt);
                    }}
                    onPreviewClick={() => {
                      if (formReceiptUrl) {
                        setViewerAppliance({
                          id: editingApplianceId || 'preview',
                          name: formName || 'Appliance',
                          brand: formBrand,
                          modelNumber: formModelNumber,
                          serialNumber: formSerialNumber,
                          boughtDate: formBoughtDate,
                          purchasePrice: parseFloat(formPurchasePrice) || undefined,
                          vendorOrStore: formVendorOrStore,
                          hasWarranty: formHasWarranty,
                          warrantyType: formWarrantyType,
                          warrantyExpirationDate: formWarrantyExpirationDate,
                          warrantyProvider: formWarrantyProvider,
                          warrantyPolicyNumber: formWarrantyPolicyNumber,
                          warrantyContactPhone: formWarrantyContactPhone,
                          warrantyContactEmail: formWarrantyContactEmail,
                          warrantyCoverageNotes: formWarrantyCoverageNotes,
                          receiptUrl: formReceiptUrl,
                          receiptFileName: formReceiptFileName,
                          receiptFileType: formReceiptFileType,
                          receiptFileSize: formReceiptFileSize,
                          receiptUploadedAt: formReceiptUploadedAt,
                        });
                        setIsViewerOpen(true);
                      }
                    }}
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    General Appliance Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Installed with braided stainless supply lines. User manual in kitchen drawer."
                    className="w-full bg-[#161A23] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingOrEditing(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingApplianceId ? 'Update Appliance' : 'Save Appliance'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center bg-[#11141B] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-[#161A23] text-white shadow-xs border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Appliances ({appliances.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('warranty')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  filter === 'warranty' ? 'bg-emerald-500/20 text-emerald-300 shadow-xs border border-emerald-500/40' : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Under Warranty ({activeWarrantyCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('expired')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  filter === 'expired' ? 'bg-rose-500/20 text-rose-300 shadow-xs border border-rose-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Expired / None ({appliances.length - activeWarrantyCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddForm()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Appliance</span>
            </button>
          </div>

          {/* Appliances List */}
          {filteredAppliances.length === 0 ? (
            <div className="bg-[#11141B] border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No Appliances Recorded for this Unit Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Keep track of when appliances were purchased, their warranties, policy numbers, and service contacts for quick repairs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddForm()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Appliance</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppliances.map((app) => {
                const ws = getWarrantyStatus(app);

                return (
                  <div
                    key={app.id}
                    className="bg-[#11141B] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4.5 space-y-3.5 transition-all shadow-md flex flex-col justify-between"
                  >
                    {/* Top Row: Name & Warranty Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                            {COMMON_APPLIANCES.find((c) => c.name.toLowerCase().includes(app.name.toLowerCase()))?.icon || '📦'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {app.name}
                            </h4>
                            <span className="text-xs text-slate-400 font-medium">
                              {app.brand || 'Standard Brand'} {app.modelNumber ? `• Mod: ${app.modelNumber}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Warranty Status Badge */}
                        <div className="shrink-0 text-right">
                          {ws.color === 'emerald' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Warranty Active</span>
                            </span>
                          )}
                          {ws.color === 'amber' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              <span>Expiring Soon</span>
                            </span>
                          )}
                          {ws.color === 'rose' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                              <ShieldX className="w-3.5 h-3.5 text-rose-400" />
                              <span>Expired</span>
                            </span>
                          )}
                          {ws.color === 'slate' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium">
                              No Warranty
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bought Date & Purchase Specs */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-[#0E121A] p-2.5 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Bought Date</span>
                          <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            {app.boughtDate}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Purchase Info</span>
                          <span className="font-semibold text-slate-200 block mt-0.5 truncate">
                            {app.purchasePrice ? formatCurrency(app.purchasePrice) : 'Cost N/A'}
                            {app.vendorOrStore ? ` • ${app.vendorOrStore}` : ''}
                          </span>
                        </div>

                        {app.serialNumber && (
                          <div className="col-span-2 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">Serial #: <span className="font-mono text-slate-300 font-semibold">{app.serialNumber}</span></span>
                            <button
                              type="button"
                              onClick={() => handleCopyPolicy(app.id + '-serial', app.serialNumber || '')}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {copiedPolicyId === app.id + '-serial' ? (
                                <span className="text-emerald-400 font-semibold">Copied</span>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Detailed Warranty Information Box */}
                      {app.hasWarranty && (
                        <div className="mt-2.5 bg-blue-950/20 border border-blue-500/20 rounded-xl p-2.5 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-blue-300 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                              {app.warrantyProvider || app.warrantyType || 'Warranty Coverage'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {app.warrantyType === 'Lifetime' 
                                ? 'Lifetime' 
                                : app.warrantyExpirationDate ? `Expires: ${app.warrantyExpirationDate}` : 'Active'}
                            </span>
                          </div>

                          {/* Policy Number with 1-click copy */}
                          {app.warrantyPolicyNumber && (
                            <div className="flex items-center justify-between bg-[#0E121A] px-2 py-1 rounded-lg text-[11px]">
                              <span className="text-slate-400">Policy / Claim #: <strong className="text-white font-mono">{app.warrantyPolicyNumber}</strong></span>
                              <button
                                type="button"
                                onClick={() => handleCopyPolicy(app.id, app.warrantyPolicyNumber || '')}
                                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 cursor-pointer font-medium"
                              >
                                {copiedPolicyId === app.id ? (
                                  <span className="text-emerald-400 font-semibold">Copied!</span>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Phone & Email contact */}
                          {(app.warrantyContactPhone || app.warrantyContactEmail) && (
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 pt-0.5">
                              {app.warrantyContactPhone && (
                                <a
                                  href={`tel:${app.warrantyContactPhone}`}
                                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                                >
                                  <Phone className="w-3 h-3 text-emerald-400" />
                                  <span>{app.warrantyContactPhone}</span>
                                </a>
                              )}
                              {app.warrantyContactEmail && (
                                <a
                                  href={`mailto:${app.warrantyContactEmail}`}
                                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white truncate max-w-[200px]"
                                >
                                  <Mail className="w-3 h-3 text-blue-400" />
                                  <span>{app.warrantyContactEmail}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Coverage notes */}
                          {app.warrantyCoverageNotes && (
                            <p className="text-[10px] text-slate-400 italic pt-0.5 border-t border-blue-500/10">
                              {app.warrantyCoverageNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Receipt & Proof of Purchase Document */}
                      {app.receiptUrl ? (
                        <div className="mt-2.5 bg-emerald-950/20 border border-emerald-500/25 rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-[260px]">
                                  {app.receiptFileName || 'Proof of Purchase Receipt'}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                                  Receipt Saved
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                                {app.receiptFileSize ? (
                                  <span>{app.receiptFileSize < 1024 * 1024 ? `${(app.receiptFileSize / 1024).toFixed(0)} KB` : `${(app.receiptFileSize / (1024 * 1024)).toFixed(1)} MB`}</span>
                                ) : null}
                                <span>•</span>
                                <span>{app.receiptUploadedAt ? `Saved ${new Date(app.receiptUploadedAt).toLocaleDateString()}` : 'Warranty Invoice'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setViewerAppliance(app);
                                setIsViewerOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                              title="View full receipt"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                            <label className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer transition-colors" title="Replace with a new receipt document">
                              <span>Replace</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleDirectUploadReceipt(app, file);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 italic">No receipt attached</span>
                          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Receipt (PDF / Photo)</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDirectUploadReceipt(app, file);
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {app.notes && (
                        <p className="text-[11px] text-slate-400 mt-2 italic">
                          Note: {app.notes}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500">
                        ID: {app.id.slice(-6)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(app)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit appliance details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAppliance(app.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete appliance"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#11141B] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {unit.name} &bull; {appliances.length} appliance{appliances.length !== 1 ? 's' : ''} on record
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Full-Featured Receipt & Warranty Document Viewer */}
      <ReceiptViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewerAppliance(null);
        }}
        appliance={viewerAppliance}
        unitName={unit.name}
        propertyName={property.name}
        onDeleteReceipt={() => {
          if (!viewerAppliance) return;
          const updatedApp: ApplianceItem = {
            ...viewerAppliance,
            receiptUrl: undefined,
            receiptFileName: undefined,
            receiptFileType: undefined,
            receiptFileSize: undefined,
            receiptUploadedAt: undefined,
          };
          const updatedList = appliances.map((a) => a.id === updatedApp.id ? updatedApp : a);
          onUpdateUnit({ ...unit, appliances: updatedList });
          if (editingApplianceId === updatedApp.id) {
            setFormReceiptUrl(undefined);
            setFormReceiptFileName(undefined);
            setFormReceiptFileType(undefined);
            setFormReceiptFileSize(undefined);
            setFormReceiptUploadedAt(undefined);
          }
          setIsViewerOpen(false);
          setViewerAppliance(null);
        }}
        onReplaceReceipt={(file: File) => {
          if (!viewerAppliance) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const updatedApp: ApplianceItem = {
              ...viewerAppliance,
              receiptUrl: dataUrl,
              receiptFileName: file.name,
              receiptFileType: file.type || 'image/jpeg',
              receiptFileSize: file.size,
              receiptUploadedAt: new Date().toISOString(),
            };
            const updatedList = appliances.map((a) => a.id === updatedApp.id ? updatedApp : a);
            onUpdateUnit({ ...unit, appliances: updatedList });
            setViewerAppliance(updatedApp);
            if (editingApplianceId === updatedApp.id) {
              setFormReceiptUrl(dataUrl);
              setFormReceiptFileName(file.name);
              setFormReceiptFileType(file.type || 'image/jpeg');
              setFormReceiptFileSize(file.size);
              setFormReceiptUploadedAt(updatedApp.receiptUploadedAt);
            }
          };
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
};
