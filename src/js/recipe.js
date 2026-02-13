import { qs } from "./utils.mjs";

// format recipe from json object as a recipe card
function recipeCardTemplate(recipe) {
    const template = `<div class='card' id='${recipe.id}'>
        <img src="${recipe.image}" alt="${recipe.title}">
        <h2>${recipe.title}</h2>
        <p>Missing ingredients: ${recipe.missedIngredientCount}</p>
        <ul>
            ${recipe.missedIngredients.map(el => `<li>${el.name}</li>`).join('')}
        </ul>
        <button class="addToMealPlan">add to meal plan</button>
        <button class="saveToCookBook">save to cookbook</button>
    </div>`
    return template;
}

// select element then insert cardTemplate object
// this function will be called when a search is submitted
export function displayRecipe(jsonList) {
    const element = qs('.recipeCards');
    let cardGrid;
    
    // check if cardGrid div exists, if not, create it.
    if (!qs('.cardGrid')) {
        cardGrid = document.createElement('div');
        cardGrid.setAttribute('class', 'cardGrid');
        element.appendChild(cardGrid); 
    } else {
        cardGrid = qs('.cardGrid');
    }
    
    // map cardTemplates to grid and join into single string
    const recipeRes = jsonList.map(recipe => recipeCardTemplate(recipe)).join('');
    
    // Insert the joined HTML string
    cardGrid.insertAdjacentHTML('beforeend', recipeRes);
}
