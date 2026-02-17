import { loadHeaderFooter } from './utils.mjs';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadHeaderFooter().then(() => {
        // Initialize navigation after header is loaded
        initNav();
    }).catch(() => {
        // Fallback if loadHeaderFooter doesn't return a promise
        setTimeout(initNav, 100);
    });
});

// Call setActiveNavLink after header is loaded
function initNav() {
    setActiveNavLink();
    
    // Hamburger menu for navigation event listeners and class toggle
    const hamburger = document.getElementById('hamburger-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });
        
        // Close menu when clicking outside
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                hamburger.classList.remove('open');
                mobileMenu.classList.remove('open');
            }
        });
    }
}


// nav page indicator
function setActiveNavLink() {
    // Get the current page path
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Map page names to their nav links
    const pageMap = {
        'index.html': 'Home',
        '': 'Home', // for root path
        'search': 'Search',
        'planner': 'Meal Plan', 
        'cookbook': 'Cook Book',
        'pantry': 'Pantry',
        'shopping-list': 'Shopping List',
        'account': 'Account'
    };
    
    // Default active page
    let activePage = 'Home'; 
    
    // Check if we're in a subfolder (like /search/, /planner/, etc.)
    const pathParts = currentPath.split('/').filter(part => part !== '');
    if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart !== 'index.html' && pageMap[lastPart]) {
            activePage = pageMap[lastPart];
        } else if (pathParts.length >= 2) {
            const secondLastPart = pathParts[pathParts.length - 2];
            if (pageMap[secondLastPart]) {
                activePage = pageMap[secondLastPart];
            }
        }
    }
    
    // Add active class to matching nav links (both regular and mobile nav)
    const allNavLinks = document.querySelectorAll('.nav-link');
    allNavLinks.forEach(link => {
        link.classList.remove('active');
        if (link.textContent.trim() === activePage) {
            link.classList.add('active');
        }
    });
}