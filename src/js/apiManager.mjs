// API keys - Using environment variables 
const spoonacularAPI = import.meta.env.VITE_SPOONACULAR_API_KEY;

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
        this.spoonacularAPIKey = spoonacularAPI;
        this.spoonacularBaseURL = 'https://api.spoonacular.com/recipes/';
    }

    //make API calls

    async getRecipes(listIngredients, ranking) {
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': spoonacularAPI,
            }
        };
        const ingredientList = listIngredients.join(',+');
        const params = new URLSearchParams({
            ingredients: ingredientList,
            ranking: ranking,
            number: 20
        });
        return await fetch(`${this.spoonacularBaseURL}findByIngredients?` + params, options).then(convertToJson); // this is API call #1
    }

    // Get full recipe information by ID
    async getRecipeInformation(recipeId, options = {}) {
        const {
            includeNutrition = false,
            addWinePairing = false,
            addTasteData = false
        } = options;

        const params = new URLSearchParams({
            includeNutrition: includeNutrition.toString(),
            addWinePairing: addWinePairing.toString(),
            addTasteData: addTasteData.toString()
        });

        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': spoonacularAPI,
            }
        };

        const url = `${this.spoonacularBaseURL}${recipeId}/information?${params}`; // this is API call #2 as this is a separate end point and requires different params
        return await fetch(url, requestOptions).then(convertToJson);
    }
}