import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useAuth } from '@/hooks/useAuth';
import { Globe2, Handshake, DollarSign, BarChart3, LogOut, Shield } from 'lucide-react';
import DiplomacyPanel from '@/components/DiplomacyPanel';
import FinancePanel from '@/components/FinancePanel';
import StockMarketPanel from '@/components/StockMarketPanel';

interface TopBarProps {
  selectedTool: string | null;
}

export default function TopBar({ selectedTool }: TopBarProps) {
  const { resources, hq, diplomacy, loans, portfolio, stocks } = useGameStore();
  const { signOut, user } = useAuth();
  const [showDiplomacy, setShowDiplomacy] = useState(false);
  const [showFinance, setShowFinance] = useState(false);
  const [showStocks, setShowStocks] = useState(false);

  const atWarCount = Object.values(diplomacy.relations).filter(r => r.status === 'war').length;
  const totalDebt = loans.reduce((sum, loan) => sum + loan.remaining, 0);
  const portfolioValue = Object.entries(portfolio).reduce((sum, [stockId, shares]) => {
    const stock = stocks.find(s => s.id === stockId);
    return sum + (stock ? stock.price * (shares as number) : 0);
  }, 0);

  return (
    <>
      <div className="bg-background/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm tracking-wide text-foreground">COMMAND</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider hidden sm:inline">
              Strategic Operations
            </span>
          </div>

          {/* Center Status & Buttons */}
          <div className="flex items-center gap-2">
            {selectedTool && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mr-2">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-medium text-primary uppercase tracking-wide">
                  {selectedTool === 'hq' ? 'Placing HQ' : `Placing ${selectedTool}`}
                </span>
              </div>
            )}
            
            {!selectedTool && !hq && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mr-2">
                <span className="text-[10px] font-medium text-accent">
                  Select HQ → Click Globe
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <button 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
              onClick={() => setShowStocks(true)}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stocks</span>
              {portfolioValue > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-friendly/20 text-friendly rounded-full">
                  ${(portfolioValue / 1000000).toFixed(1)}M
                </span>
              )}
            </button>

            <button 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
              onClick={() => setShowFinance(true)}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Finance</span>
              {totalDebt > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-accent/20 text-accent rounded-full">
                  DEBT
                </span>
              )}
            </button>

            <button 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all"
              onClick={() => setShowDiplomacy(true)}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Diplomacy</span>
              {atWarCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-destructive/20 text-destructive rounded-full">
                  {atWarCount} WAR
                </span>
              )}
            </button>
          </div>

          {/* Right: Resources & User */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wide">Funds</div>
                <div className="text-sm font-semibold text-primary tabular-nums">${resources.toLocaleString()}</div>
              </div>
              
              {hq && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-friendly/10 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-friendly animate-pulse" />
                  <span className="text-[9px] font-medium text-friendly">HQ Online</span>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-white/10" />

            {/* User */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-primary uppercase">
                    {user.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  title={user?.email || 'Sign out'}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDiplomacy && <DiplomacyPanel onClose={() => setShowDiplomacy(false)} />}
      {showFinance && <FinancePanel onClose={() => setShowFinance(false)} />}
      {showStocks && <StockMarketPanel onClose={() => setShowStocks(false)} />}
    </>
  );
}
