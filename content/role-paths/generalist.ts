import type { RolePathSeed } from "./types.ts";

/**
 * AI-native marketer, small team.
 * Draft copy, Oct 2. The seeder refuses this file until every TODO is gone:
 *   - tested_on (all four): the date Steffan did the mission himself, in the named tool.
 *   - watch.content_id on missions 2 and 3: nothing in the content lake fits. See the note on each.
 * Clips on missions 1 and 4 come from the lake, cut to chapters the creators published in their descriptions.
 * Every Do step happens in the learner's own tools, on public material or work their company already
 * allows in that tool. SkillGap never asks for or receives company information.
 */
export const generalistRolePath: RolePathSeed = {
  slug: "generalist",
  title: "AI-native marketer, small team",
  role_function: "generalist",
  missions: [
    {
      title: "Turn one recording into a week of posts",
      why: "Every small team has recorded talks nobody reuses, and this is the quickest place AI pays off.",
      level: "exploring",
      minutes: 45,
      practices: "Turned one recording into a week of LinkedIn posts with ChatGPT.",
      skill_tags: ["content-repurposing", "context-setting"],
      tested_on: "TODO",
      watch: {
        // Jeff Su, "Master the Perfect ChatGPT Prompt Formula": chapters Context (2:07), Exemplars, Persona (ends 5:18).
        content_id: "ce249edd-b2c1-4fbf-b6c5-72431167f80c",
        start_seconds: 127,
        end_seconds: 318,
        what_to_look_for:
          "Watch the Context and Persona parts. Notice what he tells the model about the situation and who it's speaking as, and how much better the answer gets.",
      },
      do: {
        tool: "ChatGPT",
        deliverable: "Five LinkedIn posts from one recording you already have, one for each weekday.",
        steps: [
          "Pick one recording your team already made and can share: a webinar, a podcast episode or a talk. Export its transcript.",
          "Paste it into ChatGPT. Before you ask for anything, say who is posting and who is reading.",
          "Ask for five posts with one idea each, each opening with a specific number, name or claim from the recording.",
          "Read each first line on its own. Rewrite any that wouldn't make you click \"…see more.\"",
        ],
        done_when:
          "Five posts, each built on a different idea from the recording, each with a first line that stands on its own.",
      },
      check: {
        questions: [
          {
            prompt: "Your first draft reads like it could come from any company. What do you add first?",
            choices: [
              "Who is posting and who is reading",
              "A longer word count",
              "More hashtags",
              "\"Make it better\"",
            ],
            correct: "Who is posting and who is reading",
            why: "Without an audience, the model writes for the most generic reader it can imagine.",
          },
          {
            prompt: "LinkedIn cuts a post off after about three lines. Where does the strongest line go?",
            choices: ["First", "In the middle", "Last, as the payoff"],
            correct: "First",
            why: "Nobody clicks \"…see more\" to find the good part.",
          },
          {
            prompt: "Two of your five posts make the same point. What do you ask for?",
            choices: [
              "One idea per post, each from a different part of the recording",
              "Longer posts",
              "Four posts instead of five",
            ],
            correct: "One idea per post, each from a different part of the recording",
            why: "A recording holds more than one idea, so the model has to be told to spread them out.",
          },
        ],
      },
      reflect: { prompt: "Which post would you actually publish, and what did you change in it?" },
    },
    {
      title: "Build a sourced brief on a competitor",
      why: "AI saves you the most time on research, and that's also where it makes things up most confidently.",
      level: "exploring",
      minutes: 50,
      practices:
        "Built a one-page competitor brief from public sources with Perplexity and checked every claim against its source.",
      skill_tags: ["ai-research", "source-checking"],
      tested_on: "TODO",
      watch: {
        // Nothing in the lake shows an AI research answer being checked against its sources.
        // Stopgap: GitHub, "Prompt engineering essentials", chapter "Understanding hallucinations" (1:53–2:25,
        // id 33f3c7bf-a75f-42df-b9ec-6263956758fb), but that's only 32 seconds. Better: add a 3–6 minute clip
        // of someone checking a Perplexity or ChatGPT answer against its sources.
        content_id: "TODO",
        what_to_look_for:
          "Watch for the moment a tool cites a source that doesn't say what the answer claims. Notice how the presenter catches it.",
      },
      do: {
        tool: "Perplexity",
        deliverable: "A one-page brief on one competitor, built only from public sources, with every claim linked.",
        steps: [
          "Pick one competitor or one company in your space that you keep an eye on.",
          "In Perplexity, ask for their positioning, their pricing, what they launched this year and what customers say about them. Ask for a source on every claim.",
          "Open at least three of the cited sources. Mark any claim the source doesn't actually support.",
          "Put what held up on one page: what they say, what they charge, what changed this year, what customers complain about.",
        ],
        done_when:
          "Every line on the page links to a source you opened yourself. Anything you couldn't confirm is cut or marked.",
      },
      check: {
        questions: [
          {
            prompt: "An answer gives you a price and cites a source. What do you do before you use it?",
            choices: [
              "Open the source and find the number",
              "Use it; it's cited",
              "Ask the tool if it's sure",
            ],
            correct: "Open the source and find the number",
            why: "A citation tells you where the tool looked. It doesn't mean the source says that.",
          },
          {
            prompt: "Two tools give you different numbers for the same thing. What's most likely?",
            choices: [
              "They're quoting different dates or editions of a source",
              "One of the tools is broken",
              "Both numbers are right",
            ],
            correct: "They're quoting different dates or editions of a source",
            why: "Check the date on a source before you trust its number.",
          },
        ],
      },
      reflect: { prompt: "Which claim surprised you, and did it hold up when you checked it?" },
    },
    {
      title: "Find the words your buyers actually use",
      why: "Your best copy is already in your buyers' reviews, and AI can sort hundreds of them while you choose the words.",
      level: "practicing",
      minutes: 55,
      practices: "Pulled ten buyer phrases from public reviews with Claude, word for word, with sources.",
      skill_tags: ["voice-of-customer", "ai-research"],
      tested_on: "TODO",
      watch: {
        // Nothing in the lake covers mining reviews or forums for customer language. Add a clip that shows it.
        content_id: "TODO",
        what_to_look_for:
          "Notice that the presenter asks for exact quotes, not summaries, and keeps where each quote came from.",
      },
      do: {
        tool: "Claude",
        deliverable:
          "Ten phrases your buyers use, each word for word, each with where it came from, grouped by the problem it describes.",
        steps: [
          "Collect 30 to 50 public reviews or forum posts about your category: G2, Capterra, Reddit, app store reviews, or a competitor's reviews.",
          "Paste them into Claude. Ask it to group them by the problem each writer describes, quoting their exact words. No paraphrasing.",
          "Check five quotes against the originals. Remove any the model reworded.",
          "Pick the ten phrases you'd use in a headline, a subject line or an ad. Note where each one came from.",
        ],
        done_when: "Ten phrases, each word for word from a real public review or post, each with its source.",
      },
      check: {
        questions: [
          {
            prompt: "The summary says customers want \"a seamless experience.\" What went wrong?",
            choices: [
              "It paraphrased instead of quoting",
              "Nothing; that's a useful insight",
              "It needed more reviews",
            ],
            correct: "It paraphrased instead of quoting",
            why: "Buyers don't say \"seamless.\" What you're after is their own words.",
          },
          {
            prompt: "How do you know a quote is real?",
            choices: [
              "You find it in the original review",
              "You ask the model to confirm it",
              "It sounds like something a customer would say",
            ],
            correct: "You find it in the original review",
            why: "Only the original can confirm a quote. The model can't vouch for itself.",
          },
        ],
      },
      reflect: { prompt: "Which phrase will you use first, and where will it go?" },
    },
    {
      title: "Set up a project for a job you do every week",
      why: "If you explain the same task to AI every week, a saved project turns that chore into a two-minute start.",
      level: "practicing",
      minutes: 60,
      practices: "Set up a ChatGPT project for a weekly task and tuned it on a real week.",
      skill_tags: ["ai-workflows", "custom-assistants"],
      tested_on: "TODO",
      watch: {
        // Futurepedia, "21 Hacks 99% ChatGPT Users Don't Know": chapter Projects (2:21–5:41).
        content_id: "4cd5cd40-7988-4cb5-989b-b808796ecb41",
        start_seconds: 141,
        end_seconds: 341,
        what_to_look_for:
          "Watch how a project keeps its instructions and files from one chat to the next, so you stop explaining the same job every week.",
      },
      do: {
        tool: "ChatGPT",
        deliverable:
          "A ChatGPT project that does one weekly task, tested on this week's real input.",
        steps: [
          "Pick one task you do every week: the newsletter, the weekly report, social posts from the blog, or event follow-ups. Use only what your company already allows in ChatGPT.",
          "Create a project in ChatGPT. In its instructions, write who the output is for, what good looks like and what to avoid. Add two past examples you were happy with as files.",
          "Run it on this week's input. Note everything you had to fix.",
          "Put those fixes into the instructions and run it again.",
        ],
        done_when:
          "The second run needs fewer fixes than the first, and the project is saved where you'll find it next week.",
      },
      check: {
        questions: [
          {
            prompt: "The first run is close but the tone is off. What's the best fix?",
            choices: [
              "Add a past example it should match",
              "Start a new chat and type everything again",
              "Tell it to sound more like you",
            ],
            correct: "Add a past example it should match",
            why: "An example carries tone better than any adjective you can write.",
          },
          {
            prompt: "What belongs in the saved instructions?",
            choices: [
              "Who it's for, what good looks like and what to avoid",
              "This week's numbers and names",
              "A request to try its best",
            ],
            correct: "Who it's for, what good looks like and what to avoid",
            why: "The instructions hold whatever stays true every week. This week's details go in the message.",
          },
        ],
      },
      reflect: { prompt: "How much time did the second run save you, and what will you change next week?" },
    },
  ],
};
