document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("recipeForm");
  const input = document.getElementById("ingredients");
  const results = document.getElementById("results");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ingredient = input.value.trim();
    results.innerHTML = "<p>Loading...</p>";

    try {
      const res = await fetch(`/api/recipes?ingredients=${encodeURIComponent(ingredient)}`);
      const data = await res.json();

      if (!data.meals) {
        results.innerHTML = `<p>No recipes found for "${ingredient}".</p>`;
        return;
      }

      results.innerHTML = data.meals
        .map(
          (m) => `
          <div class="card">
            <img src="${m.strMealThumb}" alt="${m.strMeal}" />
            <h3>${m.strMeal}</h3>
          </div>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
      results.innerHTML = "<p style='color:red'>Error fetching recipes.</p>";
    }
  });
});
