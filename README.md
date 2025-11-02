# Recipe Recommender App — CSCI 3172 Lab 4

This project is a small web application that recommends recipes based on ingredients you have at home. It satisfies the requirements for the “Recipe Recommender App” option in Lab 4 of CSCI 3172【338598786939636†L32-L40】. The app includes a polished frontend, a Node.js backend running as a Netlify function, basic unit tests, and deployment configuration.

## Features

- **Personalized recipe suggestions:** Enter a list of ingredients (comma‑separated) and optionally choose a dietary preference. The app queries the free [TheMealDB](https://www.themealdb.com/) API and returns recipes scored by ingredient matches.
- **Dietary filtering:** Users can choose “Vegetarian” or “Gluten‑free”. Vegetarian filtering removes recipes containing obvious meat ingredients; gluten filtering is not enforced due to API limitations.
- **Human‑friendly fallback:** If no recipes match the first ingredient, the app returns a set of random recipes with a friendly notice.
- **Accessible UI:** Uses semantic HTML, visible focus outlines, and live regions for feedback messages, addressing the accessibility requirements【338598786939636†L102-L104】.
- **Backend error handling:** Invalid requests return clear error messages. Unexpected failures return a generic “Server error”.
- **Unit tests:** Jest tests verify server behaviour (valid vs. invalid requests) and basic frontend structure as encouraged in the instructions【338598786939636†L81-L99】.
- **Netlify deployment:** The `netlify.toml` file configures a serverless function and proxies `/api/*` requests to the backend【350805263982062†L118-L124】.

## Running Locally

### Prerequisites
- Node.js ≥ 18
- npm

### Installation

1. Clone this repository.
2. From the project root, install dependencies:
   ```bash
   npm install
   ```
3. Run the API locally:
   ```bash
   npm start
   ```
   You should see:
   ```
   ✅ API running locally on http://localhost:8888/api/recipes
   ```
4. In a separate terminal, serve the frontend (using [serve](https://www.npmjs.com/package/serve) or any static server):
   ```bash
   npx serve frontend
   ```
   This will start a static server, typically on <http://localhost:3000>.
5. Visit the URL printed and test the app. When running locally, the client automatically calls the API at `http://localhost:8888` thanks to environment detection in `script.js`.

### Alternative: run without dependencies

If your environment cannot install npm modules (for example, due to network restrictions), you can still run the application using the bundled `server.js`, which relies solely on built‑in Node APIs. This file serves both the API and the static front end from a single process:

```bash
node server.js
```

This starts a server on port 3000. Open <http://localhost:3000> in your browser to use the Recipe Recommender. Because both the API and the web page are served from the same origin, you won’t encounter CORS or “Failed to fetch” issues.

### Running Tests

Run unit tests with:

```bash
npm test
```

The server tests call the Express handler directly via `supertest`, and the frontend tests verify that key UI elements exist using JSDOM.

## Deployment to Netlify

1. Push your code to a Git repository.
2. In Netlify, create a new site from your repository.
3. In the build settings:
   - **Publish directory:** `frontend`
   - **Functions directory:** `netlify/functions`
   - **Build command:** *(leave blank for this static app)*
4. Netlify will automatically detect the `netlify.toml` configuration and deploy both the frontend and the serverless API. Requests to `/api/recipes` will be proxied to the function.

Add your Netlify URL here once deployed. Example: `https://your‑recipe‑recommender.netlify.app/`.

## Limitations & Notes

- **Ingredient matching:** The scoring algorithm counts simple substring matches. It does not handle plurals or synonyms robustly.
- **Dietary filtering:** Vegetarian filtering removes meals containing obvious meat tokens, but relies on heuristics. Gluten‑free filtering is not enforced due to lack of metadata from TheMealDB.
- **API dependency:** The app uses TheMealDB’s free tier and may be subject to rate limits or downtime.
- **Security:** This project does not include user authentication or database storage, per lab requirements【338598786939636†L121-L126】.

## Attribution

This application was created following the Lab 4 instructions for CSCI 3172【338598786939636†L24-L40】. It uses the Express framework, serverless functions on Netlify, and the free TheMealDB API. All external libraries and assets are licensed under their respective licenses.