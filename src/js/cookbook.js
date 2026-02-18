// Cookbook page functionality with authentication integration
import { authManager, requireAuth } from "./auth.mjs";
import { qs } from "./utils.mjs";
import { showRecipeModal } from "./recipe.js";

class CookbookManager {
  constructor() {
    // Ensure user is authenticated
    if (!requireAuth()) {
      return;
    }

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadUserCookbook();
    this.updateCookbookDisplay();
  }

  setupEventListeners() {
    // Search/filter functionality
    const searchInput = qs("#cookbook-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) =>
        this.filterCookbook(e.target.value),
      );
    }

    // Sort functionality
    const sortSelect = qs("#cookbook-sort");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) =>
        this.sortCookbook(e.target.value),
      );
    }

    // Category filter
    const categoryFilter = qs("#category-filter");
    if (categoryFilter) {
      categoryFilter.addEventListener("change", (e) =>
        this.filterByCategory(e.target.value),
      );
    }
  }

  loadUserCookbook() {
    const user = authManager.getCurrentUser();
    if (user && user.cookbook) {
      this.cookbookRecipes = [...user.cookbook];
    } else {
      this.cookbookRecipes = [];
    }
  }

  updateCookbookDisplay() {
    const cookbookContainer = qs("#cookbook-recipes");
    const recipeCount = qs("#recipe-count");
    const emptyState = qs("#empty-cookbook");

    if (!cookbookContainer) return;

    // Update count
    if (recipeCount) {
      recipeCount.textContent = this.cookbookRecipes.length;
    }

    // Show/hide empty state
    if (this.cookbookRecipes.length === 0) {
      if (emptyState) emptyState.classList.remove("hidden");
      cookbookContainer.innerHTML = "";
      return;
    } else {
      if (emptyState) emptyState.classList.add("hidden");
    }

    // Render cookbook recipes
    cookbookContainer.innerHTML = this.cookbookRecipes
      .map((recipe) => this.createRecipeCardHTML(recipe))
      .join("");

    // Add event listeners to new elements
    this.attachRecipeEventListeners();
  }

  createRecipeCardHTML(recipe) {
    // Create dietary/diet tags display
    const dietaryTags = [];
    if (recipe.vegetarian) dietaryTags.push("Vegetarian");
    if (recipe.vegan) dietaryTags.push("Vegan");
    if (recipe.glutenFree) dietaryTags.push("Gluten-Free");
    if (recipe.dairyFree) dietaryTags.push("Dairy-Free");
    if (recipe.ketogenic) dietaryTags.push("Keto");

    const tagsDisplay =
      recipe.tags && recipe.tags.length > 0
        ? [...dietaryTags, ...recipe.tags.slice(0, 3)].slice(0, 4).join(", ")
        : dietaryTags.slice(0, 3).join(", ");

    // Health indicators
    const healthIndicators = [];
    if (recipe.veryHealthy) healthIndicators.push("Healthy");
    if (recipe.cheap) healthIndicators.push("Budget-Friendly");
    if (recipe.veryPopular) healthIndicators.push("Popular");
    if (recipe.sustainable) healthIndicators.push("Sustainable");

    return `
            <div class="recipe-card ${recipe.veryHealthy ? "healthy" : ""}" data-recipe-id="${recipe.id}">
                <div class="recipe-image">
                    ${
                      recipe.image
                        ? `<img src="${recipe.image}" alt="${recipe.title}" loading="lazy">`
                        : `<div class="recipe-placeholder">
                            <span class="recipe-icon">🍽️</span>
                        </div>`
                    }
                    ${recipe.healthScore ? `<div class="health-score">${recipe.healthScore}</div>` : ""}
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-time">Ready in: ${recipe.readyInMinutes || "N/A"} min</span>
                        <span class="recipe-servings">Servings: ${recipe.servings || "N/A"} servings</span>
                    </div>
                    
                    ${tagsDisplay ? `<div class="recipe-tags">${tagsDisplay}</div>` : ""}
                    
                    ${healthIndicators.length > 0 ? `<div class="health-indicators">${healthIndicators.slice(0, 2).join(" ")}</div>` : ""}
                    
                    ${recipe.cuisines && recipe.cuisines.length > 0 ? `<div class="recipe-cuisine">Cuisine: ${recipe.cuisines[0]}</div>` : ""}
                    
                    <p class="recipe-added">Added: ${this.formatDate(new Date(recipe.addedDate))}</p>
                    ${
                      recipe.notes
                        ? `<div class="recipe-notes">
                        <strong>Notes:</strong> ${recipe.notes}
                    </div>`
                        : ""
                    }
                    
                    ${recipe.ingredients && recipe.ingredients.length > 0 ? `<div class="recipe-ingredient-count">${recipe.ingredients.length} ingredients</div>` : ""}
                </div>
                <div class="recipe-actions">
                    <button class="btn view-recipe" data-recipe-id="${recipe.id}">View Recipe</button>
                    <button class="btn add-note" data-recipe-id="${recipe.id}">Add Note</button>
                    <button class="btn remove-recipe" data-recipe-id="${recipe.id}">Remove</button>
                </div>
            </div>
        `;
  }

  attachRecipeEventListeners() {
    // View recipe buttons
    const viewButtons = document.querySelectorAll(".view-recipe");
    viewButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const recipeId = e.target.getAttribute("data-recipe-id");
        this.viewRecipe(recipeId);
      });
    });

    // Remove recipe buttons
    const removeButtons = document.querySelectorAll(".remove-recipe");
    removeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const recipeId = e.target.getAttribute("data-recipe-id");
        this.removeRecipe(recipeId);
      });
    });

    // Add note buttons
    const noteButtons = document.querySelectorAll(".add-note");
    noteButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const recipeId = e.target.getAttribute("data-recipe-id");
        this.addNote(recipeId);
      });
    });
  }

  viewRecipe(recipeId) {
    // Get the full recipe object from stored recipes
    const recipe = this.cookbookRecipes.find((r) => r.id === recipeId);

    if (!recipe) {
      this.showMessage("Recipe not found", "error");
      return;
    }

    // Pass the full recipe object to the modal
    // This avoids API fetch for locally stored recipes
    showRecipeModal(recipe);
  }

  removeRecipe(recipeId) {
    const recipe = this.cookbookRecipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    if (
      confirm(
        `Are you sure you want to remove "${recipe.title}" from your cookbook?`,
      )
    ) {
      try {
        authManager.removeFromCookbook(recipeId);
        this.cookbookRecipes = this.cookbookRecipes.filter(
          (r) => r.id !== recipeId,
        );
        this.updateCookbookDisplay();
        this.showMessage("Recipe removed from cookbook", "success");
      } catch (error) {
        this.showMessage(error.message, "error");
      }
    }
  }

  addNote(recipeId) {
    const recipe = this.cookbookRecipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const currentNote = recipe.notes || "";
    const newNote = prompt(`Add a note for "${recipe.title}":`, currentNote);

    if (newNote !== null) {
      try {
        recipe.notes = newNote.trim();
        authManager.updateUserData();
        this.updateCookbookDisplay();
        this.showMessage("Note updated successfully", "success");
      } catch (error) {
        this.showMessage(error.message, "error");
      }
    }
  }

  filterCookbook(searchTerm) {
    const cards = document.querySelectorAll(".recipe-card");
    const term = searchTerm.toLowerCase();

    cards.forEach((card) => {
      const title = card
        .querySelector(".recipe-title")
        .textContent.toLowerCase();
      const tags =
        card.querySelector(".recipe-tags")?.textContent.toLowerCase() || "";

      if (title.includes(term) || tags.includes(term)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  filterByCategory(category) {
    const cards = document.querySelectorAll(".recipe-card");

    if (!category || category === "all") {
      cards.forEach((card) => (card.style.display = "block"));
      return;
    }

    cards.forEach((card) => {
      const tags =
        card.querySelector(".recipe-tags")?.textContent.toLowerCase() || "";
      if (tags.includes(category.toLowerCase())) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  sortCookbook(sortBy) {
    let sortedRecipes;

    switch (sortBy) {
      case "title":
        sortedRecipes = [...this.cookbookRecipes].sort((a, b) =>
          a.title.localeCompare(b.title),
        );
        break;
      case "time":
        sortedRecipes = [...this.cookbookRecipes].sort(
          (a, b) => (a.readyInMinutes || 999) - (b.readyInMinutes || 999),
        );
        break;
      case "added":
        sortedRecipes = [...this.cookbookRecipes].sort(
          (a, b) => new Date(b.addedDate) - new Date(a.addedDate),
        );
        break;
      default:
        sortedRecipes = [...this.cookbookRecipes];
    }

    this.cookbookRecipes = sortedRecipes;
    this.updateCookbookDisplay();
  }

  formatDate(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  showMessage(message, type = "info") {
    // Create or update message display
    let messageContainer = qs("#message-container");

    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.id = "message-container";
      messageContainer.className = "message-container";
      document.body.appendChild(messageContainer);
    }

    messageContainer.innerHTML = `
            <div class="message ${type}">
                <span>${message}</span>
                <button class="message-close" onclick="this.parentElement.parentElement.classList.add('hidden')">&times;</button>
            </div>
        `;

    messageContainer.classList.remove("hidden");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      messageContainer.classList.add("hidden");
    }, 3000);
  }

  // Method to add recipe from search results (called from other pages)
  static addRecipeFromSearch(recipeData) {
    if (!authManager.isAuthenticated()) {
      alert("Please sign in to save recipes to your cookbook");
      return false;
    }

    try {
      const cookbookRecipe = authManager.addToCookbook(recipeData);
      // Show success message or redirect
      return true;
    } catch (error) {
      console.error("Error adding recipe to cookbook:", error);
      return false;
    }
  }
}

// Initialize cookbook manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new CookbookManager();
});

// Export for use in other modules
export { CookbookManager };
