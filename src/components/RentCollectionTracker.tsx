import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Plus, 
  Receipt, 
  FileDown, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Building2, 
  CreditCard,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  Layers,
  Send,
  Tag,
  Wallet,
  CheckSquare,
  FileSpreadsheet,
  X,
  Wrench,
  Hammer,
  Phone,
  ArrowRight,
  Home,
  Paperclip,
  Upload,
  Eye,
  FileText,
  Download
} from 'lucide-react';
import { Property, UnitRental, RentPaymentRecord, PaymentMethod, RentPaymentType, PaymentStatus, Transaction, TenantDocument } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { exportRentRollToCSV } from '../utils/storage';
import { RentReceiptModal } from './RentReceiptModal';
import { ReceiptViewerModal } from './ReceiptViewerModal';

interface RentCollectionTrackerProps {
  property: Property;
  allProperties: Property[];
  rentPayments: RentPaymentRecord[];
  transactions?: Transaction[];
  onSavePayment: (payment: RentPaymentRecord) => void;
  onDeletePayment: (paymentId: string) => void;
  onAddTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onUpdateProperty?: (property: Property) => void;
  onSelectProperty: (propertyId: string) => void;
  onNavigateToLedger: () => void;
  onNavigateToUnitFix?: () => void;
  onOpenStatement?: (unitId?: string, monthYear?: string, scope?: 'portfolio' | 'property' | 'unit') => void;
  onClearAllPayments?: () => void;
}

// Helper to format live current year-month according to system date
const getLiveCurrentMonthKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const RentCollectionTracker: React.FC<RentCollectionTrackerProps> = ({
  property,
  allProperties,
  rentPayments,
  transactions = [],
  onSavePayment,
  onDeletePayment,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateProperty,
  onSelectProperty,
  onNavigateToLedger,
  onNavigateToUnitFix,
  onOpenStatement,
  onClearAllPayments,
}) => {
  // Current local time anchor according to live date
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => getLiveCurrentMonthKey());

  // Always show current month according to date when tab is opened
  useEffect(() => {
    setSelectedMonthYear(getLiveCurrentMonthKey());
  }, []);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix' | 'portfolio'>('cards');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'pending' | 'overdue'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Payment Recording Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [recordingUnit, setRecordingUnit] = useState<UnitRental | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // Form State for Recording Payment & Editing Unit/Tenant
  const [modalActiveTab, setModalActiveTab] = useState<'payment' | 'tenant'>('payment');
  const [formMonthYear, setFormMonthYear] = useState<string>('2026-10');
  const [formTenantName, setFormTenantName] = useState<string>('');
  const [formTenantPhone, setFormTenantPhone] = useState<string>('');
  const [formLeaseStart, setFormLeaseStart] = useState<string>('');
  const [formLeaseEnd, setFormLeaseEnd] = useState<string>('');
  const [formIsOccupied, setFormIsOccupied] = useState<boolean>(true);
  const [formSecurityDeposit, setFormSecurityDeposit] = useState<string>('0');
  const [formExpectedAmount, setFormExpectedAmount] = useState<string>('0');
  const [formPaidAmount, setFormPaidAmount] = useState<string>('');
  const [formPaidDate, setFormPaidDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentType, setFormPaymentType] = useState<RentPaymentType>('Monthly Rent');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('Zelle');
  const [formReferenceNumber, setFormReferenceNumber] = useState<string>('');
  const [formLateFee, setFormLateFee] = useState<string>('0');
  const [formDiscount, setFormDiscount] = useState<string>('0');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('paid');
  const [formUnitDocuments, setFormUnitDocuments] = useState<TenantDocument[]>([]);
  const [activeViewingDoc, setActiveViewingDoc] = useState<{ doc: TenantDocument; unitName?: string } | null>(null);
  const [docCategory, setDocCategory] = useState<'Rental Application' | 'Lease Agreement' | 'ID / Verification' | 'Proof of Income' | 'Other'>('Rental Application');

  // Post-payment feedback banner state
  const [postPaymentAlert, setPostPaymentAlert] = useState<{
    unitName: string;
    monthYear: string;
    paidAmount: number;
    payment: RentPaymentRecord;
  } | null>(null);

  // Receipt Modal State
  const [receiptPayment, setReceiptPayment] = useState<RentPaymentRecord | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Copied reminder tooltip state
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRecordModalOpen) setIsRecordModalOpen(false);
        if (isReceiptModalOpen) setIsReceiptModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecordModalOpen, isReceiptModalOpen]);

  // Helper to format "2026-09" to "September 2026"
  const formattedMonth = useMemo(() => {
    try {
      const [year, month] = selectedMonthYear.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return selectedMonthYear;
    }
  }, [selectedMonthYear]);

  // Month navigation functions
  const handlePrevMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonthYear(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonthYear(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleJumpToCurrent = () => {
    setSelectedMonthYear(getLiveCurrentMonthKey());
  };

  // Derive all active units for current property
  const currentUnits: UnitRental[] = useMemo(() => {
    if (property.units && property.units.length > 0) {
      return property.units.map((u, i) => ({
        ...u,
        tenantName: u.tenantName || (i === 0 ? property.tenantName : '') || '',
        tenantPhone: u.tenantPhone || (i === 0 ? property.tenantPhone : undefined),
        leaseStart: u.leaseStart || (i === 0 ? property.leaseStart : undefined),
        leaseEnd: u.leaseEnd || (i === 0 ? property.leaseEnd : undefined),
      }));
    }
    return [
      {
        id: 'u-main',
        name: 'Main Residence',
        rent: property.baseMonthlyRent || 0,
        isOccupied: true,
        tenantName: property.tenantName || 'Primary Tenant',
        tenantPhone: property.tenantPhone,
        leaseStart: property.leaseStart,
        leaseEnd: property.leaseEnd,
      },
    ];
  }, [property]);

  // Filter payments for this property and month
  const propertyMonthPayments = useMemo(() => {
    return rentPayments.filter(
      (p) => p.propertyId === property.id && p.monthYear === selectedMonthYear
    );
  }, [rentPayments, property.id, selectedMonthYear]);

  // Merge each unit with its payment record for the selected month
  const unitsWithStatus = useMemo(() => {
    return currentUnits.map((unit) => {
      const payment = propertyMonthPayments.find((p) => p.unitId === unit.id || (!p.unitId && p.tenantName === unit.tenantName));
      
      let status: PaymentStatus = 'pending';
      let paidAmount = 0;
      let isOverdue = false;

      if (payment) {
        status = payment.status;
        paidAmount = payment.paidAmount;
      } else {
        // If vacant or zero rent scheduled, it is vacant (not overdue)
        if (!unit.isOccupied || Number(unit.rent) === 0) {
          status = 'pending';
          isOverdue = false;
        } else {
          // If not paid, determine if overdue based on selected month vs current
          const currentMonthKey = getLiveCurrentMonthKey();
          if (selectedMonthYear < currentMonthKey) {
            status = 'overdue';
            isOverdue = true;
          } else {
            status = 'pending';
          }
        }
      }

      return {
        unit,
        payment: payment || null,
        status,
        expectedAmount: unit.rent,
        paidAmount,
        isOverdue,
      };
    });
  }, [currentUnits, propertyMonthPayments, selectedMonthYear]);

  // Metrics for active property in selected month
  const totalExpected = useMemo(() => {
    return unitsWithStatus.reduce((sum, item) => sum + item.expectedAmount, 0);
  }, [unitsWithStatus]);

  const totalCollected = useMemo(() => {
    return unitsWithStatus.reduce((sum, item) => sum + item.paidAmount, 0);
  }, [unitsWithStatus]);

  const outstandingBalance = Math.max(0, totalExpected - totalCollected);
  const collectionPercentage = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
  
  // Paid vs Unpaid units breakdown
  const paidUnits = useMemo(() => {
    return unitsWithStatus.filter((u) => u.status === 'paid' || u.paidAmount >= u.expectedAmount);
  }, [unitsWithStatus]);

  const unpaidUnits = useMemo(() => {
    return unitsWithStatus.filter((u) => u.status !== 'paid' && u.paidAmount < u.expectedAmount);
  }, [unitsWithStatus]);

  const paidUnitsCount = paidUnits.length;
  const isFullyCollected = totalCollected >= totalExpected && totalExpected > 0;

  // Property Management Fee calculation for the active property
  const propertyMgmtExpense = useMemo(() => {
    return property.expenses?.find(
      (e) => e.category === 'Property Management' || e.name.toLowerCase().includes('management')
    );
  }, [property]);

  const propertyMgmtRate = useMemo(() => {
    if (propertyMgmtExpense) {
      if (propertyMgmtExpense.isPercentageOfRent && propertyMgmtExpense.percentageValue !== undefined && propertyMgmtExpense.percentageValue > 0) {
        return propertyMgmtExpense.percentageValue;
      }
      if (propertyMgmtExpense.amount > 0) {
        const gross = Number(property.baseMonthlyRent) || 
          (property.units && property.units.length > 0 ? property.units.reduce((s, u) => s + (Number(u.rent) || 0), 0) : 0) || 1;
        return (Number(propertyMgmtExpense.amount) / gross) * 100;
      }
    }
    return 8; // Default standard 8% property management rate
  }, [propertyMgmtExpense, property]);

  // Portfolio-wide aggregation across all properties for the chosen month
  const portfolioSummary = useMemo(() => {
    let totalPortfolioExpected = 0;
    let totalPortfolioCollected = 0;
    let totalPortfolioUnits = 0;
    let totalPortfolioPaidUnits = 0;

    const propertySummaries = allProperties.map((p) => {
      const pUnits = p.units && p.units.length > 0
        ? p.units.map((u, idx) => ({
            ...u,
            tenantName: u.tenantName || (idx === 0 ? p.tenantName : '') || '',
            tenantPhone: u.tenantPhone || (idx === 0 ? p.tenantPhone : undefined),
            leaseEnd: u.leaseEnd || (idx === 0 ? p.leaseEnd : undefined),
          }))
        : [{ 
            id: `${p.id}-main`, 
            name: 'Main Unit', 
            rent: p.baseMonthlyRent || 0, 
            isOccupied: (p as any).isOccupied !== false && (p.baseMonthlyRent || 0) > 0,
            tenantName: p.tenantName || '',
            tenantPhone: p.tenantPhone,
            leaseEnd: p.leaseEnd,
          } as UnitRental];
      const pPayments = rentPayments.filter((rp) => rp.propertyId === p.id && rp.monthYear === selectedMonthYear);
      
      const pExpected = pUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
      const pPaidPayments = pPayments.filter((rp) => (rp.status === 'paid' || rp.status === 'partial') && Number(rp.paidAmount) > 0);
      const pCollected = pPaidPayments.reduce((sum, rp) => sum + Number(rp.paidAmount), 0);
      const pBalance = Math.max(0, pExpected - pCollected);
      const pPct = pExpected > 0 ? (pCollected / pExpected) * 100 : 0;
      const isPaidFull = pCollected >= pExpected && pExpected > 0;
      
      const isVacant = (() => {
        if ((p as any).isOccupied === false) return true;
        if (p.units && p.units.length > 0) {
          const hasAnyOccupiedWithRent = p.units.some(
            (u) => u.isOccupied && Number(u.rent) > 0 && (!u.tenantName || !u.tenantName.toLowerCase().includes('vacant'))
          );
          if (!hasAnyOccupiedWithRent) return true;
          if (p.units.every((u) => !u.isOccupied || Number(u.rent) === 0)) return true;
        } else {
          if (Number(p.baseMonthlyRent) === 0) return true;
        }
        const tStr = (p.tenantName || '').toLowerCase();
        const isTVacant = !tStr || tStr.includes('vacant') || tStr.includes('unassigned');
        if (pExpected === 0 && isTVacant) return true;
        if (pExpected === 0 && Number(p.baseMonthlyRent) === 0) return true;
        return false;
      })();
      
      const paidCount = pUnits.filter((u) => {
        const pay = pPaidPayments.find((pay) => pay.unitId === u.id || pay.unitName === u.name);
        return pay && Number(pay.paidAmount) >= Number(u.rent);
      }).length;

      totalPortfolioExpected += pExpected;
      totalPortfolioCollected += pCollected;
      totalPortfolioUnits += pUnits.length;
      totalPortfolioPaidUnits += paidCount;

      return {
        property: p,
        unitsCount: pUnits.length,
        unitsWithInfo: pUnits,
        expected: pExpected,
        collected: pCollected,
        balance: pBalance,
        collectionRate: pPct,
        isPaidFull,
        isVacant,
        paidUnitsCount: paidCount,
        paymentsCount: pPayments.length,
        isSelected: p.id === property.id,
      };
    });

    const portfolioBalance = Math.max(0, totalPortfolioExpected - totalPortfolioCollected);
    const portfolioRate = totalPortfolioExpected > 0 ? (totalPortfolioCollected / totalPortfolioExpected) * 100 : 0;

    return {
      totalPortfolioExpected,
      totalPortfolioCollected,
      totalPortfolioBalance: portfolioBalance,
      portfolioRate,
      totalPortfolioUnits,
      totalPortfolioPaidUnits,
      propertySummaries,
    };
  }, [allProperties, rentPayments, selectedMonthYear, property.id]);

  // Helper to format any YYYY-MM
  const formatMonthLabel = (my: string) => {
    try {
      const [year, month] = my.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return my;
    }
  };

  const getNextMonthKey = (currentMY: string) => {
    const [y, m] = currentMY.split('-').map(Number);
    let nextY = y;
    let nextM = m + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    return `${nextY}-${String(nextM).padStart(2, '0')}`;
  };

  const formatDateDisplayLong = (dateStr: string) => {
    if (!dateStr) return 'No Date Selected';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (!y || !m || !d) return dateStr;
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatMonthAbbr = (monthYearStr: string) => {
    if (!monthYearStr) return '';
    try {
      const [y, m] = monthYearStr.split('-').map(Number);
      const date = new Date(y, m - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short' });
    } catch {
      return monthYearStr;
    }
  };

  const handleStepDate = (days: number) => {
    try {
      const base = formPaidDate ? new Date(formPaidDate + 'T12:00:00') : new Date();
      base.setDate(base.getDate() + days);
      setFormPaidDate(base.toISOString().split('T')[0]);
    } catch {
      // ignore
    }
  };

  const handleQuickUpdatePaidDate = (payment: RentPaymentRecord, newDate: string) => {
    if (!newDate) return;
    const updated: RentPaymentRecord = {
      ...payment,
      paidDate: newDate,
      updatedAt: new Date().toISOString(),
    };
    onSavePayment(updated);
  };

  const formatDocSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadTenantDocument = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;
      const newDoc: TenantDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: `${docCategory} (${file.name})`,
        category: docCategory,
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
        fileUrl: result,
        uploadedAt: new Date().toISOString(),
      };
      setFormUnitDocuments((prev) => [newDoc, ...prev]);
    };
    reader.readAsDataURL(file);
  };

  // Open record payment modal with customizable rent month, payment values, and tenant details
  const handleOpenRecordPayment = (
    unitItem: typeof unitsWithStatus[0], 
    overrideMonthYear?: string,
    initialTab: 'payment' | 'tenant' = 'payment'
  ) => {
    setModalActiveTab(initialTab);
    const targetMonth = overrideMonthYear || unitItem.payment?.monthYear || selectedMonthYear;
    const expAmt = unitItem.payment?.expectedAmount ?? unitItem.expectedAmount;
    setRecordingUnit(unitItem.unit);
    setEditingPaymentId(unitItem.payment ? unitItem.payment.id : null);
    setFormMonthYear(targetMonth);
    setFormTenantName(unitItem.payment?.tenantName || unitItem.unit.tenantName || 'Current Tenant');

    const uPhone = unitItem.unit.tenantPhone || (property.unitsCount <= 1 ? property.tenantPhone : '') || '';
    const uLeaseEnd = unitItem.unit.leaseEnd || (property.unitsCount <= 1 ? property.leaseEnd : '') || '';
    const uLeaseStart = unitItem.unit.leaseStart || (property.unitsCount <= 1 ? property.leaseStart : '') || '';
    setFormTenantPhone(uPhone);
    setFormLeaseEnd(uLeaseEnd);
    setFormLeaseStart(uLeaseStart);
    setFormIsOccupied(unitItem.unit.isOccupied !== false);
    setFormSecurityDeposit(unitItem.unit.securityDeposit ? String(unitItem.unit.securityDeposit) : '0');
    setFormUnitDocuments(unitItem.unit.documents || []);

    setFormExpectedAmount(String(expAmt));
    setFormPaidAmount(unitItem.payment ? String(unitItem.payment.paidAmount) : String(expAmt));

    const currentMY = new Date().toISOString().slice(0, 7);
    const defaultDate = unitItem.payment?.paidDate 
      ? unitItem.payment.paidDate 
      : targetMonth === currentMY 
      ? new Date().toISOString().split('T')[0] 
      : `${targetMonth}-01`;
    setFormPaidDate(defaultDate);

    setFormPaymentType(unitItem.payment?.paymentType || 'Monthly Rent');
    setFormPaymentMethod(unitItem.payment?.paymentMethod || 'Zelle');
    setFormReferenceNumber(unitItem.payment?.referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormLateFee(unitItem.payment?.lateFeeApplied ? String(unitItem.payment.lateFeeApplied) : '0');
    setFormDiscount('0');
    setFormNotes(unitItem.payment?.notes || '');
    setFormStatus(unitItem.payment?.status || 'paid');
    setIsRecordModalOpen(true);
  };

  // Instant 1-click mark paid in full without mandatory manual forms
  const handleQuickMarkPaidFull = (unitItem: typeof unitsWithStatus[0]) => {
    const targetMonth = selectedMonthYear;
    const expAmt = unitItem.expectedAmount;
    const newPaymentRecord: RentPaymentRecord = {
      id: unitItem.payment?.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      propertyId: property.id,
      unitId: unitItem.unit.id,
      unitName: unitItem.unit.name,
      tenantName: unitItem.unit.tenantName || 'Current Tenant',
      monthYear: targetMonth,
      expectedAmount: expAmt,
      paidAmount: expAmt,
      paidDate: new Date().toISOString().split('T')[0],
      paymentType: 'Monthly Rent',
      paymentMethod: 'Zelle',
      status: 'paid',
      receiptNumber: `RCP-${targetMonth.replace('-', '')}-${unitItem.unit.id.toUpperCase().slice(-3)}`,
      notes: 'Confirmed on-time payment in full',
      createdAt: unitItem.payment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSavePayment(newPaymentRecord);
    setPostPaymentAlert({
      unitName: unitItem.unit.name,
      monthYear: targetMonth,
      paidAmount: expAmt,
      payment: newPaymentRecord,
    });
  };

  // Submit payment & tenant/lease changes
  const handleSavePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingUnit) return;

    const expectedNum = parseFloat(formExpectedAmount) || 0;
    const paidNum = parseFloat(formPaidAmount) || 0;
    const lateFeeNum = parseFloat(formLateFee) || 0;
    const discountNum = parseFloat(formDiscount) || 0;
    const secDepositNum = parseFloat(formSecurityDeposit) || 0;
    const finalStatus: PaymentStatus = paidNum >= expectedNum ? 'paid' : paidNum > 0 ? 'partial' : 'pending';

    const newPaymentRecord: RentPaymentRecord = {
      id: editingPaymentId || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      propertyId: property.id,
      unitId: recordingUnit.id,
      unitName: recordingUnit.name,
      tenantName: formTenantName.trim() || recordingUnit.tenantName || 'Tenant',
      monthYear: formMonthYear,
      expectedAmount: expectedNum,
      paidAmount: paidNum,
      paidDate: formPaidDate,
      paymentType: formPaymentType,
      paymentMethod: formPaymentMethod,
      status: finalStatus,
      referenceNumber: formReferenceNumber.trim() || undefined,
      receiptNumber: `RCP-${formMonthYear.replace('-', '')}-${recordingUnit.id.toUpperCase().slice(-3)}`,
      notes: formNotes.trim() ? formNotes.trim() + (discountNum > 0 ? ` (Discount: -$${discountNum})` : '') : (discountNum > 0 ? `Discount/Concession applied: -$${discountNum}` : undefined),
      lateFeeApplied: lateFeeNum > 0 ? lateFeeNum : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSavePayment(newPaymentRecord);
    setIsRecordModalOpen(false);

    // Keep active month in view if user selected a different billing period
    if (formMonthYear && formMonthYear !== selectedMonthYear) {
      setSelectedMonthYear(formMonthYear);
    }

    // Synchronize property units, tenant name, phone, lease end date, and rent
    if (onUpdateProperty) {
      const updatedUnits = (property.units && property.units.length > 0)
        ? property.units.map((u) => {
            if (u.id === recordingUnit.id || u.name === recordingUnit.name) {
              return {
                ...u,
                rent: expectedNum > 0 ? expectedNum : u.rent,
                tenantName: formTenantName.trim() || u.tenantName,
                tenantPhone: formTenantPhone.trim() || undefined,
                leaseStart: formLeaseStart.trim() || undefined,
                leaseEnd: formLeaseEnd.trim() || undefined,
                isOccupied: formIsOccupied,
                securityDeposit: secDepositNum > 0 ? secDepositNum : u.securityDeposit,
                documents: formUnitDocuments,
              };
            }
            return u;
          })
        : [
            {
              id: recordingUnit.id || 'u-main',
              name: recordingUnit.name || 'Main Residence',
              rent: expectedNum > 0 ? expectedNum : property.baseMonthlyRent,
              isOccupied: formIsOccupied,
              tenantName: formTenantName.trim() || property.tenantName,
              tenantPhone: formTenantPhone.trim() || property.tenantPhone,
              leaseStart: formLeaseStart.trim() || property.leaseStart,
              leaseEnd: formLeaseEnd.trim() || property.leaseEnd,
              securityDeposit: secDepositNum > 0 ? secDepositNum : property.securityDeposit,
              documents: formUnitDocuments,
            },
          ];

      const newBaseRent = updatedUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
      onUpdateProperty({
        ...property,
        units: updatedUnits,
        baseMonthlyRent: newBaseRent > 0 ? newBaseRent : property.baseMonthlyRent,
        tenantName: formTenantName.trim() || property.tenantName,
        tenantPhone: formTenantPhone.trim() || property.tenantPhone,
        leaseStart: formLeaseStart.trim() || property.leaseStart,
        leaseEnd: formLeaseEnd.trim() || property.leaseEnd,
        isOccupied: formIsOccupied,
        updatedAt: new Date().toISOString(),
      });
    }

    // Set post-payment notification banner so user can easily pick next rent month or view receipt
    setPostPaymentAlert({
      unitName: recordingUnit.name,
      monthYear: formMonthYear,
      paidAmount: paidNum,
      payment: newPaymentRecord,
    });
  };

  // View Receipt
  const handleViewReceipt = (payment: RentPaymentRecord) => {
    setReceiptPayment(payment);
    setIsReceiptModalOpen(true);
  };

  // Copy Tenant Reminder / Notice
  const handleCopyReminder = (unit: UnitRental, expected: number) => {
    const text = `Hi ${unit.tenantName || 'Resident'}, this is a friendly reminder that rent of ${formatCurrency(expected)} for ${unit.name} (${property.name}) is due for ${formattedMonth}. Accepted methods: Zelle, ACH, Venmo, Check. Thank you!`;
    navigator.clipboard.writeText(text);
    setCopiedTenantId(unit.id);
    setTimeout(() => setCopiedTenantId(null), 2500);
  };

  // Filtered unit cards
  const filteredUnits = useMemo(() => {
    return unitsWithStatus.filter((item) => {
      const isPaid = item.status === 'paid' || item.paidAmount >= item.expectedAmount;
      if (statusFilter === 'paid' && !isPaid) return false;
      if (statusFilter === 'unpaid' && isPaid) return false;
      if (statusFilter === 'pending' && (isPaid || item.isOverdue)) return false;
      if (statusFilter === 'overdue' && !item.isOverdue) return false;
      if (typeFilter !== 'all') {
        const itemType = item.payment?.paymentType || 'Monthly Rent';
        if (itemType !== typeFilter) return false;
      }
      if (methodFilter !== 'all') {
        const itemMethod = item.payment?.paymentMethod;
        if (itemMethod !== methodFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.unit.name.toLowerCase().includes(q) ||
          (item.unit.tenantName && item.unit.tenantName.toLowerCase().includes(q)) ||
          (item.payment?.paymentType && item.payment.paymentType.toLowerCase().includes(q)) ||
          (item.payment?.paymentMethod && item.payment.paymentMethod.toLowerCase().includes(q)) ||
          (item.payment?.referenceNumber && item.payment.referenceNumber.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [unitsWithStatus, statusFilter, typeFilter, methodFilter, searchQuery]);

  // Months array for 12-month schedule matrix
  const yearMonths = useMemo(() => {
    const months = [
      '2026-01', '2026-02', '2026-03', '2026-04',
      '2026-05', '2026-06', '2026-07', '2026-08',
      '2026-09', '2026-10', '2026-11', '2026-12'
    ];
    return months;
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Monthly Controller */}
      <div className="bg-[#161A23] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Monthly Rent Collection & Tenant Payment Center
                  {isFullyCollected && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Collected
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track when tenants pay every month, mark payments as received, generate printable receipts, and sync to the ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Month Selector Controls with Direct Dropdown */}
          <div className="flex flex-wrap items-center gap-2 bg-[#11141B] p-1.5 rounded-xl border border-slate-800 self-start lg:self-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-1">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <select
                value={selectedMonthYear}
                onChange={(e) => setSelectedMonthYear(e.target.value)}
                className="bg-transparent text-sm font-bold text-white cursor-pointer py-1 px-1 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 rounded-lg"
              >
                <optgroup label="2026 Active Year">
                  <option value="2026-01" className="bg-[#161A23] text-white">January 2026</option>
                  <option value="2026-02" className="bg-[#161A23] text-white">February 2026</option>
                  <option value="2026-03" className="bg-[#161A23] text-white">March 2026</option>
                  <option value="2026-04" className="bg-[#161A23] text-white">April 2026</option>
                  <option value="2026-05" className="bg-[#161A23] text-white">May 2026</option>
                  <option value="2026-06" className="bg-[#161A23] text-white">June 2026</option>
                  <option value="2026-07" className="bg-[#161A23] text-white">July 2026</option>
                  <option value="2026-08" className="bg-[#161A23] text-white">August 2026</option>
                  <option value="2026-09" className="bg-[#161A23] text-white">September 2026</option>
                  <option value="2026-10" className="bg-[#161A23] text-emerald-400 font-bold">October 2026 (Current)</option>
                  <option value="2026-11" className="bg-[#161A23] text-white">November 2026</option>
                  <option value="2026-12" className="bg-[#161A23] text-white">December 2026</option>
                </optgroup>
                <optgroup label="2027 Future Year">
                  <option value="2027-01" className="bg-[#161A23] text-white">January 2027</option>
                  <option value="2027-02" className="bg-[#161A23] text-white">February 2027</option>
                  <option value="2027-03" className="bg-[#161A23] text-white">March 2027</option>
                  <option value="2027-04" className="bg-[#161A23] text-white">April 2027</option>
                  <option value="2027-05" className="bg-[#161A23] text-white">May 2027</option>
                  <option value="2027-06" className="bg-[#161A23] text-white">June 2027</option>
                </optgroup>
                <optgroup label="2025 Past Year">
                  <option value="2025-10" className="bg-[#161A23] text-white">October 2025</option>
                  <option value="2025-11" className="bg-[#161A23] text-white">November 2025</option>
                  <option value="2025-12" className="bg-[#161A23] text-white">December 2025</option>
                </optgroup>
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedMonthYear !== getLiveCurrentMonthKey() && (
              <button
                type="button"
                onClick={handleJumpToCurrent}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 transition-colors ml-1"
              >
                Current Month
              </button>
            )}
          </div>
        </div>

        {/* Post-Payment Alert & Immediate Next-Month Action Banner */}
        {postPaymentAlert && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-xs text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-lg shadow-emerald-950/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  Rent Payment of {formatCurrency(postPaymentAlert.paidAmount)} Recorded for {formatMonthLabel(postPaymentAlert.monthYear)}!
                </span>
                <span className="text-[11px] text-slate-400">
                  Credited to {postPaymentAlert.unitName} &bull; Received: <strong className="text-emerald-400 font-mono">{postPaymentAlert.payment.paidDate || 'Today'}</strong> &bull; Synced to ledger.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  const unitItem = unitsWithStatus.find((u) => u.unit.id === postPaymentAlert.payment.unitId);
                  if (unitItem) handleOpenRecordPayment(unitItem, postPaymentAlert.monthYear);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
                title="Change the date this rent payment was received"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Date: {postPaymentAlert.payment.paidDate || 'Today'} (Change)</span>
              </button>

              <button
                type="button"
                onClick={() => handleViewReceipt(postPaymentAlert.payment)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 transition-colors"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>View Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextMonth = getNextMonthKey(postPaymentAlert.monthYear);
                  setSelectedMonthYear(nextMonth);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pick Next Month ({formatMonthLabel(getNextMonthKey(postPaymentAlert.monthYear))})</span>
              </button>

              <button
                type="button"
                onClick={() => setPostPaymentAlert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            PORTFOLIO RENT COLLECTION OVERVIEW (ON MAIN PAGE)
           ========================================================================= */}
        <div className="bg-[#11141B] rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Portfolio Rent Collection Overview ({formattedMonth})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidated rent roll across all {allProperties.length} properties &bull; Click any property to apply rent directly
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {formatCurrency(portfolioSummary.totalPortfolioCollected)} Collected ({portfolioSummary.portfolioRate.toFixed(0)}%)
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {formatCurrency(portfolioSummary.totalPortfolioBalance)} Due
              </span>
              {onOpenStatement && (
                <button
                  type="button"
                  onClick={() => onOpenStatement(undefined, selectedMonthYear, 'portfolio')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Generate Consolidated Portfolio Statement for this month"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Portfolio Statement</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Property Cards Grid on Main Page */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {portfolioSummary.propertySummaries.map((item) => {
              const p = item.property;
              const isVacant = item.isVacant;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProperty(p.id);
                    setViewMode('cards');
                  }}
                  className={`rounded-xl p-3.5 space-y-2.5 cursor-pointer transition-all duration-200 border-2 ${
                    isVacant
                      ? item.isSelected
                        ? 'bg-[#191116] border-rose-500 ring-2 ring-rose-500/60 shadow-lg shadow-rose-950/60'
                        : 'bg-[#161217] border-rose-500 hover:border-rose-400 hover:bg-[#1D1319] shadow-md shadow-rose-950/40 ring-1 ring-rose-500/30'
                      : item.isPaidFull
                      ? 'bg-[#161B26] border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : item.isSelected
                      ? 'bg-[#161B26] border-emerald-500 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-950/40'
                      : 'bg-[#141822] border-slate-800 hover:border-slate-700 hover:bg-[#161B26]'
                  }`}
                  title={isVacant ? `${p.name} is currently vacant` : `Click to select ${p.name} and apply rent`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate max-w-[170px]">
                          {p.name}
                        </span>
                        {item.isSelected && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            isVacant
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isVacant
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 ring-1 ring-rose-500/30'
                        : item.isPaidFull
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.collected > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {isVacant ? 'VACANT' : item.isPaidFull ? '100% PAID' : item.collected > 0 ? `${item.collectionRate.toFixed(0)}% PAID` : 'NOT PAID'}
                    </span>
                  </div>

                  {/* Tenant, Phone & Lease End Details */}
                  <div className="bg-[#0E121A] p-2 rounded-lg border border-slate-800/80 text-xs">
                    {isVacant ? (
                      <div className="flex items-center gap-1.5 text-rose-300/90 text-[11px] font-medium">
                        <User className="w-3 h-3 text-rose-400/80 shrink-0" />
                        <span>Currently Vacant (No Active Lease)</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {item.unitsWithInfo
                          .filter((u) => u.isOccupied !== false && (u.tenantName || Number(u.rent) > 0))
                          .map((u, uIdx) => (
                            <div key={u.id || uIdx} className="flex items-center justify-between gap-1 text-[11px] border-b border-slate-800/60 last:border-b-0 pb-0.5 last:pb-0">
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="w-3 h-3 text-blue-400 shrink-0" />
                                <span className="font-semibold text-white truncate">
                                  {item.unitsWithInfo.length > 1 ? `${u.name}: ` : ''}{u.tenantName || 'Resident'}
                                </span>
                                {u.tenantPhone && (
                                  <a
                                    href={`tel:${u.tenantPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-emerald-400 font-mono hover:underline shrink-0 flex items-center gap-0.5"
                                    title="Call tenant"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{u.tenantPhone}</span>
                                  </a>
                                )}
                              </div>
                              {u.leaseEnd && (
                                <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20 shrink-0 flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>Exp: {u.leaseEnd}</span>
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Property Mini Progress Bar & Amounts */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 text-[10px]">
                        {isVacant ? '0 units occupied (Vacant)' : `${item.paidUnitsCount} of ${item.unitsCount} units paid`}
                      </span>
                      <span className="font-mono font-bold text-white text-[11px]">
                        <span className={isVacant ? 'text-rose-400' : 'text-emerald-400'}>{formatCurrency(item.collected)}</span> / {formatCurrency(item.expected)}
                      </span>
                    </div>
                    <div className="w-full bg-[#0C0F17] h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isVacant ? 'bg-rose-500/40' : item.isPaidFull ? 'bg-emerald-400' : item.collected > 0 ? 'bg-amber-400' : 'bg-slate-700'
                        }`}
                        style={{ width: `${isVacant ? 0 : Math.min(100, Math.max(0, item.collectionRate))}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-1 flex items-center justify-between">
                    {item.isSelected ? (
                      <div className="w-full flex items-center justify-between py-0.5">
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${isVacant ? 'text-rose-400' : 'text-emerald-400'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isVacant ? 'Currently Vacant (Active)' : 'Managing Units Below'}</span>
                        </span>
                        {isVacant && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            VACANT
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProperty(p.id);
                          setViewMode('cards');
                        }}
                        className={`w-full text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-md ${
                          isVacant
                            ? 'text-white bg-rose-600 hover:bg-rose-500 shadow-rose-950/40 border border-rose-400/40 ring-1 ring-rose-500/30'
                            : 'text-slate-950 bg-green-400 hover:bg-green-300 shadow-green-950/30 border border-green-300/40'
                        }`}
                      >
                        <span>{isVacant ? 'Currently Vacant' : 'Apply Rent'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Property Focus Header with Instant Dropdown Property Switcher */}
        <div className="bg-[#11141B] p-3.5 sm:p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Property:</span>
              <h3 className="text-base font-black text-white">{property.name}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {unitsWithStatus.length} Units
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                Management Fee: {propertyMgmtRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any unit below to mark paid or record custom payment &bull; Management fee is automatically calculated as an expense upon receipt
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">Switch Property:</label>
            <select
              value={property.id}
              onChange={(e) => {
                onSelectProperty(e.target.value);
                setViewMode('cards');
              }}
              className="bg-[#161A23] text-xs font-bold text-white border border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {allProperties.map((p) => {
                const pPayments = rentPayments.filter((rp) => rp.propertyId === p.id && rp.monthYear === selectedMonthYear && (rp.status === 'paid' || rp.status === 'partial') && Number(rp.paidAmount) > 0);
                const pCol = pPayments.reduce((s, rp) => s + Number(rp.paidAmount), 0);
                const pExp = (p.units && p.units.length > 0 ? p.units : [{ rent: p.baseMonthlyRent || 0 }]).reduce((s, u: any) => s + (Number(u.rent) || 0), 0);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(pCol)} / {formatCurrency(pExp)})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Real-time Collection Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-slate-300">Collection Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isFullyCollected 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : collectionPercentage > 0 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isFullyCollected 
                  ? '✓ ALL RENTS PAID IN FULL' 
                  : collectionPercentage > 0 
                  ? `PARTIAL COLLECTION (${paidUnitsCount} of ${unitsWithStatus.length} Units Paid)` 
                  : 'PENDING COLLECTION'}
              </span>
            </div>
            <div className="text-slate-400">
              <strong className="text-white font-bold">{formatCurrency(totalCollected)}</strong> of{' '}
              <strong className="text-slate-300">{formatCurrency(totalExpected)}</strong> ({collectionPercentage.toFixed(0)}%)
            </div>
          </div>

          <div className="w-full bg-[#11141B] h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFullyCollected
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                  : collectionPercentage > 0
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                  : 'bg-slate-700'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, collectionPercentage))}%` }}
            />
          </div>
        </div>

        {/* 3 Rent Collection Metric Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Card 1: Expected Rent */}
          <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Expected Rent Roll</span>
              <DollarSign className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-xl font-black text-white mt-1">
              {formatCurrency(totalExpected)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {unitsWithStatus.length} total active unit{unitsWithStatus.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Card 2: Collected Rent */}
          <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">Collected Income</span>
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {formatCurrency(totalCollected)}
            </div>
            <span className="text-[11px] text-emerald-500/80 block mt-0.5">
              {paidUnitsCount} of {unitsWithStatus.length} units confirmed paid
            </span>
          </div>

          {/* Card 3: Outstanding Due */}
          <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">Outstanding Balance</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className={`text-xl font-black mt-1 ${outstandingBalance > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {formatCurrency(outstandingBalance)}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {outstandingBalance === 0 ? 'Zero uncollected rent' : 'Awaiting payment from tenants'}
            </span>
          </div>
        </div>

        {/* Real-time Unit Payment Status Board (Which Units Have Paid vs Not Paid) */}
        <div className="bg-[#141822] rounded-xl border border-slate-800 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Unit Rent Payment Status for {formattedMonth}</span>
              </h4>
              <p className="text-xs text-slate-400">
                Live breakdown: See exactly which units have paid their rent and which ones have not paid yet
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {paidUnits.length} Paid ({formatCurrency(totalCollected)})
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                unpaidUnits.length === 0
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {unpaidUnits.length} Unpaid ({formatCurrency(outstandingBalance)})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Left: Confirmed Paid Units */}
            <div className="bg-[#11141B] rounded-xl border border-emerald-500/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Units Paid ({paidUnits.length})</span>
                </span>
                <span className="text-[11px] font-bold text-emerald-300">
                  {formatCurrency(totalCollected)} Collected
                </span>
              </div>

              {paidUnits.length === 0 ? (
                <div className="text-center py-5 text-slate-400 text-xs bg-[#161A23] rounded-lg border border-slate-800/80">
                  <Clock className="w-5 h-5 mx-auto text-slate-500 mb-1" />
                  <span>No recorded payments for {formattedMonth} yet.</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {paidUnits.map((item) => (
                    <div
                      key={item.unit.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#161A23] border-2 border-emerald-500 text-xs shadow-sm shadow-emerald-950/30"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{item.unit.name}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            &bull; {item.unit.tenantName || 'Resident'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.payment?.paymentMethod || 'Direct'} &bull; {item.payment?.paidDate || 'Paid'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-400 text-xs">
                          {formatCurrency(item.paidAmount)}
                        </span>
                        {item.payment && (
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(item.payment!)}
                            title="View Official Receipt"
                            className="px-2 py-1 text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded cursor-pointer transition-colors"
                          >
                            Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Unpaid / Awaiting Rent Units */}
            <div className="bg-[#11141B] rounded-xl border border-amber-500/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Units Not Paid Yet ({unpaidUnits.length})</span>
                </span>
                <span className={`text-[11px] font-bold ${outstandingBalance > 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                  {formatCurrency(outstandingBalance)} Due
                </span>
              </div>

              {unpaidUnits.length === 0 ? (
                <div className="text-center py-5 text-emerald-400 text-xs bg-[#161A23] rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
                  <span className="font-bold">100% Paid! All units have paid their rent for {formattedMonth}.</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {unpaidUnits.map((item) => (
                    <div
                      key={item.unit.id}
                      className={`flex items-center justify-between p-2 rounded-lg bg-[#161A23] border text-xs ${
                        item.isOverdue ? 'border-rose-500/30' : 'border-amber-500/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{item.unit.name}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                            &bull; {item.unit.tenantName || 'Resident'}
                          </span>
                        </div>
                        <div className="text-[10px] flex items-center gap-1 mt-0.5">
                          <span className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                            item.isOverdue
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {item.isOverdue ? 'OVERDUE' : 'DUE / PENDING'}
                          </span>
                          <span className="text-slate-400">
                            {item.status === 'partial' ? `Partial ($${item.paidAmount} paid)` : 'Not paid yet'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-amber-400 text-xs">
                          {formatCurrency(item.expectedAmount - item.paidAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickMarkPaidFull(item)}
                          title="Instant 1-Click Mark Paid in Full"
                          className="px-2 py-1 text-[10px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded cursor-pointer transition-colors"
                        >
                          Mark Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRecordPayment(item)}
                          title="Open Custom Payment Form"
                          className="px-2 py-1 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded cursor-pointer transition-colors"
                        >
                          Record
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: View Selector & Toolbar */}
      <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        {/* Table/Cards Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left View Switchers & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Pills */}
            <div className="flex items-center bg-[#11141B] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-[#161A23] text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Unit Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-[#161A23] text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>12-Month Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('portfolio')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  viewMode === 'portfolio'
                    ? 'bg-[#161A23] text-white shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Portfolio Overview</span>
              </button>
            </div>

            {/* Filter by Status (Only in cards view) */}
            {viewMode === 'cards' && (
              <>
                <div className="flex items-center bg-[#11141B] p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({unitsWithStatus.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('paid')}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                      statusFilter === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Paid ({paidUnitsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('unpaid')}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                      statusFilter === 'unpaid'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>Not Paid Yet ({unpaidUnits.length})</span>
                  </button>
                </div>

                {/* Filter by Payment Type Dropdown */}
                <div className="flex items-center gap-1.5 bg-[#11141B] px-2 py-1 rounded-xl border border-slate-800">
                  <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    aria-label="Filter by Payment Type"
                    className="bg-transparent text-xs text-slate-300 font-semibold cursor-pointer py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                  >
                    <option value="all" className="bg-[#161A23] text-white">All Payment Types</option>
                    <option value="Monthly Rent" className="bg-[#161A23] text-white">Monthly Rent</option>
                    <option value="Security Deposit" className="bg-[#161A23] text-white">Security Deposit</option>
                    <option value="Prorated Rent" className="bg-[#161A23] text-white">Prorated Rent</option>
                    <option value="Late Fee Payment" className="bg-[#161A23] text-white">Late Fee Payment</option>
                    <option value="Pet Rent / Pet Fee" className="bg-[#161A23] text-white">Pet Rent / Pet Fee</option>
                    <option value="Utility Reimbursement" className="bg-[#161A23] text-white">Utility Reimbursement</option>
                    <option value="Parking / Storage Fee" className="bg-[#161A23] text-white">Parking / Storage Fee</option>
                    <option value="Advance Pre-paid Rent" className="bg-[#161A23] text-white">Advance Pre-paid Rent</option>
                    <option value="Move-in / Move-out Fee" className="bg-[#161A23] text-white">Move-in / Move-out Fee</option>
                    <option value="Maintenance / Repair Fee" className="bg-[#161A23] text-white">Maintenance / Repair Fee</option>
                    <option value="Other Payment" className="bg-[#161A23] text-white">Other Payment</option>
                  </select>
                </div>

                {/* Filter by Payment Method Dropdown */}
                <div className="flex items-center gap-1.5 bg-[#11141B] px-2 py-1 rounded-xl border border-slate-800">
                  <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    aria-label="Filter by Payment Method"
                    className="bg-transparent text-xs text-slate-300 font-semibold cursor-pointer py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
                  >
                    <option value="all" className="bg-[#161A23] text-white">All Methods</option>
                    <option value="Zelle" className="bg-[#161A23] text-white">Zelle</option>
                    <option value="ACH / Bank Transfer" className="bg-[#161A23] text-white">ACH / Bank Transfer</option>
                    <option value="Check" className="bg-[#161A23] text-white">Check</option>
                    <option value="Cash" className="bg-[#161A23] text-white">Cash</option>
                    <option value="Venmo" className="bg-[#161A23] text-white">Venmo</option>
                    <option value="Credit Card" className="bg-[#161A23] text-white">Credit Card</option>
                    <option value="Money Order" className="bg-[#161A23] text-white">Money Order</option>
                    <option value="Direct Deposit" className="bg-[#161A23] text-white">Direct Deposit</option>
                    <option value="Wire Transfer" className="bg-[#161A23] text-white">Wire Transfer</option>
                    <option value="Cash App" className="bg-[#161A23] text-white">Cash App</option>
                    <option value="PayPal" className="bg-[#161A23] text-white">PayPal</option>
                    <option value="Other" className="bg-[#161A23] text-white">Other</option>
                  </select>
                </div>
              </>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tenant or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-[#11141B] border border-slate-800 text-slate-200 placeholder-slate-500 rounded-xl pl-8 pr-3 py-1.5 w-36 sm:w-48 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Right Action: Export Rent Roll & Statements */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenStatement && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenStatement(undefined, selectedMonthYear, 'property')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors cursor-pointer"
                  title={`Generate Statement for ${property.name} (${formattedMonth})`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Statement ({property.name})</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenStatement(undefined, selectedMonthYear, 'portfolio')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 rounded-xl transition-colors cursor-pointer"
                  title={`Generate Consolidated Portfolio Statement for all properties for ${formattedMonth}`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Statement (All Portfolio)</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => exportRentRollToCSV(propertyMonthPayments, property.name, selectedMonthYear)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>

            {rentPayments && rentPayments.length > 0 && onClearAllPayments && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete all recorded payments? This will permanently remove all payment records.')) {
                    onClearAllPayments();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors cursor-pointer"
                title="Delete all payment records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Records</span>
              </button>
            )}
          </div>
        </div>

        {/* View 1: Unit Cards Grid */}
        {viewMode === 'cards' && (
          <div className="p-5 sm:p-6 space-y-4">
            {filteredUnits.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-[#11141B] rounded-xl border border-slate-800">
                <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-sm">No units found matching criteria.</p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-emerald-400 hover:underline mt-1"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUnits.map((item) => {
                  const isPaid = item.status === 'paid';
                  const isPartial = item.status === 'partial';
                  const isPending = item.status === 'pending';
                  const isOverdue = item.status === 'overdue';

                  return (
                    <div
                      key={item.unit.id}
                      className={`bg-[#11141B] rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                        isPaid
                          ? 'border-emerald-500 hover:border-emerald-400 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/30'
                          : isPartial
                          ? 'border-amber-500/60 hover:border-amber-500/80 ring-1 ring-amber-500/20'
                          : isOverdue
                          ? 'border-rose-500/60 hover:border-rose-500/80 ring-1 ring-rose-500/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* High-Visibility Paid / Unpaid Status Banner */}
                      {isPaid ? (
                        <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>✓ RENT PAID IN FULL FOR {formattedMonth.toUpperCase()}</span>
                          </span>
                          <span className="font-mono text-emerald-300 font-black">
                            {formatCurrency(item.paidAmount)} confirmed
                          </span>
                        </div>
                      ) : (
                        <div className={`px-4 py-2 border-b font-bold text-xs flex items-center justify-between ${
                          isOverdue ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        }`}>
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className={`w-4 h-4 ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`} />
                            <span>
                              {isOverdue 
                                ? `⚠ RENT OVERDUE FOR ${formattedMonth.toUpperCase()}` 
                                : `⏳ RENT NOT PAID YET FOR ${formattedMonth.toUpperCase()}`
                              }
                            </span>
                          </span>
                          <span className="font-mono font-black">
                            {formatCurrency(item.expectedAmount - item.paidAmount)} DUE
                          </span>
                        </div>
                      )}

                      {/* Card Header */}
                      <div className="p-4 sm:p-5 flex items-start justify-between gap-3 border-b border-slate-800/80 bg-[#141822]/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white">
                              {item.unit.name}
                            </h3>
                            {(!item.unit.isOccupied || Number(item.expectedAmount) === 0) && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                                VACANT
                              </span>
                            )}
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                              {property.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <strong className={item.unit.tenantName ? 'text-slate-200 font-semibold' : 'text-amber-300 font-medium'}>
                                {item.unit.tenantName || (item.unit.isOccupied && Number(item.expectedAmount) > 0 ? 'Occupied Tenant' : 'Vacant (No Active Lease)')}
                              </strong>
                            </span>
                            {(() => {
                              const uPhone = item.unit.tenantPhone || (property.unitsCount <= 1 ? property.tenantPhone : undefined);
                              const uLeaseEnd = item.unit.leaseEnd || (property.unitsCount <= 1 ? property.leaseEnd : undefined);
                              return (
                                <>
                                  {uPhone && (
                                    <a
                                      href={`tel:${uPhone}`}
                                      className="flex items-center gap-1 text-emerald-400/90 hover:underline"
                                      title="Click to call tenant"
                                    >
                                      <Phone className="w-3 h-3 text-slate-500" />
                                      <span>{uPhone}</span>
                                    </a>
                                  )}
                                  {uLeaseEnd && (
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-rose-400/80" />
                                      <span>Exp: {uLeaseEnd}</span>
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                            <button
                              type="button"
                              onClick={() => handleOpenRecordPayment(item, undefined, 'tenant')}
                              className="text-[11px] text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit tenant name, phone number, or lease dates"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit Tenant</span>
                            </button>

                            {item.unit.documents && item.unit.documents.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.unit.documents && item.unit.documents.length > 0) {
                                    setActiveViewingDoc({ doc: item.unit.documents[0], unitName: item.unit.name });
                                  }
                                }}
                                className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                                title="Click to open applicant / lease documents in viewer"
                              >
                                <FileText className="w-2.5 h-2.5 text-emerald-400" />
                                <span>{item.unit.documents.length} {item.unit.documents.length === 1 ? 'Doc' : 'Docs'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status Badge & Edit Button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                PAID IN FULL
                              </span>
                            ) : isPartial ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <Clock className="w-3.5 h-3.5" />
                                PARTIAL ({formatCurrency(item.paidAmount)})
                              </span>
                            ) : !item.unit.isOccupied || Number(item.expectedAmount) === 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-amber-300 border border-amber-500/40">
                                <Home className="w-3.5 h-3.5 text-amber-400" />
                                VACANT ($0)
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <AlertCircle className="w-3.5 h-3.5" />
                                OVERDUE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <Clock className="w-3.5 h-3.5" />
                                DUE (1st of month)
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenRecordPayment(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer shadow-xs"
                            title="Edit card details (payment date, amount, tenant, lease)"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Body Financial Information */}
                      <div className="p-4 sm:p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-xs bg-[#161A23] p-3 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                              Monthly Scheduled Rent
                            </span>
                            <span className="text-lg font-black text-white">
                              {formatCurrency(item.expectedAmount)}
                              <span className="text-xs font-normal text-slate-500">/mo</span>
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                              Amount Paid for {formattedMonth}
                            </span>
                            <span className={`text-lg font-black ${
                              isPaid ? 'text-emerald-400' : isPartial ? 'text-amber-400' : 'text-slate-400'
                            }`}>
                              {formatCurrency(item.paidAmount)}
                            </span>
                          </div>
                        </div>

                        {/* If Paid: Show Details & Reference */}
                        {item.payment && isPaid && (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between text-slate-300">
                              <span className="flex items-center gap-1.5 text-slate-400">
                                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                                Payment Type:
                              </span>
                              <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {item.payment.paymentType || 'Monthly Rent'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-300">
                              <span className="flex items-center gap-1.5 text-slate-400">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                Paid via:
                              </span>
                              <strong className="text-slate-200 font-semibold">
                                {item.payment.paymentMethod || 'Direct Payment'}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between text-slate-300">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Rent Received Date:</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="date"
                                  value={item.payment.paidDate || ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleQuickUpdatePaidDate(item.payment!, e.target.value);
                                    }
                                  }}
                                  className="bg-[#11141B] border border-slate-700 hover:border-emerald-500 focus:border-emerald-500 rounded px-2 py-0.5 text-xs text-white font-mono font-semibold cursor-pointer transition-colors focus:ring-1 focus:ring-emerald-500"
                                  title="Click to change rent received date"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleOpenRecordPayment(item)}
                                  className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 transition-colors flex items-center gap-0.5 cursor-pointer"
                                  title="Change date or edit full payment details"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </div>

                            {item.payment.referenceNumber && (
                              <div className="flex items-center justify-between text-slate-300">
                                <span className="text-slate-400">Ref / Confirmation #:</span>
                                <span className="font-mono text-slate-200">
                                  {item.payment.referenceNumber}
                                </span>
                              </div>
                            )}

                            {item.payment.notes && (
                              <div className="pt-1 text-[11px] text-slate-400 italic border-t border-emerald-500/10 mt-1">
                                Note: {item.payment.notes}
                              </div>
                            )}

                            {/* Management fee auto-calculated expense */}
                            <div className="flex items-center justify-between text-slate-300 pt-1.5 border-t border-emerald-500/20">
                              <span className="text-slate-400 text-[11px]">Management Fee ({propertyMgmtRate.toFixed(1)}%):</span>
                              <span className="font-mono text-rose-400 font-semibold text-[11px]">
                                -{formatCurrency((item.paidAmount * propertyMgmtRate) / 100)} (Auto-deducted to Ledger)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* If Due / Pending: Quick prompt */}
                        {!isPaid && (
                          <div className="bg-[#161A23] border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Outstanding due for {formattedMonth}:</span>
                              <strong className="text-amber-400 font-bold text-sm">
                                {formatCurrency(item.expectedAmount - item.paidAmount)}
                              </strong>
                            </div>
                            <div className="text-[10px] text-slate-500 flex justify-between">
                              <span>Est. Management Fee ({propertyMgmtRate.toFixed(1)}%):</span>
                              <span>-{formatCurrency(((item.expectedAmount - item.paidAmount) * propertyMgmtRate) / 100)} auto-calculated upon receipt</span>
                            </div>
                          </div>
                        )}

                        {/* Card Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                          {/* When Unpaid: Instant 1-Click Pay Full + Customizer Button */}
                          {!isPaid && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickMarkPaidFull(item)}
                                title={`1-Click Confirm Full Rent (${formatCurrency(item.expectedAmount)}) for ${item.unit.name}`}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Mark Paid Full ({formatCurrency(item.expectedAmount)})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenRecordPayment(item)}
                                title="Record partial payment, custom date, or different amount"
                                className="inline-flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Custom / Partial</span>
                              </button>
                            </>
                          )}

                          {/* If already paid for this month: Edit, Pay Next Month, Receipt, Statement, Reminder */}
                          {isPaid && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRecordPayment(item)}
                                title="Edit payment details, received date, or tenant information"
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextM = getNextMonthKey(selectedMonthYear);
                                  handleOpenRecordPayment(item, nextM);
                                }}
                                title={`Record Advance Rent for ${formatMonthLabel(getNextMonthKey(selectedMonthYear))}`}
                                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-xl transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Pay Next Month</span>
                              </button>
                            </>
                          )}

                          {/* Print / View Official Receipt Button */}
                          {item.payment && isPaid && (
                            <button
                              type="button"
                              onClick={() => handleViewReceipt(item.payment!)}
                              title="Generate Official Rent Receipt"
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Receipt</span>
                            </button>
                          )}

                          {/* Unit Cash Flow Statement Button */}
                          {onOpenStatement && (
                            <button
                              type="button"
                              onClick={() => onOpenStatement(item.unit.id, selectedMonthYear)}
                              title={`Generate Pro-Forma & Cash Flow Statement for ${item.unit.name}`}
                              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-colors cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Statement</span>
                            </button>
                          )}

                          {/* Send / Copy Tenant Reminder */}
                          <button
                            type="button"
                            onClick={() => handleCopyReminder(item.unit, item.expectedAmount)}
                            title="Copy payment reminder or notification"
                            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                          >
                            {copiedTenantId === item.unit.id ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Copied!
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Copy className="w-3.5 h-3.5" /> Reminder
                              </span>
                            )}
                          </button>

                          {/* If payment exists, option to remove payment record */}
                          {item.payment && (
                            <button
                              type="button"
                              onClick={() => onDeletePayment(item.payment!.id)}
                              title="Reset to unpaid"
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 2: 12-Month Year-at-a-Glance Matrix */}
        {viewMode === 'matrix' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  2026 Annual Rent Collection Schedule
                </h3>
                <p className="text-xs text-slate-400">
                  Visual 12-month payment timeline for {property.name}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Paid
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Due / Pending
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Overdue
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#11141B] text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 min-w-[160px]">Unit & Tenant</th>
                    <th className="py-3 px-3 text-right">Rent ($)</th>
                    {yearMonths.map((ym) => {
                      const [, m] = ym.split('-');
                      const monthName = new Date(2026, parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
                      const isCurrent = ym === '2026-10';
                      return (
                        <th
                          key={ym}
                          className={`py-3 px-2 text-center min-w-[70px] ${
                            isCurrent ? 'bg-emerald-500/10 text-emerald-400 font-bold' : ''
                          }`}
                        >
                          {monthName}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#161A23]">
                  {currentUnits.map((u) => {
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <strong className="text-white font-bold block">{u.name}</strong>
                          <span className="text-[11px] text-slate-400">{u.tenantName || 'Tenant'}</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-slate-200">
                          {formatCurrency(u.rent)}
                        </td>
                        {yearMonths.map((ym) => {
                          const pay = rentPayments.find(
                            (p) => p.propertyId === property.id && (p.unitId === u.id || p.tenantName === u.tenantName) && p.monthYear === ym
                          );
                          const isCurrent = ym === '2026-10';
                          const isPast = ym < '2026-10';

                          return (
                            <td
                              key={ym}
                              className={`py-3.5 px-2 text-center ${
                                isCurrent ? 'bg-emerald-500/5' : ''
                              }`}
                            >
                              {pay && pay.status === 'paid' ? (
                                <button
                                  type="button"
                                  onClick={() => handleViewReceipt(pay)}
                                  title={`Paid ${formatCurrency(pay.paidAmount)} (${pay.paymentType || 'Monthly Rent'}) via ${pay.paymentMethod || 'Direct'}. Click for Receipt.`}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              ) : isPast ? (
                                <span
                                  title="Unpaid / Overdue"
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMonthYear(ym);
                                    handleOpenRecordPayment({
                                      unit: u,
                                      payment: null,
                                      status: 'pending',
                                      expectedAmount: u.rent,
                                      paidAmount: 0,
                                      isOverdue: false,
                                    });
                                  }}
                                  title="Click to Record Payment for this month"
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 3: Portfolio-Wide Summary */}
        {viewMode === 'portfolio' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                All Portfolio Properties Rent Roll ({formattedMonth})
              </h3>
              <p className="text-xs text-slate-400">
                Cross-property collection status and rent verification
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allProperties.map((p) => {
                const pUnits = p.units && p.units.length > 0 
                  ? p.units.map((u, idx) => ({
                      ...u,
                      tenantName: u.tenantName || (idx === 0 ? p.tenantName : '') || '',
                      tenantPhone: u.tenantPhone || (idx === 0 ? p.tenantPhone : undefined),
                      leaseEnd: u.leaseEnd || (idx === 0 ? p.leaseEnd : undefined),
                    }))
                  : [{ 
                      id: 'u-main', 
                      name: 'Main', 
                      rent: p.baseMonthlyRent, 
                      isOccupied: (p as any).isOccupied !== false && (p.baseMonthlyRent || 0) > 0,
                      tenantName: p.tenantName || '',
                      tenantPhone: p.tenantPhone,
                      leaseEnd: p.leaseEnd,
                    }];
                const pPayments = rentPayments.filter((rp) => rp.propertyId === p.id && rp.monthYear === selectedMonthYear);
                const pExpected = pUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
                const pCollected = pPayments.filter((rp) => rp.status === 'paid').reduce((sum, rp) => sum + Number(rp.paidAmount), 0);
                const pAllPaid = pCollected >= pExpected && pExpected > 0;
                const isSelected = p.id === property.id;

                const isVacant = (() => {
                  if ((p as any).isOccupied === false) return true;
                  if (p.units && p.units.length > 0) {
                    const hasAnyOccupiedWithRent = p.units.some(
                      (u) => u.isOccupied && Number(u.rent) > 0 && (!u.tenantName || !u.tenantName.toLowerCase().includes('vacant'))
                    );
                    if (!hasAnyOccupiedWithRent) return true;
                    if (p.units.every((u) => !u.isOccupied || Number(u.rent) === 0)) return true;
                  } else {
                    if (Number(p.baseMonthlyRent) === 0) return true;
                  }
                  const tStr = (p.tenantName || '').toLowerCase();
                  const isTVacant = !tStr || tStr.includes('vacant') || tStr.includes('unassigned');
                  if (pExpected === 0 && isTVacant) return true;
                  if (pExpected === 0 && Number(p.baseMonthlyRent) === 0) return true;
                  return false;
                })();

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProperty(p.id);
                      setViewMode('cards');
                    }}
                    className={`bg-[#11141B] rounded-2xl border-2 p-4 sm:p-5 space-y-3 transition-all cursor-pointer ${
                      isVacant
                        ? isSelected
                          ? 'border-rose-500 shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/50 bg-[#181116]'
                          : 'border-rose-500 shadow-md shadow-rose-950/40 hover:border-rose-400 bg-[#161217] ring-1 ring-rose-500/30'
                        : pAllPaid
                        ? 'border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                        : isSelected
                        ? 'border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white truncate max-w-[180px]">
                            {p.name}
                          </h4>
                          {isSelected && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              isVacant
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isVacant
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/20'
                          : pAllPaid 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isVacant ? 'VACANT' : pAllPaid ? '100% PAID' : 'PENDING'}
                      </span>
                    </div>

                    {/* Tenant, Phone & Lease End Strip */}
                    <div className="bg-[#0E121A] p-2.5 rounded-xl border border-slate-800 text-xs">
                      {isVacant ? (
                        <div className="flex items-center gap-1.5 text-rose-300/90 text-xs font-medium">
                          <User className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Currently Vacant (No Active Lease)</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {pUnits
                            .filter((u) => u.isOccupied !== false && (u.tenantName || Number(u.rent) > 0))
                            .map((u, uIdx) => (
                              <div key={u.id || uIdx} className="flex items-center justify-between gap-2 text-xs border-b border-slate-800/60 last:border-b-0 pb-1 last:pb-0">
                                <div className="flex items-center gap-1.5 truncate">
                                  <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span className="font-semibold text-white truncate">
                                    {pUnits.length > 1 ? `${u.name}: ` : ''}{u.tenantName || 'Resident'}
                                  </span>
                                  {u.tenantPhone && (
                                    <a
                                      href={`tel:${u.tenantPhone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[11px] text-emerald-400 font-mono hover:underline shrink-0 flex items-center gap-1 ml-1"
                                      title="Call tenant"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>{u.tenantPhone}</span>
                                    </a>
                                  )}
                                </div>
                                {u.leaseEnd && (
                                  <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 shrink-0 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Exp: {u.leaseEnd}</span>
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-[#161A23] p-3 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Collected / Expected</span>
                        <strong className="text-white font-bold text-sm">
                          {formatCurrency(pCollected)} / {formatCurrency(pExpected)}
                        </strong>
                      </div>
                      <span className={`text-xs font-semibold ${isVacant ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {pExpected > 0 ? ((pCollected / pExpected) * 100).toFixed(0) : 0}%
                      </span>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs">
                      {isSelected ? (
                        <span className={`font-bold text-[11px] flex items-center gap-1 ${isVacant ? 'text-rose-400' : 'text-emerald-400'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isVacant ? 'Currently Vacant (Active)' : 'Active Property (Managing Units)'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProperty(p.id);
                            setViewMode('cards');
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-md ${
                            isVacant
                              ? 'text-white bg-rose-600 hover:bg-rose-500 shadow-rose-950/40 border border-rose-400/40 ring-1 ring-rose-500/30'
                              : 'text-slate-950 bg-green-400 hover:bg-green-300 shadow-green-950/30 border border-green-300/40'
                          }`}
                        >
                          <span>{isVacant ? 'Currently Vacant' : 'Apply Rent'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span className="text-[11px] text-slate-500">
                        {pPayments.length} logged records
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Record / Edit Payment Modal */}
      {isRecordModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRecordModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
        >
          <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] text-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="shrink-0 px-5 py-4 border-b border-slate-800 bg-[#141822]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {editingPaymentId ? 'Edit Payment & Card Details' : 'Record / Edit Card Payment'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {recordingUnit?.name} &bull; {property.name} &bull; {formattedMonth}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  title="Close modal (Esc)"
                  aria-label="Close dialog"
                  className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector: Payment & Date vs Tenant & Lease */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModalActiveTab('payment')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modalActiveTab === 'payment'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment & Received Date</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalActiveTab('tenant')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modalActiveTab === 'tenant'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Tenant, Phone & Lease</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSavePaymentSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
                {/* Payment & Date Tab */}
                {modalActiveTab === 'payment' && (
                  <>
                    {/* Rent Month Applied To (Billing Period) */}
                    <div className="bg-[#11141B] p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rent Month Applied To (Billing Period)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {formatMonthLabel(formMonthYear)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <select
                      value={formMonthYear}
                      onChange={(e) => {
                        const newM = e.target.value;
                        setFormMonthYear(newM);
                        if (!formPaidDate.startsWith(newM)) {
                          setFormPaidDate(`${newM}-01`);
                        }
                      }}
                      className="w-full bg-[#161A23] border border-slate-700 rounded-lg px-2.5 py-2 text-white font-semibold focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <optgroup label="Popular Months">
                        <option value="2026-10">October 2026 (Current)</option>
                        <option value="2026-09">September 2026 (Previous Month)</option>
                        <option value="2026-11">November 2026 (Advance)</option>
                        <option value="2026-12">December 2026 (Advance +2 Mo)</option>
                        <option value="2026-08">August 2026 (Past Due / Arrears)</option>
                      </optgroup>
                      <optgroup label="All 2026 Months">
                        <option value="2026-01">January 2026</option>
                        <option value="2026-02">February 2026</option>
                        <option value="2026-03">March 2026</option>
                        <option value="2026-04">April 2026</option>
                        <option value="2026-05">May 2026</option>
                        <option value="2026-06">June 2026</option>
                        <option value="2026-07">July 2026</option>
                      </optgroup>
                      <optgroup label="2027 Future Months">
                        <option value="2027-01">January 2027</option>
                        <option value="2027-02">February 2027</option>
                        <option value="2027-03">March 2027</option>
                        <option value="2027-04">April 2027</option>
                        <option value="2027-05">May 2027</option>
                        <option value="2027-06">June 2027</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <input
                      type="month"
                      value={formMonthYear}
                      onChange={(e) => {
                        if (e.target.value) {
                          const newM = e.target.value;
                          setFormMonthYear(newM);
                          if (!formPaidDate.startsWith(newM)) {
                            setFormPaidDate(`${newM}-01`);
                          }
                        }
                      }}
                      className="w-full bg-[#161A23] border border-slate-700 rounded-lg px-2.5 py-2 text-white font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick One-Click Month Selection Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Quick Pick:</span>
                  {[
                    { key: '2026-10', label: 'Oct 2026 (Current)' },
                    { key: '2026-09', label: 'Sep 2026' },
                    { key: '2026-11', label: 'Nov 2026' },
                    { key: '2026-08', label: 'Aug 2026 (Past)' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => {
                        setFormMonthYear(m.key);
                        if (!formPaidDate.startsWith(m.key)) {
                          setFormPaidDate(`${m.key}-01`);
                        }
                      }}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-colors cursor-pointer ${
                        formMonthYear === m.key
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rent Received Date (Date Payment Was Made) */}
              <div className="bg-[#11141B] p-3.5 rounded-xl border-2 border-emerald-500/50 space-y-2.5 ring-2 ring-emerald-500/10 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center justify-between">
                  <label className="block text-white font-bold flex items-center gap-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Rent Received Date (Date Payment Received)</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    {formatDateDisplayLong(formPaidDate)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      required
                      value={formPaidDate}
                      onChange={(e) => setFormPaidDate(e.target.value)}
                      className="w-full bg-[#161A23] border border-emerald-500/60 hover:border-emerald-400 focus:border-emerald-400 rounded-lg px-3 py-2 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors"
                      title="Select the exact date rent was received"
                    />
                  </div>

                  {/* Day Stepper (-1 Day / +1 Day) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStepDate(-1)}
                      title="Move 1 day earlier"
                      className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      -1 Day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepDate(1)}
                      title="Move 1 day later"
                      className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                    >
                      +1 Day
                    </button>
                  </div>
                </div>

                {/* Quick One-Click Received Date Presets */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">Quick Date Presets:</span>
                    <span>Click any button to change date instantly</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* 1st of Billing Month */}
                    <button
                      type="button"
                      onClick={() => setFormPaidDate(`${formMonthYear}-01`)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md border transition-colors cursor-pointer ${
                        formPaidDate === `${formMonthYear}-01`
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                      }`}
                      title={`Set received date to 1st of ${formatMonthLabel(formMonthYear)}`}
                    >
                      1st of Month ({formatMonthAbbr(formMonthYear)} 1)
                    </button>

                    {/* Today */}
                    <button
                      type="button"
                      onClick={() => setFormPaidDate(new Date().toISOString().split('T')[0])}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                        formPaidDate === new Date().toISOString().split('T')[0]
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title="Set to today's date"
                    >
                      Today
                    </button>

                    {/* Yesterday */}
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        setFormPaidDate(d.toISOString().split('T')[0]);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Set to yesterday's date"
                    >
                      Yesterday
                    </button>

                    {/* 5th of Month */}
                    <button
                      type="button"
                      onClick={() => setFormPaidDate(`${formMonthYear}-05`)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                        formPaidDate === `${formMonthYear}-05`
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={`Set to 5th of ${formatMonthAbbr(formMonthYear)}`}
                    >
                      5th ({formatMonthAbbr(formMonthYear)} 5)
                    </button>

                    {/* 15th of Month */}
                    <button
                      type="button"
                      onClick={() => setFormPaidDate(`${formMonthYear}-15`)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                        formPaidDate === `${formMonthYear}-15`
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={`Set to 15th of ${formatMonthAbbr(formMonthYear)}`}
                    >
                      15th
                    </button>
                  </div>
                </div>
              </div>

              {/* Tenant Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tenant Name
                </label>
                <input
                  type="text"
                  required
                  value={formTenantName}
                  onChange={(e) => setFormTenantName(e.target.value)}
                  className="w-full bg-[#11141B] border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Expected Rent vs Amount Received & Quick Presets */}
              <div className="bg-[#11141B] p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Expected Rent (Editable for any value) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Expected Rent ($)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Base Rate</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={isNaN(Number(formExpectedAmount)) && formExpectedAmount !== '' ? '' : formExpectedAmount}
                        onChange={(e) => setFormExpectedAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161A23] border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-white font-bold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Amount Received (Any number value) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span className="text-emerald-400 font-bold">Amount Received ($)</span>
                      <span className="text-[10px] text-emerald-400/80 font-semibold">Any Value</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={isNaN(Number(formPaidAmount)) && formPaidAmount !== '' ? '' : formPaidAmount}
                        onChange={(e) => setFormPaidAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161A23] border border-emerald-500/50 rounded-lg pl-7 pr-3 py-2 text-white font-bold text-base focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click Value Presets for Amount Received */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium">Quick Amount Presets:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormPaidAmount(formExpectedAmount)}
                      className="px-2 py-1 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                    >
                      Full Rent (${parseFloat(formExpectedAmount) || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const base = parseFloat(formExpectedAmount) || 0;
                        setFormPaidAmount(String((base / 2).toFixed(2)));
                      }}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      50% Half (${((parseFloat(formExpectedAmount) || 0) / 2).toFixed(0)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const base = parseFloat(formExpectedAmount) || 0;
                        setFormPaidAmount(String((base * 2).toFixed(2)));
                      }}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      2 Months (${((parseFloat(formExpectedAmount) || 0) * 2).toFixed(0)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(formPaidAmount) || 0;
                        setFormPaidAmount(String((cur + 50).toFixed(2)));
                      }}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      +$50
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(formPaidAmount) || 0;
                        setFormPaidAmount(String((cur + 100).toFixed(2)));
                      }}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      +$100
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(formPaidAmount) || 0;
                        setFormPaidAmount(String((cur + 500).toFixed(2)));
                      }}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      +$500
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaidAmount('0')}
                      className="px-2 py-1 text-[10px] font-semibold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors ml-auto"
                    >
                      Zero ($0)
                    </button>
                  </div>
                </div>

                {/* Optional Late Fee & Concession Discount */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1 text-[11px]">
                      Late Fee / Penalty ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={isNaN(Number(formLateFee)) && formLateFee !== '' ? '' : formLateFee}
                        onChange={(e) => setFormLateFee(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161A23] border border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 text-white text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1 text-[11px]">
                      Discount / Concession ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">-$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={isNaN(Number(formDiscount)) && formDiscount !== '' ? '' : formDiscount}
                        onChange={(e) => setFormDiscount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#161A23] border border-slate-800 rounded-lg pl-6 pr-2.5 py-1.5 text-white text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Calculation Summary Badge */}
                {(() => {
                  const exp = parseFloat(formExpectedAmount) || 0;
                  const paid = parseFloat(formPaidAmount) || 0;
                  const diff = paid - exp;
                  const isPaidFull = paid >= exp && exp > 0;
                  const isPartial = paid > 0 && paid < exp;
                  const isOverpaid = paid > exp;

                  return (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Payment Status Preview:</span>
                      <div className="flex items-center gap-2">
                        {isPaidFull ? (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {isOverpaid ? `Paid Full + $${diff.toFixed(2)} Advance Credit` : 'Paid in Full'}
                          </span>
                        ) : isPartial ? (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Partial (Short $${Math.abs(diff).toFixed(2)})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                            Unpaid / Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* What Type of Payment Was It (Category & Classification) */}
              <div className="bg-[#11141B] p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>What Type of Payment Was It? (Purpose / Classification)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {formPaymentType}
                  </span>
                </div>

                <select
                  value={formPaymentType}
                  onChange={(e) => setFormPaymentType(e.target.value as RentPaymentType)}
                  className="w-full bg-[#161A23] border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <optgroup label="Standard Rent">
                    <option value="Monthly Rent">Monthly Rent (Standard scheduled rent)</option>
                    <option value="Prorated Rent">Prorated Rent (Partial month / mid-month move-in)</option>
                    <option value="Advance Pre-paid Rent">Advance Pre-paid Rent (Multi-month prepaid)</option>
                  </optgroup>
                  <optgroup label="Deposits & Fees">
                    <option value="Security Deposit">Security Deposit (Move-in deposit)</option>
                    <option value="Late Fee Payment">Late Fee Payment (Late penalty fee)</option>
                    <option value="Pet Rent / Pet Fee">Pet Rent / Pet Fee (Pet deposit or recurring fee)</option>
                    <option value="Move-in / Move-out Fee">Move-in / Move-out Fee (Turnover or cleaning)</option>
                  </optgroup>
                  <optgroup label="Reimbursements & Extras">
                    <option value="Utility Reimbursement">Utility Reimbursement (Water / Sewer / Trash / Power)</option>
                    <option value="Parking / Storage Fee">Parking / Storage Fee (Garage, space, locker)</option>
                    <option value="Maintenance / Repair Fee">Maintenance / Repair Fee (Tenant damage / repair)</option>
                    <option value="Other Payment">Other Payment (Miscellaneous)</option>
                  </optgroup>
                </select>

                {/* Quick Type Selection Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Quick Pick:</span>
                  {[
                    'Monthly Rent',
                    'Security Deposit',
                    'Late Fee Payment',
                    'Pet Rent / Pet Fee',
                    'Utility Reimbursement',
                  ].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setFormPaymentType(t as RentPaymentType)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-colors ${
                        formPaymentType === t
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method & Reference */}
              <div className="bg-[#11141B] p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-200 font-bold mb-1 flex items-center gap-1.5 text-xs">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Payment Method (How Paid)</span>
                    </label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-[#161A23] border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="Zelle">Zelle (Instant Bank)</option>
                      <option value="ACH / Bank Transfer">ACH / Bank Transfer</option>
                      <option value="Check">Check (Physical / Cashier)</option>
                      <option value="Cash">Cash (Physical Currency)</option>
                      <option value="Venmo">Venmo</option>
                      <option value="Credit Card">Credit Card / Debit</option>
                      <option value="Money Order">Money Order (Postal / Western Union)</option>
                      <option value="Direct Deposit">Direct Deposit (Payroll)</option>
                      <option value="Wire Transfer">Wire Transfer (Fedwire / Int'l)</option>
                      <option value="Cash App">Cash App</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Other">Other Method</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-200 font-bold mb-1 flex items-center gap-1.5 text-xs">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Reference / Check #</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Check #1042 / Zelle ID"
                      value={formReferenceNumber}
                      onChange={(e) => setFormReferenceNumber(e.target.value)}
                      className="w-full bg-[#161A23] border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Quick Method Selection Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Quick Pick:</span>
                  {(['Zelle', 'Check', 'Cash', 'ACH / Bank Transfer', 'Venmo'] as PaymentMethod[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setFormPaymentMethod(m)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition-colors ${
                        formPaymentMethod === m
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Notes / Memo (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. On-time payment received with thanks"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#11141B] border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

                {/* Auto Sync Info */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Recording this payment will automatically update the monthly rent roll and sync with your property ledger.
                  </span>
                </div>
              </>
            )}

            {/* Tenant, Phone & Lease Tab */}
            {modalActiveTab === 'tenant' && (
              <div className="space-y-4">
                {/* Info Alert */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">Edit Resident & Lease Information</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    {recordingUnit?.name}
                  </span>
                </div>

                {/* Tenant Full Name */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Tenant Full Name</span>
                    <span className="text-[10px] text-slate-500 font-normal">Resident on Lease</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formTenantName}
                      onChange={(e) => setFormTenantName(e.target.value)}
                      placeholder="e.g. Jaqueline Garcia"
                      className="w-full bg-[#11141B] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white font-medium focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Tenant Phone Number */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Tenant Phone Number</span>
                    <span className="text-[10px] text-slate-500 font-normal">Direct Contact / SMS</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formTenantPhone}
                      onChange={(e) => setFormTenantPhone(e.target.value)}
                      placeholder="e.g. 407-701-1880"
                      className="w-full bg-[#11141B] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white font-medium focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Lease Agreement Period */}
                <div className="bg-[#11141B] p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lease Agreement Period</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        Lease Expiration Date (Exp Date)
                      </label>
                      <input
                        type="date"
                        value={formLeaseEnd}
                        onChange={(e) => setFormLeaseEnd(e.target.value)}
                        className="w-full bg-[#161A23] border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        Lease Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={formLeaseStart}
                        onChange={(e) => setFormLeaseStart(e.target.value)}
                        className="w-full bg-[#161A23] border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Monthly Scheduled Rent & Security Deposit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Monthly Scheduled Rent ($)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Base Rate</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        value={formExpectedAmount}
                        onChange={(e) => setFormExpectedAmount(e.target.value)}
                        className="w-full bg-[#11141B] border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-bold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Security Deposit ($)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={formSecurityDeposit}
                        onChange={(e) => setFormSecurityDeposit(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#11141B] border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-white font-medium focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Occupancy Status */}
                <div className="bg-[#11141B] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-white font-semibold block text-xs">Occupancy Status</span>
                    <span className="text-[11px] text-slate-400">Mark whether this unit is currently occupied</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsOccupied(!formIsOccupied)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                      formIsOccupied
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {formIsOccupied ? '✓ Occupied' : 'Vacant'}
                  </button>
                </div>

                {/* Notes / Memo */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tenant / Lease Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12-month lease renewal, parking spot #12 included"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-[#11141B] border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Applicant & Lease Documents Upload & Viewer Section */}
                <div className="bg-[#11141B] p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-bold text-xs">Applicant & Lease Documents</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {formUnitDocuments.length} {formUnitDocuments.length === 1 ? 'document' : 'documents'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Attach rental applications, signed lease agreements, applicant IDs, and proof of income. You can open and view them anytime with the viewer.
                  </p>

                  {/* Upload Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as any)}
                      className="bg-[#161A23] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      title="Select Document Type"
                    >
                      <option value="Rental Application">Rental Application</option>
                      <option value="Lease Agreement">Signed Lease Agreement</option>
                      <option value="ID / Verification">Government ID / Passport</option>
                      <option value="Proof of Income">Proof of Income / Paystub</option>
                      <option value="Other">Other Document</option>
                    </select>

                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Applicant Document (PDF, Image)</span>
                      <input
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadTenantDocument(file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Documents List */}
                  {formUnitDocuments.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                      No documents uploaded yet. Click above to attach applicant forms, IDs, or lease files.
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {formUnitDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#161A23] border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[280px]">
                                {doc.fileName || doc.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="text-emerald-400 font-medium">{doc.category}</span>
                                {doc.fileSize && <span>&bull; {formatDocSize(doc.fileSize)}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveViewingDoc({ doc, unitName: formTenantName || recordingUnit?.name })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors cursor-pointer"
                              title="Open and view document (PDF or image)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormUnitDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
              </div>

            {/* Fixed Modal Footer Buttons */}
            <div className="shrink-0 px-5 py-4 border-t border-slate-800 bg-[#141822] flex items-center justify-between gap-3">
              <div className="text-xs">
                {parseFloat(formPaidAmount) >= parseFloat(formExpectedAmount) ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Paid in Full ({formatCurrency(parseFloat(formPaidAmount) || 0)})
                  </span>
                ) : parseFloat(formPaidAmount) > 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    Partial: {formatCurrency(parseFloat(formPaidAmount) || 0)}
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium">
                    Amount: $0.00 (Unpaid)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{modalActiveTab === 'tenant' ? 'Save Resident Details' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* Official Printable Rent Receipt Modal */}
      <RentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        property={property}
        payment={receiptPayment}
      />

      {/* Applicant & Tenant Document Viewer Modal */}
      {activeViewingDoc && (
        <ReceiptViewerModal
          isOpen={Boolean(activeViewingDoc)}
          onClose={() => setActiveViewingDoc(null)}
          documentUrl={activeViewingDoc.doc.fileUrl}
          documentTitle={activeViewingDoc.doc.name}
          documentCategory={activeViewingDoc.doc.category}
          documentFileName={activeViewingDoc.doc.fileName}
          documentFileType={activeViewingDoc.doc.fileType}
          documentFileSize={activeViewingDoc.doc.fileSize}
          documentUploadedAt={activeViewingDoc.doc.uploadedAt}
          unitName={activeViewingDoc.unitName}
          propertyName={property.name}
          onDeleteReceipt={() => {
            setFormUnitDocuments((prev) => prev.filter((d) => d.id !== activeViewingDoc.doc.id));
            setActiveViewingDoc(null);
          }}
        />
      )}
    </div>
  );
};
