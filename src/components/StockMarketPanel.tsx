import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

interface StockMarketPanelProps {
  onClose: () => void;
}

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  price: number;
  previousPrice: number;
  volatility: number; // 0-1, how much it can change per tick
  sector: 'defense' | 'tech' | 'energy' | 'finance';
}

const INITIAL_STOCKS: Stock[] = [
  { id: 'lmt', name: 'Lockheed Martin', symbol: 'LMT', price: 450, previousPrice: 450, volatility: 0.03, sector: 'defense' },
  { id: 'rtn', name: 'Raytheon Tech', symbol: 'RTN', price: 320, previousPrice: 320, volatility: 0.04, sector: 'defense' },
  { id: 'ba', name: 'Boeing', symbol: 'BA', price: 180, previousPrice: 180, volatility: 0.05, sector: 'defense' },
  { id: 'nvda', name: 'NVIDIA', symbol: 'NVDA', price: 890, previousPrice: 890, volatility: 0.06, sector: 'tech' },
  { id: 'msft', name: 'Microsoft', symbol: 'MSFT', price: 420, previousPrice: 420, volatility: 0.025, sector: 'tech' },
  { id: 'xom', name: 'ExxonMobil', symbol: 'XOM', price: 110, previousPrice: 110, volatility: 0.035, sector: 'energy' },
  { id: 'cvx', name: 'Chevron', symbol: 'CVX', price: 155, previousPrice: 155, volatility: 0.03, sector: 'energy' },
  { id: 'jpm', name: 'JPMorgan Chase', symbol: 'JPM', price: 195, previousPrice: 195, volatility: 0.025, sector: 'finance' },
];

export default function StockMarketPanel({ onClose }: StockMarketPanelProps) {
  const { resources, stocks, portfolio, buyStock, sellStock, updateStockPrices } = useGameStore();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  // Update stock prices periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateStockPrices();
    }, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [updateStockPrices]);

  const filteredStocks = selectedSector 
    ? stocks.filter(s => s.sector === selectedSector)
    : stocks;

  const getTotalPortfolioValue = () => {
    return Object.entries(portfolio).reduce((total, [stockId, shares]) => {
      const stock = stocks.find(s => s.id === stockId);
      return total + (stock ? stock.price * (shares as number) : 0);
    }, 0);
  };

  const getChangePercent = (stock: Stock) => {
    if (stock.previousPrice === 0) return 0;
    return ((stock.price - stock.previousPrice) / stock.previousPrice) * 100;
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'defense': return 'text-red-400';
      case 'tech': return 'text-blue-400';
      case 'energy': return 'text-yellow-400';
      case 'finance': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-lg font-bold">STOCK MARKET</h2>
              <p className="text-xs text-muted-foreground">Invest to grow your wealth</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Portfolio Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Cash Balance</div>
              <div className="text-2xl font-bold text-primary font-mono">
                ${resources.toLocaleString()}
              </div>
            </div>
            <div className="bg-friendly/10 border border-friendly/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Portfolio Value</div>
              <div className="text-2xl font-bold text-friendly font-mono">
                ${getTotalPortfolioValue().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Sector Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedSector === null ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedSector(null)}
            >
              All
            </Button>
            {['defense', 'tech', 'energy', 'finance'].map(sector => (
              <Button
                key={sector}
                variant={selectedSector === sector ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSector(sector)}
                className="capitalize"
              >
                {sector}
              </Button>
            ))}
          </div>

          {/* Stock List */}
          <div className="space-y-2">
            {filteredStocks.map(stock => {
              const change = getChangePercent(stock);
              const isUp = change >= 0;
              const owned = portfolio[stock.id] || 0;
              
              return (
                <div 
                  key={stock.id}
                  className="bg-muted/30 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono">{stock.symbol}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${getSectorColor(stock.sector)} bg-muted`}>
                        {stock.sector}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">{stock.name}</div>
                    {owned > 0 && (
                      <div className="text-xs text-friendly mt-1">
                        Owned: {owned} shares (${(owned * stock.price).toLocaleString()})
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold font-mono">${stock.price.toFixed(2)}</div>
                      <div className={`flex items-center gap-1 text-sm ${isUp ? 'text-friendly' : 'text-destructive'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => buyStock(stock.id, 1)}
                        disabled={resources < stock.price}
                      >
                        Buy 1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => buyStock(stock.id, 10)}
                        disabled={resources < stock.price * 10}
                      >
                        Buy 10
                      </Button>
                      {owned > 0 && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => sellStock(stock.id, 1)}
                          >
                            Sell 1
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => sellStock(stock.id, owned)}
                          >
                            Sell All
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Holdings Summary */}
          {Object.keys(portfolio).length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Your Holdings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(portfolio).map(([stockId, shares]) => {
                  const sharesNum = shares as number;
                  if (sharesNum === 0) return null;
                  const stock = stocks.find(s => s.id === stockId);
                  if (!stock) return null;
                  return (
                    <div key={stockId} className="bg-background/50 rounded p-2">
                      <div className="font-mono font-bold">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">{sharesNum} shares</div>
                      <div className="text-sm text-friendly">${(sharesNum * stock.price).toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { INITIAL_STOCKS };
