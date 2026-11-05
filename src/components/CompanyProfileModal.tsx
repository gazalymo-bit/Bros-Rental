import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Briefcase, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CompanyProfile, Property } from '../types';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: CompanyProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onSaveProfile: (profile: CompanyProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  properties: Property[];
  initialMode?: 'list' | 'create' | 'edit';
  editingProfileId?: string;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onSaveProfile,
  onDeleteProfile,
  properties,
  initialMode = 'list',
  editingProfileId,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>(initialMode === 'create' || initialMode === 'edit' ? 'form' : 'list');
  const [editingTargetId, setEditingTargetId] = useState<string | null>(editingProfileId || null);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [dba, setDba] = useState('');
  const [einOrTaxId, setEinOrTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Sync mode and form values when opened or target changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialMode === 'create') {
      setViewMode('form');
      setEditingTargetId(null);
      resetForm();
    } else if (initialMode === 'edit' && editingProfileId) {
      const target = profiles.find((p) => p.id === editingProfileId);
      if (target) {
        populateForm(target);
        setViewMode('form');
        setEditingTargetId(target.id);
      }
    } else {
      setViewMode('list');
      setEditingTargetId(null);
    }
  }, [isOpen, initialMode, editingProfileId, profiles]);

  const resetForm = () => {
    setCompanyName('');
    setDba('');
    setEinOrTaxId('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setFormError('');
  };

  const populateForm = (p: CompanyProfile) => {
    setCompanyName(p.name || '');
    setDba(p.dba || '');
    setEinOrTaxId(p.einOrTaxId || '');
    setEmail(p.email || '');
    setPhone(p.phone || '');
    setAddress(p.address || '');
    setNotes(p.notes || '');
    setFormError('');
  };

  const handleStartCreate = () => {
    resetForm();
    setEditingTargetId(null);
    setViewMode('form');
  };

  const handleStartEdit = (profile: CompanyProfile) => {
    populateForm(profile);
    setEditingTargetId(profile.id);
    setViewMode('form');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setFormError('Please enter a Company or Profile Name.');
      return;
    }

    const now = new Date().toISOString();
    const existing = editingTargetId ? profiles.find((p) => p.id === editingTargetId) : null;

    const profileToSave: CompanyProfile = {
      id: existing ? existing.id : `profile-${Date.now()}`,
      name: companyName.trim(),
      dba: dba.trim() || undefined,
      einOrTaxId: einOrTaxId.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      isDefault: existing ? existing.isDefault : profiles.length === 0,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    onSaveProfile(profileToSave);
    // Switch to new profile automatically if newly created
    if (!existing) {
      onSelectProfile(profileToSave.id);
    }
    setViewMode('list');
    setEditingTargetId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (profiles.length <= 1) {
      alert('You must keep at least one company profile.');
      return;
    }
    const attachedCount = properties.filter((pr) => (pr.profileId || 'profile-default') === id).length;
    const confirmMsg = attachedCount > 0
      ? `Are you sure you want to delete "${name}"? It currently has ${attachedCount} building(s) assigned to it. Those buildings will be moved to your primary company profile.`
      : `Are you sure you want to delete profile "${name}"?`;

    if (window.confirm(confirmMsg)) {
      onDeleteProfile(id);
      if (activeProfileId === id) {
        const remaining = profiles.filter((p) => p.id !== id);
        if (remaining.length > 0) {
          onSelectProfile(remaining[0].id);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-[#11141B] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#141822]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Company & Portfolio Profiles
              </h2>
              <p className="text-xs text-slate-400">
                Organize buildings under separate LLCs, entities, or company names
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {/* Top banner / quick actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161B26] p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-300">
                    Active Entity Mode
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Select a profile below to filter buildings, rent roll, and unit repairs for that specific company.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Profile</span>
                </button>
              </div>

              {/* Profiles List */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Available Company Profiles ({profiles.length})
                </div>

                {profiles.map((profile) => {
                  const isActive = activeProfileId === profile.id;
                  const profileProps = properties.filter(
                    (p) => (p.profileId || 'profile-default') === profile.id
                  );
                  const totalUnits = profileProps.reduce((sum, p) => sum + (p.unitsCount || (p.units?.length || 1)), 0);

                  return (
                    <div
                      key={profile.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                          : 'bg-[#141822] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            onSelectProfile(profile.id);
                          }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base">
                              {profile.name}
                            </span>
                            {profile.dba && (
                              <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                                DBA: {profile.dba}
                              </span>
                            )}
                            {profile.isDefault && (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                Primary Entity
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/30 px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Active Now
                              </span>
                            )}
                          </div>

                          {/* Quick details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                            {profile.einOrTaxId && (
                              <div>
                                <span className="text-slate-500">Tax ID / EIN:</span> {profile.einOrTaxId}
                              </div>
                            )}
                            {profile.email && (
                              <div className="truncate">
                                <span className="text-slate-500">Email:</span> {profile.email}
                              </div>
                            )}
                            {profile.phone && (
                              <div>
                                <span className="text-slate-500">Phone:</span> {profile.phone}
                              </div>
                            )}
                            {profile.address && (
                              <div className="truncate">
                                <span className="text-slate-500">Address:</span> {profile.address}
                              </div>
                            )}
                          </div>

                          {profile.notes && (
                            <p className="text-xs text-slate-400/80 italic mt-1.5 line-clamp-1">
                              {profile.notes}
                            </p>
                          )}

                          {/* Property & Unit stats */}
                          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-800/60 text-xs">
                            <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                              {profileProps.length} {profileProps.length === 1 ? 'Building' : 'Buildings'}
                            </span>
                            <span className="text-slate-600">&bull;</span>
                            <span className="text-slate-400">
                              {totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'} Total
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onSelectProfile(profile.id)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors flex items-center gap-1"
                              title="Switch to this company profile"
                            >
                              <span>Switch</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(profile)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Profile Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {profiles.length > 1 && !profile.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleDelete(profile.id, profile.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Form View: Create or Edit */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span>{editingTargetId ? 'Edit Company Profile' : 'Create New Company Profile'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  &larr; Back to Profiles List
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              {/* Company / Profile Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company / Profile Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Sunset Holdings LLC, Sunshine Realty, or 100 Main St LLC"
                    className="w-full bg-[#161B26] border border-slate-800 text-slate-100 rounded-lg pl-3 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-600 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  This will appear across statements, rent receipts, and reports for buildings assigned to this company.
                </p>
              </div>

              {/* DBA & Tax ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Doing Business As (DBA) / Display Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={dba}
                    onChange={(e) => setDba(e.target.value)}
                    placeholder="e.g., Austin Multifamily Division"
                    className="w-full bg-[#161B26] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Federal Tax ID / EIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={einOrTaxId}
                    onChange={(e) => setEinOrTaxId(e.target.value)}
                    placeholder="e.g., 12-3456789"
                    className="w-full bg-[#161B26] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., info@sunsetholdings.com"
                    className="w-full bg-[#161B26] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Business Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., (555) 123-4567"
                    className="w-full bg-[#161B26] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Office Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official Office / Mailing Address (Optional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 500 Enterprise Way, Suite 200, Austin, TX 78701"
                  className="w-full bg-[#161B26] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Entity Notes & Legal Information (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Formed in Delaware 2024. Holds downtown commercial and duplex assets."
                  className="w-full bg-[#161B26] border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTargetId ? 'Save Changes' : 'Create Profile'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {viewMode === 'list' && (
          <div className="p-4 bg-[#141822] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>
              Currently viewing as: <strong className="text-white">{profiles.find((p) => p.id === activeProfileId)?.name || 'Default Profile'}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
