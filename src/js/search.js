import { setClick, qs } from "./utils.mjs";
import { APIManager } from "./apiManager.mjs";
import { displayRecipe } from "./recipe.js";

// Initialize search page with stored ingredients from home page
function initializeFromSessionStorage() {
  const storedIngredients = sessionStorage.getItem("searchIngredients");
  const autoSearch = sessionStorage.getItem("autoSearch");

  if (storedIngredients) {
    try {
      const ingredients = JSON.parse(storedIngredients);
      const ingredientList = qs("#ingredientList");

      // Add each ingredient to the list
      ingredients.forEach((ingredient) => {
        const newP = document.createElement("p");
        newP.textContent = ingredient;
        ingredientList.appendChild(newP);
      });

      // Clear session storage
      sessionStorage.removeItem("searchIngredients");
      sessionStorage.removeItem("autoSearch");

      // Auto-submit if flag is set
      if (autoSearch === "true") {
        // Set default search preference if not already selected
        const radioNotSelected = !qs("input[name=max-or-min]:checked");
        if (radioNotSelected) {
          qs('input[name=max-or-min][value="1"]').checked = true;
        }

        // Auto-submit the form after a short delay
        setTimeout(() => {
          const form = qs('form[name="ingredientSearch-form"]');
          form.dispatchEvent(new Event("submit"));
        }, 100);
      }
    } catch (error) {
      console.error("Error parsing stored ingredients:", error);
    }
  }
}

// Call initialization when DOM is ready
document.addEventListener("DOMContentLoaded", initializeFromSessionStorage);

// Helper function to add ingredient
function addIngredient() {
  const ingredientInput = qs("#ingredient");
  const ingredientValue = ingredientInput.value.trim();

  // Check if input is not empty
  if (ingredientValue !== "") {
    const newP = document.createElement("p");
    newP.textContent = ingredientValue;
    qs("#ingredientList").appendChild(newP);

    // Clear the input field
    ingredientInput.value = "";
    ingredientInput.focus();
  }
}

// format search terms to pass to getAPI
setClick("#addIngredientBtn", () => {
  addIngredient();
});

// Allow Enter key in ingredient input to add ingredient (without submitting form)
const ingredientInput = qs("#ingredient");
if (ingredientInput) {
  ingredientInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      addIngredient();
    }
  });
}

// compile ingredients into format to submit to spoonify for recipe search
const form = qs('form[name="ingredientSearch-form"]');
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const ingredients = qs("#ingredientList");
  const searchList = [];
  ingredients.querySelectorAll("p").forEach((element) => {
    searchList.push(element.textContent);
  });

  // Check if user wants to include pantry ingredients
  const includePantryCheckbox = qs("#include-pantry-checkbox");
  if (includePantryCheckbox && includePantryCheckbox.checked) {
    // Get pantry ingredients
    const { authManager } = await import("./auth.mjs");
    const user = authManager.getCurrentUser();
    if (user && user.pantry) {
      user.pantry.forEach((item) => {
        if (!searchList.includes(item.name)) {
          searchList.push(item.name);
        }
      });
    }
  }

  // Validation: Check if ingredients were added
  if (searchList.length === 0) {
    alert("Please add at least one ingredient before searching.");
    return;
  }

  // Validation: Check if a ranking option was selected
  const maxMinElement = qs("input[name=max-or-min]:checked");
  if (!maxMinElement) {
    alert("Please select a search priority option.");
    return;
  }

  const maxMin = maxMinElement.value;
  // pass list and number input into api call
  const spoonacularAPI = new APIManager();
  try {
    const data = await spoonacularAPI.getRecipes(searchList, maxMin);
    // display response as recipe cards
    displayRecipe(data);
  } catch (e) {
    console.error("Error fetching recipes:", e);
    alert("Sorry, there was an error searching for recipes. Please try again.");
  }
});
