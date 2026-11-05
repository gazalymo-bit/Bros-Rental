import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { PortfolioOverviewView } from './components/PortfolioOverviewView';
import { PropertyOverview } from './components/PropertyOverview';
import { CalculatorView } from './components/CalculatorView';
import { RentCollectionTracker } from './components/RentCollectionTracker';
import { UnitFixTracker } from './components/UnitFixTracker';
import { AppliancesView } from './components/AppliancesView';
import { FinancialMetrics } from './components/FinancialMetrics';
import { SensitivityAnalysis } from './components/SensitivityAnalysis';
import { TransactionTracker } from './components/TransactionTracker';
import { PropertyModal } from './components/PropertyModal';
import { ExportReportModal } from './components/ExportReportModal';
import { AppearanceModal } from './components/AppearanceModal';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { Property, Transaction, RentPaymentRecord, CompanyProfile } from './types';
import { ThemeSettings, ThemeId, getStoredThemeSettings, saveThemeSettings, applyThemeToDOM } from './utils/theme';
import { 
  getStoredProperties, 
  saveProperties, 
  getActivePropertyId, 
  setActivePropertyId as saveActivePropertyId,
  getStoredTransactions,
  saveTransactions,
  getStoredRentPayments,
  saveRentPayments,
  getStoredProfiles,
  saveProfiles,
  getActiveProfileId,
  setActiveProfileId as saveActiveProfileIdKey
} from './utils/storage';
import { calculatePropertyFinances } from './utils/calculations';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Palette, 
  FileDown, 
  Layers, 
  Calculator, 
  Receipt, 
  Wrench, 
  ShieldCheck, 
  PieChart, 
  TrendingUp,
  Layout,
  Sliders,
  DollarSign,
  Briefcase
} from 'lucide-react';

export default function App() {
  const [properties, setProperties] = useState<Property[]>(() => getStoredProperties());
  const [profiles, setProfiles] = useState<CompanyProfile[]>(() => getStoredProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string>(() => getActiveProfileId());
  const [activePropertyId, setActivePropId] = useState<string>(() => getActivePropertyId());
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [rentPayments, setRentPayments] = useState<RentPaymentRecord[]>(() => getStoredRentPayments());
  const [activeTab, setActiveTab] = useState<'portfolio' | 'calculator' | 'collection' | 'unit-fix' | 'appliances' | 'ledger' | 'metrics' | 'scenario'>('portfolio');

  // Company Profile Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [profileModalMode, setProfileModalMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingProfileId, setEditingProfileId] = useState<string | undefined>(undefined);

  // Theme & Layout state
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => getStoredThemeSettings());
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState<boolean>(false);

  // Modals state
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportModalInitialUnitId, setReportModalInitialUnitId] = useState<string | undefined>(undefined);
  const [reportModalInitialMonthYear, setReportModalInitialMonthYear] = useState<string | undefined>(undefined);
  const [reportModalInitialScope, setReportModalInitialScope] = useState<'portfolio' | 'property' | 'unit' | undefined>(undefined);

  const handleOpenReportModal = (unitId?: string, monthYear?: string, scope?: 'portfolio' | 'property' | 'unit') => {
    setReportModalInitialUnitId(unitId);
    setReportModalInitialMonthYear(monthYear);
    setReportModalInitialScope(scope);
    setIsReportModalOpen(true);
  };

  // Sync theme to DOM on mount and changes
  useEffect(() => {
    applyThemeToDOM(themeSettings);
  }, [themeSettings]);

  const handleUpdateThemeSettings = (newSettings: ThemeSettings) => {
    setThemeSettings(newSettings);
    saveThemeSettings(newSettings);
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeId = themeSettings.theme === 'light' ? 'dark' : 'light';
    const updated: ThemeSettings = {
      ...themeSettings,
      theme: nextTheme,
    };
    handleUpdateThemeSettings(updated);
  };

  // Sync to local storage
  useEffect(() => {
    saveProperties(properties);
  }, [properties]);

  useEffect(() => {
    saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    saveActiveProfileIdKey(activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    saveActivePropertyId(activePropertyId);
  }, [activePropertyId]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveRentPayments(rentPayments);
  }, [rentPayments]);

  // Ensure all recorded collected payments have their corresponding management fee expense auto-calculated in the ledger
  useEffect(() => {
    if (!rentPayments || rentPayments.length === 0 || !properties || properties.length === 0) return;

    let hasChanges = false;
    let currentTxs = [...transactions];

    rentPayments.forEach((p) => {
      if (p.paidAmount > 0) {
        const syncedMgmtTxId = `tx-sync-mgmt-${p.id}`;
        const exists = currentTxs.some((t) => t.id === syncedMgmtTxId);
        if (!exists) {
          const targetProp = properties.find((pr) => pr.id === p.propertyId);
          const mgmtExpense = targetProp?.expenses?.find(
            (e) => e.category === 'Property Management' || e.name.toLowerCase().includes('management')
          );
          let mgmtFeePercent = 8;
          if (mgmtExpense) {
            if (mgmtExpense.isPercentageOfRent && mgmtExpense.percentageValue !== undefined && mgmtExpense.percentageValue > 0) {
              mgmtFeePercent = mgmtExpense.percentageValue;
            } else if (mgmtExpense.amount > 0) {
              const totalPropGross = Number(targetProp?.baseMonthlyRent) || 
                (targetProp?.units && targetProp.units.length > 0 ? targetProp.units.reduce((s, u) => s + (Number(u.rent) || 0), 0) : 0) || 1;
              mgmtFeePercent = (Number(mgmtExpense.amount) / totalPropGross) * 100;
            }
          }
          const feeAmt = parseFloat(((p.paidAmount * mgmtFeePercent) / 100).toFixed(2));
          currentTxs.push({
            id: syncedMgmtTxId,
            propertyId: p.propertyId,
            date: p.paidDate || new Date().toISOString().split('T')[0],
            type: 'expense',
            category: 'Property Management',
            amount: feeAmt,
            description: `Property Management Fee (${mgmtFeePercent.toFixed(1)}%) - ${p.unitName || 'Unit'} (${p.monthYear})`,
            paidByOrTo: 'Property Management',
            receiptNumber: `MGMT-${p.id.slice(-6).toUpperCase()}`,
          });
          hasChanges = true;
        }
      }
    });

    // Auto-sync unit appliances as expense transactions so any appliance is recognized and calculated in the statement as Maintenance, Fixes & Repairs
    const activeAppTxIds = new Set<string>();
    properties.forEach((p) => {
      (p.units || []).forEach((u) => {
        (u.appliances || []).forEach((app) => {
          const price = Number(app.purchasePrice) || 0;
          if (price > 0) {
            const syncAppTxId = `tx-sync-appliance-${app.id}`;
            activeAppTxIds.add(syncAppTxId);
            const existingTx = currentTxs.find((t) => t.id === syncAppTxId);
            // Description should be clean without unit number attached
            const appDesc = `Appliance: ${app.name}${app.brand ? ` (${app.brand})` : ''}`;

            if (!existingTx) {
              currentTxs.push({
                id: syncAppTxId,
                propertyId: p.id,
                unitId: u.id,
                unitName: u.name,
                date: app.boughtDate || new Date().toISOString().split('T')[0],
                type: 'expense',
                category: 'Repairs & Maintenance',
                amount: price,
                description: appDesc,
                isRepair: true,
                repairType: undefined,
                paidByOrTo: app.vendorOrStore || 'Appliance Retailer / Store',
                receiptNumber: app.warrantyPolicyNumber ? `APP-${app.warrantyPolicyNumber}` : (app.modelNumber ? `Model #${app.modelNumber}` : `APP-${app.id.slice(-6).toUpperCase()}`),
                receiptUrl: app.receiptUrl,
                receiptFileName: app.receiptFileName,
                receiptFileType: app.receiptFileType,
                receiptFileSize: app.receiptFileSize,
                notes: `Unit Appliances. Purchase date: ${app.boughtDate || 'N/A'}`
              });
              hasChanges = true;
            } else if (
              Math.abs(existingTx.amount - price) > 0.01 || 
              existingTx.category !== 'Repairs & Maintenance' ||
              !existingTx.isRepair ||
              existingTx.repairType ||
              existingTx.description !== appDesc ||
              existingTx.description.includes('Unit')
            ) {
              existingTx.amount = price;
              existingTx.category = 'Repairs & Maintenance';
              existingTx.isRepair = true;
              existingTx.repairType = undefined;
              existingTx.unitName = u.name;
              existingTx.description = appDesc;
              existingTx.date = app.boughtDate || existingTx.date;
              existingTx.paidByOrTo = app.vendorOrStore || existingTx.paidByOrTo || 'Appliance Retailer';
              existingTx.receiptUrl = app.receiptUrl || existingTx.receiptUrl;
              existingTx.receiptFileName = app.receiptFileName || existingTx.receiptFileName;
              hasChanges = true;
            }
          }
        });
      });
    });

    // Remove obsolete appliance sync transactions if appliance was deleted
    const cleanedTxs = currentTxs.filter(t => !t.id.startsWith('tx-sync-appliance-') || activeAppTxIds.has(t.id));
    if (cleanedTxs.length !== currentTxs.length) {
      currentTxs = cleanedTxs;
      hasChanges = true;
    }

    // Sanitize any lingering unit suffixes or duplicate Unit text from all transaction descriptions
    currentTxs.forEach((t) => {
      if (t.description && (
        t.description.includes('Unit Unit') || 
        t.description.match(/\s*-\s*Unit\s+/i) ||
        (t.description.startsWith('Appliance:') && t.description.includes('Unit'))
      )) {
        const cleaned = t.description
          .replace(/\s*-\s*Unit\s+[^,\n-]+/gi, '')
          .replace(/\bUnit\s+Unit\s*\w*/gi, '')
          .replace(/\bUnit\s+\d+\b/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (cleaned !== t.description) {
          t.description = cleaned;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setTransactions(currentTxs);
      saveTransactions(currentTxs);
    }
  }, [rentPayments, properties]);

  // Active profile lookup
  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;
  }, [profiles, activeProfileId]);

  // Filtered properties based on active company profile
  const displayedProperties = useMemo(() => {
    if (activeProfileId === 'ALL_COMPANIES') return properties;
    return properties.filter((p) => (p.profileId || 'profile-default') === activeProfileId);
  }, [properties, activeProfileId]);

  // Active property lookup
  const activeProperty = useMemo(() => {
    const list = displayedProperties.length > 0 ? displayedProperties : properties;
    return list.find((p) => p.id === activePropertyId) || list[0] || null;
  }, [displayedProperties, properties, activePropertyId]);

  // Calculate live financials
  const financials = useMemo(() => {
    if (!activeProperty) return null;
    return calculatePropertyFinances(activeProperty);
  }, [activeProperty]);

  // Company Profile Handlers
  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    if (id !== 'ALL_COMPANIES') {
      const matchingProps = properties.filter((p) => (p.profileId || 'profile-default') === id);
      if (matchingProps.length > 0) {
        setActivePropId(matchingProps[0].id);
      } else {
        setActiveTab('portfolio');
      }
    }
  };

  const handleOpenProfileModal = (mode: 'list' | 'create' = 'list', targetProfileId?: string) => {
    setProfileModalMode(mode);
    setEditingProfileId(targetProfileId);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (profileToSave: CompanyProfile) => {
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === profileToSave.id);
      if (exists) {
        return prev.map((p) => (p.id === profileToSave.id ? profileToSave : p));
      }
      return [...prev, profileToSave];
    });

    // Update companyName in properties
    setProperties((prev) =>
      prev.map((prop) =>
        (prop.profileId || 'profile-default') === profileToSave.id
          ? { ...prop, companyName: profileToSave.name }
          : prop
      )
    );

    setActiveProfileId(profileToSave.id);
  };

  const handleDeleteProfile = (profileIdToDelete: string) => {
    if (profiles.length <= 1) return;
    const remaining = profiles.filter((p) => p.id !== profileIdToDelete);
    const fallbackId = remaining[0]?.id || 'profile-default';
    const fallbackCompany = remaining[0]?.name || 'Bros Real Estate LLC';

    setProfiles(remaining);

    // Reassign any properties under deleted profile to fallback profile so user data is NEVER lost
    setProperties((prev) =>
      prev.map((prop) =>
        (prop.profileId || 'profile-default') === profileIdToDelete
          ? { ...prop, profileId: fallbackId, companyName: fallbackCompany }
          : prop
      )
    );

    if (activeProfileId === profileIdToDelete) {
      setActiveProfileId(fallbackId);
    }
  };

  // Property Handlers
  const handleSelectProperty = (id: string) => {
    setActivePropId(id);
  };

  const handleUpdateProperty = (updated: Property) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleSavePropertyModal = (propertyToSave: Property) => {
    if (editingProperty) {
      // Editing existing
      handleUpdateProperty(propertyToSave);
    } else {
      // Adding new
      setProperties((prev) => [...prev, propertyToSave]);
      setActivePropId(propertyToSave.id);
      if (propertyToSave.profileId && activeProfileId !== 'ALL_COMPANIES') {
        setActiveProfileId(propertyToSave.profileId);
      }
    }
    setEditingProperty(null);
  };

  const handleDuplicateProperty = (prop: Property) => {
    const duplicated: Property = {
      ...prop,
      id: `prop-${Date.now()}`,
      name: `${prop.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProperties((prev) => [...prev, duplicated]);
    setActivePropId(duplicated.id);
  };

  const handleDeleteProperty = (id: string) => {
    if (properties.length <= 1) return;
    const remaining = properties.filter((p) => p.id !== id);
    setProperties(remaining);
    setActivePropId(remaining[0].id);
  };

  // Transaction Handlers
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Rent Payment Handlers & Ledger Synchronization
  const handleSaveRentPayment = (newOrUpdatedPayment: RentPaymentRecord) => {
    setRentPayments((prev) => {
      // Find existing payment by id or matching property + unit + monthYear
      const existingIdx = prev.findIndex((p) => 
        p.id === newOrUpdatedPayment.id ||
        (p.propertyId === newOrUpdatedPayment.propertyId &&
         p.unitId && newOrUpdatedPayment.unitId &&
         p.unitId === newOrUpdatedPayment.unitId &&
         p.monthYear === newOrUpdatedPayment.monthYear)
      );

      let next: RentPaymentRecord[];
      if (existingIdx >= 0) {
        next = [...prev];
        const existingId = prev[existingIdx].id;
        next[existingIdx] = {
          ...prev[existingIdx],
          ...newOrUpdatedPayment,
          id: existingId, // preserve canonical ID
          updatedAt: new Date().toISOString(),
        };
      } else {
        next = [newOrUpdatedPayment, ...prev];
      }
      saveRentPayments(next);
      return next;
    });

    // Auto-sync into Ledger if paid: (1) Rent Income and (2) Property Management Fee Expense
    if (newOrUpdatedPayment.paidAmount > 0) {
      const targetProperty = properties.find((p) => p.id === newOrUpdatedPayment.propertyId);
      
      // Determine management fee rate from property expenses or standard underwriting (8%)
      const mgmtExpense = targetProperty?.expenses?.find(
        (e) => e.category === 'Property Management' || e.name.toLowerCase().includes('management')
      );

      let mgmtFeePercent = 8; // Default standard management fee percentage
      if (mgmtExpense) {
        if (mgmtExpense.isPercentageOfRent && mgmtExpense.percentageValue !== undefined && mgmtExpense.percentageValue > 0) {
          mgmtFeePercent = mgmtExpense.percentageValue;
        } else if (mgmtExpense.amount > 0) {
          const totalPropGross = Number(targetProperty?.baseMonthlyRent) || 
            (targetProperty?.units && targetProperty.units.length > 0 ? targetProperty.units.reduce((s, u) => s + (Number(u.rent) || 0), 0) : 0) || 
            newOrUpdatedPayment.expectedAmount || 
            newOrUpdatedPayment.paidAmount || 
            1;
          mgmtFeePercent = (Number(mgmtExpense.amount) / totalPropGross) * 100;
        }
      }

      const mgmtFeeAmount = parseFloat(((newOrUpdatedPayment.paidAmount * mgmtFeePercent) / 100).toFixed(2));

      const syncedTxId = `tx-sync-${newOrUpdatedPayment.id}`;
      const syncedMgmtTxId = `tx-sync-mgmt-${newOrUpdatedPayment.id}`;

      const syncTx: Transaction = {
        id: syncedTxId,
        propertyId: newOrUpdatedPayment.propertyId,
        date: newOrUpdatedPayment.paidDate || new Date().toISOString().split('T')[0],
        type: 'income',
        category: 'Rent Payment',
        amount: newOrUpdatedPayment.paidAmount,
        description: `${newOrUpdatedPayment.unitName || 'Unit'} Rent (${newOrUpdatedPayment.monthYear}) - ${newOrUpdatedPayment.paymentMethod || 'Direct'}`,
        paidByOrTo: newOrUpdatedPayment.tenantName,
        receiptNumber: newOrUpdatedPayment.receiptNumber || `RCP-${newOrUpdatedPayment.id}`,
      };

      const syncMgmtTx: Transaction = {
        id: syncedMgmtTxId,
        propertyId: newOrUpdatedPayment.propertyId,
        date: newOrUpdatedPayment.paidDate || new Date().toISOString().split('T')[0],
        type: 'expense',
        category: 'Property Management',
        amount: mgmtFeeAmount,
        description: `Property Management Fee (${mgmtFeePercent.toFixed(1)}%) - ${newOrUpdatedPayment.unitName || 'Unit'} (${newOrUpdatedPayment.monthYear})`,
        paidByOrTo: 'Property Management',
        receiptNumber: `MGMT-${newOrUpdatedPayment.id.slice(-6).toUpperCase()}`,
      };

      setTransactions((prev) => {
        const filtered = prev.filter((t) => t.id !== syncedTxId && t.id !== syncedMgmtTxId);
        const nextTx = [syncTx, syncMgmtTx, ...filtered];
        saveTransactions(nextTx);
        return nextTx;
      });
    } else {
      // If payment amount is 0/unpaid, remove any synced ledger entries (income & management expense)
      setTransactions((prev) => {
        const nextTx = prev.filter((t) => t.id !== `tx-sync-${newOrUpdatedPayment.id}` && t.id !== `tx-sync-mgmt-${newOrUpdatedPayment.id}`);
        saveTransactions(nextTx);
        return nextTx;
      });
    }
  };

  const handleDeleteRentPayment = (paymentId: string) => {
    setRentPayments((prev) => prev.filter((p) => p.id !== paymentId));
    // Also remove any linked ledger transactions (income and management fee expense)
    setTransactions((prev) => prev.filter((t) => t.id !== `tx-sync-${paymentId}` && t.id !== `tx-sync-mgmt-${paymentId}`));
  };

  const handleClearAllPayments = () => {
    setRentPayments([]);
    setTransactions((prev) => prev.filter((t) => !t.id.startsWith('tx-sync-')));
  };

  const handleClearAllRepairs = () => {
    setTransactions((prev) =>
      prev.filter(
        (t) =>
          !t.isRepair &&
          !t.category?.toLowerCase().includes('repair') &&
          !t.category?.toLowerCase().includes('fix') &&
          !t.category?.toLowerCase().includes('maintenance')
      )
    );
  };

  if (!activeProperty || !financials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0C10] text-slate-300">
        <div className="text-center p-6">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-semibold text-sm text-slate-400">Loading Rental Calculator...</p>
        </div>
      </div>
    );
  }

  const isSidebarLayout = themeSettings.layout === 'sidebar';

  const mainContent = (
    <>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {displayedProperties.length === 0 ? (
          <div className="bg-[#141822] rounded-2xl border border-slate-800 p-8 sm:p-12 text-center max-w-xl mx-auto my-12 space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                Company Profile: {activeProfile?.name || 'Selected Entity'}
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                No Buildings Under This Profile Yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                You are currently viewing <strong>"{activeProfile?.name}"</strong>. Enter a new building to track rent collection, units, leases, and ledger expenses separately under this company name.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setEditingProperty(null);
                  setIsPropertyModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Building to {activeProfile?.name || 'this Company'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileId('ALL_COMPANIES')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1B212D] hover:bg-[#232B3A] text-slate-300 hover:text-white text-xs sm:text-sm font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
              >
                <span>View All Companies ({properties.length} props)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* All Properties Portfolio View (All-In-One Screen) */}
            {activeTab === 'portfolio' && (
              <PortfolioOverviewView
                properties={displayedProperties}
                rentPayments={rentPayments}
                onSelectProperty={(id) => {
                  setActivePropId(id);
                  setActiveTab('calculator');
                }}
                onNavigateToTab={setActiveTab}
                onUpdateProperty={handleUpdateProperty}
                onDuplicateProperty={handleDuplicateProperty}
                onDeleteProperty={handleDeleteProperty}
                onOpenStatementModal={(monthYear) => handleOpenReportModal(undefined, monthYear, 'portfolio')}
                onOpenNewPropertyModal={() => {
                  setEditingProperty(null);
                  setIsPropertyModalOpen(true);
                }}
                onOpenEditPropertyModal={(prop) => {
                  setEditingProperty(prop);
                  setIsPropertyModalOpen(true);
                }}
              />
            )}

            {/* Single Property Views */}
            {activeTab !== 'portfolio' && (
              <>
                {/* Top KPI Header Strip for Active Single Property (hidden on Monthly Rent Collection per user request) */}
                {activeTab !== 'collection' && (
                  <PropertyOverview
                    property={activeProperty}
                    financials={financials}
                    allProperties={displayedProperties}
                    onSelectProperty={setActivePropId}
                    rentPayments={rentPayments}
                    onNavigateToCollection={() => setActiveTab('collection')}
                    onNavigateToPortfolio={() => setActiveTab('portfolio')}
                    onOpenEditModal={() => {
                      setEditingProperty(activeProperty);
                      setIsPropertyModalOpen(true);
                    }}
                  />
                )}

                {/* Tab Views */}
                {activeTab === 'calculator' && (
                  <CalculatorView
                    property={activeProperty}
                    financials={financials}
                    onUpdateProperty={handleUpdateProperty}
                  />
                )}

                {activeTab === 'collection' && (
                  <RentCollectionTracker
                    key={`collection-tab-${activeTab}`}
                    property={activeProperty}
                    allProperties={displayedProperties}
                    rentPayments={rentPayments}
                    transactions={transactions}
                    onSavePayment={handleSaveRentPayment}
                    onDeletePayment={handleDeleteRentPayment}
                    onClearAllPayments={handleClearAllPayments}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onUpdateProperty={handleUpdateProperty}
                    onSelectProperty={setActivePropId}
                    onNavigateToLedger={() => setActiveTab('ledger')}
                    onOpenStatement={handleOpenReportModal}
                    onNavigateToUnitFix={() => setActiveTab('unit-fix')}
                  />
                )}

                {activeTab === 'unit-fix' && (
                  <UnitFixTracker
                    property={activeProperty}
                    allProperties={displayedProperties}
                    transactions={transactions}
                    onAddTransaction={handleAddTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onClearAllRepairs={handleClearAllRepairs}
                    onSelectProperty={setActivePropId}
                    onNavigateToRentCollection={() => setActiveTab('collection')}
                  />
                )}

                {activeTab === 'appliances' && (
                  <AppliancesView
                    properties={displayedProperties}
                    activePropertyId={activePropertyId}
                    onUpdateProperty={handleUpdateProperty}
                    onSelectProperty={setActivePropId}
                  />
                )}

                {activeTab === 'ledger' && (
                  <TransactionTracker
                    property={activeProperty}
                    allProperties={displayedProperties}
                    transactions={transactions}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    onSelectProperty={setActivePropId}
                  />
                )}

                {activeTab === 'metrics' && (
                  <FinancialMetrics
                    property={activeProperty}
                    financials={financials}
                  />
                )}

                {activeTab === 'scenario' && (
                  <SensitivityAnalysis
                    property={activeProperty}
                    baseFinancials={financials}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#11141B] border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-400">Bros Rental Flow — Rental Income & Expense Intelligence</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAppearanceModalOpen(true)}
              className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customize Layout & Theme</span>
            </button>
            <span>&bull;</span>
            <span className="text-slate-500">Real-Time Monthly Rent Collection & Underwriting</span>
          </div>
        </div>
      </footer>
    </>
  );

  return (
    <div className={`min-h-screen bg-[#0A0C10] text-slate-300 selection:bg-emerald-500 selection:text-white ${isSidebarLayout ? 'flex flex-row' : 'flex flex-col'}`}>
      {/* If Left Sidebar layout mode */}
      {isSidebarLayout ? (
        <>
          <Sidebar
            properties={displayedProperties.length > 0 ? displayedProperties : properties}
            activePropertyId={activeProperty.id}
            onSelectProperty={handleSelectProperty}
            onOpenNewPropertyModal={() => {
              setEditingProperty(null);
              setIsPropertyModalOpen(true);
            }}
            onOpenEditPropertyModal={() => {
              setEditingProperty(activeProperty);
              setIsPropertyModalOpen(true);
            }}
            onDuplicateProperty={handleDuplicateProperty}
            onDeleteProperty={handleDeleteProperty}
            onOpenReportModal={() => handleOpenReportModal()}
            onOpenAppearanceModal={() => setIsAppearanceModalOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            themeSettings={themeSettings}
            onToggleTheme={handleToggleTheme}
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            onOpenProfileModal={handleOpenProfileModal}
          />
          <div className="flex-1 min-w-0 flex flex-col min-h-screen overflow-y-auto">
            {mainContent}
          </div>
        </>
      ) : (
        <>
          {/* Top Navbar */}
          <Navbar
            properties={displayedProperties.length > 0 ? displayedProperties : properties}
            activePropertyId={activeProperty.id}
            onSelectProperty={handleSelectProperty}
            onOpenNewPropertyModal={() => {
              setEditingProperty(null);
              setIsPropertyModalOpen(true);
            }}
            onOpenEditPropertyModal={() => {
              setEditingProperty(activeProperty);
              setIsPropertyModalOpen(true);
            }}
            onDuplicateProperty={handleDuplicateProperty}
            onDeleteProperty={handleDeleteProperty}
            onOpenReportModal={() => handleOpenReportModal()}
            onOpenAppearanceModal={() => setIsAppearanceModalOpen(true)}
            theme={themeSettings.theme}
            onToggleTheme={handleToggleTheme}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            onOpenProfileModal={handleOpenProfileModal}
          />
          {mainContent}
        </>
      )}

      {/* Property Create/Edit Modal */}
      <PropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onSave={handleSavePropertyModal}
        initialProperty={editingProperty}
        profiles={profiles}
        activeProfileId={activeProfileId !== 'ALL_COMPANIES' ? activeProfileId : (profiles[0]?.id || 'profile-default')}
        onOpenCreateProfile={() => handleOpenProfileModal('create')}
      />

      {/* Printable Report Modal */}
      <ExportReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportModalInitialUnitId(undefined);
          setReportModalInitialMonthYear(undefined);
          setReportModalInitialScope(undefined);
        }}
        property={activeProperty}
        allProperties={displayedProperties.length > 0 ? displayedProperties : properties}
        financials={financials}
        rentPayments={rentPayments}
        initialUnitId={reportModalInitialUnitId}
        initialMonthYear={reportModalInitialMonthYear}
        initialScope={reportModalInitialScope}
        transactions={transactions}
      />

      {/* Company / Profile Management Modal */}
      <CompanyProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        onSaveProfile={handleSaveProfile}
        onDeleteProfile={handleDeleteProfile}
        properties={properties}
        initialMode={profileModalMode}
        editingProfileId={editingProfileId}
      />

      {/* Appearance, Theme & Layout Modal */}
      <AppearanceModal
        isOpen={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
        settings={themeSettings}
        onUpdateSettings={handleUpdateThemeSettings}
      />
    </div>
  );
}
