"use client";

import OptionList from "./OptionList";
import { FOCUS_OPTIONS, type FocusArea } from "@/lib/onboarding/types";

interface FocusStepProps {
  activeIndex: number;
  selected: FocusArea[];
  onChoose: (index: number) => void;
}

export default function FocusStep({
  activeIndex,
  selected,
  onChoose,
}: FocusStepProps) {
  return (
    <OptionList
      options={FOCUS_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      activeIndex={activeIndex}
      selected={selected}
      onChoose={onChoose}
    />
  );
}
