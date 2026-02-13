import { setClick, qs } from "./utils.mjs";
import { APIManager } from "./apiManager.mjs";
import { displayRecipe } from "./recipe.js"
 
// format search terms to pass to getAPI
setClick('.addIngredient', () => {
    const ingredientInput = qs('#ingredient'); 
    const ingredientValue = ingredientInput.value.trim();
    
    // Check if input is not empty
    if (ingredientValue !== '') {
        const newP = document.createElement('p');
        newP.textContent = ingredientValue;
        qs('.myIngredients').appendChild(newP);
        
        // Clear the input field
        ingredientInput.value = '';
        ingredientInput.focus();
    }
});

// compile ingredients into format to submit to spoonify for recipe search
setClick('.submit', () => {
    const ingredients = qs('.myIngredients');
    const searchList = []
    ingredients.querySelectorAll('p').forEach(element => {
        searchList.push(element.textContent);
    });
    const maxMin = qs('input[name=max-or-min]:checked').value;
    // pass list and number input into api call
    const spoonacularAPI = new APIManager;
    try {
        const data = spoonacularAPI.getRecipes(searchList, maxMin);
        // display response as recipe cards
        displayRecipe(data);
    } catch (e) {
        console.error(e);
    }
});