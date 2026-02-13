// API keys - Using environment variables 
const spoonacularAPI = import.meta.env.VITE_SPOONACULAR_API_KEY;
const walmartAPI = import.meta.env.VITE_WALMART_API_KEY;

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
        this.walmartAPIKey = walmartAPI;
        this.spoonacularBaseURL = 'https://api.spoonacular.com/recipes/';
        this.walmartBaseURL = 'https://api.dataextractorpro.com/api/extractor/walmart/search/';
    }

    //make API calls

    async getRecipes(listIngredients, ranking) {
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };
        const ingredientList = listIngredients.join(',+');
        const params = new URLSearchParams({
            ingredients: ingredientList,
            ranking: ranking,
            number: 20
        });
        return await fetch(`${this.spoonacularBaseURL}findByIngredients?apiKey=${spoonacularAPI}&`+ params, options).then(convertToJson);
    }

    async getPrices(listIngredients) {
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.walmartAPIKey,
            },
            body: JSON.stringify(listIngredients),
        };
        return await fetch(`${this.walmartBaseURL}`, options).then(convertToJson);
    }
}