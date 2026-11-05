import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Building2, 
  CheckCircle2, 
  Receipt, 
  Calendar, 
  DollarSign, 
  User, 
  CreditCard,
  Home,
  Download,
  Loader2
} from 'lucide-react';
import { Property, RentPaymentRecord } from '../types';
import { formatCurrency } from '../utils/calculations';
import { downloadPdfDocument, printElement } from '../utils/printHelper';

interface RentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  payment: RentPaymentRecord | null;
}

export const RentReceiptModal: React.FC<RentReceiptModalProps> = ({
  isOpen,
  onClose,
  property,
  payment,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Close receipt on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !payment) return null;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const filename = `Rent_Receipt_${property.name.replace(/\s+/g, '_')}_${(payment.unitName || 'Unit').replace(/\s+/g, '_')}_${payment.monthYear}.pdf`;
    try {
      await downloadPdfDocument('printable-receipt', filename, `Rent Receipt - ${property.name}`);
    } catch (err) {
      console.error('PDF error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    printElement('printable-receipt', `Rent Receipt - ${property.name} - ${payment.unitName || 'Unit'}`);
  };

  const handleCopyText = () => {
    const text = `
RENT PAYMENT RECEIPT
-------------------------------------------
Receipt #: ${payment.receiptNumber || 'RCP-' + payment.id}
Date Paid: ${payment.paidDate || 'N/A'}
Property: ${property.name}
Address: ${property.address}
Unit: ${payment.unitName || 'Main Unit'}
Tenant: ${payment.tenantName}
For Month: ${payment.monthYear}
Payment Type: ${payment.paymentType || 'Monthly Rent'}
Payment Method: ${payment.paymentMethod || 'Direct Payment'}
Amount Paid: ${formatCurrency(payment.paidAmount)}
Reference / Memo: ${payment.referenceNumber || 'Confirmed'}
Status: ${payment.status === 'paid' ? 'PAID IN FULL' : payment.status.toUpperCase()}
-------------------------------------------
Thank you for your payment!
`;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert month string "2026-09" to "September 2026"
  const getFormattedMonth = (my: string) => {
    try {
      const [year, month] = my.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return my;
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-5 my-4 sm:my-6 text-slate-200 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
        {/* Header toolbar (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Rent Payment Receipt</h3>
              <p className="text-xs text-slate-400">Official tenant proof of payment</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleCopyText}
              title="Copy receipt text to clipboard"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Open Print Window (Primary) */}
            <button
              type="button"
              onClick={handlePrint}
              title="Open print preview window"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Print Window</span>
            </button>

            {/* Direct Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Save PDF file to device"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save .PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close receipt (Esc)"
              aria-label="Close dialog"
              className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="bg-[#11141B] p-5 sm:p-6 rounded-xl border border-slate-800 space-y-5 print:bg-white print:border-2 print:border-black print:text-black print:p-6">
          {/* Top Brand & Receipt No */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4 print:border-black">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400 print:text-black" />
                <span className="text-base font-extrabold text-white print:text-black uppercase tracking-wider">
                  Bros Rental Flow Property Management
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                {property.name} &bull; {property.address}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 print:text-black block">
                Official Receipt
              </span>
              <span className="text-xs font-mono font-bold text-white print:text-black">
                {payment.receiptNumber || `RCP-${payment.id.toUpperCase()}`}
              </span>
            </div>
          </div>

          {/* Paid Stamp & Month */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between print:bg-gray-100 print:border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 print:text-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 print:text-black uppercase tracking-wider block">
                  Payment Status: PAID IN FULL
                </span>
                <span className="text-sm font-semibold text-white print:text-black">
                  Rent for {getFormattedMonth(payment.monthYear)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 print:text-gray-600 block">Amount Paid</span>
              <span className="text-xl font-extrabold text-emerald-400 print:text-black">
                {formatCurrency(payment.paidAmount)}
              </span>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-[11px] font-semibold text-slate-400 print:text-gray-500 block mb-0.5">
                Tenant Name
              </span>
              <strong className="text-white print:text-black font-bold text-sm block">
                {payment.tenantName}
              </strong>
              <span className="text-[11px] text-slate-400 print:text-gray-600">
                {payment.unitName || 'Main Unit'}
              </span>
            </div>

            <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-[11px] font-semibold text-slate-400 print:text-gray-500 block mb-0.5">
                Payment Date & Method
              </span>
              <strong className="text-white print:text-black font-bold text-sm block">
                {payment.paidDate || 'Current Month'}
              </strong>
              <div className="flex flex-col gap-0.5 mt-0.5 text-[11px] text-slate-400 print:text-gray-600">
                <span>Type: <strong className="text-emerald-400 print:text-black">{payment.paymentType || 'Monthly Rent'}</strong></span>
                <span>Method: <strong>{payment.paymentMethod || 'Direct Deposit'}</strong></span>
              </div>
            </div>

            <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-[11px] font-semibold text-slate-400 print:text-gray-500 block mb-0.5">
                Transaction Reference #
              </span>
              <span className="text-white print:text-black font-mono font-medium block truncate">
                {payment.referenceNumber || 'Confirmed Electronic Transaction'}
              </span>
            </div>

            <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 print:bg-gray-50 print:border-gray-300">
              <span className="text-[11px] font-semibold text-slate-400 print:text-gray-500 block mb-0.5">
                Balance Due
              </span>
              <strong className="text-emerald-400 print:text-black font-bold block">
                {formatCurrency(Math.max(0, payment.expectedAmount - payment.paidAmount))} (Current)
              </strong>
            </div>
          </div>

          {/* Memo / Notes if present */}
          {payment.notes && (
            <div className="bg-[#161A23] p-3 rounded-lg border border-slate-800 print:bg-gray-50 print:border-gray-300 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 print:text-gray-500 block mb-0.5">
                Memo & Notes
              </span>
              <p className="text-slate-300 print:text-black italic">"{payment.notes}"</p>
            </div>
          )}

          {/* Signature / Landlord Verification */}
          <div className="pt-4 border-t border-slate-800 print:border-black flex items-center justify-between text-xs text-slate-400 print:text-gray-600">
            <div>
              <span>Authorized Signature / Management:</span>
              <div className="font-serif italic text-sm text-emerald-400 print:text-black mt-1">
                Bros Rental Flow Underwriting & Property Management
              </div>
            </div>
            <div className="text-right font-mono text-[10px]">
              Verified on {payment.paidDate || new Date().toISOString().split('T')[0]}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden in print) */}
        <div className="flex items-center justify-between pt-2 print:hidden gap-3 flex-wrap">
          <div className="text-xs text-slate-400">
            Receipt ref: <span className="font-mono text-slate-300">{payment.receiptNumber || 'RCP-' + payment.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Window</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save .PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
