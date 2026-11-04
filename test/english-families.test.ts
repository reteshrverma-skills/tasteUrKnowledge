import { describe, expect, it } from "vitest";
import {
  ENGLISH_FAMILY_ORDER,
  OTHER_FAMILY,
  englishFamilyFor,
} from "@/lib/progress-config";

/** Every question type in the bank, spelt as stored, by the family it belongs to. */
const FAMILIES: Record<string, string[]> = {
  "Retrieval & Evidence": ["Direct retrieval", "Retrieval", "evidence", "Evidence"],
  "Inference & Interpretation": [
    "simple inference",
    "subtle inference",
    "Subtle inference",
    "deeper inference",
    "Deeper inference",
    "implicit meaning",
    "Implicit meaning",
    "ambiguity",
    "Ambiguity",
    "multiple interpretations",
    "Multiple interpretations",
  ],
  "Vocabulary & Word Meaning": [
    "basic vocabulary",
    "Vocabulary",
    "Synonym",
    "synonyms",
    "antonyms",
  ],
  "Structure & Sequencing": [
    "structure",
    "Structure",
    "simple sequencing",
    "sequencing",
    "Sequencing",
  ],
  "Author, Language & Character Understanding": [
    "author's purpose",
    "Author’s Purpose",
    "viewpoint",
    "Language effect",
    "language effects",
    "writer's technique",
    "Writer's technique",
    "character feelings",
    "Character feelings",
    "motivation",
    "Motivation",
  ],
  "Reasoning & Relationships": [
    "multi-step reasoning",
    "cause/effect",
    "comparison",
    "Comparison",
  ],
};

describe("English skill families", () => {
  it("lists the six families in order", () => {
    expect(ENGLISH_FAMILY_ORDER).toEqual(Object.keys(FAMILIES));
  });

  for (const [family, types] of Object.entries(FAMILIES)) {
    it.each(types)(`files "%s" under ${family}`, (type) => {
      expect(englishFamilyFor(type)).toBe(family);
    });
  }

  it("still sends an unknown type to Other skills", () => {
    expect(englishFamilyFor("something new")).toBe(OTHER_FAMILY);
  });
});
