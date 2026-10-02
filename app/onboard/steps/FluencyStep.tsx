"use client";

import OptionList from "./OptionList";
import { FLUENCY_OPTIONS, type FluencyLevel } from "@/lib/onboarding/types";

interface FluencyStepProps {
  activeIndex?: number;
  selected?: FluencyLevel | null;
  onChoose?: (index: number) => void;
  /** Immediate commit for the existing migration modal. */
  onSelect?: (level: FluencyLevel, notSure?: boolean) => void;
}

export default function FluencyStep({
  activeIndex,
  selected,
  onChoose,
  onSelect,
}: FluencyStepProps) {
  return (
    <OptionList
      options={FLUENCY_OPTIONS.map((option) => ({
        value: option.value,
        label: option.anchor,
      }))}
      activeIndex={activeIndex ?? -1}
      selected={selected ? [selected] : []}
      onChoose={(index) => {
        onChoose?.(index);
        const value = FLUENCY_OPTIONS[index]?.value;
        if (value && onSelect) onSelect(value);
      }}
    />
  );
}
