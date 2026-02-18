// convert response from API to JSON
async function convertToJson(res) {
    const jsonResponse = await res.json();
    if (res.ok) {
        return jsonResponse;
    } else {
        throw { name: 'servicesError', message: jsonResponse };
    }
}

// API manager class - handles api calls
export class APIManager {
    constructor() {
        this.baseURL = '/.netlify/functions/spoonacular';
    }

    //make API calls via netlify function

    async getRecipes(listIngredients, ranking) {
        const ingredientList = listIngredients.join(',+');
        const params = new URLSearchParams({
            ingredients: ingredientList,
            ranking: ranking,
            number: 20,
        });
        const res = await fetch(`${this.baseURL}?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        return convertToJson(res);
    }

    // Get full recipe information by ID
    async getRecipeInformation(recipeId, options = {}) {
        const {
            includeNutrition = false,
            addWinePairing = false,
            addTasteData = false
        } = options;

        const params = new URLSearchParams({
            type: 'information',
            recipeId: recipeId.toString(),
            includeNutrition: includeNutrition.toString(),
            addWinePairing: addWinePairing.toString(),
            addTasteData: addTasteData.toString(),
        });

        const res = await fetch(`${this.baseURL}?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        return convertToJson(res);
    }
}