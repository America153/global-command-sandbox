import { useState } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Building2, Users, Landmark, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { getCountryPower } from '@/engine/countryDefenders';

interface FinancePanelProps {
  onClose: () => void;
}

// Constants for financial calculations
const UNIT_UPKEEP = 10000; // $10k per unit
const BASE_UPKEEP = 100000; // $100k per base
const BASE_INCOME = 10000000; // $10M base income per tick
const TERRITORY_INCOME_MULTIPLIER = 500000; // $500k per power level
const LOAN_INTEREST_RATE = 0.05; // 5% interest per tick payment

export interface Loan {
  id: string;
  principal: number;
  remaining: number;
  interestRate: number;
  takenAtTick: number;
}

export default function FinancePanel({ onClose }: FinancePanelProps) {
  const { 
    resources, 
    units, 
    bases, 
    capturedCountryIds, 
    hq,
    loans = [],
    addResources,
    takeLoan,
    payLoan
  } = useGameStore();
  
  const [loanAmount, setLoanAmount] = useState(1000000);

  // Calculate income breakdown
  const baseIncome = hq ? BASE_INCOME : 0;
  
  let territoryIncome = 0;
  for (const countryId of capturedCountryIds) {
    const countryPower = getCountryPower(countryId);
    territoryIncome += countryPower * TERRITORY_INCOME_MULTIPLIER;
  }
  
  const totalIncome = baseIncome + territoryIncome;

  // Calculate upkeep costs
  const unitCount = units.filter(u => u.faction === 'player').length;
  const baseCount = bases.filter(b => b.faction === 'player').length;
  
  const unitUpkeep = unitCount * UNIT_UPKEEP;
  const baseUpkeep = baseCount * BASE_UPKEEP;
  const totalUpkeep = unitUpkeep + baseUpkeep;

  // Calculate loan payments
  const totalLoanPayment = loans.reduce((sum, loan) => {
    return sum + (loan.remaining * loan.interestRate);
  }, 0);

  const netIncome = totalIncome - totalUpkeep - totalLoanPayment;

  // Loan amounts
  const loanOptions = [1000000, 5000000, 10000000, 50000000, 100000000];
  
  const totalDebt = loans.reduce((sum, loan) => sum + loan.remaining, 0);

  const handleTakeLoan = (amount: number) => {
    if (takeLoan) {
      takeLoan(amount);
    }
  };

  const handlePayLoan = (loanId: string, amount: number) => {
    if (payLoan && resources >= amount) {
      payLoan(loanId, amount);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold">FINANCIAL OVERVIEW</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Current Balance */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Current Balance</div>
            <div className="text-3xl font-bold text-primary font-mono">
              ${resources.toLocaleString()}
            </div>
          </div>

          {/* Income Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-friendly">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-semibold">INCOME (per tick)</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Income (HQ)</span>
                <span className="font-mono text-friendly">+${baseIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Territory Income ({capturedCountryIds.length} territories)</span>
                <span className="font-mono text-friendly">+${territoryIncome.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Total Income</span>
                <span className="font-mono text-friendly">+${totalIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <TrendingDown className="w-5 h-5" />
              <h3 className="font-semibold">EXPENSES (per tick)</h3>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Unit Salaries ({unitCount} units × $10k)</span>
                </div>
                <span className="font-mono text-destructive">-${unitUpkeep.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Base Upkeep ({baseCount} bases × $100k)</span>
                </div>
                <span className="font-mono text-destructive">-${baseUpkeep.toLocaleString()}</span>
              </div>
              {totalLoanPayment > 0 && (
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Loan Interest Payments</span>
                  </div>
                  <span className="font-mono text-destructive">-${totalLoanPayment.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Total Expenses</span>
                <span className="font-mono text-destructive">-${(totalUpkeep + totalLoanPayment).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className={`rounded-lg p-4 border ${netIncome >= 0 ? 'bg-friendly/10 border-friendly/30' : 'bg-destructive/10 border-destructive/30'}`}>
            <div className="flex justify-between items-center">
              <span className="font-semibold">NET INCOME (per tick)</span>
              <span className={`text-2xl font-bold font-mono ${netIncome >= 0 ? 'text-friendly' : 'text-destructive'}`}>
                {netIncome >= 0 ? '+' : ''}{netIncome.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Loans Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Landmark className="w-5 h-5" />
              <h3 className="font-semibold">LOANS & FINANCING</h3>
            </div>
            
            {/* Current Debt */}
            {totalDebt > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Total Outstanding Debt</div>
                <div className="text-xl font-bold text-destructive font-mono">
                  ${totalDebt.toLocaleString()}
                </div>
              </div>
            )}

            {/* Active Loans */}
            {loans.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Active Loans</div>
                {loans.map((loan, index) => (
                  <div key={loan.id} className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Loan #{index + 1}</div>
                      <div className="text-xs text-muted-foreground">
                        Remaining: ${loan.remaining.toLocaleString()} ({(loan.interestRate * 100).toFixed(0)}% interest)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePayLoan(loan.id, Math.min(loan.remaining, 1000000))}
                        disabled={resources < 1000000}
                      >
                        Pay $1M
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handlePayLoan(loan.id, loan.remaining)}
                        disabled={resources < loan.remaining}
                      >
                        Pay Off (${loan.remaining.toLocaleString()})
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Take New Loan */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium">Take New Loan (5% interest per tick)</div>
              <div className="flex flex-wrap gap-2">
                {loanOptions.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTakeLoan(amount)}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    ${(amount / 1000000).toFixed(0)}M
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
