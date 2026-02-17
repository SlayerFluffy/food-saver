// Authentication and User Management System
import { getLocalStorage, setLocalStorage } from './utils.mjs';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.initAuth();
    }

    // check if user is logged in
    initAuth() {
        const sessionData = getLocalStorage('currentSession');
        if (sessionData && sessionData.userId && sessionData.loginTime) {
            // Check if session is still valid (24 hours)
            const loginTime = new Date(sessionData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                this.currentUser = this.getUserById(sessionData.userId);
                return true;
            } else {
                this.logout();
            }
        }
        return false;
    }

    // Load all users from local storage
    loadUsers() {
        return getLocalStorage('foodSaverUsers') || [];
    }

    // Save users to local storage
    saveUsers() {
        setLocalStorage('foodSaverUsers', this.users);
    }

    // Generate unique user ID
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    isValidPassword(password) {
        return password.length >= 6;
    }

    // Check if email already exists
    emailExists(email) {
        return this.users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    // Get user by ID
    getUserById(userId) {
        return this.users.find(user => user.id === userId);
    }

    // Register new user
    register(userData) {
        const { firstName, lastName, email, password, confirmPassword } = userData;

        // Validation
        if (!firstName?.trim() || !lastName?.trim()) {
            throw new Error('First name and last name are required');
        }

        if (!this.isValidEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        if (!this.isValidPassword(password)) {
            throw new Error('Password must be at least 6 characters long');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        if (this.emailExists(email)) {
            throw new Error('An account with this email already exists');
        }

        // Create new user
        const newUser = {
            id: this.generateUserId(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            pantry: [],
            cookbook: [],
            shoppingList: [],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();
        
        return newUser;
    }

    // Login user
    login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (user.password !== password) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        // Set current user and session
        this.currentUser = user;
        setLocalStorage('currentSession', {
            userId: user.id,
            loginTime: new Date().toISOString()
        });

        return user;
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentSession');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Update user profile
    updateProfile(updates) {
        if (!this.isAuthenticated()) {
            throw new Error('User must be logged in to update profile');
        }

        const allowedUpdates = ['firstName', 'lastName', 'email'];
        const validUpdates = {};

        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                if (key === 'email') {
                    if (!this.isValidEmail(updates[key])) {
                        throw new Error('Please enter a valid email address');
                    }
                    if (updates[key].toLowerCase() !== this.currentUser.email && this.emailExists(updates[key])) {
                        throw new Error('An account with this email already exists');
                    }
                    validUpdates[key] = updates[key].toLowerCase().trim();
                } else {
                    validUpdates[key] = updates[key].trim();
                }
            }
        }

        // Update user in users array
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            Object.assign(this.users[userIndex], validUpdates);
            Object.assign(this.currentUser, validUpdates);
            this.saveUsers();
        }

        return this.currentUser;
    }

    // Change password
    changePassword(currentPassword, newPassword, confirmPassword) {
        if (!this.isAuthenticated()) {
            throw new Error('User must be logged in to change password');
        }

        if (this.currentUser.password !== currentPassword) {
            throw new Error('Current password is incorrect');
        }

        if (!this.isValidPassword(newPassword)) {
            throw new Error('New password must be at least 6 characters long');
        }

        if (newPassword !== confirmPassword) {
            throw new Error('New passwords do not match');
        }

        // Update password
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex].password = newPassword;
            this.currentUser.password = newPassword;
            this.saveUsers();
        }

        return true;
    }

    // Add item to user's pantry
    addToPantry(ingredient) {
        if (!this.isAuthenticated()) {
            throw new Error('User must be logged in to add to pantry');
        }

        const pantryItem = {
            id: 'pantry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: ingredient.name,
            quantity: ingredient.quantity || 1,
            unit: ingredient.unit || 'item',
            expiryDate: ingredient.expiryDate || null,
            addedDate: new Date().toISOString()
        };

        this.currentUser.pantry.push(pantryItem);
        this.updateUserData();
        return pantryItem;
    }

    // Remove item from pantry
    removeFromPantry(itemId) {
        if (!this.isAuthenticated()) {
            throw new Error('User must be logged in to remove from pantry');
        }

        this.currentUser.pantry = this.currentUser.pantry.filter(item => item.id !== itemId);
        this.updateUserData();
    }

    // Add recipe to cookbook
    addToCookbook(recipe) {
        if (!this.isAuthenticated()) {
            throw new Error('User must be logged in to add to cookbook');
        }

        const cookbookRecipe = {
            id: 'recipe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            recipeId: recipe.id,
            title: recipe.title,
            image: recipe.image || null,
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            servings: recipe.servings || 1,
            readyInMinutes: recipe.readyInMinutes || 0,
            addedDate: new Date().toISOString(),
            tags: recipe.tags || [],
            notes: ''
        };

        this.currentUser.cookbook.push(cookbookRecipe);
        this.updateUserData();
        return cookbookRecipe;
    }

    // Remove recipe from cookbook
    removeFromCookbook(recipeId) {
        if (!this.isAuthenticated()) {
            throw new Error('User must be logged in to remove from cookbook');
        }

        this.currentUser.cookbook = this.currentUser.cookbook.filter(recipe => recipe.id !== recipeId);
        this.updateUserData();
    }

    // Update user data in storage
    updateUserData() {
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.currentUser };
            this.saveUsers();
        }
    }

    // Get user's pantry
    getPantry() {
        return this.isAuthenticated() ? this.currentUser.pantry || [] : [];
    }

    // Get user's cookbook
    getCookbook() {
        return this.isAuthenticated() ? this.currentUser.cookbook || [] : [];
    }

    // Get user's shopping list
    getShoppingList() {
        return this.isAuthenticated() ? this.currentUser.shoppingList || [] : [];
    }
}

// Export a singleton instance
export const authManager = new AuthManager();

// Navigation guard - check authentication before accessing protected pages
export function requireAuth() {
    if (!authManager.isAuthenticated()) {
        window.location.href = '/account/';
        return false;
    }
    return true;
}

// Redirect if already logged in
export function redirectIfAuthenticated(redirectPath = '/') {
    if (authManager.isAuthenticated()) {
        window.location.href = redirectPath;
        return true;
    }
    return false;
}