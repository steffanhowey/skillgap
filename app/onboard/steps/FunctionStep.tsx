"use client";

import OptionList from "./OptionList";
import {
  MARKETING_ROLE_OPTIONS,
  primaryFunctionForRole,
  type MarketingRole,
  type ProfessionalFunction,
} from "@/lib/onboarding/types";

interface FunctionStepProps {
  activeIndex?: number;
  selected?: MarketingRole | null;
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
      options={MARKETING_ROLE_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      activeIndex={activeIndex ?? -1}
      selected={selected ? [selected] : []}
      onChoose={(index) => {
        onChoose?.(index);
        const role = MARKETING_ROLE_OPTIONS[index]?.value;
        const primary = role ? primaryFunctionForRole(role) : null;
        if (primary && onSelect) onSelect(primary, []);
      }}
    />
  );
}
