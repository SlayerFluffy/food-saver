import { authManager, requireAuth } from "./auth.mjs";
import { APIManager } from "./apiManager.mjs";

class MealPlanner {
  constructor() {
    this.currentWeek = new Date();
    this.mealPlan = {};
    this.selectedSlot = null;
    this.apiManager = new APIManager();
    this.lastShoppingList = [];

    this.init();
  }

  init() {
    try {
      this.checkAuth();
      this.loadMealPlan();
      this.displayPendingRecipes();
      this.setupEventListeners();
      this.updateWeekDisplay();
    } catch (error) {
      console.error("Error in MealPlanner init:", error);
    }
  }

  checkAuth() {
    if (!requireAuth()) {
      return;
    }
  }

  setupEventListeners() {
    // Week navigation
    const prevWeekBtn = document.getElementById("prev-week");
    const nextWeekBtn = document.getElementById("next-week");

    if (prevWeekBtn) {
      prevWeekBtn.addEventListener("click", () => this.changeWeek(-7));
    }
    if (nextWeekBtn) {
      nextWeekBtn.addEventListener("click", () => this.changeWeek(7));
    }

    // Action buttons
    const clearWeekBtn = document.getElementById("clear-week-btn");
    const generateShoppingBtn = document.getElementById(
      "generate-shopping-btn",
    );

    if (clearWeekBtn) {
      clearWeekBtn.addEventListener("click", () => this.clearWeek());
    }
    if (generateShoppingBtn) {
      generateShoppingBtn.addEventListener("click", () =>
        this.generateShoppingList(),
      );
    }

    // Meal slots
    const mealSlots = document.querySelectorAll(".meal-slot");
    mealSlots.forEach((slot) => {
      slot.addEventListener("click", (e) => this.openAddMealModal(slot));
    });

    // Modal functionality
    this.setupModalListeners();
  }

  setupModalListeners() {
    // Add meal modal
    const addMealModal = document.getElementById("add-meal-modal");
    const shoppingModal = document.getElementById("shopping-list-modal");
    const modalCloses = document.querySelectorAll(".modal-close");

    // Close modals
    modalCloses.forEach((closeBtn) => {
      closeBtn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        this.closeModal(modal);
      });
    });

    // Close modals on background click
    [addMealModal, shoppingModal].forEach((modal) => {
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            this.closeModal(modal);
          }
        });
      }
    });

    // Tab switching
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.switchTab(btn.dataset.tab));
    });

    // Recipe search
    const recipeSearchBtn = document.getElementById("recipe-search-btn");
    const recipeSearchInput = document.getElementById("recipe-search-input");

    if (recipeSearchBtn) {
      recipeSearchBtn.addEventListener("click", () => this.searchRecipes());
    }
    if (recipeSearchInput) {
      recipeSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.searchRecipes();
        }
      });
    }

    // Custom meal
    const addCustomMealBtn = document.getElementById("add-custom-meal-btn");
    if (addCustomMealBtn) {
      addCustomMealBtn.addEventListener("click", () => this.addCustomMeal());
    }

    // Shopping list actions
    const saveShoppingBtn = document.getElementById("save-shopping-list-btn");
    const printShoppingBtn = document.getElementById("print-shopping-list-btn");

    if (saveShoppingBtn) {
      saveShoppingBtn.addEventListener("click", () => this.saveShoppingList());
    }
    if (printShoppingBtn) {
      printShoppingBtn.addEventListener("click", () =>
        this.printShoppingList(),
      );
    }
  }

  changeWeek(days) {
    this.currentWeek.setDate(this.currentWeek.getDate() + days);
    this.updateWeekDisplay();
    this.loadMealPlan();
  }

  updateWeekDisplay() {
    const weekDisplay = document.getElementById("current-week");
    if (weekDisplay) {
      const options = { month: "short", day: "numeric", year: "numeric" };
      const weekStart = new Date(this.currentWeek);
      // Get Monday of current week (Sunday=0, Monday=1, etc.)
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekDisplay.textContent = `Week of ${weekStart.toLocaleDateString("en-US", options)}`;
    }
  }

  getWeekKey() {
    const weekStart = new Date(this.currentWeek);
    // Get Monday of current week (Sunday=0, Monday=1, etc.)
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
  }

  loadMealPlan() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) return;

    const weekKey = this.getWeekKey();
    const savedPlans = JSON.parse(
      localStorage.getItem(`mealPlans_${currentUser.id}`) || "{}",
    );
    this.mealPlan = savedPlans[weekKey] || {};

    this.renderMealPlan();
  }

  displayPendingRecipes() {
    const pendingRecipes = JSON.parse(
      sessionStorage.getItem("pendingMealRecipes") || "[]",
    );
    const section = document.getElementById("pending-recipes-section");
    const list = document.getElementById("pending-recipes-list");

    if (pendingRecipes.length === 0) {
      if (section) section.classList.add("hidden");
      return;
    }

    if (section) section.classList.remove("hidden");

    list.innerHTML = pendingRecipes
      .map(
        (recipe) => `
      <div class="pending-recipe-card">
        <div class="pending-recipe-image">
          ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}">` : '<div style="height:100%;background:var(--muted-color)"></div>'}
        </div>
        <div class="pending-recipe-content">
          <h3 class="pending-recipe-title">${recipe.title}</h3>
          <div class="pending-recipe-info">
            ${recipe.readyInMinutes ? `<span>⏱️ ${recipe.readyInMinutes} min</span>` : ""}
            ${recipe.servings ? `<span>🍽️ ${recipe.servings} servings</span>` : ""}
          </div>
          <div class="pending-recipe-actions">
            <button class="btn add-pending-meal" data-recipe-id="${recipe.id}" data-recipe='${JSON.stringify(recipe)}'>Add to Meal</button>
            <button class="btn btn-secondary remove-pending" data-recipe-id="${recipe.id}">✕</button>
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    // Attach event listeners for pending recipe buttons
    list.querySelectorAll(".add-pending-meal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const recipe = JSON.parse(e.target.dataset.recipe);
        this.openAddMealModalWithRecipe(recipe);
      });
    });

    list.querySelectorAll(".remove-pending").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.removePendingRecipe(e.target.dataset.recipeId);
      });
    });
  }

  openAddMealModalWithRecipe(recipe) {
    // Store the pending recipe temporarily
    this.pendingRecipeToAdd = recipe;
    // Show instruction message
    this.showPlannerMessage(
      `Click a meal slot to add "${recipe.title}"`,
      "info",
    );
  }

  removePendingRecipe(recipeId) {
    let pendingRecipes = JSON.parse(
      sessionStorage.getItem("pendingMealRecipes") || "[]",
    );
    // Convert recipeId to number for comparison since API IDs are numbers
    const idToRemove = parseInt(recipeId, 10);
    pendingRecipes = pendingRecipes.filter((r) => r.id !== idToRemove);
    sessionStorage.setItem(
      "pendingMealRecipes",
      JSON.stringify(pendingRecipes),
    );
    this.displayPendingRecipes();
  }

  showPlannerMessage(message, type = "info") {
    let container = document.getElementById("message-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "message-container";
      container.className = "message-container";
      document.body.insertBefore(container, document.body.firstChild);
    }

    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${type}`;
    msgDiv.innerHTML = `
      <span>${message}</span>
      <button class="message-close">&times;</button>
    `;

    container.innerHTML = "";
    container.appendChild(msgDiv);
    container.classList.remove("hidden");

    msgDiv.querySelector(".message-close")?.addEventListener("click", () => {
      container.classList.add("hidden");
    });

    setTimeout(() => container.classList.add("hidden"), 4000);
  }

  saveMealPlan() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) return;

    const weekKey = this.getWeekKey();
    const savedPlans = JSON.parse(
      localStorage.getItem(`mealPlans_${currentUser.id}`) || "{}",
    );
    savedPlans[weekKey] = this.mealPlan;
    localStorage.setItem(
      `mealPlans_${currentUser.id}`,
      JSON.stringify(savedPlans),
    );
  }

  renderMealPlan() {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const meals = ["breakfast", "lunch", "dinner"];

    days.forEach((day) => {
      meals.forEach((meal) => {
        const slot = document.querySelector(
          `[data-day="${day}"][data-meal="${meal}"]`,
        );
        if (slot) {
          const mealData = this.mealPlan[`${day}-${meal}`];
          if (mealData) {
            this.renderMealInSlot(slot, mealData);
          } else {
            this.renderEmptySlot(slot);
          }
        }
      });
    });
  }

  renderMealInSlot(slot, mealData) {
    slot.innerHTML = `
      <div class="meal-card">
        <div class="meal-info">
          <h4 class="meal-title">${mealData.title}</h4>
          ${mealData.readyInMinutes ? `<span class="meal-time">${mealData.readyInMinutes} min</span>` : ""}
        </div>
        <div class="meal-actions">
          <button class="meal-action-btn remove-btn" onclick="window.mealPlanner.removeMeal('${slot.dataset.day}', '${slot.dataset.meal}')">&times;</button>
        </div>
      </div>
    `;
  }

  renderEmptySlot(slot) {
    slot.innerHTML = `
      <div class="meal-placeholder">
        <span class="add-meal-text">+ Add Meal</span>
      </div>
    `;
  }

  openAddMealModal(slot) {
    this.selectedSlot = slot;

    // If there's a pending recipe to add, add it directly instead of opening modal
    if (this.pendingRecipeToAdd) {
      this.addPendingRecipeToSlot();
      return;
    }

    const modal = document.getElementById("add-meal-modal");
    if (modal) {
      modal.classList.remove("hidden");
      this.loadCookbookRecipes();
    }
  }

  addPendingRecipeToSlot() {
    if (!this.selectedSlot || !this.pendingRecipeToAdd) return;

    const recipe = this.pendingRecipeToAdd;
    const day = this.selectedSlot.dataset.day;
    const meal = this.selectedSlot.dataset.meal;

    this.mealPlan[`${day}-${meal}`] = {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      type: "recipe",
    };

    this.saveMealPlan();
    this.renderMealPlan();

    // Remove from pending list
    let pendingRecipes = JSON.parse(
      sessionStorage.getItem("pendingMealRecipes") || "[]",
    );
    pendingRecipes = pendingRecipes.filter((r) => r.id !== recipe.id);
    sessionStorage.setItem(
      "pendingMealRecipes",
      JSON.stringify(pendingRecipes),
    );

    // Clear pending recipe and refresh display
    this.pendingRecipeToAdd = null;
    this.displayPendingRecipes();
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  switchTab(tabName) {
    // Update tab buttons
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update tab content
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach((content) => {
      content.classList.toggle("active", content.dataset.tab === tabName);
    });
  }

  async loadCookbookRecipes() {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) return;

    const cookbookContainer = document.getElementById("cookbook-recipes");
    if (!cookbookContainer) return;

    // Get cookbook from user object (stored in auth system)
    const cookbook = currentUser.cookbook || [];

    if (cookbook.length === 0) {
      cookbookContainer.innerHTML =
        '<p>No recipes saved to your cookbook yet. <a href="/search/">Find some recipes</a> to get started!</p>';
      return;
    }

    cookbookContainer.innerHTML = cookbook
      .map(
        (recipe) => `
      <div class="recipe-card" data-recipe-id="${recipe.id}">
        <div class="recipe-image">
          <img src="${recipe.image || "/api/placeholder/80/60"}" alt="${recipe.title}" loading="lazy">
        </div>
        <div class="recipe-info">
          <h4>${recipe.title}</h4>
          <p>${recipe.readyInMinutes ? `${recipe.readyInMinutes} minutes` : "No time info"}</p>
        </div>
        <button class="btn btn-sm" onclick="window.mealPlanner.addRecipeToSlot('${recipe.id}')">Add</button>
      </div>
    `,
      )
      .join("");
  }

  async searchRecipes() {
    const searchInput = document.getElementById("recipe-search-input");
    const resultsContainer = document.getElementById("recipe-search-results");

    if (!searchInput || !resultsContainer) return;

    const query = searchInput.value.trim();
    if (!query) {
      alert("Please enter a search term");
      return;
    }

    resultsContainer.innerHTML =
      '<p class="loading-text">Searching for recipes...</p>';

    try {
      const results = await this.apiManager.searchRecipes(query);

      if (results.length === 0) {
        resultsContainer.innerHTML =
          "<p>No recipes found. Try different keywords.</p>";
        return;
      }

      resultsContainer.innerHTML = results
        .slice(0, 10)
        .map(
          (recipe) => `
        <div class="recipe-card" data-recipe-id="${recipe.id}">
          <div class="recipe-image">
            <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
          </div>
          <div class="recipe-info">
            <h4>${recipe.title}</h4>
            <p>${recipe.readyInMinutes ? `${recipe.readyInMinutes} minutes` : "No time info"}</p>
          </div>
          <button class="btn btn-sm" onclick="window.mealPlanner.addRecipeToSlot(${recipe.id})">Add</button>
        </div>
      `,
        )
        .join("");
    } catch (error) {
      console.error("Search error:", error);
      resultsContainer.innerHTML =
        "<p>Error searching for recipes. Please try again.</p>";
    }
  }

  async addRecipeToSlot(recipeId) {
    if (!this.selectedSlot) return;

    try {
      const day = this.selectedSlot.dataset.day;
      const meal = this.selectedSlot.dataset.meal;
      const currentUser = authManager.getCurrentUser();
      let recipeDetails = null;

      // Check if it's a cookbook recipe
      if (currentUser && currentUser.cookbook) {
        const cookbookRecipe = currentUser.cookbook.find(
          (r) => r.id === recipeId,
        );
        if (cookbookRecipe) {
          // Use cookbook recipe directly
          recipeDetails = cookbookRecipe;
        }
      }

      // If not found in cookbook, fetch from API
      if (!recipeDetails) {
        recipeDetails = await this.apiManager.getRecipeInformation(recipeId);
      }

      this.mealPlan[`${day}-${meal}`] = {
        id: recipeDetails.id,
        title: recipeDetails.title,
        image: recipeDetails.image,
        readyInMinutes: recipeDetails.readyInMinutes,
        type: "recipe",
      };

      this.saveMealPlan();
      this.renderMealPlan(); // Re-render to show the updated meal plan
      this.closeModal(document.getElementById("add-meal-modal"));

      // Clear form inputs
      const searchInput = document.getElementById("recipe-search-input");
      if (searchInput) searchInput.value = "";
      const customNameInput = document.getElementById("custom-meal-name");
      if (customNameInput) customNameInput.value = "";
      const customNotesInput = document.getElementById("custom-meal-notes");
      if (customNotesInput) customNotesInput.value = "";
    } catch (error) {
      console.error("Error adding recipe:", error);
      alert("Error adding recipe to meal plan. Please try again.");
    }
  }

  addCustomMeal() {
    const nameInput = document.getElementById("custom-meal-name");
    const notesInput = document.getElementById("custom-meal-notes");

    if (!nameInput || !this.selectedSlot) return;

    const name = nameInput.value.trim();
    if (!name) {
      alert("Please enter a meal name");
      return;
    }

    const day = this.selectedSlot.dataset.day;
    const meal = this.selectedSlot.dataset.meal;

    this.mealPlan[`${day}-${meal}`] = {
      id: `custom-${Date.now()}`,
      title: name,
      notes: notesInput.value.trim(),
      type: "custom",
    };

    this.saveMealPlan();
    this.renderMealInSlot(this.selectedSlot, this.mealPlan[`${day}-${meal}`]);
    this.closeModal(document.getElementById("add-meal-modal"));

    // Clear form
    nameInput.value = "";
    notesInput.value = "";
  }

  removeMeal(day, meal) {
    if (confirm("Remove this meal from your plan?")) {
      delete this.mealPlan[`${day}-${meal}`];
      this.saveMealPlan();

      const slot = document.querySelector(
        `[data-day="${day}"][data-meal="${meal}"]`,
      );
      if (slot) {
        this.renderEmptySlot(slot);
      }
    }
  }

  clearWeek() {
    if (confirm("Clear all meals for this week? This cannot be undone.")) {
      this.mealPlan = {};
      this.saveMealPlan();
      this.renderMealPlan();
    }
  }

  async generateShoppingList() {
    const modal = document.getElementById("shopping-list-modal");
    const contentContainer = document.getElementById("shopping-list-content");

    if (!modal || !contentContainer) return;

    modal.classList.remove("hidden");
    contentContainer.innerHTML =
      '<p class="loading-text">Generating your shopping list...</p>';

    try {
      // Get user's pantry ingredients
      const currentUser = authManager.getCurrentUser();
      const pantryIngredients = new Set();

      if (currentUser && currentUser.pantry) {
        currentUser.pantry.forEach((item) => {
          pantryIngredients.add(item.name.toLowerCase());
        });
      }

      const ingredients = new Map();

      // Collect all ingredients from planned meals
      for (const mealKey in this.mealPlan) {
        const mealData = this.mealPlan[mealKey];

        if (mealData && mealData.type === "recipe") {
          try {
            const recipeDetails = await this.apiManager.getRecipeInformation(
              mealData.id,
            );

            if (recipeDetails && recipeDetails.extendedIngredients) {
              recipeDetails.extendedIngredients.forEach((ingredient) => {
                const name = ingredient.name.toLowerCase();

                // Skip ingredients already in pantry
                if (pantryIngredients.has(name)) {
                  return;
                }

                const amount = ingredient.amount || 1;
                const unit = ingredient.unit || "";

                if (ingredients.has(name)) {
                  const existing = ingredients.get(name);
                  existing.amount += amount;
                } else {
                  ingredients.set(name, {
                    name: ingredient.name,
                    amount: amount,
                    unit: unit,
                    original: ingredient.original || ingredient.name,
                  });
                }
              });
            }
          } catch (recipeError) {
            console.warn(`Could not fetch recipe ${mealData.id}:`, recipeError);
            // Continue with next recipe if one fails
          }
        }
      }

      if (ingredients.size === 0) {
        this.lastShoppingList = [];
        this.persistShoppingList([]);
        contentContainer.innerHTML =
          "<p>Great! Everything you need for your meal plan is already in your pantry!</p>";
        return;
      }

      // Generate shopping list HTML
      const ingredientsList = Array.from(ingredients.values());
      const shoppingListItems = ingredientsList.map((ingredient) => ({
        id: `${ingredient.name.toLowerCase()}-${ingredient.unit || "unit"}`,
        name: ingredient.name,
        amount:
          ingredient.amount > 0 ? Math.round(ingredient.amount * 100) / 100 : 0,
        unit: ingredient.unit || "",
      }));

      this.lastShoppingList = shoppingListItems;
      this.persistShoppingList(shoppingListItems);
      const pantryNote =
        currentUser && currentUser.pantry && currentUser.pantry.length > 0
          ? `<p class="list-note"><strong>Note:</strong> Ingredients already in your pantry have been excluded from this list.</p>`
          : "";

      contentContainer.innerHTML = `
        <div class="shopping-list">
          <h3>Shopping List for This Week</h3>
          <p class="list-count">Items to purchase: ${ingredientsList.length}</p>
          <div class="ingredient-categories">
            <div class="ingredient-list">
              ${ingredientsList
                .map(
                  (ingredient) => `
                <div class="shopping-item">
                  <label class="shopping-checkbox">
                    <input type="checkbox">
                    <span class="checkmark"></span>
                    <span class="ingredient-text">
                      ${ingredient.amount > 0 ? Math.round(ingredient.amount * 100) / 100 : ""} 
                      ${ingredient.unit} 
                      ${ingredient.name}
                    </span>
                  </label>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          ${pantryNote}
        </div>
      `;
    } catch (error) {
      console.error("Error generating shopping list:", error);
      contentContainer.innerHTML =
        "<p>Error generating shopping list. Please try again.</p>";
    }
  }

  saveShoppingList() {
    const items = this.lastShoppingList || [];
    this.persistShoppingList(items);
    alert("Shopping list saved! You can view it on the Shopping List page.");
  }

  persistShoppingList(items) {
    const currentUser = authManager.getCurrentUser();
    if (!currentUser) return;

    currentUser.shoppingList = Array.isArray(items) ? items : [];
    authManager.updateUserData();
  }

  printShoppingList() {
    const listContent = document.querySelector(".shopping-list").innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Shopping List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .shopping-item { margin: 10px 0; }
            .ingredient-text { margin-left: 10px; }
            @media print { .shopping-checkbox input { display: none; } }
          </style>
        </head>
        <body>
          ${listContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

// Initialize meal planner when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.mealPlanner = new MealPlanner();
});
