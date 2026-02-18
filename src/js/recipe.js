// Simplified recipe management for search results and cookbook
import { qs } from "./utils.mjs";
import { APIManager } from "./apiManager.mjs";
import { authManager } from './auth.mjs';

const apiManager = new APIManager();

// Cache to store recipe details by ID (safer than passing through HTML attributes)
const recipesCache = new Map();

// Create simple recipe card for search results
function createRecipeCard(recipe) {
    return `
        <div class="recipe-card" data-recipe-id="${recipe.id}">
            <img src="${recipe.image}" alt="${recipe.title}">
            <h3>${recipe.title}</h3>
            <p class="missing-count">Missing: ${recipe.missedIngredientCount} ingredient${recipe.missedIngredientCount !== 1 ? 's' : ''}</p>
            <div class="recipe-card-actions">
                <button class="btn-small add-to-meal-plan">Add to Meal Plan</button>
                <button class="btn-small save-recipe">Save to CookBook</button>
            </div>
        </div>
    `;
}

// Display search results as recipe cards
export function displayRecipe(recipes) {
    const resultsContainer = qs('#recipeResults');
    if (!resultsContainer) return;

    // Clear or create grid
    let grid = qs('.recipe-grid');
    if (!grid) {
        grid = document.createElement('div');
        grid.className = 'recipe-grid';
        resultsContainer.appendChild(grid);
    } else {
        grid.innerHTML = '';
    }

    // Add cards
    const html = recipes.map(recipe => createRecipeCard(recipe)).join('');
    grid.innerHTML = html;

    // Attach event listeners
    attachRecipeCardListeners();
}

// Attach listeners to recipe cards
function attachRecipeCardListeners() {
    // Click card to open modal
    document.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            if (!e.target.closest('button')) {
                const recipeId = card.dataset.recipeId;
                showRecipeModal(recipeId);
            }
        });

        // Save recipe button
        card.querySelector('.save-recipe')?.addEventListener('click', (e) => {
            e.stopPropagation();
            saveRecipe(card.dataset.recipeId, e.target);
        });

        // Add to meal plan button
        card.querySelector('.add-to-meal-plan')?.addEventListener('click', (e) => {
            e.stopPropagation();
            addToMealPlan(card.dataset.recipeId);
        });
    });
}

// Show recipe details in modal
// Can accept either a recipeId (string) or full recipe object
export async function showRecipeModal(recipeIdOrObject) {
    try {
        let details;
        let isFromCookbook = false;
        let recipeId;

        // Check if we received a full recipe object or just an ID
        if (typeof recipeIdOrObject === 'object' && recipeIdOrObject !== null) {
            // Full recipe object from cookbook
            details = recipeIdOrObject;
            isFromCookbook = true;
            recipeId = recipeIdOrObject.recipeId || recipeIdOrObject.id;
            console.log('ShowRecipeModal: Received cookbook recipe object:', details);
        } else {
            // Just a recipe ID, fetch from API
            recipeId = recipeIdOrObject;
            console.log('ShowRecipeModal: Fetching recipe from API with ID:', recipeId);
            details = await apiManager.getRecipeInformation(recipeId, {
                includeNutrition: false
            });
            console.log('ShowRecipeModal: Fetched recipe details:', details);
        }

        // Build ingredients display
        const ingredientsHTML = buildIngredientsHTML(details);

        // Build instructions display
        const instructionsHTML = buildInstructionsHTML(details);

        // Build dietary/health tags
        const tagsHTML = buildDietaryTagsHTML(details);

        // Create modal HTML with rich content
        const modalHTML = `
            <div id="recipe-modal" class="modal-overlay">
                <div class="modal-content recipe-modal">
                    <button class="close-btn" onclick="document.getElementById('recipe-modal').remove();">&times;</button>
                    
                    <div class="recipe-modal-header">
                        <img src="${details.image}" alt="${details.title}" class="recipe-modal-image">
                        <div class="recipe-modal-info">
                            <h2>${details.title}</h2>
                            <p>⏱️ ${details.readyInMinutes || 'N/A'} minutes | 🍽️ ${details.servings || 1} serving${details.servings !== 1 ? 's' : ''}</p>
                            ${tagsHTML}
                        </div>
                    </div>

                    <div class="recipe-modal-body">
                        <div class="recipe-section">
                            <h3>Ingredients</h3>
                            <ul class="ingredients-list">
                                ${ingredientsHTML}
                            </ul>
                        </div>

                        <div class="recipe-section">
                            <h3>Instructions</h3>
                            ${instructionsHTML}
                        </div>
                    </div>

                    <div class="recipe-modal-actions">
                        ${!isFromCookbook ? `<button class="btn save-recipe-modal" data-recipe-id="${recipeId}">📖 Save to Cookbook</button>` : ''}
                        <button class="btn add-to-meal-modal" data-recipe-id="${recipeId}">📅 Add to Meal Plan</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Store recipe details in cache for safe access
        recipesCache.set(recipeId.toString(), details);

        // Attach modal button listeners
        const modal = qs('#recipe-modal');
        modal.querySelector('.save-recipe-modal')?.addEventListener('click', (e) => {
            saveRecipe(e.target.dataset.recipeId, e.target);
        });

        modal.querySelector('.add-to-meal-modal')?.addEventListener('click', (e) => {
            const recipeId = e.target.dataset.recipeId;
            const recipeData = recipesCache.get(recipeId.toString());
            if (recipeData) {
                addToMealPlan(recipeData);
            } else {
                showMessage('Recipe data not found', 'error');
            }
        });

        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

    } catch (error) {
        console.error('Error fetching recipe details:', error);
        showMessage('Failed to load recipe details', 'error');
    }
}

// Build ingredients list HTML
function buildIngredientsHTML(details) {
    // Handle API ingredients (extendedIngredients) or cookbook ingredients (ingredients array with strings)
    if (details.extendedIngredients && Array.isArray(details.extendedIngredients)) {
        return details.extendedIngredients
            .map(ing => `<li>${ing.original}</li>`)
            .join('') || '<li>No ingredients available</li>';
    } else if (details.ingredients && Array.isArray(details.ingredients)) {
        // Cookbook stores ingredients as strings
        return details.ingredients
            .map(ing => `<li>${ing}</li>`)
            .join('') || '<li>No ingredients available</li>';
    }
    return '<li>No ingredients available</li>';
}

// Build instructions HTML
function buildInstructionsHTML(details) {
    // Handle API instructions (analyzedInstructions) or cookbook instructions (string or array)
    if (details.analyzedInstructions && Array.isArray(details.analyzedInstructions) && details.analyzedInstructions.length > 0) {
        const steps = details.analyzedInstructions[0].steps || [];
        return `<ol class="instructions-list">${steps.map(step => `<li>${step.step}</li>`).join('')}</ol>`;
    } else if (typeof details.instructions === 'string' && details.instructions) {
        return `<p class="instructions-text">${details.instructions}</p>`;
    } else if (Array.isArray(details.instructions) && details.instructions.length > 0) {
        // Fallback if instructions is an array
        return `<ol class="instructions-list">${details.instructions.map(step => `<li>${step}</li>`).join('')}</ol>`;
    }
    return '<p>No instructions available</p>';
}

// Build dietary/health tags HTML
function buildDietaryTagsHTML(details) {
    const tags = [];
    
    if (details.vegetarian) tags.push('🥬 Vegetarian');
    if (details.vegan) tags.push('🌱 Vegan');
    if (details.glutenFree) tags.push('🌾 Gluten-Free');
    if (details.dairyFree) tags.push('🥛 Dairy-Free');
    if (details.ketogenic) tags.push('🥓 Keto');
    if (details.healthy) tags.push('💚 Healthy');
    
    if (tags.length === 0) return '';
    
    return `<div class="recipe-tags-modal">${tags.join(' ')}</div>`;
}


// Save recipe to cookbook
async function saveRecipe(recipeId, button = null) {
    if (!authManager.isAuthenticated()) {
        if (confirm('You need to sign in to save recipes. Go to account page?')) {
            window.location.href = '/account/';
        }
        return;
    }

    try {
        // Show loading state
        if (button) {
            button.disabled = true;
            button.textContent = 'Saving...';
        }

        // Fetch full recipe data
        const recipe = await apiManager.getRecipeInformation(recipeId);

        // Format for storage
        const cookbookRecipe = {
            recipeId: recipe.id,
            title: recipe.title,
            image: recipe.image,
            servings: recipe.servings,
            readyInMinutes: recipe.readyInMinutes,
            ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
            instructions: buildInstructionsHTML(recipe)
        };

        // Save to auth system (already generates ID and timestamp)
        authManager.addToCookbook(cookbookRecipe);

        showMessage(`✅ "${recipe.title}" saved to cookbook!`, 'success');

        // Update button state
        if (button) {
            button.textContent = '✅ Saved';
            button.disabled = true;
        }

    } catch (error) {
        console.error('Error saving recipe:', error);
        showMessage('Failed to save recipe', 'error');
        
        // Reset button
        if (button) {
            button.disabled = false;
            button.textContent = '📖 Save';
        }
    }
}

// Add recipe to meal plan staging area
async function addToMealPlan(recipeData) {
    try {
        console.log('addToMealPlan called with:', recipeData);
        
        // If recipeData is just a string ID, fetch the full recipe
        if (typeof recipeData === 'string') {
            const recipeId = recipeData;
            console.log('Recipe data is a string ID, fetching from API...');
            recipeData = await apiManager.getRecipeInformation(recipeId, { includeNutrition: false });
            console.log('Fetched recipe data:', recipeData);
        }
        
        if (!recipeData || !recipeData.id || !recipeData.title) {
            showMessage('Invalid recipe data', 'error');
            return;
        }
        
        // Get existing pending recipes from sessionStorage
        let pendingRecipes = JSON.parse(sessionStorage.getItem('pendingMealRecipes') || '[]');
        
        // Check if recipe is already in pending list
        const alreadyPending = pendingRecipes.some(r => r.id === recipeData.id);
        if (alreadyPending) {
            showMessage('Recipe already queued for meal plan', 'info');
            return;
        }
        
        // Add recipe to pending list
        const recipeToAdd = {
            id: recipeData.id,
            title: recipeData.title,
            image: recipeData.image || null,
            readyInMinutes: recipeData.readyInMinutes || 0,
            servings: recipeData.servings || 1,
            recipeId: recipeData.recipeId || recipeData.id
        };
        
        pendingRecipes.push(recipeToAdd);
        
        // Store in sessionStorage (temporary for this session)
        sessionStorage.setItem('pendingMealRecipes', JSON.stringify(pendingRecipes));
        
        console.log('Recipe added to pending. Current pending:', pendingRecipes);
        
        showMessage(`✅ "${recipeData.title}" queued for meal plan! Go to the Meal Planner to add it.`, 'success');
        
        // Close the modal after adding
        const modal = qs('#recipe-modal');
        if (modal) {
            modal.remove();
        }
        
    } catch (error) {
        console.error('Error adding to meal plan:', error);
        showMessage('Failed to queue recipe for meal plan', 'error');
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    let container = qs('#message-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'message-container';
        container.className = 'message-container';
        document.body.insertBefore(container, document.body.firstChild);
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `
        <span>${message}</span>
        <button class="message-close">&times;</button>
    `;

    container.innerHTML = '';
    container.appendChild(msgDiv);
    container.classList.remove('hidden');

    msgDiv.querySelector('.message-close')?.addEventListener('click', () => {
        container.classList.add('hidden');
    });

    setTimeout(() => container.classList.add('hidden'), 3000);
}

export { displayRecipe };