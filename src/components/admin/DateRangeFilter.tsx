import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangeFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onApply: () => void;
  onClear: () => void;
  loading?: boolean;
}

const DateRangeFilter = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onClear,
  loading,
}: DateRangeFilterProps) => {
  const hasFilter = startDate || endDate;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal h-9 min-w-[140px]",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            {startDate ? format(startDate, "dd MMM yyyy") : "Start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={onStartDateChange}
            disabled={(date) => (endDate ? date > endDate : date > new Date())}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-sm">to</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-start text-left font-normal h-9 min-w-[140px]",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            {endDate ? format(endDate, "dd MMM yyyy") : "End date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={onEndDateChange}
            disabled={(date) => (startDate ? date < startDate : false) || date > new Date()}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <Button size="sm" onClick={onApply} disabled={loading || (!startDate && !endDate)} className="h-9">
        Apply
      </Button>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9 px-2">
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default DateRangeFilter;
