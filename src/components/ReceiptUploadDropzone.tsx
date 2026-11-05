import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Image as ImageIcon, 
  Paperclip,
  AlertCircle
} from 'lucide-react';

interface ReceiptUploadDropzoneProps {
  receiptUrl?: string;
  receiptFileName?: string;
  receiptFileType?: string;
  receiptFileSize?: number;
  onReceiptChange: (data: {
    receiptUrl?: string;
    receiptFileName?: string;
    receiptFileType?: string;
    receiptFileSize?: number;
    receiptUploadedAt?: string;
  }) => void;
  onPreviewClick?: () => void;
}

export const ReceiptUploadDropzone: React.FC<ReceiptUploadDropzoneProps> = ({
  receiptUrl,
  receiptFileName,
  receiptFileType,
  receiptFileSize,
  onReceiptChange,
  onPreviewClick,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate type: image or PDF
    const isValidType = file.type.startsWith('image/') || 
                        file.type === 'application/pdf' || 
                        file.name.toLowerCase().endsWith('.pdf');

    if (!isValidType) {
      setErrorMessage('Please upload an image (PNG, JPG, WEBP) or PDF invoice document.');
      return;
    }

    // Check size limit: max 4.5MB to preserve localStorage integrity
    if (file.size > 4.5 * 1024 * 1024) {
      setErrorMessage('Receipt file is too large (max 4.5 MB). Please compress or take a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onReceiptChange({
        receiptUrl: dataUrl,
        receiptFileName: file.name,
        receiptFileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        receiptFileSize: file.size,
        receiptUploadedAt: new Date().toISOString(),
      });
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveReceipt = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReceiptChange({
      receiptUrl: undefined,
      receiptFileName: undefined,
      receiptFileType: undefined,
      receiptFileSize: undefined,
      receiptUploadedAt: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isPdf = receiptFileType?.includes('pdf') || receiptFileName?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
          <span>Purchase Receipt & Warranty Invoice (Proof of Purchase)</span>
        </label>
        <span className="text-[10px] text-slate-500">
          JPG, PNG, PDF up to 4.5 MB
        </span>
      </div>

      {receiptUrl ? (
        /* Attached Receipt Preview Card */
        <div className="bg-[#161A23] border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail */}
            {isPdf ? (
              <div className="w-12 h-12 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg border border-slate-700 overflow-hidden bg-black shrink-0 relative group">
                <img
                  src={receiptUrl}
                  alt="Receipt thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  {receiptFileName || 'Receipt on file'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                <span className="text-emerald-400 font-semibold uppercase tracking-wider">
                  {isPdf ? 'PDF Invoice' : 'Image Receipt'}
                </span>
                {receiptFileSize && (
                  <span>• {formatFileSize(receiptFileSize)}</span>
                )}
                <span>• Saved for Warranty Claims</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onPreviewClick && (
              <button
                type="button"
                onClick={onPreviewClick}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                title="Preview receipt"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Replace with new receipt"
            >
              Replace
            </button>

            <button
              type="button"
              onClick={handleRemoveReceipt}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Delete receipt"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-emerald-500/60 bg-[#161A23]/60 hover:bg-[#161A23]'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800/90 text-slate-400 flex items-center justify-center border border-slate-700">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                <span className="text-emerald-400 hover:underline">Click to upload receipt</span> or drag and drop
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Save store invoice, paper receipt photo, or extended warranty certificate
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="text-xs text-rose-400 flex items-center gap-1.5 pt-1 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
