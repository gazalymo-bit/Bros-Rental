import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  MapPin, 
  DollarSign, 
  X, 
  Shield, 
  Landmark, 
  User, 
  Phone, 
  Calendar, 
  Sparkles,
  FileText,
  Wallet,
  ShieldCheck,
  Plus,
  Briefcase
} from 'lucide-react';
import { Property, PropertyType, ExpenseItem, UnitRental, CompanyProfile } from '../types';
import { formatCurrency } from '../utils/calculations';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Property) => void;
  initialProperty?: Property | null;
  profiles?: CompanyProfile[];
  activeProfileId?: string;
  onOpenCreateProfile?: () => void;
}

const PROPERTY_TYPES: PropertyType[] = [
  'Single Family',
  'Duplex / Multi-Family',
  'Condo / Apartment',
  'Townhouse',
  'Short-Term Rental (Airbnb)',
  'Commercial',
];

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProperty,
  profiles = [],
  activeProfileId = 'profile-default',
  onOpenCreateProfile,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    initialProperty?.profileId || activeProfileId || profiles[0]?.id || 'profile-default'
  );
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Single Family');
  const [purchasePrice, setPurchasePrice] = useState<number>(320000);
  const [currentValuation, setCurrentValuation] = useState<number>(320000);
  const [unitsCount, setUnitsCount] = useState<number>(1);

  // Tenant & Lease Agreement information
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState<number>(2400);
  const [tenantNotes, setTenantNotes] = useState<string>('');
  
  // Specific financial pillars per property
  const [baseMonthlyRent, setBaseMonthlyRent] = useState<number>(2400);
  const [rentInputStr, setRentInputStr] = useState<string>('2400');
  const [isOccupied, setIsOccupied] = useState<boolean>(true);
  const [annualPropertyTax, setAnnualPropertyTax] = useState<number>(3600);
  const [monthlyHoa, setMonthlyHoa] = useState<number>(0);
  const [annualInsurance, setAnnualInsurance] = useState<number>(1400);

  // Multi-unit itemized list state
  const [propertyUnits, setPropertyUnits] = useState<UnitRental[]>([]);

  useEffect(() => {
    if (initialProperty) {
      setSelectedProfileId(initialProperty.profileId || activeProfileId || profiles[0]?.id || 'profile-default');
      setName(initialProperty.name);
      setAddress(initialProperty.address || '');
      setPropertyType(initialProperty.propertyType);
      setPurchasePrice(initialProperty.purchasePrice);
      setCurrentValuation(initialProperty.currentValuation || initialProperty.purchasePrice);
      const uCount = initialProperty.unitsCount || (initialProperty.units ? initialProperty.units.length : 1);
      setUnitsCount(uCount);

      // Extract existing units
      const existingUnits: UnitRental[] = initialProperty.units && initialProperty.units.length > 0
        ? initialProperty.units.map((u, i) => ({
            ...u,
            id: u.id || `u-${i + 1}-${Date.now()}`,
            name: u.name || `Unit ${i + 1}`,
            rent: Number(u.rent) || 0,
            isOccupied: u.isOccupied !== undefined ? u.isOccupied : (Number(u.rent) > 0),
            tenantName: u.tenantName || '',
            tenantPhone: u.tenantPhone || '',
            leaseStart: u.leaseStart || '',
            leaseEnd: u.leaseEnd || '',
            securityDeposit: u.securityDeposit !== undefined ? u.securityDeposit : (Number(u.rent) || 0),
            tenantNotes: u.tenantNotes || '',
          }))
        : [
            {
              id: `u-1-${Date.now()}`,
              name: 'Main Unit',
              rent: initialProperty.baseMonthlyRent !== undefined ? initialProperty.baseMonthlyRent : 2400,
              isOccupied: initialProperty.baseMonthlyRent === 0 ? false : (initialProperty.tenantName ? true : true),
              tenantName: initialProperty.tenantName || '',
              tenantPhone: initialProperty.tenantPhone || '',
              leaseStart: initialProperty.leaseStart || '',
              leaseEnd: initialProperty.leaseEnd || '',
              securityDeposit: initialProperty.securityDeposit !== undefined ? initialProperty.securityDeposit : 2400,
              tenantNotes: initialProperty.tenantNotes || '',
            }
          ];
      setPropertyUnits(existingUnits);

      // Extract tenant & lease info
      const primaryUnit = existingUnits[0];
      const propRent = initialProperty.baseMonthlyRent !== undefined 
        ? initialProperty.baseMonthlyRent 
        : (primaryUnit?.rent !== undefined ? primaryUnit.rent : 2400);
      setBaseMonthlyRent(propRent);
      setRentInputStr(String(propRent));

      const loadedOccupied = primaryUnit?.isOccupied !== undefined 
        ? primaryUnit.isOccupied 
        : (propRent === 0 ? false : Boolean(primaryUnit?.tenantName || initialProperty.tenantName));
      setIsOccupied(loadedOccupied);

      setTenantName(primaryUnit?.tenantName || initialProperty.tenantName || '');
      setTenantPhone(primaryUnit?.tenantPhone || initialProperty.tenantPhone || '');
      setLeaseStart(primaryUnit?.leaseStart || initialProperty.leaseStart || '');
      setLeaseEnd(primaryUnit?.leaseEnd || initialProperty.leaseEnd || '');
      const loadedDeposit = primaryUnit?.securityDeposit !== undefined 
        ? primaryUnit.securityDeposit 
        : (initialProperty.securityDeposit !== undefined ? initialProperty.securityDeposit : (propRent || 0));
      setSecurityDeposit(loadedDeposit);
      setTenantNotes(primaryUnit?.tenantNotes || initialProperty.tenantNotes || '');

      // Extract Property Taxes from expenses
      const taxExpense = (initialProperty.expenses || []).find(
        (e) => e.category === 'Property Taxes' || (!e.name.toLowerCase().includes('insurance') && e.name.toLowerCase().includes('tax'))
      );
      if (taxExpense) {
        const amt = Number(taxExpense.amount) || 0;
        setAnnualPropertyTax(taxExpense.frequency === 'monthly' ? amt * 12 : amt);
      } else {
        setAnnualPropertyTax(0);
      }

      // Extract HOA from expenses
      const hoaExpense = (initialProperty.expenses || []).find(
        (e) => e.category === 'HOA / Condo Fees' || e.name.toLowerCase().includes('hoa')
      );
      if (hoaExpense) {
        const amt = Number(hoaExpense.amount) || 0;
        setMonthlyHoa(hoaExpense.frequency === 'annual' ? Math.round(amt / 12) : amt);
      } else {
        setMonthlyHoa(0);
      }

      // Extract Insurance from expenses
      const insExpense = (initialProperty.expenses || []).find(
        (e) => e.category === 'Property Insurance' || (!e.name.toLowerCase().includes('tax') && e.name.toLowerCase().includes('insurance'))
      );
      if (insExpense) {
        const amt = Number(insExpense.amount) || 0;
        setAnnualInsurance(insExpense.frequency === 'monthly' ? amt * 12 : amt);
      } else {
        setAnnualInsurance(0);
      }
    } else {
      setSelectedProfileId(activeProfileId || profiles[0]?.id || 'profile-default');
      setName('New Rental Property');
      setAddress('');
      setPropertyType('Single Family');
      setPurchasePrice(320000);
      setCurrentValuation(320000);
      setUnitsCount(1);
      setPropertyUnits([
        {
          id: `u-1-${Date.now()}`,
          name: 'Main Unit',
          rent: 2400,
          isOccupied: true,
          tenantName: '',
          tenantPhone: '',
          leaseStart: '',
          leaseEnd: '',
          securityDeposit: 2400,
          tenantNotes: '',
        }
      ]);
      setTenantName('');
      setTenantPhone('');
      setLeaseStart('');
      setLeaseEnd('');
      setSecurityDeposit(2400);
      setTenantNotes('');
      setBaseMonthlyRent(2400);
      setRentInputStr('2400');
      setIsOccupied(true);
      setAnnualPropertyTax(3840);
      setMonthlyHoa(0);
      setAnnualInsurance(0);
    }
  }, [initialProperty, isOpen]);

  // Adjust property units when unitsCount changes
  const handleUnitsCountChange = (newCount: number) => {
    const safeCount = Math.max(1, newCount);
    setUnitsCount(safeCount);
    setPropertyUnits((prev) => {
      if (prev.length === safeCount) return prev;
      if (prev.length < safeCount) {
        const added: UnitRental[] = [];
        for (let i = prev.length; i < safeCount; i++) {
          added.push({
            id: `u-${i + 1}-${Date.now()}`,
            name: `Unit ${i + 1}`,
            rent: prev[0]?.rent || 1800,
            isOccupied: true,
            tenantName: '',
            tenantPhone: '',
            leaseStart: '',
            leaseEnd: '',
            securityDeposit: prev[0]?.rent || 1800,
            tenantNotes: '',
          });
        }
        return [...prev, ...added];
      }
      return prev.slice(0, safeCount);
    });
  };

  const handleUpdateUnit = (idx: number, field: keyof UnitRental, val: any) => {
    setPropertyUnits((prev) => {
      const next = [...prev];
      const u = { ...next[idx], [field]: val };
      if (field === 'isOccupied' && val === false) {
        u.rent = 0;
      } else if (field === 'isOccupied' && val === true && Number(u.rent) === 0) {
        u.rent = 1800;
      }
      next[idx] = u;
      return next;
    });
  };

  const handleMarkAllUnitsVacant = () => {
    setPropertyUnits((prev) => prev.map((u) => ({
      ...u,
      isOccupied: false,
      rent: 0,
    })));
    setBaseMonthlyRent(0);
    setRentInputStr('0');
    setIsOccupied(false);
  };

  const handleMarkAllUnitsOccupied = () => {
    setPropertyUnits((prev) => prev.map((u) => ({
      ...u,
      isOccupied: true,
      rent: Number(u.rent) > 0 ? Number(u.rent) : 1800,
    })));
    setIsOccupied(true);
    if (baseMonthlyRent === 0) {
      setBaseMonthlyRent(2400);
      setRentInputStr('2400');
    }
  };

  // Quick Lease Duration Calculators
  const handleSetLeaseTerm = (months: number) => {
    let startD: Date;
    if (leaseStart) {
      const parts = leaseStart.split('-');
      if (parts.length === 3) {
        startD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        startD = new Date(leaseStart);
      }
    } else {
      startD = new Date();
      const y = startD.getFullYear();
      const m = String(startD.getMonth() + 1).padStart(2, '0');
      const d = String(startD.getDate()).padStart(2, '0');
      setLeaseStart(`${y}-${m}-${d}`);
    }

    const endD = new Date(startD);
    endD.setMonth(endD.getMonth() + months);
    endD.setDate(endD.getDate() - 1); // 1 day before anniversary
    const endY = endD.getFullYear();
    const endM = String(endD.getMonth() + 1).padStart(2, '0');
    const endDay = String(endD.getDate()).padStart(2, '0');
    setLeaseEnd(`${endY}-${endM}-${endDay}`);
  };

  const getLeaseStatusBadge = () => {
    if (!leaseEnd) {
      if (tenantName) {
        return { label: 'Active Tenant (Month-to-Month)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      }
      return null;
    }
    const end = new Date(leaseEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { label: `Lease Expired (${Math.abs(diffDays)} days ago)`, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    } else if (diffDays <= 30) {
      return { label: `Expiring Soon (${diffDays} days remaining)`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    return { label: `Active Lease (${diffDays} days remaining)`, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (initialProperty) {
      // Update existing expenses or add if missing
      const existingExpenses = [...(initialProperty.expenses || [])];

      // 1. Update/Add/Remove Property Taxes
      const taxIdx = existingExpenses.findIndex(
        (exp) => exp.category === 'Property Taxes' || (!exp.name.toLowerCase().includes('insurance') && exp.name.toLowerCase().includes('tax'))
      );
      if (taxIdx >= 0) {
        if (annualPropertyTax > 0) {
          existingExpenses[taxIdx] = {
            ...existingExpenses[taxIdx],
            category: 'Property Taxes',
            amount: annualPropertyTax,
            frequency: 'annual',
            isPercentageOfRent: false,
          };
        } else {
          existingExpenses.splice(taxIdx, 1);
        }
      } else if (annualPropertyTax > 0) {
        existingExpenses.unshift({
          id: `exp-tax-${Date.now()}`,
          category: 'Property Taxes',
          name: 'Property Taxes',
          amount: annualPropertyTax,
          frequency: 'annual',
          isPercentageOfRent: false,
        });
      }

      // 2. Update/Add/Remove HOA Fees
      const hoaIdx = existingExpenses.findIndex(
        (exp) => exp.category === 'HOA / Condo Fees' || exp.name.toLowerCase().includes('hoa')
      );
      if (hoaIdx >= 0) {
        if (monthlyHoa > 0) {
          existingExpenses[hoaIdx] = {
            ...existingExpenses[hoaIdx],
            category: 'HOA / Condo Fees',
            amount: monthlyHoa,
            frequency: 'monthly',
            isPercentageOfRent: false,
          };
        } else {
          existingExpenses.splice(hoaIdx, 1);
        }
      } else if (monthlyHoa > 0) {
        existingExpenses.push({
          id: `exp-hoa-${Date.now()}`,
          category: 'HOA / Condo Fees',
          name: 'HOA / Condo Dues',
          amount: monthlyHoa,
          frequency: 'monthly',
          isPercentageOfRent: false,
        });
      }

      // 3. Update/Add/Remove Insurance
      const insIdx = existingExpenses.findIndex(
        (exp) => exp.category === 'Property Insurance' || (!exp.name.toLowerCase().includes('tax') && exp.name.toLowerCase().includes('insurance'))
      );
      if (insIdx >= 0) {
        if (annualInsurance > 0) {
          existingExpenses[insIdx] = {
            ...existingExpenses[insIdx],
            category: 'Property Insurance',
            amount: annualInsurance,
            frequency: 'annual',
            isPercentageOfRent: false,
          };
        } else {
          // Delete insurance when 0
          existingExpenses.splice(insIdx, 1);
        }
      } else if (annualInsurance > 0) {
        existingExpenses.push({
          id: `exp-ins-${Date.now()}`,
          category: 'Property Insurance',
          name: 'Property Insurance',
          amount: annualInsurance,
          frequency: 'annual',
          isPercentageOfRent: false,
        });
      }

      // Synchronize unit rents and tenant info if 1 unit or primary unit
      const trimmedTenantName = tenantName.trim();
      const trimmedTenantPhone = tenantPhone.trim();
      const cleanedLeaseStart = leaseStart.trim() || undefined;
      const cleanedLeaseEnd = leaseEnd.trim() || undefined;
      const cleanedSecurityDeposit = isNaN(securityDeposit) ? 0 : Math.max(0, securityDeposit);
      const cleanedTenantNotes = tenantNotes.trim() || undefined;

      let updatedUnits: UnitRental[] = [];
      let finalRent = 0;
      let anyOccupied = false;

      if (propertyUnits.length > 1) {
        updatedUnits = propertyUnits.map((u) => {
          const uRent = isNaN(u.rent) ? 0 : Math.max(0, u.rent);
          const uOccupied = u.isOccupied && (uRent > 0 || Boolean(u.tenantName?.trim()));
          return {
            ...u,
            rent: uRent,
            isOccupied: uOccupied,
            tenantName: uOccupied ? (u.tenantName?.trim() || undefined) : undefined,
            tenantPhone: uOccupied ? (u.tenantPhone?.trim() || undefined) : undefined,
            leaseStart: uOccupied ? (u.leaseStart?.trim() || undefined) : undefined,
            leaseEnd: uOccupied ? (u.leaseEnd?.trim() || undefined) : undefined,
            securityDeposit: uOccupied ? (isNaN(u.securityDeposit || 0) ? 0 : Math.max(0, u.securityDeposit || 0)) : 0,
            tenantNotes: u.tenantNotes?.trim() || undefined,
          };
        });
        finalRent = updatedUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
        anyOccupied = updatedUnits.some((u) => u.isOccupied);
      } else {
        const singleRent = isNaN(baseMonthlyRent) ? 0 : Math.max(0, baseMonthlyRent);
        const singleOccupied = isOccupied && singleRent > 0;
        finalRent = singleRent;
        anyOccupied = singleOccupied;
        updatedUnits = [
          {
            ...(propertyUnits[0] || {}),
            id: propertyUnits[0]?.id || `u-${Date.now()}`,
            name: propertyUnits[0]?.name || 'Main Unit',
            rent: singleRent,
            isOccupied: singleOccupied,
            tenantName: singleOccupied ? (trimmedTenantName || undefined) : undefined,
            tenantPhone: singleOccupied ? (trimmedTenantPhone || undefined) : undefined,
            leaseStart: singleOccupied ? cleanedLeaseStart : undefined,
            leaseEnd: singleOccupied ? cleanedLeaseEnd : undefined,
            securityDeposit: singleOccupied ? cleanedSecurityDeposit : 0,
            tenantNotes: cleanedTenantNotes,
            appliances: propertyUnits[0]?.appliances || [],
          },
        ];
      }

      const primaryActive = updatedUnits.find((u) => u.isOccupied) || updatedUnits[0];

      onSave({
        ...initialProperty,
        profileId: selectedProfileId,
        companyName: profiles.find((pr) => pr.id === selectedProfileId)?.name || initialProperty.companyName || 'Bros Real Estate LLC',
        name: name.trim() || 'Rental Property',
        address: address.trim(),
        propertyType,
        purchasePrice,
        currentValuation: currentValuation || purchasePrice,
        unitsCount: updatedUnits.length,
        units: updatedUnits,
        isOccupied: anyOccupied,
        tenantName: anyOccupied ? (primaryActive?.tenantName || trimmedTenantName || undefined) : undefined,
        tenantPhone: anyOccupied ? (primaryActive?.tenantPhone || trimmedTenantPhone || undefined) : undefined,
        leaseStart: anyOccupied ? (primaryActive?.leaseStart || cleanedLeaseStart) : undefined,
        leaseEnd: anyOccupied ? (primaryActive?.leaseEnd || cleanedLeaseEnd) : undefined,
        securityDeposit: anyOccupied ? updatedUnits.reduce((s, u) => s + (u.securityDeposit || 0), 0) : 0,
        tenantNotes: cleanedTenantNotes,
        baseMonthlyRent: finalRent,
        expenses: existingExpenses,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Creating a new property with dedicated inputs
      const trimmedTenantName = tenantName.trim();
      const trimmedTenantPhone = tenantPhone.trim();
      const cleanedLeaseStart = leaseStart.trim() || undefined;
      const cleanedLeaseEnd = leaseEnd.trim() || undefined;
      const cleanedSecurityDeposit = isNaN(securityDeposit) ? 0 : Math.max(0, securityDeposit);
      const cleanedTenantNotes = tenantNotes.trim() || undefined;

      const initialExpenses: ExpenseItem[] = [
        {
          id: `exp-tax-${Date.now()}`,
          category: 'Property Taxes',
          name: 'Property Taxes',
          amount: annualPropertyTax,
          frequency: 'annual',
          isPercentageOfRent: false,
        },
        {
          id: `exp-ins-${Date.now()}`,
          category: 'Property Insurance',
          name: 'Property Insurance',
          amount: annualInsurance,
          frequency: 'annual',
          isPercentageOfRent: false,
        },
        {
          id: `exp-mgmt-${Date.now()}`,
          category: 'Property Management',
          name: 'Property Management (8%)',
          amount: 0,
          frequency: 'monthly',
          isPercentageOfRent: true,
          percentageValue: 8,
        },
        {
          id: `exp-maint-${Date.now()}`,
          category: 'Repairs & Maintenance',
          name: 'Maintenance & Repairs (5%)',
          amount: 0,
          frequency: 'monthly',
          isPercentageOfRent: true,
          percentageValue: 5,
        },
        {
          id: `exp-capex-${Date.now()}`,
          category: 'Capital Expenditures (CapEx)',
          name: 'CapEx Reserve (5%)',
          amount: 0,
          frequency: 'monthly',
          isPercentageOfRent: true,
          percentageValue: 5,
        },
      ];

      if (monthlyHoa > 0) {
        initialExpenses.push({
          id: `exp-hoa-${Date.now()}`,
          category: 'HOA / Condo Fees',
          name: 'HOA / Condo Dues',
          amount: monthlyHoa,
          frequency: 'monthly',
          isPercentageOfRent: false,
        });
      }

      let newUnits: UnitRental[] = [];
      let finalRent = 0;
      let anyOccupied = false;

      if (propertyUnits.length > 1) {
        newUnits = propertyUnits.map((u) => {
          const uRent = isNaN(u.rent) ? 0 : Math.max(0, u.rent);
          const uOccupied = u.isOccupied && (uRent > 0 || Boolean(u.tenantName?.trim()));
          return {
            ...u,
            rent: uRent,
            isOccupied: uOccupied,
            tenantName: uOccupied ? (u.tenantName?.trim() || undefined) : undefined,
            tenantPhone: uOccupied ? (u.tenantPhone?.trim() || undefined) : undefined,
            leaseStart: uOccupied ? (u.leaseStart?.trim() || undefined) : undefined,
            leaseEnd: uOccupied ? (u.leaseEnd?.trim() || undefined) : undefined,
            securityDeposit: uOccupied ? (isNaN(u.securityDeposit || 0) ? 0 : Math.max(0, u.securityDeposit || 0)) : 0,
            tenantNotes: u.tenantNotes?.trim() || undefined,
          };
        });
        finalRent = newUnits.reduce((sum, u) => sum + (Number(u.rent) || 0), 0);
        anyOccupied = newUnits.some((u) => u.isOccupied);
      } else {
        const singleRent = isNaN(baseMonthlyRent) ? 0 : Math.max(0, baseMonthlyRent);
        const singleOccupied = isOccupied && singleRent > 0;
        finalRent = singleRent;
        anyOccupied = singleOccupied;
        newUnits = [
          {
            id: `u-${Date.now()}`,
            name: 'Unit 1',
            rent: singleRent,
            isOccupied: singleOccupied,
            tenantName: singleOccupied ? (trimmedTenantName || undefined) : undefined,
            tenantPhone: singleOccupied ? (trimmedTenantPhone || undefined) : undefined,
            leaseStart: singleOccupied ? cleanedLeaseStart : undefined,
            leaseEnd: singleOccupied ? cleanedLeaseEnd : undefined,
            securityDeposit: singleOccupied ? cleanedSecurityDeposit : 0,
            tenantNotes: cleanedTenantNotes,
            appliances: [],
          },
        ];
      }

      const primaryActive = newUnits.find((u) => u.isOccupied) || newUnits[0];

      const newProp: Property = {
        id: `prop-${Date.now()}`,
        profileId: selectedProfileId,
        companyName: profiles.find((pr) => pr.id === selectedProfileId)?.name || 'Bros Real Estate LLC',
        name: name.trim() || 'New Rental Property',
        address: address.trim(),
        propertyType,
        unitsCount: newUnits.length,
        isOccupied: anyOccupied,
        tenantName: anyOccupied ? (primaryActive?.tenantName || trimmedTenantName || undefined) : undefined,
        tenantPhone: anyOccupied ? (primaryActive?.tenantPhone || trimmedTenantPhone || undefined) : undefined,
        leaseStart: anyOccupied ? (primaryActive?.leaseStart || cleanedLeaseStart) : undefined,
        leaseEnd: anyOccupied ? (primaryActive?.leaseEnd || cleanedLeaseEnd) : undefined,
        securityDeposit: anyOccupied ? newUnits.reduce((s, u) => s + (u.securityDeposit || 0), 0) : 0,
        tenantNotes: cleanedTenantNotes,
        units: newUnits,
        purchasePrice,
        currentValuation: currentValuation || purchasePrice,
        downPaymentPercent: 20,
        downPaymentAmount: purchasePrice * 0.2,
        closingCosts: 6500,
        initialRepairCosts: 3500,
        hasMortgage: true,
        interestRate: 6.5,
        loanTermYears: 30,
        mortgageManualOverride: false,
        monthlyMortgageAmount: 0,
        baseMonthlyRent: finalRent,
        vacancyRatePercent: 5,
        extraIncomes: [],
        expenses: initialExpenses,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(newProp);
    }

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#161A23] rounded-2xl border border-slate-800 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 my-2 sm:my-4 overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialProperty ? 'Edit Property, Tenant & Lease' : 'Add New Rental Property'}
              </h3>
              <p className="text-xs text-slate-400">Configure address, lease dates, tenant details, and financials</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1.5 pt-3">
          {/* General Property Info */}
          <div className="space-y-3 bg-[#11141B] p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Property Identification
            </span>

            {/* Company / Profile Assignment */}
            <div className="bg-[#0E121A] p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Company / Entity Profile *</span>
                </label>
                {onOpenCreateProfile && (
                  <button
                    type="button"
                    onClick={onOpenCreateProfile}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Profile</span>
                  </button>
                )}
              </div>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full text-xs font-semibold text-white bg-[#161A23] px-3 py-2 border border-slate-700/80 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#161A23] text-white">
                    🏢 {p.name} {p.dba ? `(${p.dba})` : ''} {p.isDefault ? '• Primary' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Assign building to this company or entity name for separate statements, rent collection, and records.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Property Name / Nickname *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oakridge Single Family, Sunset Vista Condo"
                className="w-full text-xs font-semibold text-white bg-[#0E121A] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Street Address / Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 742 Evergreen Terrace, Springfield, IL"
                className="w-full text-xs text-white bg-[#0E121A] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full text-xs font-semibold text-white bg-[#0E121A] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#161A23] text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Total Units
                </label>
                <input
                  type="number"
                  min="1"
                  value={isNaN(unitsCount) ? 1 : unitsCount}
                  onChange={(e) => handleUnitsCountChange(parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-semibold text-white bg-[#0E121A] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Key Financial Pillars: Rental Income, HOA, Property Tax */}
          <div className="space-y-3.5 bg-[#11141B] p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                2. Property-Specific Income & Fixed Escrows
              </span>
              <span className="text-[11px] text-slate-400">Tailored per property</span>
            </div>

            {/* 1. Monthly Rental Income */}
            <div className="bg-[#161A23] p-3 rounded-lg border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    {propertyUnits.length > 1 ? 'Total Property Scheduled Rent ($)' : 'Monthly Rental Income ($)'}
                  </label>
                  {propertyUnits.length > 1 && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Sum of {propertyUnits.length} units • {propertyUnits.filter((u) => u.isOccupied && Number(u.rent) > 0).length} occupied, {propertyUnits.filter((u) => !u.isOccupied || Number(u.rent) === 0).length} vacant
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (propertyUnits.length > 1) {
                        handleMarkAllUnitsVacant();
                      } else {
                        setBaseMonthlyRent(0);
                        setRentInputStr('0');
                        setIsOccupied(false);
                      }
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                      (propertyUnits.length > 1 ? propertyUnits.every((u) => !u.isOccupied || Number(u.rent) === 0) : (baseMonthlyRent === 0 || !isOccupied))
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                        : 'bg-[#0E121A] text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <span>
                      {(propertyUnits.length > 1 ? propertyUnits.every((u) => !u.isOccupied || Number(u.rent) === 0) : (baseMonthlyRent === 0 || !isOccupied))
                        ? '✓ Entire Property Vacant ($0)'
                        : 'Mark Entire Property Vacant ($0)'}
                    </span>
                  </button>
                  <span className="text-xs font-semibold text-emerald-400">
                    {formatCurrency((propertyUnits.length > 1 ? propertyUnits.reduce((s, u) => s + (Number(u.rent) || 0), 0) : (baseMonthlyRent || 0)) * 12)} / year
                  </span>
                </div>
              </div>

              {propertyUnits.length > 1 ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0E121A] border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white">
                      {formatCurrency(propertyUnits.reduce((s, u) => s + (Number(u.rent) || 0), 0))}
                    </span>
                    <span className="text-xs text-slate-400">/ month total scheduled</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    Set per-unit rent &amp; vacancy in Section 3 below ↓
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={rentInputStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRentInputStr(v);
                      if (v === '') {
                        setBaseMonthlyRent(0);
                        setIsOccupied(false);
                      } else {
                        const num = parseFloat(v);
                        const safeNum = isNaN(num) ? 0 : Math.max(0, num);
                        setBaseMonthlyRent(safeNum);
                        if (safeNum > 0) {
                          setIsOccupied(true);
                        } else {
                          setIsOccupied(false);
                        }
                      }
                    }}
                    placeholder="0"
                    className="w-full text-sm font-bold text-white bg-[#0E121A] pl-7 pr-20 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 placeholder-slate-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ month</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 2. Property Taxes */}
              <div className="bg-[#161A23] p-3 rounded-lg border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-rose-400" />
                    Annual Property Tax ($)
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={isNaN(annualPropertyTax) ? '' : (annualPropertyTax || '')}
                    onChange={(e) => setAnnualPropertyTax(parseFloat(e.target.value) || 0)}
                    placeholder="3600"
                    className="w-full text-xs font-bold text-white bg-[#0E121A] pl-7 pr-16 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 placeholder-slate-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ year</span>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  ≈ <strong className="text-slate-300">{formatCurrency(annualPropertyTax / 12)}</strong> / mo
                </span>
              </div>

              {/* 3. HOA / Condo Fees */}
              <div className="bg-[#161A23] p-3 rounded-lg border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                    Monthly HOA / Condo Fee ($)
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={isNaN(monthlyHoa) ? '' : (monthlyHoa || '')}
                    onChange={(e) => setMonthlyHoa(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-xs font-bold text-white bg-[#0E121A] pl-7 pr-16 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder-slate-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">/ month</span>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {monthlyHoa > 0 ? (
                    <>Annual: <strong className="text-slate-300">{formatCurrency(monthlyHoa * 12)}</strong> / yr</>
                  ) : (
                    'No HOA dues ($0)'
                  )}
                </span>
              </div>
            </div>

            {/* Insurance, Purchase Price & Current Valuation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purchase Price ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={isNaN(purchasePrice) ? '' : (purchasePrice || '')}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      setPurchasePrice(p);
                      if (currentValuation === purchasePrice || !currentValuation || currentValuation < p * 0.3) {
                        setCurrentValuation(p);
                      }
                      if (!initialProperty || annualPropertyTax === 0) {
                        setAnnualPropertyTax(Math.round(p * 0.012));
                      }
                    }}
                    placeholder="350000"
                    className="w-full text-xs font-semibold text-white bg-[#0E121A] pl-7 pr-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Current Market Valuation ($)
                  </label>
                  {currentValuation !== purchasePrice && purchasePrice > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentValuation(purchasePrice)}
                      className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                    >
                      Match Price
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={isNaN(currentValuation) ? '' : (currentValuation || '')}
                    onChange={(e) => setCurrentValuation(parseFloat(e.target.value) || 0)}
                    placeholder={purchasePrice ? String(purchasePrice) : '350000'}
                    className="w-full text-xs font-semibold text-white bg-[#0E121A] pl-7 pr-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Used for Cap Rate Yield</span>
              </div>
            </div>

            {/* Annual Property Insurance */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Annual Property Insurance ($)
                </label>
                {annualInsurance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAnnualInsurance(0)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer"
                    title="Remove / Delete Insurance ($0)"
                  >
                    Delete ($0)
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={isNaN(annualInsurance) ? '' : (annualInsurance || '')}
                  onChange={(e) => setAnnualInsurance(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full text-xs font-semibold text-white bg-[#0E121A] pl-7 pr-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {annualInsurance > 0 ? (
                  <>≈ {formatCurrency(annualInsurance / 12)}/mo</>
                ) : (
                  'No insurance expense ($0)'
                )}
              </span>
            </div>
          </div>

          {/* 3. Tenant & Active Lease Information */}
          <div className="space-y-3.5 bg-[#11141B] p-3.5 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {propertyUnits.length > 1
                  ? `3. Unit Inventory, Tenants & Leases (${propertyUnits.length} Units)`
                  : '3. Tenant & Active Lease Agreement'}
              </span>
              {propertyUnits.length <= 1 && getLeaseStatusBadge() && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getLeaseStatusBadge()?.color}`}>
                  {getLeaseStatusBadge()?.label}
                </span>
              )}
            </div>

            {propertyUnits.length > 1 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                  <span className="text-slate-400">
                    Itemized Unit Breakdown ({propertyUnits.filter(u => u.isOccupied && Number(u.rent) > 0).length} Occupied, {propertyUnits.filter(u => !u.isOccupied || Number(u.rent) === 0).length} Vacant)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleMarkAllUnitsVacant}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
                    >
                      Mark All Vacant ($0)
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkAllUnitsOccupied}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                    >
                      Mark All Occupied
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {propertyUnits.map((u, idx) => {
                    const isVac = !u.isOccupied || Number(u.rent) === 0;
                    return (
                      <div
                        key={u.id || idx}
                        className={`p-3 rounded-xl border transition-all ${
                          isVac
                            ? 'bg-[#121620] border-amber-500/40'
                            : 'bg-[#161A23] border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={u.name || `Unit ${idx + 1}`}
                              onChange={(e) => handleUpdateUnit(idx, 'name', e.target.value)}
                              placeholder={`Unit ${idx + 1}`}
                              className="text-xs font-bold text-white bg-[#0E121A] px-2 py-1 rounded border border-slate-700 w-36 sm:w-44 focus:border-emerald-500"
                            />
                            {isVac ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                VACANT ($0)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                OCCUPIED
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateUnit(idx, 'isOccupied', true)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                !isVac
                                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-xs'
                                  : 'bg-[#0E121A] text-slate-400 border border-slate-700 hover:text-white'
                              }`}
                            >
                              Occupied
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateUnit(idx, 'isOccupied', false)}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                isVac
                                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                                  : 'bg-[#0E121A] text-slate-400 border border-slate-700 hover:text-white'
                              }`}
                            >
                              Vacant ($0)
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Monthly Rent ($):</label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={isNaN(u.rent) ? 0 : u.rent}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                handleUpdateUnit(idx, 'rent', isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              className="w-full bg-[#0E121A] text-white font-bold text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Resident Name:</label>
                            <input
                              type="text"
                              value={u.tenantName || ''}
                              onChange={(e) => handleUpdateUnit(idx, 'tenantName', e.target.value)}
                              placeholder={isVac ? 'Vacant / Available' : 'Tenant Name'}
                              className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-blue-500 placeholder-slate-600"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Phone Number:</label>
                            <input
                              type="tel"
                              value={u.tenantPhone || ''}
                              onChange={(e) => handleUpdateUnit(idx, 'tenantPhone', e.target.value)}
                              placeholder="(555) 000-0000"
                              className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-blue-500 placeholder-slate-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-1.5 border-t border-slate-800/60">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Lease Expiration:</label>
                            <input
                              type="date"
                              value={u.leaseEnd || ''}
                              onChange={(e) => handleUpdateUnit(idx, 'leaseEnd', e.target.value)}
                              className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Security Deposit ($):</label>
                            <input
                              type="number"
                              min="0"
                              value={isNaN(u.securityDeposit || 0) ? 0 : u.securityDeposit}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                handleUpdateUnit(idx, 'securityDeposit', isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              className="w-full bg-[#0E121A] text-white text-xs px-2 py-1 rounded border border-slate-700 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Single Unit Occupancy Status Selector */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0E121A] border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Unit Occupancy Status</span>
                    <span className="text-[11px] text-slate-400">
                      {isOccupied && baseMonthlyRent > 0 ? 'Occupied with active lease / rent' : 'Vacant (Available for Lease / $0 rent)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOccupied(true);
                        if (baseMonthlyRent === 0) {
                          setBaseMonthlyRent(2400);
                          setRentInputStr('2400');
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isOccupied && baseMonthlyRent > 0
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs'
                          : 'bg-transparent text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      Occupied
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOccupied(false);
                        setBaseMonthlyRent(0);
                        setRentInputStr('0');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !isOccupied || baseMonthlyRent === 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                          : 'bg-transparent text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      Vacant ($0 Rent)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tenant Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Tenant Name
                    </label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      placeholder={!isOccupied || baseMonthlyRent === 0 ? 'Vacant / Available for lease' : 'e.g. Sarah & David Miller'}
                      className="w-full text-xs font-semibold text-white bg-[#0E121A] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-600"
                    />
                  </div>

                  {/* Tenant Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      Tenant Phone Number
                    </label>
                    <input
                      type="tel"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      placeholder="e.g. (217) 555-0192"
                      className="w-full text-xs font-semibold text-white bg-[#0E121A] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Lease Start Date and Expiration Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-400" />
                      Lease Start Date
                    </label>
                    <input
                      type="date"
                      value={leaseStart}
                      onChange={(e) => setLeaseStart(e.target.value)}
                      className="w-full text-xs font-semibold text-white bg-[#0E121A] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-400" />
                      Lease Expiration Date
                    </label>
                    <input
                      type="date"
                      value={leaseEnd}
                      onChange={(e) => setLeaseEnd(e.target.value)}
                      className="w-full text-xs font-semibold text-white bg-[#0E121A] px-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Quick Lease Duration Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400">Quick lease term presets:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSetLeaseTerm(12)}
                      className="px-2 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors cursor-pointer"
                    >
                      1-Year Lease
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetLeaseTerm(6)}
                      className="px-2 py-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-md transition-colors cursor-pointer"
                    >
                      6-Month Lease
                    </button>
                    {(leaseStart || leaseEnd || tenantName || tenantPhone) && (
                      <button
                        type="button"
                        onClick={() => {
                          setLeaseStart('');
                          setLeaseEnd('');
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>
                </div>

                {/* Security Deposit Amount & Quick Presets */}
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                      Security Deposit Paid ($)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {securityDeposit > 0 ? (
                        <>Held in Escrow: <strong className="text-emerald-400 font-semibold">{formatCurrency(securityDeposit)}</strong></>
                      ) : (
                        <span className="text-slate-500">No deposit / Waived ($0)</span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={isNaN(securityDeposit) ? '' : (securityDeposit || '')}
                        onChange={(e) => setSecurityDeposit(parseFloat(e.target.value) || 0)}
                        placeholder="2400"
                        className="w-full text-xs font-bold text-white bg-[#0E121A] pl-7 pr-3 py-2 border border-slate-800 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-600"
                      />
                    </div>

                    {/* Quick Deposit Preset Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSecurityDeposit(baseMonthlyRent || 0)}
                        className="px-2 py-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors cursor-pointer"
                        title="Set to 1 month rent"
                      >
                        1-Mo Rent ({formatCurrency(baseMonthlyRent)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecurityDeposit(Math.round((baseMonthlyRent || 0) * 1.5))}
                        className="px-2 py-1 text-[10px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-md transition-colors cursor-pointer"
                        title="Set to 1.5x month rent"
                      >
                        1.5x
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecurityDeposit(0)}
                        className="px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                        title="Waive deposit ($0)"
                      >
                        $0 Waived
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tenant & Lease Notes Section */}
            <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Tenant & Lease Notes
                </label>
                <span className="text-[10px] text-slate-500">
                  Pet policy, deposit conditions, parking stall, emergency contacts
                </span>
              </div>
              <textarea
                rows={3}
                value={tenantNotes}
                onChange={(e) => setTenantNotes(e.target.value)}
                placeholder="e.g. Security deposit held in dedicated escrow account. 2 dogs approved with $75/mo pet rent addendum. Assigned parking space #4B and 2 FOB keys issued. Emergency contact: John Miller (brother) 555-0199."
                className="w-full text-xs text-white bg-[#0E121A] p-2.5 border border-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-600 resize-y"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              {initialProperty ? 'Save Changes' : 'Create Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

