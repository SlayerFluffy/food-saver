exports.handler = async function (event) {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Missing API key" }),
    };
  }

  const {
    type,
    ingredients,
    ranking,
    number,
    recipeId,
    includeNutrition,
    addWinePairing,
    addTasteData,
  } = event.queryStringParameters || {};

  let url;

  if (type === "findByIngredients") {
    // API call #1
    const params = new URLSearchParams({
      ingredients,
      ranking: ranking ?? "1",
      number: number ?? "20",
      apiKey: apiKey,
    });
    url = `https://api.spoonacular.com/recipes/findByIngredients?${params.toString()}`;
  } else if (type === "information" && recipeId) {
    // API call #2
    const params = new URLSearchParams({
      includeNutrition: (includeNutrition ?? "false").toString(),
      addWinePairing: (addWinePairing ?? "false").toString(),
      addTasteData: (addTasteData ?? "false").toString(),
      apiKey: apiKey,
    });
    url = `https://api.spoonacular.com/recipes/${recipeId}/information?${params.toString()}`;
  } else {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Invalid parameters" }),
    };
  }

  const res = await fetch(url, {
    method: "GET",
  });

  const data = await res.json();

  return {
    statusCode: res.ok ? 200 : res.status,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
};
