// Jest tests for the frontend markup. These tests use jsdom to parse the
// HTML file and verify that key elements exist. They do not run any
// network code, focusing only on the DOM structure.

import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";

const html = fs.readFileSync(
  path.resolve(__dirname, "../frontend/index.html"),
  "utf8"
);

describe("Frontend UI", () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM(html);
    document = dom.window.document;
  });

  test("should have an input for ingredients", () => {
    const input = document.querySelector("#ingredients");
    expect(input).not.toBeNull();
  });

  test("should have a button to search", () => {
    const button = document.querySelector("#searchBtn");
    expect(button.textContent).toMatch(/find recipes/i);
  });
});