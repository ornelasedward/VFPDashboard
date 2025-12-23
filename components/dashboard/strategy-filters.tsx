"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X, Check } from "lucide-react";

export interface StrategyFilters {
  maxDrawdown: number;
  minPnl: number;
  maxPnl: number;
  minWinRate: number;
  minProfitFactor: number;
  minTrades: number;
  ticker: string | null;
  timeframe: string | null;
  vmId: string | null;
}

interface StrategyFiltersProps {
  filters: StrategyFilters;
  onFiltersChange: (filters: StrategyFilters) => void;
  availableTickers: string[];
  availableTimeframes: string[];
  availableVmIds: string[];
}

const DEFAULT_FILTERS: StrategyFilters = {
  maxDrawdown: 100,
  minPnl: -100,
  maxPnl: 1000000,
  minWinRate: 0,
  minProfitFactor: 0,
  minTrades: 0,
  ticker: null,
  timeframe: null,
  vmId: null,
};

export function StrategyFiltersComponent({ filters, onFiltersChange, availableTickers, availableTimeframes, availableVmIds }: StrategyFiltersProps) {
  // Local state for editing
  const [localFilters, setLocalFilters] = useState<StrategyFilters>(filters);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when parent filters change
  useEffect(() => {
    setLocalFilters(filters);
    setHasChanges(false);
  }, [filters]);

  // Check if local filters differ from applied filters
  useEffect(() => {
    const changed = 
      localFilters.maxDrawdown !== filters.maxDrawdown ||
      localFilters.minPnl !== filters.minPnl ||
      localFilters.maxPnl !== filters.maxPnl ||
      localFilters.minWinRate !== filters.minWinRate ||
      localFilters.minProfitFactor !== filters.minProfitFactor ||
      localFilters.minTrades !== filters.minTrades ||
      localFilters.ticker !== filters.ticker ||
      localFilters.timeframe !== filters.timeframe ||
      localFilters.vmId !== filters.vmId;
    setHasChanges(changed);
  }, [localFilters, filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  const isFiltered = 
    filters.maxDrawdown !== 100 ||
    filters.minPnl !== -100 ||
    filters.maxPnl !== 1000000 ||
    filters.minWinRate !== 0 ||
    filters.minProfitFactor !== 0 ||
    filters.minTrades !== 0 ||
    filters.ticker !== null ||
    filters.timeframe !== null ||
    filters.vmId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {hasChanges && <span className="text-xs text-orange-600">• Changes not applied</span>}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="default" size="sm" onClick={handleApply}>
              <Check className="h-4 w-4 mr-1" />
              Apply
            </Button>
          )}
          {isFiltered && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          {/* Ticker Filter */}
          <div className="space-y-2">
            <Label htmlFor="ticker-filter">Ticker</Label>
            <Select
              value={localFilters.ticker || "all"}
              onValueChange={(value) => 
                setLocalFilters({ ...localFilters, ticker: value === "all" ? null : value })
              }
            >
              <SelectTrigger id="ticker-filter">
                <SelectValue placeholder="All Tickers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickers</SelectItem>
                {availableTickers.map((ticker) => (
                  <SelectItem key={ticker} value={ticker}>
                    {ticker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe Filter */}
          <div className="space-y-2">
            <Label htmlFor="timeframe-filter">Timeframe</Label>
            <Select
              value={localFilters.timeframe || "all"}
              onValueChange={(value) => 
                setLocalFilters({ ...localFilters, timeframe: value === "all" ? null : value })
              }
            >
              <SelectTrigger id="timeframe-filter">
                <SelectValue placeholder="All Timeframes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeframes</SelectItem>
                {availableTimeframes.map((tf) => (
                  <SelectItem key={tf} value={tf}>
                    {tf.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VM ID Filter */}
          <div className="space-y-2">
            <Label htmlFor="vmid-filter">VM ID</Label>
            <Select
              value={localFilters.vmId || "all"}
              onValueChange={(value) => 
                setLocalFilters({ ...localFilters, vmId: value === "all" ? null : value })
              }
            >
              <SelectTrigger id="vmid-filter">
                <SelectValue placeholder="All VMs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All VMs</SelectItem>
                {availableVmIds.map((vmId) => (
                  <SelectItem key={vmId} value={vmId}>
                    {vmId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max Drawdown Filter */}
          <div className="space-y-2">
            <Label htmlFor="max-drawdown">Max Drawdown (%)</Label>
            <Input
              id="max-drawdown"
              type="number"
              min="0"
              max="100"
              step="5"
              value={localFilters.maxDrawdown === 0 ? "" : localFilters.maxDrawdown}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                setLocalFilters({ ...localFilters, maxDrawdown: isNaN(val) ? 0 : val });
              }}
              onBlur={(e) => {
                if (e.target.value === "" || parseFloat(e.target.value) === 0) {
                  setLocalFilters({ ...localFilters, maxDrawdown: 100 });
                }
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Show strategies ≤ {localFilters.maxDrawdown}%
            </p>
          </div>

          {/* Min PnL Filter */}
          <div className="space-y-2">
            <Label htmlFor="min-pnl">Min PnL (%)</Label>
            <Input
              id="min-pnl"
              type="number"
              step="10"
              value={localFilters.minPnl === 0 ? "" : localFilters.minPnl}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                setLocalFilters({ ...localFilters, minPnl: isNaN(val) ? 0 : val });
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Show strategies ≥ {localFilters.minPnl}%
            </p>
          </div>

          {/* Max PnL Filter */}
          <div className="space-y-2">
            <Label htmlFor="max-pnl">Max PnL (%)</Label>
            <Input
              id="max-pnl"
              type="number"
              step="100"
              value={localFilters.maxPnl === 0 ? "" : localFilters.maxPnl}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                setLocalFilters({ ...localFilters, maxPnl: isNaN(val) ? 0 : val });
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Show strategies ≤ {localFilters.maxPnl}%
            </p>
          </div>

          {/* Min Win Rate Filter */}
          <div className="space-y-2">
            <Label htmlFor="min-win-rate">Min Win Rate (%)</Label>
            <Input
              id="min-win-rate"
              type="number"
              min="0"
              max="100"
              step="5"
              value={localFilters.minWinRate === 0 ? "" : localFilters.minWinRate}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                setLocalFilters({ ...localFilters, minWinRate: isNaN(val) ? 0 : val });
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Show strategies ≥ {localFilters.minWinRate}%
            </p>
          </div>

          {/* Min Profit Factor Filter */}
          <div className="space-y-2">
            <Label htmlFor="min-profit-factor">Min Profit Factor</Label>
            <Input
              id="min-profit-factor"
              type="number"
              min="0"
              step="0.1"
              value={localFilters.minProfitFactor === 0 ? "" : localFilters.minProfitFactor}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                setLocalFilters({ ...localFilters, minProfitFactor: isNaN(val) ? 0 : val });
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Show strategies ≥ {localFilters.minProfitFactor}
            </p>
          </div>

          {/* Min Trades Filter */}
          <div className="space-y-2">
            <Label htmlFor="min-trades">Min Trades</Label>
            <Input
              id="min-trades"
              type="number"
              min="0"
              step="10"
              value={localFilters.minTrades === 0 ? "" : localFilters.minTrades}
              onChange={(e) => {
                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                setLocalFilters({ ...localFilters, minTrades: isNaN(val) ? 0 : val });
              }}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Show strategies ≥ {localFilters.minTrades} trades
            </p>
          </div>
        </div>
      </div>
  );
}
