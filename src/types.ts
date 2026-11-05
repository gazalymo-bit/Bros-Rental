export type PropertyType = 
  | 'Single Family' 
  | 'Duplex / Multi-Family' 
  | 'Condo / Apartment' 
  | 'Townhouse' 
  | 'Short-Term Rental (Airbnb)' 
  | 'Commercial';

export type ExpenseCategory =
  | 'Property Taxes'
  | 'Property Insurance'
  | 'Property Management'
  | 'Repairs & Maintenance'
  | 'Capital Expenditures (CapEx)'
  | 'HOA / Condo Fees'
  | 'Water & Sewer'
  | 'Trash Collection'
  | 'Gas & Electricity'
  | 'Landscaping & Snow'
  | 'Pest Control'
  | 'Legal & Accounting'
  | 'Advertising / Leasing'
  | 'Appliance'
  | 'Other Operating Expense';

export interface ExtraIncomeItem {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'annual';
}

export interface ApplianceItem {
  id: string;
  name: string; // e.g., "Refrigerator", "Dishwasher", "Oven / Range", "Washer", "Dryer", "Water Heater", "HVAC / AC", "Microwave"
  brand?: string; // e.g. "Whirlpool", "GE", "Samsung", "Bosch", "LG", "Carrier"
  modelNumber?: string;
  serialNumber?: string;
  boughtDate: string; // Purchase date (YYYY-MM-DD)
  purchasePrice?: number;
  vendorOrStore?: string; // e.g. "Home Depot", "Lowe's", "Best Buy"
  hasWarranty: boolean;
  warrantyType?: 'Manufacturer' | 'Extended' | 'Home Warranty' | 'Store / Retailer' | 'Lifetime' | 'Other';
  warrantyExpirationDate?: string; // (YYYY-MM-DD)
  warrantyProvider?: string; // e.g. "American Home Shield", "Whirlpool Care", "Allstate / SquareTrade"
  warrantyPolicyNumber?: string;
  warrantyContactPhone?: string;
  warrantyContactEmail?: string;
  warrantyCoverageNotes?: string;
  // Receipt & Invoice Attachment
  receiptUrl?: string; // Base64 data URL for uploaded receipt image or PDF document
  receiptFileName?: string; // Original uploaded file name (e.g. "refrigerator_invoice_homedepot.pdf")
  receiptFileType?: string; // MIME type e.g. "image/jpeg", "image/png", "application/pdf"
  receiptFileSize?: number; // File size in bytes
  receiptUploadedAt?: string; // ISO date timestamp
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantDocument {
  id: string;
  name: string; // e.g., "Rental Application", "Signed Lease Agreement", "Government ID", "Proof of Income"
  category: 'Rental Application' | 'Lease Agreement' | 'ID / Verification' | 'Proof of Income' | 'Other';
  fileUrl: string; // Base64 data URL or Blob URL
  fileName: string;
  fileType: string;
  fileSize?: number;
  uploadedAt: string;
  notes?: string;
}

export interface UnitRental {
  id: string;
  name: string; // e.g., "Unit A", "Main House", "Studio"
  rent: number;
  isOccupied: boolean;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  leaseStart?: string;
  leaseEnd?: string;
  rentDueDay?: number; // e.g. 1 (1st of month)
  securityDeposit?: number; // Security deposit amount paid by tenant
  tenantNotes?: string; // Notes on tenant, lease terms, pet deposit, parking, etc.
  appliances?: ApplianceItem[];
  documents?: TenantDocument[];
}

export type RentPaymentType =
  | 'Monthly Rent'
  | 'Security Deposit'
  | 'Prorated Rent'
  | 'Late Fee Payment'
  | 'Pet Rent / Pet Fee'
  | 'Utility Reimbursement'
  | 'Parking / Storage Fee'
  | 'Advance Pre-paid Rent'
  | 'Move-in / Move-out Fee'
  | 'Maintenance / Repair Fee'
  | 'Other Payment';

export type PaymentMethod = 
  | 'Zelle' 
  | 'ACH / Bank Transfer' 
  | 'Check' 
  | 'Cash' 
  | 'Venmo' 
  | 'Credit Card' 
  | 'Money Order'
  | 'Direct Deposit'
  | 'Wire Transfer' 
  | 'Cash App'
  | 'PayPal'
  | 'Other';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';

export interface RentPaymentRecord {
  id: string;
  propertyId: string;
  unitId?: string;
  unitName?: string;
  tenantName: string;
  monthYear: string; // "YYYY-MM", e.g. "2026-09"
  expectedAmount: number;
  paidAmount: number;
  paidDate?: string;
  paymentType?: RentPaymentType;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string;
  receiptNumber?: string;
  notes?: string;
  lateFeeApplied?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  name: string;
  amount: number;
  frequency: 'monthly' | 'annual';
  isPercentageOfRent?: boolean;
  percentageValue?: number; // e.g. 8% for management, 5% for repairs
  notes?: string;
}

export interface CompanyProfile {
  id: string;
  name: string; // Company / Entity / Profile Name e.g. "Apex Holdings LLC", "Sunshine Realty"
  dba?: string; // Doing Business As
  einOrTaxId?: string; // EIN or Tax Identification #
  email?: string;
  phone?: string;
  address?: string;
  isDefault?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  profileId?: string; // Links building to specific company profile
  companyName?: string; // Cached or display entity name
  name: string;
  address: string;
  propertyType: PropertyType;
  unitsCount: number;
  units: UnitRental[];
  isOccupied?: boolean; // Overall property occupancy status

  // Tenant & Lease Information (Primary / Initial)
  tenantName?: string;
  tenantPhone?: string;
  leaseStart?: string;
  leaseEnd?: string;
  securityDeposit?: number; // Security deposit amount paid by tenant
  tenantNotes?: string; // Notes on tenant, lease terms, pet deposit, parking, etc.
  
  // Purchase & Financing
  purchasePrice: number;
  currentValuation: number;
  downPaymentPercent: number; // e.g. 20%
  downPaymentAmount: number;
  closingCosts: number;
  initialRepairCosts: number;
  
  hasMortgage: boolean;
  interestRate: number; // e.g. 6.5%
  loanTermYears: number; // e.g. 30
  mortgageManualOverride: boolean;
  monthlyMortgageAmount: number;
  
  // Income Settings
  baseMonthlyRent: number; // Used if units are not itemized or as summary
  vacancyRatePercent: number; // e.g. 5%
  extraIncomes: ExtraIncomeItem[];
  
  // Expenses Settings
  expenses: ExpenseItem[];
  
  // Notes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  propertyId: string;
  unitId?: string; // Specific unit ID if expense/income was for a unit
  unitName?: string; // Specific unit name e.g. "Unit 1", "Unit A"
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  paidByOrTo?: string;
  receiptNumber?: string;
  isRepair?: boolean; // True if this was an actual fix/repair in a unit
  repairType?: string; // e.g. 'Plumbing', 'HVAC', 'Electrical', 'Appliance', 'Hardware', 'Painting', 'Handyman', 'Supplies'
}

export interface FinancialCalculationResult {
  // Income
  grossScheduledIncomeMonthly: number;
  grossScheduledIncomeAnnual: number;
  vacancyLossMonthly: number;
  vacancyLossAnnual: number;
  effectiveGrossIncomeMonthly: number; // EGI
  effectiveGrossIncomeAnnual: number;
  extraIncomeMonthly: number;
  extraIncomeAnnual: number;
  
  // Expenses
  operatingExpensesMonthly: number;
  operatingExpensesAnnual: number;
  operatingExpensesByCategory: Record<ExpenseCategory | string, { monthly: number; annual: number; percentageOfTotal: number }>;
  
  // NOI
  netOperatingIncomeMonthly: number;
  netOperatingIncomeAnnual: number;
  
  // Debt Service
  loanAmount: number;
  monthlyMortgagePI: number;
  debtServiceMonthly: number;
  annualMortgagePI: number;
  
  // Cash Flow
  netCashFlowMonthly: number;
  netCashFlowAnnual: number;
  
  // Key Ratios & Metrics
  totalInitialInvestment: number; // Down payment + closing costs + initial repairs
  capRatePercent: number; // NOI / Purchase Price (or valuation) * 100
  cashOnCashReturnPercent: number; // Annual Net Cash Flow / Total Initial Investment * 100
  operatingExpenseRatioPercent: number; // Operating Expenses / Effective Gross Income * 100
  grossRentMultiplier: number; // Purchase Price / Annual Gross Rent
  debtServiceCoverageRatio: number; // NOI / Annual Debt Service
  breakEvenOccupancyPercent: number; // (Operating Expenses + Debt Service) / Gross Potential Rent
  onePercentRuleMet: boolean;
  onePercentRatio: number; // Gross Monthly Rent / Purchase Price
  fiftyPercentRuleEstimateExpense: number; // 50% of gross income
}
