"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface SafeNumberInputProps extends React.ComponentProps<typeof Input> {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  defaultValue?: number;
}

export function SafeNumberInput({
  value,
  onValueChange,
  min,
  max,
  defaultValue = 0,
  ...props
}: SafeNumberInputProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    let val = parseInt(localValue);
    
    if (isNaN(val)) {
      val = defaultValue;
    }

    if (min !== undefined && val < min) val = min;
    if (max !== undefined && val > max) val = max;

    setLocalValue(val.toString());
    onValueChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      {...props}
      type="number" // Still keep type number for mobile keyboard
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
