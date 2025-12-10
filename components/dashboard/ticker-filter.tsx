"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TickerFilterProps {
  tickers: string[];
  selectedTicker: string | null;
  onTickerChange: (ticker: string | null) => void;
}

export function TickerFilter({ tickers, selectedTicker, onTickerChange }: TickerFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">Filter by Ticker:</span>
      
      <Button
        variant={selectedTicker === null ? "default" : "outline"}
        size="sm"
        onClick={() => onTickerChange(null)}
        className="h-8"
      >
        All Tickers
      </Button>
      
      {tickers.map((ticker) => (
        <Button
          key={ticker}
          variant={selectedTicker === ticker ? "default" : "outline"}
          size="sm"
          onClick={() => onTickerChange(ticker)}
          className="h-8"
        >
          {ticker}
          {selectedTicker === ticker && (
            <X className="ml-1 h-3 w-3" onClick={(e) => {
              e.stopPropagation();
              onTickerChange(null);
            }} />
          )}
        </Button>
      ))}
      
      {selectedTicker && (
        <Badge variant="secondary" className="ml-2">
          Showing: {selectedTicker}
        </Badge>
      )}
    </div>
  );
}
