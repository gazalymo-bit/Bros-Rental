import React from 'react';
import { 
  X, 
  Palette, 
  Layout, 
  Check, 
  Sparkles, 
  Monitor, 
  Sun, 
  Moon, 
  Compass, 
  Maximize2, 
  ShieldCheck,
  Zap,
  Minimize2,
  TreePine,
  Cpu
} from 'lucide-react';
import { ThemeSettings, ThemeId, LayoutMode, ContentWidth, DensityMode, AccentColor } from '../utils/theme';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThemeSettings;
  onUpdateSettings: (settings: ThemeSettings) => void;
}

const THEME_OPTIONS: { 
  id: ThemeId; 
  name: string; 
  description: string; 
  previewBg: string; 
  previewCard: string; 
  previewText: string; 
  previewAccent: string; 
  icon: any; 
  badge: string;
}[] = [
  {
    id: 'dark',
    name: 'Dark Obsidian (Default)',
    description: 'Deep contrast dark theme tailored for pro underwriting & low eye strain.',
    previewBg: '#0A0C10',
    previewCard: '#161A23',
    previewText: '#FFFFFF',
    previewAccent: '#10B981',
    icon: Moon,
    badge: 'Pro Dark',
  },
  {
    id: 'light',
    name: 'Clean Executive Light',
    description: 'Crisp white & cool slate corporate financial presentation mode for daylight clarity.',
    previewBg: '#F8FAFC',
    previewCard: '#FFFFFF',
    previewText: '#0F172A',
    previewAccent: '#059669',
    icon: Sun,
    badge: 'Light Mode',
  },
  {
    id: 'navy',
    name: 'Midnight Financial Navy',
    description: 'Institutional investment banking palette in deep oceanic midnight navy.',
    previewBg: '#060B18',
    previewCard: '#0F1B38',
    previewText: '#FFFFFF',
    previewAccent: '#00D09C',
    icon: Compass,
    badge: 'Wall St Navy',
  },
  {
    id: 'sand',
    name: 'Warm Executive Sand / Linen',
    description: 'Warm editorial paper & neutral linen palette with rich dark charcoal typography.',
    previewBg: '#F5F2EB',
    previewCard: '#FAF8F5',
    previewText: '#1C1917',
    previewAccent: '#15803D',
    icon: Sparkles,
    badge: 'Warm Editorial',
  },
  {
    id: 'emerald',
    name: 'Emerald Wealth Forest',
    description: 'Botanical deep dark green & rich mint tones celebrating cash flow and equity.',
    previewBg: '#041009',
    previewCard: '#0B2216',
    previewText: '#E2F8EE',
    previewAccent: '#10B981',
    icon: TreePine,
    badge: 'High Cash Flow',
  },
  {
    id: 'cobalt',
    name: 'Cyber Cobalt Slate',
    description: 'High-tech deep titanium slate with bright sapphire accent highlights.',
    previewBg: '#050811',
    previewCard: '#0D1629',
    previewText: '#E0E7FF',
    previewAccent: '#3B82F6',
    icon: Cpu,
    badge: 'Tech Cobalt',
  },
];

const ACCENT_OPTIONS: { id: AccentColor; name: string; hex: string }[] = [
  { id: 'emerald', name: 'Emerald Mint', hex: '#10B981' },
  { id: 'blue', name: 'Sapphire Blue', hex: '#3B82F6' },
  { id: 'purple', name: 'Amethyst Violet', hex: '#A855F7' },
  { id: 'amber', name: 'Gold / Amber', hex: '#F59E0B' },
];

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-6 my-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Appearance, Themes & Layouts</h3>
              <p className="text-xs text-slate-400">
                Instantly change your color theme, sidebar layout, density, and screen width
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Color Themes (6 options) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              1. Choose Color Theme ({THEME_OPTIONS.length} Presets)
            </label>
            <span className="text-[11px] text-emerald-400 font-semibold">Active: {THEME_OPTIONS.find(t => t.id === settings.theme)?.name.split(' (')[0]}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((t) => {
              const Icon = t.icon;
              const isSelected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, theme: t.id })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/50 shadow-md scale-[1.01]'
                      : 'border-slate-800 bg-[#11141B] hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center border shadow-xs"
                          style={{ backgroundColor: t.previewCard, borderColor: 'rgba(100, 116, 139, 0.4)' }}
                        >
                          <Icon className="w-3 h-3" style={{ color: t.previewAccent }} />
                        </div>
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{t.name.split(' (')[0]}</span>
                      </div>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {t.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">{t.description}</p>
                  </div>

                  {/* Visual mini-swatch preview */}
                  <div
                    className="p-2 rounded-lg border flex items-center justify-between text-[10px] font-semibold"
                    style={{ backgroundColor: t.previewBg, borderColor: 'rgba(100, 116, 139, 0.3)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.previewAccent }} />
                      <span style={{ color: t.previewText }}>Dashboard</span>
                    </div>
                    <span style={{ color: t.previewAccent }}>+ Cash Flow</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Layout Style (Topbar vs Sidebar) */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            2. Navigation Layout Architecture
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, layout: 'topbar' })}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                settings.layout === 'topbar'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/50'
                  : 'border-slate-800 bg-[#11141B] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Layout className="w-4 h-4 text-emerald-400" />
                  Top Header Bar (Classic)
                </span>
                {settings.layout === 'topbar' && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Horizontal top header tabs with quick property selector. Standard layout with full horizontal room.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, layout: 'sidebar' })}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                settings.layout === 'sidebar'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/50'
                  : 'border-slate-800 bg-[#11141B] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  Left Command Sidebar (Pro Dashboard)
                </span>
                {settings.layout === 'sidebar' && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Vertical left navigation rail with property badges, persistent status, and dedicated executive workspace.
              </p>
            </button>
          </div>
        </div>

        {/* Section 3: Screen Width & Density */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
          {/* Canvas Width */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              3. Canvas Width
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, width: 'contained' })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.width === 'contained'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-[#11141B] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Minimize2 className="w-3 h-3 text-slate-400" />
                    Contained
                  </span>
                  {settings.width === 'contained' && (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">1280px standard</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, width: 'fluid' })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.width === 'fluid'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-[#11141B] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Maximize2 className="w-3 h-3 text-emerald-400" />
                    Full Width
                  </span>
                  {settings.width === 'fluid' && (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">98% edge-to-edge</span>
              </button>
            </div>
          </div>

          {/* Density Mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              4. Display Density
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, density: 'comfortable' })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.density === 'comfortable'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-[#11141B] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Comfortable</span>
                  {settings.density === 'comfortable' && (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">Spacious padding</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, density: 'compact' })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  settings.density === 'compact'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-[#11141B] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Compact Data</span>
                  {settings.density === 'compact' && (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">High row density</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Accent Color */}
        <div className="space-y-2.5 pt-3 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            5. Primary Accent Tone
          </label>
          <div className="flex flex-wrap gap-2.5">
            {ACCENT_OPTIONS.map((a) => {
              const isSelected = settings.accent === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, accent: a.id })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-slate-800 text-white ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-[#11141B] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: a.hex }} />
                  <span>{a.name}</span>
                  {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">Settings are instantly applied & saved in browser</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
