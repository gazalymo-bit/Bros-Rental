import React from 'react';
import { 
  Building2, 
  Plus, 
  FileDown, 
  Home, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Copy,
  Layers,
  ChevronDown,
  Receipt,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  Palette,
  Sun,
  Moon,
  Briefcase
} from 'lucide-react';
import { Property, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/calculations';

interface NavbarProps {
  properties: Property[];
  activePropertyId: string;
  onSelectProperty: (id: string) => void;
  onOpenNewPropertyModal: () => void;
  onOpenEditPropertyModal: () => void;
  onDuplicateProperty: (property: Property) => void;
  onDeleteProperty: (id: string) => void;
  onOpenReportModal: () => void;
  onOpenAppearanceModal?: () => void;
  theme?: string;
  onToggleTheme?: () => void;
  activeTab: 'portfolio' | 'calculator' | 'collection' | 'unit-fix' | 'appliances' | 'ledger' | 'metrics' | 'scenario';
  setActiveTab: (tab: 'portfolio' | 'calculator' | 'collection' | 'unit-fix' | 'appliances' | 'ledger' | 'metrics' | 'scenario') => void;
  profiles?: CompanyProfile[];
  activeProfileId?: string;
  onSelectProfile?: (id: string) => void;
  onOpenProfileModal?: (mode?: 'list' | 'create') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  properties,
  activePropertyId,
  onSelectProperty,
  onOpenNewPropertyModal,
  onOpenEditPropertyModal,
  onDuplicateProperty,
  onDeleteProperty,
  onOpenReportModal,
  onOpenAppearanceModal,
  theme = 'dark',
  onToggleTheme,
  activeTab,
  setActiveTab,
  profiles = [],
  activeProfileId,
  onSelectProfile,
  onOpenProfileModal,
}) => {
  const activeProperty = properties.find((p) => p.id === activePropertyId) || properties[0];
  const activeProfile = profiles.find((pr) => pr.id === activeProfileId) || profiles[0];
  const totalAppliancesCount = properties.reduce(
    (acc, p) => acc + (p.units || []).reduce((uAcc, u) => uAcc + (u.appliances || []).length, 0),
    0
  );

  return (
    <header className="bg-[#11141B] border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Left: Brand + Active Company Entity Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Logo Icon */}
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>

            {/* Brand Title */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight whitespace-nowrap">
                Bros Rental Flow
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                Pro
              </span>
            </div>

            {/* Company / Profile Switcher Pill */}
            {profiles.length > 0 && onSelectProfile && onOpenProfileModal && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800 shrink-0">
                <div className="flex items-center bg-[#161A23] hover:bg-[#1D222F] border border-slate-800 hover:border-slate-700 rounded-lg px-2 py-1 transition-colors">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                  <div className="relative">
                    <select
                      id="company-profile-selector"
                      value={activeProfileId || profiles[0]?.id}
                      onChange={(e) => {
                        if (e.target.value === 'NEW_PROFILE') {
                          onOpenProfileModal('create');
                        } else if (e.target.value === 'MANAGE_PROFILES') {
                          onOpenProfileModal('list');
                        } else {
                          onSelectProfile(e.target.value);
                        }
                      }}
                      className="appearance-none bg-transparent text-emerald-300 font-bold text-xs pr-5 py-0.5 focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[170px] truncate whitespace-nowrap"
                      title={`Active Entity: ${activeProfile?.name || 'Company'}`}
                    >
                      <optgroup label="Companies & Entities">
                        <option value="ALL_COMPANIES" className="bg-[#161A23] text-emerald-400 font-bold">
                          🌐 All Companies ({properties.length})
                        </option>
                        {profiles.map((prof) => {
                          const count = properties.filter((p) => (p.profileId || 'profile-default') === prof.id).length;
                          return (
                            <option key={prof.id} value={prof.id} className="bg-[#161A23] text-slate-200 font-semibold">
                              🏢 {prof.name} ({count})
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="Profile Actions">
                        <option value="NEW_PROFILE" className="bg-[#161A23] text-emerald-400 font-bold">
                          + New Company Profile...
                        </option>
                        <option value="MANAGE_PROFILES" className="bg-[#161A23] text-slate-300">
                          ⚙️ Manage Profiles...
                        </option>
                      </optgroup>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-0.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenProfileModal('create')}
                    title="Create another profile with separate company name"
                    className="ml-1 p-0.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Property Selector & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Property Selector Dropdown */}
            <div className="relative shrink-0">
              <select
                id="property-selector"
                value={activeTab === 'portfolio' ? 'ALL_PORTFOLIO' : (activeProperty?.id || '')}
                onChange={(e) => {
                  if (e.target.value === 'ALL_PORTFOLIO') {
                    setActiveTab('portfolio');
                  } else {
                    onSelectProperty(e.target.value);
                    if (activeTab === 'portfolio') {
                      setActiveTab('calculator');
                    }
                  }
                }}
                className="appearance-none bg-[#161A23] hover:bg-[#1D222F] border border-slate-800 text-slate-200 text-xs sm:text-sm font-semibold rounded-lg pl-2.5 sm:pl-3 pr-7 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors max-w-[130px] sm:max-w-[210px] truncate whitespace-nowrap"
              >
                <option value="ALL_PORTFOLIO" className="bg-[#161A23] text-emerald-400 font-bold">
                  📊 All Properties ({properties.length})
                </option>
                <optgroup label="Individual Properties" className="bg-[#161A23] text-slate-400 font-normal">
                  {properties.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#161A23] text-slate-200 font-semibold">
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Edit / Actions (only when on a specific property, keeps bar clean) */}
            {activeProperty && activeTab !== 'portfolio' && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  id="edit-property-btn"
                  onClick={onOpenEditPropertyModal}
                  title="Edit Property Details"
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  id="duplicate-property-btn"
                  onClick={() => onDuplicateProperty(activeProperty)}
                  title="Duplicate Property"
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors hidden xl:inline-flex cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {properties.length > 1 && (
                  <button
                    id="delete-property-btn"
                    onClick={() => onDeleteProperty(activeProperty.id)}
                    title="Delete Property"
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Add Property Button */}
            <button
              id="add-new-property-btn"
              onClick={onOpenNewPropertyModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-slate-200 bg-[#161A23] hover:bg-[#1D222F] border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Add Property</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Export Report */}
            <button
              id="export-report-btn"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-950/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Statement & Report</span>
              <span className="md:hidden">Report</span>
            </button>

            {/* Appearance Theme & Layout: Clean Icon Button */}
            {onOpenAppearanceModal && (
              <button
                id="open-appearance-modal-btn"
                onClick={onOpenAppearanceModal}
                title="Theme & Layout Settings"
                className="p-2 text-slate-300 hover:text-white bg-[#161A23] hover:bg-[#1D222F] border border-slate-700/80 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <Palette className="w-4 h-4 text-emerald-400" />
              </button>
            )}

            {/* Quick 1-Click Light/Dark Toggle */}
            {onToggleTheme && (
              <button
                id="quick-theme-toggle-btn"
                type="button"
                onClick={onToggleTheme}
                title={`Switch to ${theme === 'light' ? 'Dark Obsidian' : 'Executive Light'} mode`}
                className="p-2 text-slate-300 hover:text-white bg-[#161A23] hover:bg-[#1D222F] border border-slate-700/80 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-300" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 -mb-px border-t border-slate-800/80 pt-1 overflow-x-auto scrollbar-none">
          {/* 1. All Properties */}
          <button
            id="tab-portfolio"
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'portfolio'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>All Properties (Portfolio P&L)</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {properties.length}
            </span>
          </button>

          {/* 2. Monthly Rent Collection */}
          <button
            id="tab-collection"
            onClick={() => setActiveTab('collection')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'collection'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Monthly Rent Collection</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Payments
            </span>
          </button>

          {/* 3. Log Unit Fix */}
          <button
            id="tab-unit-fix"
            onClick={() => setActiveTab('unit-fix')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'unit-fix'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Log Unit Fix</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Repairs
            </span>
          </button>

          {/* 4. Unit Appliances & Warranties */}
          <button
            id="tab-appliances"
            onClick={() => setActiveTab('appliances')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'appliances'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Unit Appliances & Warranties</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {totalAppliancesCount > 0 ? `${totalAppliancesCount} Items` : 'Appliances'}
            </span>
          </button>

          {/* 5. Single Property Underwriting */}
          <button
            id="tab-calculator"
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Single Property Underwriting</span>
          </button>

          {/* 5. Actual Ledger Log */}
          <button
            id="tab-ledger"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Actual Ledger Log</span>
          </button>

          {/* 6. Financial Ratios & ROI */}
          <button
            id="tab-metrics"
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'metrics'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Financial Ratios & ROI</span>
          </button>

          {/* 7. What-If Scenarios */}
          <button
            id="tab-scenario"
            onClick={() => setActiveTab('scenario')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'scenario'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>What-If Scenarios</span>
          </button>
        </div>
      </div>
    </header>
  );
};
