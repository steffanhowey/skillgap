"use client";

import OptionList from "./OptionList";
import {
  FUNCTION_OPTIONS,
  type ProfessionalFunction,
} from "@/lib/onboarding/types";

interface FunctionStepProps {
  activeIndex?: number;
  selected?: ProfessionalFunction | null;
  onChoose?: (index: number) => void;
  /** Immediate commit for the existing migration modal. */
  onSelect?: (
    primary: ProfessionalFunction,
    secondaries: ProfessionalFunction[],
  ) => void;
}

export default function FunctionStep({
  activeIndex,
  selected,
  onChoose,
  onSelect,
}: FunctionStepProps) {
  return (
    <OptionList
      options={FUNCTION_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      activeIndex={activeIndex ?? -1}
      selected={selected ? [selected] : []}
      onChoose={(index) => {
        onChoose?.(index);
        const value = FUNCTION_OPTIONS[index]?.value;
        if (value && onSelect) onSelect(value, []);
      }}
    />
  );
}
