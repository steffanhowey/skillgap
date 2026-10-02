import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MessageReviewPrototype } from "./MessageReviewPrototype";

describe("MessageReviewPrototype", () => {
  it("renders the disclosure before any content submission control", () => {
    const html = renderToStaticMarkup(<MessageReviewPrototype />);

    expect(html).toContain("Check every claim before your message ships.");
    expect(html).toContain("sent to OpenAI");
    expect(html).toContain("Human judges see content only with separate consent");
    expect(html.indexOf("How your text is handled")).toBeLessThan(
      html.indexOf("Check what SkillGap understood"),
    );
    expect(html).toContain("Source of truth");
    expect(html).toContain("Message to review");
    expect(html).not.toContain("quality score");
  });
});
