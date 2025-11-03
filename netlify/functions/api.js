const express    = require('express');
const serverless = require('serverless-http');
const app    = express();
const router = express.Router();

router.get('/recipes', async (req, res) => {
  const { ingredients = '', diet = '' } = req.query;
  const ingList = ingredients
    .toLowerCase()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (!ingList.length) {
    return res.status(400).json({
      error: 'Please provide at least one ingredient using ?ingredients=tomato'
    });
  }

  const first    = encodeURIComponent(ingList[0]);
  const filterUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${first}`;

  try {
    const filterResp = await fetch(filterUrl);
    const filterData = await filterResp.json();
    let meals   = filterData.meals;
    let notice  = '';

    if (!meals) {
      const randResp  = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
      const randData  = await randResp.json();
      meals   = randData.meals.slice(0, 8);
      notice  = 'No exact matches found. Showing random recipes instead.';
    }

    // Fetch details for each meal
    const detailPromises = meals.slice(0, 8).map(async (m) => {
      const detailsResp  = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
      const detailsData  = await detailsResp.json();
      return detailsData.meals ? detailsData.meals[0] : null;
    });

    const detailedMeals = (await Promise.all(detailPromises)).filter(Boolean);
    // Compute match scores and assemble result objects
    const results = detailedMeals.map((meal) => {
      const mealIngredients = [];
      for (let i = 1; i <= 20; i++) {
        const key   = `strIngredient${i}`;
        const value = meal[key];
        if (value) mealIngredients.push(value.toLowerCase());
      }
      let score = 0;
      ingList.forEach((q) => {
        if (mealIngredients.some(mi => mi.includes(q) || q.includes(mi))) {
          score++;
        }
      });
      return {
        id: meal.idMeal,
        name: meal.strMeal,
        category: meal.strCategory,
        area: meal.strArea,
        thumbnail: meal.strMealThumb,
        instructions: meal.strInstructions,
        ingredients: mealIngredients,
        score
      };
    });
    // ApplyIING diet filters
    let filtered = results;
    const dietLower = diet.toLowerCase();
    if (dietLower === 'vegetarian') {
      const nonVeg = ['chicken', 'beef', 'pork', 'meat', 'fish', 'shrimp'];
      filtered = filtered.filter(item =>
        !item.ingredients.some(i => nonVeg.some(nv => i.includes(nv)))
      );
    } else if (dietLower === 'gluten-free') {
      const gluten = ['flour', 'bread', 'pasta', 'wheat', 'noodle'];
      filtered = filtered.filter(item =>
        !item.ingredients.some(i => gluten.some(g => i.includes(g)))
      );
    }
    filtered.sort((a, b) => b.score - a.score);

    res.json({ queryIngredients: ingList, notice, results: filtered });
  } catch (err) {
    console.error('Error in /recipes', err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.use('/api', router);
module.exports.handler = serverless(app);
