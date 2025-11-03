import express from 'express';
import serverless from 'serverless-http';
import fetch from 'node-fetch';

const app    = express();
const router = express.Router();
router.get('/recipes', async (req, res) => {
  const ingredients = req.query.ingredients || '';
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
  const first = encodeURIComponent(ingList[0]);
  const filterUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${first}`;
  try {
    const filterResp = await fetch(filterUrl);
    const filterData = await filterResp.json();
    let meals    = filterData.meals;
    let notice   = '';
    if (!meals) {
      const randResp = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
      const randData = await randResp.json();
      meals  = randData.meals.slice(0, 8);
      notice = 'No exact matches found. Showing random recipes instead.';
    }
    // The frontend expects an object with a `meals` array
    res.json({ meals, notice });
  } catch (err) {
    console.error('Error in /recipes', err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.use('/api', router);
export const handler = serverless(app);
