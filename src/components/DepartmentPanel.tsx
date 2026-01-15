import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, DollarSign, Users, Shield } from 'lucide-react';
import { useDepartmentStore } from '@/store/departmentStore';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { DepartmentId, Department } from '@/types/departments';
import { ALL_DEPARTMENT_IDS } from '@/data/departments';

interface DepartmentPanelProps {
  onClose: () => void;
}

const TrendIcon = ({ trend }: { trend: 'improving' | 'declining' | 'stable' }) => {
  if (trend === 'improving') return <TrendingUp className="w-3 h-3 text-green-400" />;
  if (trend === 'declining') return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
};

const DepartmentCard = ({ dept, isSelected, onClick }: { 
  dept: Department; 
  isSelected: boolean;
  onClick: () => void;
}) => {
  const fundingRatio = (dept.currentBudget / dept.baselineBudget * 100).toFixed(0);
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg border text-left transition-all ${
        isSelected 
          ? 'border-primary bg-primary/10' 
          : 'border-border/50 bg-card/50 hover:bg-card/80'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{dept.abbreviation}</span>
        <Badge variant={dept.isInCrisisMode ? 'destructive' : 'secondary'} className="text-xs">
          {fundingRatio}%
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground truncate">{dept.name}</div>
      <Progress value={dept.crisisReadiness} className="h-1 mt-2" />
    </button>
  );
};

export default function DepartmentPanel({ onClose }: DepartmentPanelProps) {
  const [selectedDept, setSelectedDept] = useState<DepartmentId>('defense');
  const { 
    departments, 
    nationalMetrics, 
    currentYear, 
    activeSynergies,
    activeCrises,
    setDepartmentBudget,
    adjustPolicyLever,
    advanceYear,
    getTotalDiscretionary,
    getTotalMandatory,
    getBudgetDeficit
  } = useDepartmentStore();

  const dept = departments[selectedDept];
  const deficit = getBudgetDeficit();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl w-[95vw] max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">Executive Departments</h2>
            <Badge variant="outline">FY {currentYear}</Badge>
            {activeCrises.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {activeCrises.length} Active Crisis
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Budget: </span>
              <span className={deficit > 0 ? 'text-red-400' : 'text-green-400'}>
                ${(getTotalDiscretionary() + getTotalMandatory()).toFixed(0)}B
              </span>
            </div>
            <Button size="sm" onClick={advanceYear}>Advance Year</Button>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Department List */}
          <ScrollArea className="w-48 border-r border-border/30 p-2">
            <div className="space-y-2">
              {ALL_DEPARTMENT_IDS.map((id) => (
                <DepartmentCard
                  key={id}
                  dept={departments[id]}
                  isSelected={id === selectedDept}
                  onClick={() => setSelectedDept(id)}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4 w-fit">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="policy">Policy</TabsTrigger>
                <TabsTrigger value="synergies">Synergies</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 p-4">
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                      <div className="p-4 rounded-xl bg-accent/30 border border-border/30">
                        <h3 className="font-semibold text-lg mb-1">{dept.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{dept.mission}</p>
                        <p className="text-xs text-muted-foreground">{dept.description}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Shield className="w-3 h-3" /> Crisis Readiness
                          </div>
                          <div className="text-2xl font-bold">{dept.crisisReadiness.toFixed(0)}%</div>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Users className="w-3 h-3" /> Public Approval
                          </div>
                          <div className="text-2xl font-bold">{dept.publicApproval.toFixed(0)}%</div>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Zap className="w-3 h-3" /> Research
                          </div>
                          <div className="text-2xl font-bold">{dept.researchProgress.toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Performance Metrics</h4>
                      {dept.performanceMetrics.map((metric) => (
                        <div key={metric.id} className="p-2 rounded-lg bg-card/50 border border-border/20">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{metric.name}</span>
                            <TrendIcon trend={metric.trend} />
                          </div>
                          <Progress value={metric.value} className="h-1.5" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {metric.value.toFixed(0)} / {metric.target}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="budget" className="mt-0 space-y-4">
                  <div className="p-4 rounded-xl bg-accent/30 border border-border/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Discretionary Budget</h4>
                        <p className="text-xs text-muted-foreground">Baseline: ${dept.baselineBudget}B</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${dept.currentBudget.toFixed(1)}B</div>
                        <div className={`text-xs ${dept.currentBudget > dept.baselineBudget ? 'text-green-400' : dept.currentBudget < dept.baselineBudget ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {((dept.currentBudget / dept.baselineBudget - 1) * 100).toFixed(0)}% from baseline
                        </div>
                      </div>
                    </div>
                    <Slider
                      value={[dept.currentBudget]}
                      min={dept.baselineBudget * 0.5}
                      max={dept.baselineBudget * 1.5}
                      step={1}
                      onValueChange={([v]) => setDepartmentBudget(selectedDept, v)}
                    />
                  </div>

                  {dept.mandatoryPrograms.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Mandatory Programs
                      </h4>
                      {dept.mandatoryPrograms.map((program) => (
                        <div key={program.id} className="p-3 rounded-lg bg-card/50 border border-border/20 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">{program.name}</div>
                            <div className="text-xs text-muted-foreground">{program.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">${program.annualCost.toFixed(0)}B</div>
                            <div className="text-xs text-amber-400">+{program.growthRate}%/yr</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="policy" className="mt-0 space-y-4">
                  {dept.policyLevers.map((lever) => (
                    <div key={lever.id} className="p-4 rounded-xl bg-card/50 border border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-sm">{lever.name}</h4>
                          <p className="text-xs text-muted-foreground">{lever.description}</p>
                        </div>
                        <Badge variant="outline">{lever.value}%</Badge>
                      </div>
                      <Slider
                        value={[lever.value]}
                        min={lever.minValue}
                        max={lever.maxValue}
                        step={5}
                        onValueChange={([v]) => adjustPolicyLever(selectedDept, lever.id, v)}
                      />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="synergies" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {dept.synergies.map((synergy) => {
                      const partner = departments[synergy.partnerId];
                      const deptFunding = dept.currentBudget / dept.baselineBudget * 100;
                      const partnerFunding = partner.currentBudget / partner.baselineBudget * 100;
                      const isActive = deptFunding >= synergy.requiredFundingThreshold && 
                                       partnerFunding >= synergy.requiredFundingThreshold;
                      
                      return (
                        <div 
                          key={synergy.partnerId} 
                          className={`p-4 rounded-xl border ${isActive ? 'bg-green-500/10 border-green-500/30' : 'bg-card/50 border-border/30'}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-muted-foreground'}`} />
                            <span className="font-medium text-sm">{synergy.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{synergy.description}</p>
                          <div className="text-xs mb-2">
                            Partner: <span className="font-medium">{partner.abbreviation}</span> ({partnerFunding.toFixed(0)}% funded)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Requires: {synergy.requiredFundingThreshold}% funding each • Bonus: +{((synergy.bonusMultiplier - 1) * 100).toFixed(0)}%
                          </div>
                          {isActive && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {synergy.unlockedBenefits.map((b) => (
                                <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Right sidebar - National metrics */}
          <div className="w-56 border-l border-border/30 p-4 space-y-4">
            <h4 className="font-semibold text-sm">National Metrics</h4>
            <div className="space-y-3">
              {[
                { label: 'Stability', value: nationalMetrics.nationalStability },
                { label: 'Approval', value: nationalMetrics.publicApproval },
                { label: 'Military', value: nationalMetrics.militaryStrength },
                { label: 'Diplomacy', value: nationalMetrics.diplomaticInfluence },
                { label: 'Technology', value: nationalMetrics.technologicalAdvancement },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span>{value.toFixed(0)}</span>
                  </div>
                  <Progress value={value} className="h-1.5" />
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-border/30 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">National Debt</span>
                <span className="text-red-400">${(nationalMetrics.nationalDebt / 1000).toFixed(1)}T</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Debt/GDP</span>
                <span>{nationalMetrics.debtToGDP.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Growth</span>
                <span className="text-green-400">{nationalMetrics.economicGrowth.toFixed(1)}%</span>
              </div>
            </div>

            {activeSynergies.length > 0 && (
              <div className="pt-4 border-t border-border/30">
                <h4 className="font-semibold text-xs mb-2 text-green-400">
                  Active Synergies ({activeSynergies.length})
                </h4>
                <div className="space-y-1">
                  {activeSynergies.slice(0, 5).map((s) => (
                    <div key={s} className="text-xs text-muted-foreground">{s}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
