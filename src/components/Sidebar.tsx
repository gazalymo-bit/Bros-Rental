import React, { useState } from 'react';
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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  PieChart,
  Sliders,
  Calculator,
  Briefcase
} from 'lucide-react';
import { Property, CompanyProfile } from '../types';
import { ThemeSettings } from '../utils/theme';

interface SidebarProps {
  properties: Property[];
  activePropertyId: string;
  onSelectProperty: (id: string) => void;
  onOpenNewPropertyModal: () => void;
  onOpenEditPropertyModal: () => void;
  onDuplicateProperty: (property: Property) => void;
  onDeleteProperty: (id: string) => void;
  onOpenReportModal: () => void;
  onOpenAppearanceModal: () => void;
  activeTab: 'portfolio' | 'calculator' | 'collection' | 'unit-fix' | 'appliances' | 'ledger' | 'metrics' | 'scenario';
  setActiveTab: (tab: 'portfolio' | 'calculator' | 'collection' | 'unit-fix' | 'appliances' | 'ledger' | 'metrics' | 'scenario') => void;
  themeSettings: ThemeSettings;
  onToggleTheme: () => void;
  profiles?: CompanyProfile[];
  activeProfileId?: string;
  onSelectProfile?: (id: string) => void;
  onOpenProfileModal?: (mode?: 'list' | 'create') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  properties,
  activePropertyId,
  onSelectProperty,
  onOpenNewPropertyModal,
  onOpenEditPropertyModal,
  onDuplicateProperty,
  onDeleteProperty,
  onOpenReportModal,
  onOpenAppearanceModal,
  activeTab,
  setActiveTab,
  themeSettings,
  onToggleTheme,
  profiles = [],
  activeProfileId,
  onSelectProfile,
  onOpenProfileModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeProperty = properties.find((p) => p.id === activePropertyId) || properties[0];

  const navItems = [
    {
      id: 'portfolio' as const,
      label: 'All Properties',
      subtitle: 'Portfolio P&L Rollup',
      icon: Building2,
      badge: `${properties.length}`,
    },
    {
      id: 'collection' as const,
      label: 'Rent Collection',
      subtitle: 'Tracker & Receipts',
      icon: Receipt,
      badge: 'Rent',
    },
    {
      id: 'unit-fix' as const,
      label: 'Unit Repairs & Fixes',
      subtitle: 'Work Orders & ROI',
      icon: Wrench,
      badge: 'Fixes',
    },
    {
      id: 'appliances' as const,
      label: 'Appliances & Warranties',
      subtitle: 'Asset Lifecycle',
      icon: ShieldCheck,
      badge: 'Assets',
    },
    {
      id: 'calculator' as const,
      label: 'Rent & Expense Engine',
      subtitle: 'Operating Cash Flow',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'ledger' as const,
      label: 'Income & Expense Ledger',
      subtitle: 'Transactions & Audit',
      icon: DollarSign,
      badge: null,
    },
    {
      id: 'metrics' as const,
      label: 'Financial DNA Metrics',
      subtitle: 'Cap Rate, CoC & DSCR',
      icon: PieChart,
      badge: null,
    },
    {
      id: 'scenario' as const,
      label: 'Stress Test Scenarios',
      subtitle: 'Vacancy & Rate Shifts',
      icon: Sliders,
      badge: null,
    },
  ];

  return (
    <aside
      className={`bg-[#11141B] border-r border-slate-800 transition-all duration-200 flex flex-col shrink-0 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight leading-none">
                  Bros Rental Flow
                </h1>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Pro
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Rental Income & Expenses</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <Building2 className="w-5 h-5" />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Property Selector & Quick Actions */}
      {!isCollapsed ? (
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          {/* Company / Entity Profile Switcher */}
          {profiles.length > 0 && onSelectProfile && onOpenProfileModal && (
            <div className="bg-[#161A23] p-2 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-emerald-400" />
                  <span>Company Entity</span>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenProfileModal('create')}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                  title="Create New Profile"
                >
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </button>
              </div>
              <div className="relative">
                <select
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
                  className="w-full appearance-none bg-[#11141B] hover:bg-[#1A1F2C] border border-slate-700/80 text-emerald-300 text-xs font-bold rounded px-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer truncate"
                >
                  <optgroup label="Companies / Entities">
                    <option value="ALL_COMPANIES" className="bg-[#161A23] text-emerald-400 font-bold">
                      🌐 All Companies ({properties.length} props)
                    </option>
                    {profiles.map((p) => {
                      const count = properties.filter((pr) => (pr.profileId || 'profile-default') === p.id).length;
                      return (
                        <option key={p.id} value={p.id} className="bg-[#161A23] text-slate-200">
                          🏢 {p.name} ({count})
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="Manage">
                    <option value="NEW_PROFILE" className="bg-[#161A23] text-emerald-400 font-bold">
                      + New Company Profile...
                    </option>
                    <option value="MANAGE_PROFILES" className="bg-[#161A23] text-slate-300">
                      ⚙️ Manage Profiles...
                    </option>
                  </optgroup>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Property
          </label>
          <div className="relative">
            <select
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
              className="w-full appearance-none bg-[#161A23] hover:bg-[#1D222F] border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors truncate"
            >
              <option value="ALL_PORTFOLIO" className="bg-[#161A23] text-emerald-400 font-bold">
                📊 All Properties ({properties.length})
              </option>
              <optgroup label="Individual Properties" className="bg-[#161A23] text-slate-400">
                {properties.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#161A23] text-slate-200">
                    {p.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={onOpenNewPropertyModal}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Property</span>
            </button>
            <button
              type="button"
              onClick={onOpenReportModal}
              title="Printable Statement & PDF"
              className="p-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg transition-colors"
            >
              <FileDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenAppearanceModal}
              title="Change Theme & Layout"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors"
            >
              <Palette className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 border-b border-slate-800 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewPropertyModal}
            title="Add New Property"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onOpenAppearanceModal}
            title="Change Theme & Layout"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl transition-all cursor-pointer ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'justify-between px-3 py-2 text-left'
              } ${
                isActive
                  ? 'bg-emerald-500/15 text-white border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                />
                {!isCollapsed && (
                  <div className="min-w-0 truncate">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{item.subtitle}</p>
                  </div>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Bar with Theme Quick Switcher */}
      <div className="p-3 border-t border-slate-800 bg-[#0E121A]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onOpenAppearanceModal}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-xs capitalize">{themeSettings.theme} Theme</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              title={`Switch to ${themeSettings.theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {themeSettings.theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              title="Toggle Light/Dark"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              {themeSettings.theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
