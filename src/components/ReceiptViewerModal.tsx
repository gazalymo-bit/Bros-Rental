import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Store, 
  Trash2, 
  Upload, 
  ExternalLink,
  CheckCircle2,
  Maximize2,
  AlertCircle,
  Eye,
  FileCheck
} from 'lucide-react';
import { ApplianceItem } from '../types';
import { formatCurrency } from '../utils/calculations';

export interface ReceiptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  appliance?: ApplianceItem | null;
  // Generic document fields (supports Applicant/Tenant documents, Unit fixes, or standalone receipts)
  documentUrl?: string;
  documentTitle?: string;
  documentCategory?: string;
  documentFileName?: string;
  documentFileType?: string;
  documentFileSize?: number;
  documentUploadedAt?: string;
  unitName?: string;
  propertyName?: string;
  onDeleteReceipt?: () => void;
  onReplaceReceipt?: (file: File) => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  appliance,
  documentUrl,
  documentTitle,
  documentCategory,
  documentFileName,
  documentFileType,
  documentFileSize,
  documentUploadedAt,
  unitName,
  propertyName,
  onDeleteReceipt,
  onReplaceReceipt,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pdfLoadError, setPdfLoadError] = useState<boolean>(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const rawUrl = appliance?.receiptUrl || documentUrl;
  const fileName = appliance?.receiptFileName || documentFileName || 'Document';
  const fileType = appliance?.receiptFileType || documentFileType || '';
  const fileSize = appliance?.receiptFileSize ?? documentFileSize;
  const uploadedAt = appliance?.receiptUploadedAt || documentUploadedAt;

  const isPdf = Boolean(
    fileType.includes('pdf') || 
    fileName.toLowerCase().endsWith('.pdf') ||
    rawUrl?.startsWith('data:application/pdf')
  );

  const isImage = Boolean(
    fileType.startsWith('image/') || 
    rawUrl?.startsWith('data:image/') ||
    /\.(jpg|jpeg|png|webp|svg|gif|bmp)$/i.test(fileName)
  );

  // Convert Base64 data URL to a safe, accessible browser Blob URL
  // This bypasses Chrome's strict security policy that blocks data: URLs in top-frame navigation and iframes
  useEffect(() => {
    if (!rawUrl) {
      setBlobUrl(null);
      return;
    }

    if (rawUrl.startsWith('data:')) {
      try {
        const [header, base64Data] = rawUrl.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : (isPdf ? 'application/pdf' : 'image/jpeg');
        const binary = atob(base64Data);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const bUrl = URL.createObjectURL(blob);
        setBlobUrl(bUrl);

        return () => {
          URL.revokeObjectURL(bUrl);
        };
      } catch (err) {
        console.error('Failed to create Blob URL from data URL:', err);
        setBlobUrl(rawUrl);
      }
    } else {
      setBlobUrl(rawUrl);
    }
  }, [rawUrl, isPdf]);

  // Reset zoom and rotation when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPdfLoadError(false);
    }
  }, [isOpen, rawUrl]);

  if (!isOpen || !rawUrl) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    const targetUrl = blobUrl || rawUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    const targetUrl = blobUrl || rawUrl;
    if (!targetUrl) return;

    // Use blob URL so Chrome does not block top-frame navigation
    const newTab = window.open(targetUrl, '_blank');
    if (!newTab) {
      // If popup blocker blocked the new window, trigger instant download as reliable fallback
      handleDownload();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplaceReceipt) {
      onReplaceReceipt(file);
    }
  };

  const displayTitle = appliance 
    ? `${appliance.name} — Purchase Receipt` 
    : (documentTitle || 'Attached Document');

  const displayBadge = appliance 
    ? 'Warranty Proof of Purchase' 
    : (documentCategory || 'Verified Document');

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141822] border border-slate-700/80 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0E121A] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isPdf 
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {displayTitle}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {displayBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {propertyName ? `${propertyName} • ` : ''}
                {unitName ? `${unitName} • ` : ''}
                {fileName} {fileSize ? `(${formatFileSize(fileSize)})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Open in New Tab Button */}
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm transition-colors cursor-pointer"
              title="Open document in a separate browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </button>

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Download original document file"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="bg-[#11141B] px-4 py-2.5 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {appliance ? (
            <>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Bought Date</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  {appliance.boughtDate}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Purchase Cost</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  {appliance.purchasePrice ? formatCurrency(appliance.purchasePrice) : 'Cost N/A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Store / Retailer</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1 mt-0.5 truncate">
                  <Store className="w-3 h-3 text-slate-400 shrink-0" />
                  {appliance.vendorOrStore || 'Home Depot'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Warranty Status</span>
                <span className="font-semibold text-blue-400 flex items-center gap-1 mt-0.5 truncate">
                  <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                  {appliance.warrantyPolicyNumber 
                    ? `Policy: ${appliance.warrantyPolicyNumber}` 
                    : (appliance.hasWarranty ? (appliance.warrantyType || 'Covered') : 'No Warranty')}
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Document Name</span>
                <span className="font-semibold text-slate-200 truncate block mt-0.5">
                  {fileName}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">File Size</span>
                <span className="font-semibold text-slate-200 block mt-0.5">
                  {formatFileSize(fileSize) || 'Standard Document'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Document Type</span>
                <span className="font-semibold text-emerald-400 block mt-0.5">
                  {isPdf ? 'PDF Document' : isImage ? 'Image Document' : 'Document File'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Saved On</span>
                <span className="font-semibold text-blue-400 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {uploadedAt ? new Date(uploadedAt).toLocaleDateString() : 'Active Record'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Document Viewer Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0A0C10] flex flex-col items-center justify-center relative min-h-[380px]">
          {isPdf ? (
            <div className="w-full h-full flex flex-col items-center justify-between space-y-3">
              {/* PDF Container using native browser PDF plugin with Blob URL */}
              <div className="w-full flex-1 min-h-[460px] h-[55vh] rounded-xl overflow-hidden border border-slate-700 bg-[#0E121A] relative shadow-inner flex flex-col">
                {blobUrl && !pdfLoadError ? (
                  <object
                    data={blobUrl}
                    type="application/pdf"
                    className="w-full h-full min-h-[450px]"
                    onError={() => setPdfLoadError(true)}
                  >
                    <iframe
                      src={blobUrl}
                      title="PDF Document"
                      className="w-full h-full min-h-[450px] border-none"
                    />
                  </object>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center my-auto space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{fileName}</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        PDF ready for view. Click below to view in a dedicated full browser tab or download to your computer.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleOpenInNewTab}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open Document in New Tab</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Download PDF File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Ribbon beneath PDF */}
              <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full PDF in New Window</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {/* Image Controls Floating Toolbar */}
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex items-center gap-1 bg-[#11141B]/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-slate-300 px-1 font-semibold">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Reset Zoom & Orientation"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Open Full Image in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Receipt Image Display */}
              <div className="overflow-auto max-h-[62vh] max-w-full flex items-center justify-center p-2">
                <img
                  src={blobUrl || rawUrl}
                  alt={displayTitle}
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800/80 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer info & management actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-[#11141B] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 truncate max-w-xs sm:max-w-md">
              {fileName}
            </span>
            {fileSize && (
              <span className="text-[11px] text-slate-500 font-mono">
                • {formatFileSize(fileSize)}
              </span>
            )}
            {uploadedAt && (
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                • Saved on {new Date(uploadedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onReplaceReceipt && (
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Replace File</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            )}

            {onDeleteReceipt && (
              <button
                type="button"
                onClick={onDeleteReceipt}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors cursor-pointer"
                title="Remove attached document"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
