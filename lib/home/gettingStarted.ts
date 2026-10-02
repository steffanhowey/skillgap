export interface GettingStartedInput {
  onboardingCompleted: boolean;
  practiceCount: number;
  triedAtWork: boolean;
}

export interface GettingStartedRow {
  label: string;
  done: boolean;
}

/**
 * The three first-session rows. The card hides once every row is done.
 */
export function gettingStarted(input: GettingStartedInput): GettingStartedRow[] {
  return [
    { label: "Answer three questions", done: input.onboardingCompleted },
    { label: "Finish your first mission", done: input.practiceCount > 0 },
    {
      label: "Try it at work and say how it went",
      done: input.triedAtWork,
    },
  ];
}
