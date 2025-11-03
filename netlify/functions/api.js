import express from "express";
import serverless from "serverless-http";
//import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

const router = express.Router();

async function fetchMealDetails(idMeal) {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.meals ? data.meals[0] : null;
}


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


    const first = encodeURIComponent(ingList[0]);
    const filterUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${first}`;
    const filterResp = await fetch(filterUrl);
    const filterData = await filterResp.json();

    let meals = filterData.meals;
    let notice = "";


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


app.use("/.netlify/functions/api", router);
app.use("/api", router);

// Export the handler so Netlify can wrap the Express app in Lambda runtime
export const handler = serverless(app);


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
