// Jest tests for the recipe API. These tests exercise the API handler
// directly via supertest without starting an external server. They ensure
// that the API responds correctly to valid and invalid requests.

import request from "supertest";
import { handler } from "../netlify/functions/api.js";

describe("Recipe API", () => {
  it("should return 400 when ingredients are missing", async () => {
    const res = await request(handler).get("/api/recipes");
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/provide at least one ingredient/i);
  });

  it(
    "should return an array of recipes for a common ingredient",
    async () => {
      const res = await request(handler).get(
        "/api/recipes?ingredients=chicken"
      );
      // TheMealDB may occasionally return no results, but we handle both scenarios
      expect([200, 404]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty("results");
        expect(Array.isArray(res.body.results)).toBe(true);
      }
    },
    20000
  );
});