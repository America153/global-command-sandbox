import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Handshake, 
  Swords, 
  Flag, 
  TrendingUp,
  Shield,
  DollarSign,
  Users,
  X
} from 'lucide-react';
import type { NationRelation, DiplomaticStatus } from '@/engine/diplomacy';
import { acceptPeace, canRequestPeace } from '@/engine/diplomacy';

interface DiplomacyPanelProps {
  onClose: () => void;
}

interface Alliance {
  id: string;
  name: string;
  members: string[];
  tradeBonus: number;
  defenseBonus: number;
}

// Mock alliances - in a full implementation, these would be stored in state
const AVAILABLE_ALLIANCES: Alliance[] = [
  { id: 'nato', name: 'NATO Coalition', members: ['USA', 'UK', 'France', 'Germany'], tradeBonus: 20, defenseBonus: 30 },
  { id: 'eastern', name: 'Eastern Bloc', members: ['Russia', 'China', 'Belarus'], tradeBonus: 15, defenseBonus: 25 },
  { id: 'neutral', name: 'Non-Aligned Movement', members: ['India', 'Brazil', 'South Africa'], tradeBonus: 25, defenseBonus: 10 },
];

const STATUS_CONFIG: Record<DiplomaticStatus, { color: string; icon: typeof Handshake; label: string }> = {
  peace: { color: 'bg-green-600', icon: Handshake, label: 'Peace' },
  tense: { color: 'bg-yellow-600', icon: Flag, label: 'Tense' },
  hostile: { color: 'bg-orange-600', icon: Swords, label: 'Hostile' },
  war: { color: 'bg-red-600', icon: Swords, label: 'At War' },
  allied: { color: 'bg-blue-600', icon: Shield, label: 'Allied' },
};

export default function DiplomacyPanel({ onClose }: DiplomacyPanelProps) {
  const { diplomacy, resources, capturedCountryIds, addResources, addLog } = useGameStore();
  const [selectedAlliance, setSelectedAlliance] = useState<string | null>(null);
  const [playerAlliance, setPlayerAlliance] = useState<string | null>(null);
  
  const relations = Object.values(diplomacy.relations);
  const atWar = relations.filter(r => r.status === 'war').length;
  const hostile = relations.filter(r => r.status === 'hostile').length;
  const allied = relations.filter(r => r.status === 'allied').length;

  const handleRequestPeace = (nationId: string) => {
    const relation = diplomacy.relations[nationId];
    if (relation && canRequestPeace(relation)) {
      addLog('intel', `Peace offer sent to ${relation.nationName}`);
    }
  };

  const handleJoinAlliance = (allianceId: string) => {
    const alliance = AVAILABLE_ALLIANCES.find(a => a.id === allianceId);
    if (alliance) {
      setPlayerAlliance(allianceId);
      addLog('intel', `Joined ${alliance.name}! Trade +${alliance.tradeBonus}%, Defense +${alliance.defenseBonus}%`);
    }
  };

  const handleLeaveAlliance = () => {
    if (playerAlliance) {
      const alliance = AVAILABLE_ALLIANCES.find(a => a.id === playerAlliance);
      addLog('intel', `Left ${alliance?.name}`);
      setPlayerAlliance(null);
    }
  };

  const handleTrade = (amount: number) => {
    const bonus = playerAlliance 
      ? AVAILABLE_ALLIANCES.find(a => a.id === playerAlliance)?.tradeBonus || 0 
      : 0;
    const actualAmount = Math.floor(amount * (1 + bonus / 100));
    addResources(actualAmount);
    addLog('production', `Trade agreement: +${actualAmount} resources (${bonus}% alliance bonus)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-[800px] max-h-[80vh] tactical-panel border-primary/30">
        <CardHeader className="border-b border-border flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Handshake className="w-6 h-6 text-primary" />
            <CardTitle className="font-tactical text-xl">DIPLOMACY & TRADE</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="relations" className="w-full">
            <TabsList className="w-full rounded-none border-b border-border bg-muted/50">
              <TabsTrigger value="relations" className="flex-1 gap-2">
                <Flag className="w-4 h-4" />
                Relations ({relations.length})
              </TabsTrigger>
              <TabsTrigger value="alliances" className="flex-1 gap-2">
                <Shield className="w-4 h-4" />
                Alliances
              </TabsTrigger>
              <TabsTrigger value="trade" className="flex-1 gap-2">
                <TrendingUp className="w-4 h-4" />
                Trade
              </TabsTrigger>
            </TabsList>

            {/* RELATIONS TAB */}
            <TabsContent value="relations" className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-red-900/30 border border-red-800/50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{atWar}</div>
                  <div className="text-xs text-muted-foreground uppercase">At War</div>
                </div>
                <div className="bg-orange-900/30 border border-orange-800/50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">{hostile}</div>
                  <div className="text-xs text-muted-foreground uppercase">Hostile</div>
                </div>
                <div className="bg-blue-900/30 border border-blue-800/50 rounded p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{allied}</div>
                  <div className="text-xs text-muted-foreground uppercase">Allied</div>
                </div>
              </div>

              <ScrollArea className="h-[300px]">
                {relations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No diplomatic relations established yet.
                    <br />
                    <span className="text-sm">Enter foreign territory to establish contact.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {relations.map((relation) => {
                      const config = STATUS_CONFIG[relation.status];
                      const Icon = config.icon;
                      
                      return (
                        <div 
                          key={relation.nationId}
                          className="flex items-center justify-between p-3 bg-card/50 border border-border rounded"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded flex items-center justify-center ${config.color}`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{relation.nationName}</div>
                              <div className="text-xs text-muted-foreground">
                                Opinion: {relation.opinion > 0 ? '+' : ''}{relation.opinion}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${config.color} text-white border-0`}>
                              {config.label}
                            </Badge>
                            
                            {relation.status === 'war' && (
                              <div className="flex items-center gap-2">
                                <div className="text-xs">
                                  War Score: {relation.warScore}%
                                </div>
                                {canRequestPeace(relation) && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleRequestPeace(relation.nationId)}
                                  >
                                    Request Peace
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ALLIANCES TAB */}
            <TabsContent value="alliances" className="p-4">
              {playerAlliance && (
                <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary" />
                      <div>
                        <div className="font-medium">
                          Current Alliance: {AVAILABLE_ALLIANCES.find(a => a.id === playerAlliance)?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Trade +{AVAILABLE_ALLIANCES.find(a => a.id === playerAlliance)?.tradeBonus}% | 
                          Defense +{AVAILABLE_ALLIANCES.find(a => a.id === playerAlliance)?.defenseBonus}%
                        </div>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleLeaveAlliance}>
                      Leave Alliance
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                {AVAILABLE_ALLIANCES.map((alliance) => (
                  <div 
                    key={alliance.id}
                    className={`p-4 border rounded transition-all cursor-pointer ${
                      playerAlliance === alliance.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-card/50 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedAlliance(alliance.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {alliance.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Members: {alliance.members.join(', ')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-400">+{alliance.tradeBonus}%</div>
                          <div className="text-xs text-muted-foreground">Trade</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-400">+{alliance.defenseBonus}%</div>
                          <div className="text-xs text-muted-foreground">Defense</div>
                        </div>
                        
                        {playerAlliance !== alliance.id && (
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinAlliance(alliance.id);
                            }}
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TRADE TAB */}
            <TabsContent value="trade" className="p-4">
              <div className="mb-4 p-4 bg-accent/10 border border-accent/30 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-accent" />
                    <div>
                      <div className="font-medium">Current Resources</div>
                      <div className="text-2xl font-bold text-accent">
                        {resources.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Captured Territories</div>
                    <div className="text-xl font-bold">{capturedCountryIds.length}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 uppercase tracking-wide text-muted-foreground">
                  Trade Agreements
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col"
                    onClick={() => handleTrade(500)}
                  >
                    <TrendingUp className="w-5 h-5 mb-1" />
                    <span>Small Trade Deal</span>
                    <span className="text-xs text-muted-foreground">+500 Resources</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col"
                    onClick={() => handleTrade(2000)}
                  >
                    <TrendingUp className="w-5 h-5 mb-1" />
                    <span>Major Trade Deal</span>
                    <span className="text-xs text-muted-foreground">+2,000 Resources</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col"
                    onClick={() => handleTrade(5000)}
                  >
                    <Users className="w-5 h-5 mb-1" />
                    <span>Economic Partnership</span>
                    <span className="text-xs text-muted-foreground">+5,000 Resources</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col"
                    onClick={() => handleTrade(10000)}
                  >
                    <Handshake className="w-5 h-5 mb-1" />
                    <span>Strategic Alliance Trade</span>
                    <span className="text-xs text-muted-foreground">+10,000 Resources</span>
                  </Button>
                </div>
              </div>

              {playerAlliance && (
                <div className="p-3 bg-green-900/20 border border-green-800/50 rounded text-center">
                  <div className="text-sm text-green-400">
                    Alliance Trade Bonus Active: +{AVAILABLE_ALLIANCES.find(a => a.id === playerAlliance)?.tradeBonus}%
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2 uppercase tracking-wide text-muted-foreground">
                  Territory Income
                </h3>
                <div className="text-sm text-muted-foreground">
                  Each captured territory generates passive income based on its economic power.
                  More powerful nations generate more resources per tick.
                </div>
                {capturedCountryIds.length > 0 && (
                  <div className="mt-2 p-2 bg-muted/50 rounded">
                    <div className="text-xs">
                      Generating income from {capturedCountryIds.length} territories
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}