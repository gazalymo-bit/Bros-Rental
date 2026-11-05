import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Plus, 
  Search, 
  Building2, 
  Home, 
  Calendar, 
  DollarSign, 
  Store, 
  Edit3, 
  Trash2, 
  FileDown, 
  Clock, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Filter,
  CheckCircle2,
  Layers,
  X,
  Info,
  RotateCcw,
  FileText,
  Eye,
  Download,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';
import { Property, UnitRental, ApplianceItem } from '../types';
import { formatCurrency } from '../utils/calculations';
import { ReceiptUploadDropzone } from './ReceiptUploadDropzone';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface AppliancesViewProps {
  properties: Property[];
  activePropertyId?: string;
  onUpdateProperty: (updatedProperty: Property) => void;
  onSelectProperty?: (id: string) => void;
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

export const AppliancesView: React.FC<AppliancesViewProps> = ({
  properties,
  activePropertyId,
  onUpdateProperty,
  onSelectProperty,
}) => {
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [warrantyStatusFilter, setWarrantyStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'none'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalPropertyId, setModalPropertyId] = useState<string>('');
  const [modalUnitId, setModalUnitId] = useState<string>('');
  const [editingApplianceId, setEditingApplianceId] = useState<string | null>(null);

  // Form Fields
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
  const [formReceiptUrl, setFormReceiptUrl] = useState<string | undefined>(undefined);
  const [formReceiptFileName, setFormReceiptFileName] = useState<string | undefined>(undefined);
  const [formReceiptFileType, setFormReceiptFileType] = useState<string | undefined>(undefined);
  const [formReceiptFileSize, setFormReceiptFileSize] = useState<number | undefined>(undefined);
  const [formReceiptUploadedAt, setFormReceiptUploadedAt] = useState<string | undefined>(undefined);
  const [formNotes, setFormNotes] = useState<string>('');

  // Receipt Viewer Modal state
  const [viewerAppliance, setViewerAppliance] = useState<ApplianceItem | null>(null);
  const [viewerUnitName, setViewerUnitName] = useState<string>('');
  const [viewerPropertyName, setViewerPropertyName] = useState<string>('');
  const [viewerProperty, setViewerProperty] = useState<Property | null>(null);
  const [viewerUnit, setViewerUnit] = useState<UnitRental | null>(null);

  // Flatten all appliances across properties & units
  const allAppliancesList = useMemo(() => {
    const list: Array<{
      property: Property;
      unit: UnitRental;
      appliance: ApplianceItem;
    }> = [];

    properties.forEach((prop) => {
      (prop.units || []).forEach((unit) => {
        (unit.appliances || []).forEach((app) => {
          list.push({
            property: prop,
            unit,
            appliance: app,
          });
        });
      });
    });

    return list;
  }, [properties]);

  // Today reference
  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Helper: compute warranty status
  const getWarrantyStatus = (app: ApplianceItem): 'active' | 'expiring' | 'expired' | 'lifetime' | 'none' => {
    if (!app.hasWarranty) return 'none';
    if (app.warrantyType === 'Lifetime') return 'lifetime';
    if (!app.warrantyExpirationDate) return 'active';

    const expDate = new Date(app.warrantyExpirationDate + 'T23:59:59');
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 60) return 'expiring';
    return 'active';
  };

  // Helper: check if warranty is currently active (unexpired)
  const isWarrantyActive = (app: ApplianceItem): boolean => {
    const st = getWarrantyStatus(app);
    return st === 'active' || st === 'lifetime' || st === 'expiring';
  };

  // Helper: days remaining or expired text
  const getWarrantyRemainingText = (app: ApplianceItem): string => {
    if (!app.hasWarranty) return 'No warranty recorded';
    if (app.warrantyType === 'Lifetime') return 'Lifetime coverage';
    if (!app.warrantyExpirationDate) return 'Active warranty';

    const expDate = new Date(app.warrantyExpirationDate + 'T23:59:59');
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      if (absDays > 365) {
        return `Expired ${(absDays / 365).toFixed(1)} yrs ago`;
      }
      return `Expired ${absDays} days ago`;
    }
    if (diffDays === 0) return 'Expires today!';
    if (diffDays <= 60) return `${diffDays} days left`;
    if (diffDays <= 365) return `${Math.round(diffDays / 30)} mos remaining`;
    return `${(diffDays / 365).toFixed(1)} yrs remaining`;
  };

  // Filtered appliances list
  const filteredAppliances = useMemo(() => {
    return allAppliancesList.filter((item) => {
      // Property filter
      if (selectedPropertyFilter !== 'all' && item.property.id !== selectedPropertyFilter) {
        return false;
      }
      // Unit filter
      if (selectedUnitFilter !== 'all' && item.unit.id !== selectedUnitFilter) {
        return false;
      }
      // Warranty status filter
      if (warrantyStatusFilter !== 'all') {
        const st = getWarrantyStatus(item.appliance);
        if (warrantyStatusFilter === 'active') {
          // Both active, lifetime, and expiring are active warranties!
          if (st !== 'active' && st !== 'lifetime' && st !== 'expiring') return false;
        } else if (warrantyStatusFilter === 'expiring') {
          if (st !== 'expiring') return false;
        } else if (warrantyStatusFilter === 'expired') {
          if (st !== 'expired') return false;
        } else if (warrantyStatusFilter === 'none') {
          if (st !== 'none') return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const app = item.appliance;
        const matches = 
          app.name.toLowerCase().includes(q) ||
          (app.brand && app.brand.toLowerCase().includes(q)) ||
          (app.modelNumber && app.modelNumber.toLowerCase().includes(q)) ||
          (app.serialNumber && app.serialNumber.toLowerCase().includes(q)) ||
          (app.warrantyProvider && app.warrantyProvider.toLowerCase().includes(q)) ||
          (app.warrantyPolicyNumber && app.warrantyPolicyNumber.toLowerCase().includes(q)) ||
          item.property.name.toLowerCase().includes(q) ||
          item.unit.name.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [allAppliancesList, selectedPropertyFilter, selectedUnitFilter, warrantyStatusFilter, searchQuery]);

  // Key KPI metrics across entire portfolio
  const kpis = useMemo(() => {
    let totalValue = 0;
    let activeWarranties = 0;
    let expiringSoon = 0;
    let expiredCount = 0;

    allAppliancesList.forEach((item) => {
      const price = Number(item.appliance.purchasePrice) || 0;
      totalValue += price;

      const st = getWarrantyStatus(item.appliance);
      if (st === 'active' || st === 'lifetime' || st === 'expiring') activeWarranties++;
      if (st === 'expiring') expiringSoon++;
      else if (st === 'expired') expiredCount++;
    });

    return {
      totalCount: allAppliancesList.length,
      totalValue,
      activeWarranties,
      expiringSoon,
      expiredCount,
    };
  }, [allAppliancesList]);

  // Scoped count for currently selected property/unit (if filtered)
  const scopedAppliancesList = useMemo(() => {
    return allAppliancesList.filter((item) => {
      if (selectedPropertyFilter !== 'all' && item.property.id !== selectedPropertyFilter) return false;
      if (selectedUnitFilter !== 'all' && item.unit.id !== selectedUnitFilter) return false;
      return true;
    });
  }, [allAppliancesList, selectedPropertyFilter, selectedUnitFilter]);

  const scopedKpis = useMemo(() => {
    let active = 0;
    let expiring = 0;
    let expired = 0;
    let none = 0;

    scopedAppliancesList.forEach((item) => {
      const st = getWarrantyStatus(item.appliance);
      if (st === 'active' || st === 'lifetime' || st === 'expiring') active++;
      if (st === 'expiring') expiring++;
      else if (st === 'expired') expired++;
      else if (st === 'none') none++;
    });

    return {
      total: scopedAppliancesList.length,
      active,
      expiring,
      expired,
      none,
    };
  }, [scopedAppliancesList]);

  // Count per property
  const propertyCounts = useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    properties.forEach((p) => {
      let total = 0;
      let active = 0;
      (p.units || []).forEach((u) => {
        (u.appliances || []).forEach((a) => {
          total++;
          const st = getWarrantyStatus(a);
          if (st === 'active' || st === 'lifetime' || st === 'expiring') active++;
        });
      });
      map.set(p.id, { total, active });
    });
    return map;
  }, [properties]);

  // Copy handler
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open modal for adding
  const handleOpenAddModal = (presetPropId?: string, presetUnitId?: string, presetApp?: { name: string; brand: string }) => {
    setEditingApplianceId(null);
    const propId = presetPropId || (selectedPropertyFilter !== 'all' ? selectedPropertyFilter : (activePropertyId || properties[0]?.id || ''));
    const prop = properties.find((p) => p.id === propId) || properties[0];
    const unitId = presetUnitId || (selectedUnitFilter !== 'all' ? selectedUnitFilter : (prop?.units?.[0]?.id || ''));

    setModalPropertyId(propId);
    setModalUnitId(unitId);

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    setFormName(presetApp?.name || 'Refrigerator');
    setFormBrand(presetApp?.brand || '');
    setFormModelNumber('');
    setFormSerialNumber('');
    setFormBoughtDate(today);
    setFormPurchasePrice('');
    setFormVendorOrStore('Home Depot');
    setFormHasWarranty(true);
    setFormIsLifetimeWarranty(false);
    setFormWarrantyType('Manufacturer');
    setFormWarrantyExpirationDate(nextYear.toISOString().split('T')[0]);
    setFormWarrantyProvider(presetApp?.brand ? `${presetApp.brand} Protection` : 'Manufacturer Warranty');
    setFormWarrantyPolicyNumber('');
    setFormWarrantyContactPhone('');
    setFormWarrantyContactEmail('');
    setFormWarrantyCoverageNotes('');
    setFormReceiptUrl(undefined);
    setFormReceiptFileName(undefined);
    setFormReceiptFileType(undefined);
    setFormReceiptFileSize(undefined);
    setFormReceiptUploadedAt(undefined);
    setFormNotes('');

    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (prop: Property, unit: UnitRental, app: ApplianceItem) => {
    setEditingApplianceId(app.id);
    setModalPropertyId(prop.id);
    setModalUnitId(unit.id);

    setFormName(app.name || 'Refrigerator');
    setFormBrand(app.brand || '');
    setFormModelNumber(app.modelNumber || '');
    setFormSerialNumber(app.serialNumber || '');
    setFormBoughtDate(app.boughtDate || today);
    setFormPurchasePrice(app.purchasePrice ? String(app.purchasePrice) : '');
    setFormVendorOrStore(app.vendorOrStore || 'Home Depot');
    setFormHasWarranty(app.hasWarranty);
    setFormIsLifetimeWarranty(app.warrantyType === 'Lifetime');
    setFormWarrantyType(app.warrantyType || 'Manufacturer');
    setFormWarrantyExpirationDate(app.warrantyExpirationDate || '');
    setFormWarrantyProvider(app.warrantyProvider || '');
    setFormWarrantyPolicyNumber(app.warrantyPolicyNumber || '');
    setFormWarrantyContactPhone(app.warrantyContactPhone || '');
    setFormWarrantyContactEmail(app.warrantyContactEmail || '');
    setFormWarrantyCoverageNotes(app.warrantyCoverageNotes || '');
    setFormReceiptUrl(app.receiptUrl);
    setFormReceiptFileName(app.receiptFileName);
    setFormReceiptFileType(app.receiptFileType);
    setFormReceiptFileSize(app.receiptFileSize);
    setFormReceiptUploadedAt(app.receiptUploadedAt);
    setFormNotes(app.notes || '');

    setIsModalOpen(true);
  };

  // Save appliance form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPropertyId || !modalUnitId) return;

    const prop = properties.find((p) => p.id === modalPropertyId);
    if (!prop) return;

    const unit = (prop.units || []).find((u) => u.id === modalUnitId);
    if (!unit) return;

    const applianceData: ApplianceItem = {
      id: editingApplianceId || `app-${Date.now()}`,
      name: formName.trim() || 'Appliance',
      brand: formBrand.trim() || undefined,
      modelNumber: formModelNumber.trim() || undefined,
      serialNumber: formSerialNumber.trim() || undefined,
      boughtDate: formBoughtDate || today,
      purchasePrice: formPurchasePrice ? parseFloat(formPurchasePrice) : undefined,
      vendorOrStore: formVendorOrStore.trim() || undefined,
      hasWarranty: formHasWarranty,
      warrantyType: formIsLifetimeWarranty ? 'Lifetime' : formWarrantyType,
      warrantyExpirationDate: (!formIsLifetimeWarranty && formHasWarranty && formWarrantyExpirationDate) ? formWarrantyExpirationDate : undefined,
      warrantyProvider: formHasWarranty ? formWarrantyProvider.trim() || undefined : undefined,
      warrantyPolicyNumber: formHasWarranty ? formWarrantyPolicyNumber.trim() || undefined : undefined,
      warrantyContactPhone: formHasWarranty ? formWarrantyContactPhone.trim() || undefined : undefined,
      warrantyContactEmail: formHasWarranty ? formWarrantyContactEmail.trim() || undefined : undefined,
      warrantyCoverageNotes: formHasWarranty ? formWarrantyCoverageNotes.trim() || undefined : undefined,
      receiptUrl: formReceiptUrl,
      receiptFileName: formReceiptFileName,
      receiptFileType: formReceiptFileType,
      receiptFileSize: formReceiptFileSize,
      receiptUploadedAt: formReceiptUploadedAt,
      notes: formNotes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    const currentAppliances = unit.appliances || [];
    let updatedAppliances: ApplianceItem[];

    if (editingApplianceId) {
      updatedAppliances = currentAppliances.map((a) => (a.id === editingApplianceId ? applianceData : a));
    } else {
      updatedAppliances = [...currentAppliances, { ...applianceData, createdAt: new Date().toISOString() }];
    }

    const updatedUnits = prop.units.map((u) => (u.id === unit.id ? { ...u, appliances: updatedAppliances } : u));
    onUpdateProperty({ ...prop, units: updatedUnits });

    // Ensure the saved/edited appliance is immediately visible in view
    if (selectedPropertyFilter !== 'all' && selectedPropertyFilter !== modalPropertyId) {
      setSelectedPropertyFilter(modalPropertyId);
    }
    if (warrantyStatusFilter !== 'all') {
      setWarrantyStatusFilter('all');
    }
    setSearchQuery('');

    setIsModalOpen(false);
  };

  // Delete appliance
  const handleDeleteAppliance = (prop: Property, unit: UnitRental, app: ApplianceItem) => {
    if (!window.confirm(`Delete "${app.name}" (${app.brand || 'Appliance'}) from ${prop.name} - ${unit.name}?`)) {
      return;
    }

    const currentAppliances = unit.appliances || [];
    const updatedAppliances = currentAppliances.filter((a) => a.id !== app.id);
    const updatedUnits = prop.units.map((u) => (u.id === unit.id ? { ...u, appliances: updatedAppliances } : u));
    onUpdateProperty({ ...prop, units: updatedUnits });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Property Name',
      'Unit Name',
      'Appliance Name',
      'Brand',
      'Model Number',
      'Serial Number',
      'Bought Date',
      'Purchase Price',
      'Store / Vendor',
      'Has Warranty',
      'Warranty Type',
      'Warranty Expiration',
      'Warranty Status',
      'Warranty Provider',
      'Policy Number',
      'Contact Phone',
      'Contact Email',
      'Coverage Details',
      'Notes'
    ];

    const rows = allAppliancesList.map((item) => {
      const a = item.appliance;
      const st = getWarrantyStatus(a);
      return [
        `"${item.property.name.replace(/"/g, '""')}"`,
        `"${item.unit.name.replace(/"/g, '""')}"`,
        `"${a.name.replace(/"/g, '""')}"`,
        `"${(a.brand || '').replace(/"/g, '""')}"`,
        `"${(a.modelNumber || '').replace(/"/g, '""')}"`,
        `"${(a.serialNumber || '').replace(/"/g, '""')}"`,
        `"${a.boughtDate || ''}"`,
        `"${a.purchasePrice || 0}"`,
        `"${(a.vendorOrStore || '').replace(/"/g, '""')}"`,
        `"${a.hasWarranty ? 'Yes' : 'No'}"`,
        `"${(a.warrantyType || '').replace(/"/g, '""')}"`,
        `"${a.warrantyExpirationDate || ''}"`,
        `"${st.toUpperCase()}"`,
        `"${(a.warrantyProvider || '').replace(/"/g, '""')}"`,
        `"${(a.warrantyPolicyNumber || '').replace(/"/g, '""')}"`,
        `"${(a.warrantyContactPhone || '').replace(/"/g, '""')}"`,
        `"${(a.warrantyContactEmail || '').replace(/"/g, '""')}"`,
        `"${(a.warrantyCoverageNotes || '').replace(/"/g, '""')}"`,
        `"${(a.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Portfolio_Appliances_Warranties_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for setting warranty expiration date presets
  const handleSetWarrantyPresetYears = (years: number) => {
    const baseDate = formBoughtDate ? new Date(formBoughtDate) : new Date();
    baseDate.setFullYear(baseDate.getFullYear() + years);
    setFormWarrantyExpirationDate(baseDate.toISOString().split('T')[0]);
    setFormIsLifetimeWarranty(false);
  };

  // Get units for active modal property
  const modalPropertyUnits = useMemo(() => {
    const prop = properties.find((p) => p.id === modalPropertyId);
    return prop?.units || [];
  }, [properties, modalPropertyId]);

  // Shared Appliance Card Renderer
  const renderApplianceCard = (
    item: { property: Property; unit: UnitRental; appliance: ApplianceItem },
    isFallback: boolean = false
  ) => {
    const { property, unit, appliance } = item;
    const status = getWarrantyStatus(appliance);
    const remainingText = getWarrantyRemainingText(appliance);
    const isCopied = copiedId === appliance.id;

    return (
      <div
        key={`${isFallback ? 'fb-' : ''}${property.id}-${unit.id}-${appliance.id}`}
        className={`bg-[#161A23] border ${
          isFallback ? 'border-blue-500/40 hover:border-blue-500/70 shadow-blue-950/30' : 'border-slate-800 hover:border-slate-700/80'
        } rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm hover:shadow-md relative group`}
      >
        <div className="space-y-3.5">
          {/* Card Header: Name + Warranty Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-base shrink-0">
                {COMMON_APPLIANCES.find((c) => c.name.toLowerCase().includes(appliance.name.toLowerCase()))?.icon || '⚙️'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  {appliance.name}
                </h4>
                <div className="text-[11px] text-slate-400 font-medium">
                  {appliance.brand ? <strong className="text-slate-300 font-semibold">{appliance.brand}</strong> : 'Brand Unspecified'}
                  {appliance.modelNumber && ` • Mod: ${appliance.modelNumber}`}
                </div>
              </div>
            </div>

            {/* Warranty Status Pill */}
            {status === 'active' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                <span>Active</span>
              </span>
            )}
            {status === 'expiring' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                <span>Expiring Soon</span>
              </span>
            )}
            {status === 'lifetime' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                <span>Lifetime</span>
              </span>
            )}
            {status === 'expired' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                <ShieldX className="w-3 h-3" />
                <span>Expired</span>
              </span>
            )}
            {status === 'none' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                <span>No Warranty</span>
              </span>
            )}
          </div>

          {/* Property & Unit Location Badge */}
          <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-400 bg-[#0E121A] px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-300 truncate">{property.name}</span>
              <span className="text-slate-600">&bull;</span>
              <Home className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-emerald-400 font-semibold truncate">{unit.name}</span>
            </div>
            {isFallback && selectedPropertyFilter !== property.id && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPropertyFilter(property.id);
                  setSelectedUnitFilter('all');
                }}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0"
              >
                View in {property.name}
              </button>
            )}
          </div>

          {/* Serial Number & Bought Date Row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#11141B] p-2 rounded-lg border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Serial Number
              </span>
              {appliance.serialNumber ? (
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <code className="text-xs font-mono font-bold text-slate-200 truncate">
                    {appliance.serialNumber}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyText(appliance.serialNumber || '', appliance.id)}
                    className="text-slate-400 hover:text-white p-0.5"
                    title="Copy Serial #"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic mt-0.5 block">Not recorded</span>
              )}
            </div>

            <div className="bg-[#11141B] p-2 rounded-lg border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Purchase Date
              </span>
              <div className="flex items-center gap-1 text-slate-200 font-semibold mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{appliance.boughtDate || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Cost & Store */}
          {(appliance.purchasePrice || appliance.vendorOrStore) && (
            <div className="flex items-center justify-between text-xs text-slate-300 px-1">
              {appliance.purchasePrice ? (
                <span>
                  Cost: <strong className="text-white font-bold">{formatCurrency(appliance.purchasePrice)}</strong>
                </span>
              ) : <span />}
              {appliance.vendorOrStore && (
                <span className="text-slate-400 flex items-center gap-1">
                  <Store className="w-3 h-3 text-slate-500" />
                  <span>{appliance.vendorOrStore}</span>
                </span>
              )}
            </div>
          )}

          {/* Warranty Information Box */}
          {appliance.hasWarranty ? (
            <div className={`p-2.5 rounded-xl border text-xs space-y-1.5 ${
              status === 'active' || status === 'lifetime'
                ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
                : status === 'expiring'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-rose-500/5 border-rose-500/20 text-slate-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1 text-xs">
                  {status === 'active' || status === 'lifetime' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : status === 'expiring' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <ShieldX className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{appliance.warrantyProvider || `${appliance.warrantyType || 'Appliance'} Warranty`}</span>
                </span>
                <span className="text-[11px] font-semibold opacity-90">
                  {remainingText}
                </span>
              </div>

              {appliance.warrantyPolicyNumber && (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Policy / Plan: <strong className="text-slate-200">{appliance.warrantyPolicyNumber}</strong></span>
                </div>
              )}

              {/* Phone or Email Contacts */}
              {(appliance.warrantyContactPhone || appliance.warrantyContactEmail) && (
                <div className="flex items-center gap-3 pt-1 text-[11px] border-t border-slate-800/60">
                  {appliance.warrantyContactPhone && (
                    <a
                      href={`tel:${appliance.warrantyContactPhone}`}
                      className="text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{appliance.warrantyContactPhone}</span>
                    </a>
                  )}
                  {appliance.warrantyContactEmail && (
                    <a
                      href={`mailto:${appliance.warrantyContactEmail}`}
                      className="text-blue-400 hover:underline flex items-center gap-1 truncate"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email Support</span>
                    </a>
                  )}
                </div>
              )}

              {appliance.warrantyCoverageNotes && (
                <p className="text-[10px] text-slate-400 italic line-clamp-2">
                  "{appliance.warrantyCoverageNotes}"
                </p>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#0E121A] border border-slate-800 text-xs text-slate-500">
              No warranty registered. Out of pocket replacement responsibility.
            </div>
          )}

          {/* Purchase Receipt & Warranty Attachment Badge */}
          {appliance.receiptUrl ? (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="text-[11px] font-bold text-white block truncate">
                    {appliance.receiptFileName || 'Official Purchase Receipt'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Verified Proof of Purchase
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewerAppliance(appliance);
                  setViewerUnitName(unit.name);
                  setViewerPropertyName(property.name);
                  setViewerProperty(property);
                  setViewerUnit(unit);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenEditModal(property, unit, appliance)}
              className="w-full py-1.5 px-2.5 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-[#0E121A]/60 hover:bg-[#0E121A] text-[11px] text-slate-400 hover:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Paperclip className="w-3 h-3 text-slate-500" />
              <span>Attach Receipt / Warranty Invoice</span>
            </button>
          )}

          {/* General Notes */}
          {appliance.notes && (
            <p className="text-[11px] text-slate-400 line-clamp-2 bg-[#11141B] p-2 rounded-lg border border-slate-800/50">
              {appliance.notes}
            </p>
          )}
        </div>

        {/* Card Footer: Action Buttons */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-medium">
            {appliance.boughtDate ? `Installed ${appliance.boughtDate}` : 'Log Updated'}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEditModal(property, unit, appliance)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-[#0E121A] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-blue-400" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => handleDeleteAppliance(property, unit, appliance)}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Delete Appliance"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#111622] via-[#161B26] to-[#121620] border border-blue-500/20 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Unit Appliances & Warranties
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Equipment Log & Protection
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Track purchased appliances, installation dates, serial numbers, warranty terms, provider contacts, and claims info for every unit across your portfolio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-[#1A202C] hover:bg-[#232B3B] border border-slate-700/80 transition-colors cursor-pointer"
              title="Download entire appliance and warranty ledger to CSV"
            >
              <FileDown className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Appliance</span>
            </button>
          </div>
        </div>

        {/* Quick presets row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-400" /> Quick Add:
          </span>
          {COMMON_APPLIANCES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleOpenAddModal(undefined, undefined, { name: preset.name, brand: preset.defaultBrand })}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-[#0E121A] hover:bg-blue-500/10 hover:text-blue-300 border border-slate-800 hover:border-blue-500/30 px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Key Summary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Appliances */}
        <div className="bg-[#161A23] border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Total Appliances
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-white">
                {kpis.totalCount}
              </span>
              <span className="text-xs text-slate-400">items logged</span>
            </div>
          </div>
        </div>

        {/* Active Warranties */}
        <div className="bg-[#161A23] border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Active Warranties
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">
                {kpis.activeWarranties}
              </span>
              <span className="text-xs text-slate-400">
                ({kpis.totalCount > 0 ? Math.round((kpis.activeWarranties / kpis.totalCount) * 100) : 0}% covered)
              </span>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className={`bg-[#161A23] border rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm ${
          kpis.expiringSoon > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            kpis.expiringSoon > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Expiring Soon
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-xl sm:text-2xl font-black ${kpis.expiringSoon > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {kpis.expiringSoon}
              </span>
              <span className="text-xs text-slate-400">&lt; 60 days</span>
            </div>
          </div>
        </div>

        {/* Total Investment Value */}
        <div className="bg-[#161A23] border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Capital Invested
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-purple-300">
                {formatCurrency(kpis.totalValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Toolbar */}
      <div className="bg-[#161A23] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by appliance, brand, model, serial #, warranty provider, or policy..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0E121A] border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Property Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedPropertyFilter}
              onChange={(e) => {
                setSelectedPropertyFilter(e.target.value);
                setSelectedUnitFilter('all');
              }}
              className="bg-[#0E121A] border border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Properties ({properties.length})</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Selector (if specific property picked) */}
          {selectedPropertyFilter !== 'all' && (
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="bg-[#0E121A] border border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Units</option>
                {properties
                  .find((p) => p.id === selectedPropertyFilter)
                  ?.units?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick Property Filter Pills - Fully visible multi-line wrap so no properties are hidden */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-800/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Building2 className="w-3.5 h-3.5 text-blue-400" /> All Properties ({properties.length}):
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedPropertyFilter('all');
              setSelectedUnitFilter('all');
            }}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              selectedPropertyFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400 font-bold'
                : 'bg-[#0E121A] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Properties ({allAppliancesList.length})
          </button>
          {properties.map((p) => {
            const count = propertyCounts.get(p.id)?.total || 0;
            const isSelected = selectedPropertyFilter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPropertyFilter(p.id);
                  setSelectedUnitFilter('all');
                }}
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400 font-bold'
                    : count > 0
                    ? 'bg-[#0E121A] text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500'
                    : 'bg-[#0E121A]/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                }`}
                title={`Filter by ${p.name} (${count} appliances)`}
              >
                <span>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-blue-700 text-white' : count > 0 ? 'bg-blue-500/25 text-blue-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Unit Filter Pills if a specific property is chosen */}
        {selectedPropertyFilter !== 'all' && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Home className="w-3.5 h-3.5 text-emerald-400" /> Units in {properties.find((p) => p.id === selectedPropertyFilter)?.name || 'Property'}:
            </span>
            <button
              type="button"
              onClick={() => setSelectedUnitFilter('all')}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedUnitFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'bg-[#0E121A] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Units
            </button>
            {properties.find((p) => p.id === selectedPropertyFilter)?.units?.map((u) => {
              const uCount = (u.appliances || []).length;
              const isSelected = selectedUnitFilter === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUnitFilter(u.id)}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'bg-[#0E121A] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{u.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {uCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Notice Banner if filtered property has 0 appliances but portfolio has appliances */}
        {selectedPropertyFilter !== 'all' && scopedAppliancesList.length === 0 && allAppliancesList.length > 0 && (
          <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md animate-fade-in">
            <div className="flex items-center gap-2.5 text-blue-200">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span>
                  Filtering by <strong>{properties.find((p) => p.id === selectedPropertyFilter)?.name || 'Selected Property'}</strong> (0 appliances recorded).
                </span>
                <span className="block text-slate-400 text-[11px] mt-0.5">
                  You have <strong>{allAppliancesList.length} appliance(s)</strong> ({kpis.activeWarranties} with active warranty) recorded in other properties.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPropertyFilter('all');
                setSelectedUnitFilter('all');
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              Show All ({allAppliancesList.length}) Appliances &rarr;
            </button>
          </div>
        )}

        {/* Warranty Status Filter Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            <button
              type="button"
              onClick={() => setWarrantyStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                warrantyStatusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0E121A] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All ({selectedPropertyFilter === 'all' ? allAppliancesList.length : scopedKpis.total})
            </button>
            <button
              type="button"
              onClick={() => {
                // If user clicks Active and the currently filtered property has 0 active appliances,
                // but there are active appliances across the portfolio, automatically set property filter to 'all'
                if (selectedPropertyFilter !== 'all' && scopedKpis.active === 0 && kpis.activeWarranties > 0) {
                  setSelectedPropertyFilter('all');
                  setSelectedUnitFilter('all');
                }
                setWarrantyStatusFilter('active');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                warrantyStatusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Active ({selectedPropertyFilter === 'all' ? kpis.activeWarranties : scopedKpis.active})</span>
              {selectedPropertyFilter !== 'all' && scopedKpis.active === 0 && kpis.activeWarranties > 0 && (
                <span className="text-[10px] bg-emerald-400/25 text-emerald-200 px-1.5 py-0.2 rounded font-bold">
                  {kpis.activeWarranties} in portfolio
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setWarrantyStatusFilter('expiring')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                warrantyStatusFilter === 'expiring'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Expiring Soon ({selectedPropertyFilter === 'all' ? kpis.expiringSoon : scopedKpis.expiring})</span>
            </button>
            <button
              type="button"
              onClick={() => setWarrantyStatusFilter('expired')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                warrantyStatusFilter === 'expired'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
              }`}
            >
              <ShieldX className="w-3.5 h-3.5" />
              <span>Expired ({selectedPropertyFilter === 'all' ? kpis.expiredCount : scopedKpis.expired})</span>
            </button>
            <button
              type="button"
              onClick={() => setWarrantyStatusFilter('none')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                warrantyStatusFilter === 'none'
                  ? 'bg-slate-700 text-white'
                  : 'bg-[#0E121A] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              No Warranty ({selectedPropertyFilter === 'all' ? allAppliancesList.filter((item) => !item.appliance.hasWarranty).length : scopedKpis.none})
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{filteredAppliances.length}</strong> of {allAppliancesList.length} appliances
          </span>
        </div>
      </div>

      {/* 4. Appliances Content Grid / List */}
      {filteredAppliances.length === 0 ? (
        <div className="space-y-5">
          <div className="bg-[#161A23] border border-dashed border-slate-800 rounded-2xl p-8 sm:p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {allAppliancesList.length > 0 ? 'No Appliances Match Current Filter' : 'No Appliances Found'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {allAppliancesList.length > 0
                  ? `Your portfolio has ${allAppliancesList.length} appliance(s) (${kpis.activeWarranties} with active warranty), but none matched the current view (${selectedPropertyFilter !== 'all' ? `Property: ${properties.find((p) => p.id === selectedPropertyFilter)?.name || selectedPropertyFilter}` : 'All Properties'}${warrantyStatusFilter !== 'all' ? `, Status: ${warrantyStatusFilter}` : ''}${searchQuery ? `, Search: "${searchQuery}"` : ''}).`
                  : 'Start tracking refrigerators, dishwashers, HVAC systems, water heaters, and their warranties.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 flex-wrap pt-2">
              {allAppliancesList.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPropertyFilter('all');
                      setSelectedUnitFilter('all');
                      setWarrantyStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/30 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Show All Portfolio Appliances ({allAppliancesList.length})</span>
                  </button>
                  {kpis.activeWarranties > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPropertyFilter('all');
                        setSelectedUnitFilter('all');
                        setWarrantyStatusFilter('active');
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Show Active Warranties ({kpis.activeWarranties})</span>
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Appliance</span>
              </button>
            </div>
          </div>

          {/* If appliances exist across the portfolio, display them right here below so user never loses sight of them! */}
          {allAppliancesList.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>All Portfolio Appliances ({allAppliancesList.length} Items Logged):</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPropertyFilter('all');
                    setSelectedUnitFilter('all');
                    setWarrantyStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Clear all filters to view full ledger &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allAppliancesList.map((item) => renderApplianceCard(item, true))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppliances.map((item) => renderApplianceCard(item, false))}
        </div>
      )}

      {/* 5. ADD / EDIT APPLIANCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#161A23] border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-[#11141B] px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingApplianceId ? 'Edit Appliance & Warranty' : 'Add Unit Appliance'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Record bought date, model details, and warranty terms
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Property & Unit Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Property *
                  </label>
                  <select
                    value={modalPropertyId}
                    onChange={(e) => {
                      const newPropId = e.target.value;
                      setModalPropertyId(newPropId);
                      const prop = properties.find((p) => p.id === newPropId);
                      if (prop?.units?.[0]) {
                        setModalUnitId(prop.units[0].id);
                      }
                    }}
                    required
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unit *
                  </label>
                  <select
                    value={modalUnitId}
                    onChange={(e) => setModalUnitId(e.target.value)}
                    required
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {modalPropertyUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Appliance Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Appliance Preset
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_APPLIANCES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setFormName(preset.name);
                        if (!formBrand) setFormBrand(preset.defaultBrand);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        formName.toLowerCase() === preset.name.toLowerCase()
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#0E121A] text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {preset.icon} {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Appliance Type / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Refrigerator, Washer"
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Whirlpool, Bosch, Carrier"
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Model & Serial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={formModelNumber}
                    onChange={(e) => setFormModelNumber(e.target.value)}
                    placeholder="e.g. WRF535SWHZ"
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Serial Number (for claims & repairs)
                  </label>
                  <input
                    type="text"
                    value={formSerialNumber}
                    onChange={(e) => setFormSerialNumber(e.target.value)}
                    placeholder="e.g. HR-8921049"
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Purchase Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bought / Installed Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formBoughtDate}
                    onChange={(e) => setFormBoughtDate(e.target.value)}
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Purchase Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    placeholder="1299"
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-emerald-400 font-medium block mt-1">
                    ✓ Automatically calculated into Maintenance, Fixes &amp; Repairs expenses on statement
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store / Retailer
                  </label>
                  <input
                    type="text"
                    value={formVendorOrStore}
                    onChange={(e) => setFormVendorOrStore(e.target.value)}
                    placeholder="e.g. Home Depot, Lowe's"
                    className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Warranty Section */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formHasWarranty}
                      onChange={(e) => setFormHasWarranty(e.target.checked)}
                      className="rounded text-blue-500 focus:ring-blue-500 bg-[#0E121A] border-slate-700"
                    />
                    <span>Has Warranty Coverage</span>
                  </label>

                  {formHasWarranty && (
                    <label className="flex items-center gap-1.5 text-xs text-purple-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsLifetimeWarranty}
                        onChange={(e) => setFormIsLifetimeWarranty(e.target.checked)}
                        className="rounded text-purple-500 focus:ring-purple-500 bg-[#0E121A] border-slate-700"
                      />
                      <span>Lifetime Warranty</span>
                    </label>
                  )}
                </div>

                {formHasWarranty && !formIsLifetimeWarranty && (
                  <div className="space-y-3 pt-2 border-t border-blue-500/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Warranty Type
                        </label>
                        <select
                          value={formWarrantyType}
                          onChange={(e) => setFormWarrantyType(e.target.value as any)}
                          className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="Manufacturer">Manufacturer Warranty</option>
                          <option value="Extended">Extended Service Contract</option>
                          <option value="Home Warranty">Whole Home Warranty Policy</option>
                          <option value="Store / Retailer">Store Protection Plan (e.g. Allstate)</option>
                          <option value="Other">Other Warranty</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Expiration Date
                        </label>
                        <input
                          type="date"
                          value={formWarrantyExpirationDate}
                          onChange={(e) => setFormWarrantyExpirationDate(e.target.value)}
                          className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick Expiration Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Set Duration:
                      </span>
                      {[
                        { label: '+1 Year', years: 1 },
                        { label: '+2 Years', years: 2 },
                        { label: '+5 Years', years: 5 },
                        { label: '+10 Years (HVAC)', years: 10 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleSetWarrantyPresetYears(item.years)}
                          className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Provider / Carrier Name
                        </label>
                        <input
                          type="text"
                          value={formWarrantyProvider}
                          onChange={(e) => setFormWarrantyProvider(e.target.value)}
                          placeholder="e.g. American Home Shield, Allstate"
                          className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Policy / Plan / Contract #
                        </label>
                        <input
                          type="text"
                          value={formWarrantyPolicyNumber}
                          onChange={(e) => setFormWarrantyPolicyNumber(e.target.value)}
                          placeholder="e.g. POL-839201"
                          className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Claims Phone #
                        </label>
                        <input
                          type="tel"
                          value={formWarrantyContactPhone}
                          onChange={(e) => setFormWarrantyContactPhone(e.target.value)}
                          placeholder="1-800-466-3337"
                          className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Claims Email / Portal
                        </label>
                        <input
                          type="text"
                          value={formWarrantyContactEmail}
                          onChange={(e) => setFormWarrantyContactEmail(e.target.value)}
                          placeholder="claims@homedepotprotection.com"
                          className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Coverage Inclusions / Notes
                      </label>
                      <input
                        type="text"
                        value={formWarrantyCoverageNotes}
                        onChange={(e) => setFormWarrantyCoverageNotes(e.target.value)}
                        placeholder="e.g. 5-yr parts & labor, power surge protection, $300 food spoilage"
                        className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Receipt & Warranty Attachment (Always Available) */}
              <div className="bg-[#11141B] border border-slate-800 rounded-xl p-3 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Purchase Receipt &amp; Warranty Document</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Saved for Future Claims
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Upload your receipt, invoice, or extended warranty certificate (PDF or photo) so proof of purchase is always saved for future claims.
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
                      setViewerUnitName('Active Unit');
                      setViewerPropertyName('Active Property');
                    }
                  }}
                />
              </div>

              {/* General Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Appliance Notes (Installation details, filter sizes, receipt location)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Stainless steel, 24-inch, filter replaced every 6 months."
                  className="w-full bg-[#0E121A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-[#0E121A] hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-950 transition-colors cursor-pointer"
                >
                  {editingApplianceId ? 'Update Appliance' : 'Save Appliance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt & Warranty Attachment Viewer Modal */}
      <ReceiptViewerModal
        isOpen={Boolean(viewerAppliance && viewerAppliance.receiptUrl)}
        onClose={() => {
          setViewerAppliance(null);
          setViewerProperty(null);
          setViewerUnit(null);
        }}
        appliance={viewerAppliance}
        unitName={viewerUnitName}
        propertyName={viewerPropertyName}
        onDeleteReceipt={() => {
          if (viewerProperty && viewerUnit && viewerAppliance) {
            const updatedAppliances = (viewerUnit.appliances || []).map((a) => {
              if (a.id === viewerAppliance.id) {
                return {
                  ...a,
                  receiptUrl: undefined,
                  receiptFileName: undefined,
                  receiptFileType: undefined,
                  receiptFileSize: undefined,
                  receiptUploadedAt: undefined,
                };
              }
              return a;
            });
            const updatedUnits = viewerProperty.units.map((u) => 
              u.id === viewerUnit.id ? { ...u, appliances: updatedAppliances } : u
            );
            onUpdateProperty({ ...viewerProperty, units: updatedUnits });
          }
          if (editingApplianceId) {
            setFormReceiptUrl(undefined);
            setFormReceiptFileName(undefined);
            setFormReceiptFileType(undefined);
            setFormReceiptFileSize(undefined);
            setFormReceiptUploadedAt(undefined);
          }
          setViewerAppliance(null);
        }}
      />
    </div>
  );
};
