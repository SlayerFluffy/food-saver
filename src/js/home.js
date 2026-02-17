class HomePage {
  constructor() {
    this.init();
  }

  init() {
    this.setupHeroSearch();
  }

  setupHeroSearch() {
    const heroSearchForm = document.getElementById('hero-search-form');
    const heroSearchInput = document.getElementById('hero-search-input');

    if (heroSearchForm) {
      heroSearchForm.addEventListener('submit', this.handleHeroSearch.bind(this));
    }

    // Add autocomplete/search hints
    if (heroSearchInput) {
      heroSearchInput.addEventListener('input', this.handleSearchInput.bind(this));
    }
  }

  async handleHeroSearch(event) {
    event.preventDefault();
    
    const searchInput = document.getElementById('hero-search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
      alert('Please enter some ingredients to search for recipes.');
      return;
    }

    try {
      // Show loading state
      const searchBtn = event.target.querySelector('.search-btn');
      const originalText = searchBtn.textContent;
      searchBtn.textContent = 'Searching...';
      searchBtn.disabled = true;

      // Parse ingredients separated by dash, comma, or space
      const ingredients = query
        .split(/[-,\s]+/) // Split by dash, comma, or whitespace
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0); // Remove empty strings
      
      // Store parsed ingredients in session storage for the search page
      sessionStorage.setItem('searchIngredients', JSON.stringify(ingredients));
      sessionStorage.setItem('searchType', 'ingredients');
      sessionStorage.setItem('autoSearch', 'true'); // Flag to auto-submit search
      
      // Redirect to search page
      window.location.href = '/search/';
      
    } catch (error) {
      console.error('Search error:', error);
      alert('There was an error searching for recipes. Please try again.');
      
      // Reset button state
      const searchBtn = event.target.querySelector('.search-btn');
      searchBtn.textContent = 'Find Recipes';
      searchBtn.disabled = false;
    }
  }

  handleSearchInput(event) {
    const query = event.target.value.trim();
    
    // Add some visual feedback or suggestions here if needed
    // For now, just basic input handling
    if (query.length > 0) {
      event.target.classList.add('has-content');
    } else {
      event.target.classList.remove('has-content');
    }
  }
}

// Initialize home page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HomePage();
});