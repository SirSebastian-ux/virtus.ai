import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSpeechText, mergeSpeechCycles } from "../lib/virtus-voice-transcript.mjs";

test("normalize transcript spacing", () => {
  assert.equal(normalizeSpeechText("  Hello   there \n friends  "), "Hello there friends");
});
test("append non-overlapping speech cycles", () => {
  assert.equal(mergeSpeechCycles("I want to", "open the app"), "I want to open the app");
});
test("remove overlap created when mobile recognizer restarts", () => {
  assert.equal(mergeSpeechCycles("I want you to show", "you to show me the app"), "I want you to show me the app");
});
test("remove repeated whole segment", () => {
  assert.equal(mergeSpeechCycles("Tell me the next step", "Tell me the next step"), "Tell me the next step");
});
test("preserve intentional repetition inside an utterance", () => {
  assert.equal(mergeSpeechCycles("okay okay okay", "let us begin"), "okay okay okay let us begin");
});
test("keep single word repetitions across speech cycles", () => {
  assert.equal(mergeSpeechCycles("okay", "okay"), "okay okay");
});
test("handle empty previous or next", () => {
  assert.equal(mergeSpeechCycles("", "Start here"), "Start here");
  assert.equal(mergeSpeechCycles("Start here", ""), "Start here");
});
