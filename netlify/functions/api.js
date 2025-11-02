// Recipe recommender API implemented as a Netlify function.
//
// This endpoint exposes a single route at `/api/recipes` which accepts
// query parameters:
//   - ingredients: a comma‑separated list of available ingredients
//   - diet (optional): a dietary preference such as "vegetarian" or "gluten-free"
//
// It queries the free public API at TheMealDB to retrieve recipes that match
// the first ingredient provided, then fetches details for each match and
// computes a simple match score based on how many of the provided
// ingredients appear in each recipe's ingredient list. If no recipes are
// returned for the initial ingredient, the API falls back to returning a
// random selection of recipes as a human‑friendly default.

import express from "express";
import serverless from "serverless-http";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables from .env when present. This allows the same file
// to be used on Netlify (where env vars are automatically injected) and
// locally without requiring extra configuration.
dotenv.config();

const app = express();

// Enable simple CORS by setting response headers. This allows the local
// frontend (running on a different port) to call this API during
// development. On Netlify, requests originate from the same origin, so CORS
// headers are still harmless.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

const router = express.Router();

/**
 * Helper to fetch meal details from TheMealDB by ID.
 * Returns a parsed meal object or null if the lookup fails.
 *
 * @param {string} idMeal The numeric ID of the meal to look up
 * @returns {Promise<Object|null>}
 */
async function fetchMealDetails(idMeal) {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.meals ? data.meals[0] : null;
}

/**
 * Compute a simple score for a meal based on matching ingredients.
 * The more ingredients from the user input that appear in the meal's
 * ingredient list, the higher the score.
 *
 * @param {Object} meal The meal object returned from TheMealDB
 * @param {string[]} ingList List of user‑provided ingredients (lowercased)
 * @returns {number}
 */
function computeMatchScore(meal, ingList) {
  const mealIngredients = [];
  for (let i = 1; i <= 20; i++) {
    const key = `strIngredient${i}`;
    const value = meal[key];
    if (value) {
      mealIngredients.push(String(value).toLowerCase());
    }
  }
  let score = 0;
  ingList.forEach((q) => {
    if (mealIngredients.some((mi) => mi.includes(q) || q.includes(mi))) {
      score++;
    }
  });
  return score;
}

// Main route: GET /recipes
router.get("/recipes", async (req, res) => {
  try {
    const { ingredients = "", diet = "" } = req.query;
    // Normalize and split the comma‑separated ingredients into an array
    const ingList = ingredients
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (ingList.length === 0) {
      return res.status(400).json({
        error: "Please provide at least one ingredient using ?ingredients=egg,tomato",
      });
    }

    // Use TheMealDB's filter endpoint with the first ingredient.
    // If no meals are returned, we'll fall back to a random query later.
    const first = encodeURIComponent(ingList[0]);
    const filterUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${first}`;
    const filterResp = await fetch(filterUrl);
    const filterData = await filterResp.json();

    let meals = filterData.meals;
    let notice = "";

    // If no meals were found for the given ingredient, fetch a random list
    // of meals to provide the user with something useful. TheMealDB's
    // search endpoint with an empty query returns many meals.
    if (!meals) {
      const randomResp = await fetch(
        "https://www.themealdb.com/api/json/v1/1/search.php?s="
      );
      const randomData = await randomResp.json();
      meals = randomData.meals.slice(0, 8);
      notice =
        "No exact matches found. Showing random recipes instead. Try another ingredient for more accurate results.";
    }

    // Fetch details for the top 8 meals. Fetching only a handful keeps the
    // response time reasonable, and eight recipes is sufficient for a small UI.
    const detailPromises = meals.slice(0, 8).map((m) => fetchMealDetails(m.idMeal));
    const detailedMeals = (await Promise.all(detailPromises)).filter(Boolean);

    // Build the final results array including a match score and basic fields
    const results = detailedMeals.map((meal) => {
      const score = computeMatchScore(meal, ingList);
      return {
        id: meal.idMeal,
        name: meal.strMeal,
        category: meal.strCategory,
        area: meal.strArea,
        thumbnail: meal.strMealThumb,
        instructions: meal.strInstructions,
        ingredients: Array.from({ length: 20 })
          .map((_, i) => meal[`strIngredient${i + 1}`])
          .filter(Boolean),
        score,
      };
    });

    return res.json({ queryIngredients: ingList, notice, results });
  } catch (error) {
    console.error("Error in /recipes", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Mount the router at two paths. When running locally via `npm start`
// Express listens on port 8888 and exposes `/api/recipes`. When deployed
// through Netlify, the function is served from `/.netlify/functions/api` and
// Netlify will rewrite `/api/*` requests to this function. Including both
// mount points ensures the API works in both environments.
app.use("/.netlify/functions/api", router);
app.use("/api", router);

// Export the handler so Netlify can wrap the Express app in Lambda runtime
export const handler = serverless(app);

// When executed directly via `node netlify/functions/api.js`, start a local
// development server. This branch is skipped when the file is executed in
// Netlify's Lambda environment. NODE_ENV will be set by Netlify to
// 'production' in that case.
if (
  process.env.NODE_ENV !== "production" &&
  import.meta.url.endsWith("/api.js")
) {
  const PORT = process.env.PORT || 8888;
  app.listen(PORT, () => {
    console.log(
      `✅ API running locally on http://localhost:${PORT}/api/recipes`
    );
  });
}