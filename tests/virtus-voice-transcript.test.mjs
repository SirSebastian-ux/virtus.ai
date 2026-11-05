import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpeechText, mergeSpeechCycles, combineRecognitionResults } from "../lib/virtus-voice-transcript.mjs";

test("normalize whitespace", () => {
  assert.equal(normalizeSpeechText("  hello   Virtus  "), "hello Virtus");
});
test("merge unrelated cycles", () => {
  assert.equal(mergeSpeechCycles("Hi Virtus", "how are you"), "Hi Virtus how are you");
});
test("repeated evolving hypotheses replace previous text", () => {
  let text = "";
  for (const result of ["Hi Virtus", "Hi Virtus how", "Hi Virtus how are you",
    "Hi Virtus how are you I think", "Hi Virtus how are you I think your recording is not good"]) {
    text = mergeSpeechCycles(text, result);
  }
  assert.equal(text, "Hi Virtus how are you I think your recording is not good");
});
test("exact user's repeated cumulative microphone fragments collapse", () => {
  let text = "";
  for (const result of [
    "hi Richard", "hi Richard how", "hi Richard how are you",
    "I think", "I think your", "I think your recording",
    "I think your recording is", "I think your recording is not",
    "I think your recording is not very good",
  ]) text = mergeSpeechCycles(text, result);
  assert.equal(text, "hi Richard how are you I think your recording is not very good");
});
test("within an event incremental final and interim results are not duplicated", () => {
  assert.equal(combineRecognitionResults(
    ["I think", "I think your recording"],
    ["I think your recording is not good"]
  ), "I think your recording is not good");
});
test("overlapping restart results only once", () => {
  assert.equal(mergeSpeechCycles("I think your recording", "your recording is not good"),
    "I think your recording is not good");
});
test("intentional repeated single word is preserved", () => {
  assert.equal(mergeSpeechCycles("okay", "okay"), "okay okay");
});
test("non-cumulative distinct sentences remain intact", () => {
  assert.equal(mergeSpeechCycles("I agree with you.", "I agree with you."),
    "I agree with you.");
});
test("empty cases", () => {
  assert.equal(mergeSpeechCycles("", "hello"), "hello");
  assert.equal(mergeSpeechCycles("hello", ""), "hello");
});
