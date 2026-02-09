import { setClick, qs } from "./utils.mjs";

// format search terms to pass to getAPI
setClick('.addIngredient', () => {
    const ingredientInput = qs('#ingredient'); 
    const ingredientValue = ingredientInput.value.trim();
    
    // Check if input is not empty
    if (ingredientValue !== '') {
        const newP = document.createElement('p');
        newP.textContent = ingredientValue;
        qs('.ingredientInput').appendChild(newP);
        
        // Clear the input field
        ingredientInput.value = '';
        ingredientInput.focus();
    }
});