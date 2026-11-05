import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { Property, ApplianceItem, UnitRental } from '../types';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface QuickReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  defaultApplianceId?: string;
  onSaveReceipt: (
    unitId: string,
    applianceId: string,
    receiptData: {
      receiptUrl: string;
      receiptFileName: string;
      receiptFileType: string;
      receiptFileSize: number;
      receiptUploadedAt: string;
    }
  ) => void;
}

export const QuickReceiptUploadModal: React.FC<QuickReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  property,
  defaultApplianceId,
  onSaveReceipt,
}) => {
  // Collect all appliances across units in the property
  const allAppliances: { unit: UnitRental; appliance: ApplianceItem }[] = [];
  (property.units || []).forEach((u) => {
    (u.appliances || []).forEach((a) => {
      allAppliances.push({ unit: u, appliance: a });
    });
  });

  const [selectedAppId, setSelectedAppId] = useState<string>(
    defaultApplianceId || allAppliances[0]?.appliance.id || ''
  );
  const [fileData, setFileData] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    const isValidType = 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf' || 
      file.name.toLowerCase().endsWith('.pdf');

    if (!isValidType) {
      setErrorMessage('Please upload an image file (JPG, PNG, WEBP) or a PDF document.');
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      setErrorMessage('Receipt file is too large (max 4.5 MB). Please take a smaller photo or compress PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData({
        url: reader.result as string,
        name: file.name,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        size: file.size,
      });
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleSave = () => {
    if (!selectedAppId) {
      setErrorMessage('Please choose which appliance this receipt is for.');
      return;
    }
    if (!fileData) {
      setErrorMessage('Please choose or drop a receipt file to upload.');
      return;
    }

    const match = allAppliances.find((x) => x.appliance.id === selectedAppId);
    if (!match) {
      setErrorMessage('Selected appliance not found.');
      return;
    }

    onSaveReceipt(match.unit.id, match.appliance.id, {
      receiptUrl: fileData.url,
      receiptFileName: fileData.name,
      receiptFileType: fileData.type,
      receiptFileSize: fileData.size,
      receiptUploadedAt: new Date().toISOString(),
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  const selectedApplianceItem = allAppliances.find((x) => x.appliance.id === selectedAppId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141822] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0E121A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upload Warranty & Purchase Receipt</h3>
              <p className="text-[11px] text-slate-400">Attach store receipt, invoice photo, or warranty PDF document</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Appliance Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Select Appliance / Asset
            </label>
            {allAppliances.length === 0 ? (
              <div className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                No appliances logged yet for this property. Add an appliance first in Section 6.
              </div>
            ) : (
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full bg-[#0E121A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {allAppliances.map(({ unit, appliance }) => (
                  <option key={appliance.id} value={appliance.id}>
                    {appliance.name} {appliance.brand ? `(${appliance.brand})` : ''} — {unit.name}
                    {appliance.receiptUrl ? ' [Has Existing Receipt]' : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedApplianceItem && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Warranty: {selectedApplianceItem.appliance.hasWarranty ? (selectedApplianceItem.appliance.warrantyType || 'Active') : 'Standard'}
                </span>
                {selectedApplianceItem.appliance.receiptUrl && (
                  <span className="text-emerald-400 font-medium">
                    (Will replace current receipt)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Select or Drop Receipt File (PDF, JPG, PNG)
            </label>
            
            {fileData ? (
              <div className="bg-[#0E121A] border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate max-w-[240px]">
                      {fileData.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatFileSize(fileData.size)} &bull; Ready to save
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20"
                    title="Preview uploaded document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileData(null)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                    title="Remove selected file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleProcessFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-700 hover:border-emerald-500/60 bg-[#0E121A]/70 hover:bg-[#0E121A]'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/90 text-slate-400 flex items-center justify-center border border-slate-700">
                    <UploadCloud className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      <span className="text-emerald-400 hover:underline">Click to browse your receipt</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports store invoice photo, paper receipt scan, or Home Depot / Lowe's PDF
                    </p>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {errorMessage && (
            <div className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Receipt saved successfully!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0E121A] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!fileData || !selectedAppId}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:hover:bg-emerald-400 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Receipt</span>
          </button>
        </div>
      </div>

      {isPreviewOpen && fileData && (
        <ReceiptViewerModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          documentUrl={fileData.url}
          documentFileName={fileData.name}
          documentFileType={fileData.type}
          documentFileSize={fileData.size}
          documentTitle={selectedApplianceItem?.appliance.name || 'Receipt Document Preview'}
          documentCategory="Appliance Receipt / Warranty"
        />
      )}
    </div>
  );
};
