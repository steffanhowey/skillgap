import Link from "next/link";
import { getAllMarketStates } from "@/lib/intelligence/marketState";

/**
 * Brand colors hardcoded to avoid ThemeProvider character accent overrides.
 * Source of truth: brand/skillgap-homepage-v4.html + figma-code-connect.md
 */
const BRAND = {
  forest900: "#0F2318",
  forest500: "#3A7D53",
  forest400: "#4A9E6A",
  forest300: "#6BBF87",
  cream: "#F7F4EE",
  white: "#FFFFFF",
} as const;

const HOW_IT_WORKS = [
  {
    eyebrow: "Mission",
    title: "Do real work in real tools",
    body: "You get a brief, a prompt, and a finish line. Practice in Claude, ChatGPT, or Cursor — not a simulation.",
  },
  {
    eyebrow: "Work",
    title: "Leave with something you can use",
    body: "Each mission ends in a brief, matrix, or other artifact you can take into a real review. That is the value.",
  },
  {
    eyebrow: "Next",
    title: "Come back for the next mission",
    body: "After you finish, you can share the work, join a room if you want company, or start the next mission.",
  },
] as const;

export default async function LandingPage() {
  let showPulse = false;
  try {
    const states = await getAllMarketStates();
    showPulse = states.length > 0;
  } catch {
    showPulse = false;
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        fontFamily: "var(--font-body), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "var(--sg-shell-700)",
        background: BRAND.white,
      }}
    >
      <header
        className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-8"
        style={{
          height: 56,
          background: "rgba(15, 35, 24, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-1 text-base font-bold no-underline"
          style={{
            fontFamily: "var(--font-body), 'DM Sans', sans-serif",
            color: BRAND.white,
          }}
        >
          SkillGap<span style={{ color: BRAND.forest300 }}>.ai</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium no-underline transition-colors"
            style={{
              color: "rgba(255, 255, 255, 0.45)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold no-underline transition-colors"
            style={{
              padding: "7px 18px",
              background: BRAND.forest500,
              color: BRAND.white,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section
          className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
          style={{
            backgroundColor: BRAND.forest900,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            padding: "80px 32px 60px",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(58,125,83,0.08) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10 mx-auto max-w-[1080px] text-center">
            <div
              className="mb-6 inline-flex items-center gap-2 uppercase"
              style={{
                fontFamily: "var(--font-body), 'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: BRAND.forest300,
              }}
            >
              <span
                className="inline-block rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: BRAND.forest400,
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              AI fluency for professionals
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display), 'Fraunces', Georgia, serif",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 600,
                color: BRAND.white,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                marginBottom: 20,
              }}
            >
              Do one real mission. Leave with work you can use.
            </h1>

            <p
              className="mx-auto"
              style={{
                fontSize: 16,
                color: "rgba(255, 255, 255, 0.4)",
                lineHeight: 1.6,
                maxWidth: 620,
                marginBottom: 60,
              }}
            >
              Practice a marketing brief in Claude or ChatGPT. Finish with an
              artifact you can take into a real review.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center font-semibold no-underline transition-colors"
                style={{
                  padding: "16px 32px",
                  background: BRAND.forest500,
                  color: BRAND.white,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Start my first mission
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center font-semibold no-underline transition-colors"
                style={{
                  padding: "16px 32px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "rgba(255, 255, 255, 0.6)",
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-16 px-6 py-20 sm:px-8 sm:py-24"
          style={{ background: BRAND.cream }}
        >
          <div className="mx-auto max-w-[1080px]">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: BRAND.forest500 }}
            >
              How it works
            </p>
            <h2
              className="mb-12 max-w-xl text-3xl leading-tight sm:text-4xl"
              style={{
                fontFamily: "var(--font-display), 'Fraunces', Georgia, serif",
                color: BRAND.forest900,
                fontWeight: 600,
              }}
            >
              One mission. Real tools. Work you can use.
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((beat, index) => (
                <div
                  key={beat.eyebrow}
                  className="rounded-xl border p-6"
                  style={{
                    background: BRAND.white,
                    borderColor: "rgba(15, 35, 24, 0.08)",
                  }}
                >
                  <p
                    className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: BRAND.forest500 }}
                  >
                    {index + 1}. {beat.eyebrow}
                  </p>
                  <h3
                    className="mb-2 text-xl leading-snug"
                    style={{
                      fontFamily:
                        "var(--font-display), 'Fraunces', Georgia, serif",
                      color: BRAND.forest900,
                      fontWeight: 600,
                    }}
                  >
                    {beat.title}
                  </h3>
                  <p
                    className="text-sm leading-6"
                    style={{ color: "rgba(15, 35, 24, 0.62)" }}
                  >
                    {beat.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        className="px-6 py-6 text-center"
        style={{
          background: BRAND.forest900,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          {showPulse ? (
            <Link
              href="/pulse"
              className="text-sm font-medium no-underline transition-colors hover:text-white"
              style={{ color: BRAND.forest300 }}
            >
              See the AI Skills Pulse
            </Link>
          ) : null}
          <nav className="flex items-center justify-center gap-4 text-sm">
            <Link href="/terms" className="no-underline hover:text-white" style={{ color: BRAND.forest300 }}>
              Terms
            </Link>
            <Link href="/privacy" className="no-underline hover:text-white" style={{ color: BRAND.forest300 }}>
              Privacy
            </Link>
            <Link href="/refund" className="no-underline hover:text-white" style={{ color: BRAND.forest300 }}>
              Refund policy
            </Link>
          </nav>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
