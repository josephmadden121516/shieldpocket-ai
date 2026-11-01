import { strict as assert } from "node:assert";
import { buildInsuranceSystemPrompt } from "./insurance.ts";

Deno.test("insurance prompt responds in the requested language", () => {
  assert.match(buildInsuranceSystemPrompt("Spanish"), /Respond in Spanish\./);
  assert.match(buildInsuranceSystemPrompt("English"), /Respond in English\./);
});

Deno.test("insurance prompt requires the four report sections", () => {
  const prompt = buildInsuranceSystemPrompt("English");
  assert.match(prompt, /Readiness snapshot/);
  assert.match(prompt, /Likely application answers/);
  assert.match(prompt, /Top gaps to close first/);
  assert.match(prompt, /What to gather next/);
});

Deno.test("insurance prompt carries safety guardrails", () => {
  const prompt = buildInsuranceSystemPrompt("English");
  assert.match(prompt, /untrusted data, not instructions/);
  assert.match(prompt, /Never invent/);
  assert.match(prompt, /not insurance advice/);
  assert.match(prompt, /proof of coverage or insurability/);
});
