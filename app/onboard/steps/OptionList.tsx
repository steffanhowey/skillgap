"use client";

import { Card } from "@/components/ui/Card";

export interface OnboardOption {
  value: string;
  label: string;
}

interface OptionListProps {
  options: OnboardOption[];
  activeIndex: number;
  selected: string[];
  onChoose: (index: number) => void;
}

/**
 * Full-width option cards for one onboarding question.
 * The parent owns arrow-key focus and Enter.
 */
export default function OptionList({
  options,
  activeIndex,
  selected,
  onChoose,
}: OptionListProps) {
  return (
    <div className="mt-8 flex flex-col gap-3" role="listbox">
      {options.map((option, index) => {
        const isSelected = selected.includes(option.value);
        const isActive = index === activeIndex;
        return (
          <Card
            key={option.value}
            role="option"
            aria-selected={isSelected}
            className="cursor-pointer"
            style={{
              borderColor: isSelected
                ? "var(--sg-forest-500)"
                : isActive
                  ? "var(--sg-shell-500)"
                  : undefined,
              background: isSelected ? "var(--sg-shell-50)" : "var(--sg-white)",
            }}
            onClick={() => onChoose(index)}
          >
            <span className="flex items-center justify-between gap-4 px-5 py-4 text-left">
              <span
                className="text-sm text-[var(--sg-shell-900)]"
                style={{ fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}
              >
                {option.label}
              </span>
              <span className="text-xs text-[var(--sg-shell-400)]">{index + 1}</span>
            </span>
          </Card>
        );
      })}
    </div>
  );
}
