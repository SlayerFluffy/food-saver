// Account page functionality
import { authManager, redirectIfAuthenticated } from './auth.mjs';
import { qs, setClick } from './utils.mjs';

class Account {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.showCorrectView();
        // this.createDemoAccount();
    }

    // // Create demo account if it doesn't exist
    // createDemoAccount() {
    //     try {
    //         const demoData = {
    //             firstName: 'Demo',
    //             lastName: 'User',
    //             email: 'demo@foodsaver.com',
    //             password: 'demo123',
    //             confirmPassword: 'demo123'
    //         };
            
    //         // Try to register demo account (will fail if already exists)
    //         authManager.register(demoData);
    //         console.log('Demo account created');
    //     } catch (error) {
    //         // Demo account already exists, which is fine
    //         if (!error.message.includes('already exists')) {
    //             console.log('Demo account setup:', error.message);
    //         }
    //     }
    // }

    setupEventListeners() {
        // Form switching
        const showRegisterBtn = qs('#show-register');
        const showLoginBtn = qs('#show-login');
        
        if (showRegisterBtn) {
            setClick('#show-register', () => this.showRegisterForm());
        }
        
        if (showLoginBtn) {
            setClick('#show-login', () => this.showLoginForm());
        }

        // Form submissions
        const loginForm = qs('#login-form-element');
        const registerForm = qs('#register-form-element');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Demo login
        // setClick('#demo-login', () => this.handleDemoLogin());

        // Dashboard functionality
        setClick('#logout-btn', () => this.handleLogout());
        setClick('#edit-profile-btn', () => this.showEditProfile());
        setClick('#change-password-btn', () => this.showChangePassword());

        // Modal functionality
        this.setupModalEventListeners();

        // Real-time validation
        this.setupRealTimeValidation();

        // Message close
        const messageClose = qs('#message-close');
        if (messageClose) {
            messageClose.addEventListener('click', () => this.hideMessage());
        }
    }

    setupModalEventListeners() {
        // Edit profile modal
        setClick('#close-profile-modal', () => this.hideModal('edit-profile-modal'));
        setClick('#cancel-profile-edit', () => this.hideModal('edit-profile-modal'));
        
        const editProfileForm = qs('#edit-profile-form');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => this.handleEditProfile(e));
        }

        // Change password modal
        setClick('#close-password-modal', () => this.hideModal('change-password-modal'));
        setClick('#cancel-password-change', () => this.hideModal('change-password-modal'));
        
        const changePasswordForm = qs('#change-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
    }

    setupRealTimeValidation() {
        // Password confirmation validation
        const registerPassword = qs('#register-password');
        const registerConfirmPassword = qs('#register-confirm-password');
        const newPassword = qs('#new-password');
        const confirmNewPassword = qs('#confirm-new-password');

        if (registerPassword && registerConfirmPassword) {
            registerConfirmPassword.addEventListener('input', () => {
                this.validatePasswordMatch(registerPassword.value, registerConfirmPassword.value, 'register-confirm-password-error');
            });
        }

        if (newPassword && confirmNewPassword) {
            confirmNewPassword.addEventListener('input', () => {
                this.validatePasswordMatch(newPassword.value, confirmNewPassword.value, 'confirm-new-password-error');
            });
        }

        // Email validation
        const loginEmail = qs('#login-email');
        const registerEmail = qs('#register-email');
        const editEmail = qs('#edit-email');

        if (loginEmail) {
            loginEmail.addEventListener('blur', () => this.validateEmail(loginEmail.value, 'login-email-error'));
        }
        if (registerEmail) {
            registerEmail.addEventListener('blur', () => this.validateEmail(registerEmail.value, 'register-email-error'));
        }
        if (editEmail) {
            editEmail.addEventListener('blur', () => this.validateEmail(editEmail.value, 'edit-email-error'));
        }
    }

    validateEmail(email, errorElementId) {
        const errorElement = qs(`#${errorElementId}`);
        if (!errorElement) return true;

        if (!email) {
            this.showFieldError(errorElementId, '');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showFieldError(errorElementId, 'Please enter a valid email address');
            return false;
        }

        this.showFieldError(errorElementId, '');
        return true;
    }

    validatePasswordMatch(password, confirmPassword, errorElementId) {
        if (!confirmPassword) {
            this.showFieldError(errorElementId, '');
            return false;
        }

        if (password !== confirmPassword) {
            this.showFieldError(errorElementId, 'Passwords do not match');
            return false;
        }

        this.showFieldError(errorElementId, '');
        return true;
    }

    showRegisterForm() {
        const loginForm = qs('#login-form');
        const registerForm = qs('#register-form');
        
        if (loginForm && registerForm) {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
        }
    }

    showLoginForm() {
        const loginForm = qs('#login-form');
        const registerForm = qs('#register-form');
        
        if (loginForm && registerForm) {
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        }
    }

    showCorrectView() {
        const authSection = qs('#auth-section');
        const userDashboard = qs('#user-dashboard');

        if (authManager.isAuthenticated()) {
            if (authSection) authSection.classList.add('hidden');
            if (userDashboard) userDashboard.classList.remove('hidden');
            this.updateDashboard();
        } else {
            if (authSection) authSection.classList.remove('hidden');
            if (userDashboard) userDashboard.classList.add('hidden');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        this.clearAllErrors();

        const formData = new FormData(event.target);
        const email = formData.get('email')?.trim();
        const password = formData.get('password');

        try {
            const user = authManager.login(email, password);
            this.showMessage(`Welcome back, ${user.firstName}!`, 'success');
            
            setTimeout(() => {
                this.showCorrectView();
            }, 1000);
            
        } catch (error) {
            this.showMessage(error.message, 'error');
            this.showFieldError('login-email-error', '');
            this.showFieldError('login-password-error', error.message);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        this.clearAllErrors();

        const formData = new FormData(event.target);
        const userData = {
            firstName: formData.get('firstName')?.trim(),
            lastName: formData.get('lastName')?.trim(),
            email: formData.get('email')?.trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        try {
            const user = authManager.register(userData);
            this.showMessage(`Account created successfully! Welcome, ${user.firstName}!`, 'success');
            
            // Auto-login the user
            authManager.login(userData.email, userData.password);
            
            setTimeout(() => {
                this.showCorrectView();
            }, 1000);
            
        } catch (error) {
            this.showMessage(error.message, 'error');
            
            // Show specific field errors
            if (error.message.includes('email')) {
                this.showFieldError('register-email-error', error.message);
            } else if (error.message.includes('password')) {
                this.showFieldError('register-password-error', error.message);
            } else if (error.message.includes('match')) {
                this.showFieldError('register-confirm-password-error', error.message);
            }
        }
    }

    // handleDemoLogin() {
    //     try {
    //         const user = authManager.login('demo@foodsaver.com', 'demo123');
    //         this.showMessage(`Welcome to the demo, ${user.firstName}!`, 'success');
            
    //         setTimeout(() => {
    //             this.showCorrectView();
    //         }, 1000);
            
    //     } catch (error) {
    //         this.showMessage('Demo account unavailable: ' + error.message, 'error');
    //     }
    // }

    handleLogout() {
        authManager.logout();
        this.showMessage('You have been signed out successfully', 'success');
        
        setTimeout(() => {
            this.showCorrectView();
            this.clearAllForms();
        }, 1000);
    }

    updateDashboard() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        // Update user name
        const userName = qs('#user-name');
        if (userName) {
            userName.textContent = user.firstName;
        }

        // Update statistics
        const pantryCount = qs('#pantry-count');
        const cookbookCount = qs('#cookbook-count');

        if (pantryCount) {
            pantryCount.textContent = user.pantry?.length || 0;
        }
        
        if (cookbookCount) {
            cookbookCount.textContent = user.cookbook?.length || 0;
        }
    }

    showEditProfile() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        // Populate form with current data
        const firstNameInput = qs('#edit-firstname');
        const lastNameInput = qs('#edit-lastname');
        const emailInput = qs('#edit-email');

        if (firstNameInput) firstNameInput.value = user.firstName;
        if (lastNameInput) lastNameInput.value = user.lastName;
        if (emailInput) emailInput.value = user.email;

        this.showModal('edit-profile-modal');
    }

    handleEditProfile(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const updates = {
            firstName: formData.get('firstName')?.trim(),
            lastName: formData.get('lastName')?.trim(),
            email: formData.get('email')?.trim()
        };

        try {
            authManager.updateProfile(updates);
            this.showMessage('Profile updated successfully!', 'success');
            this.updateDashboard();
            this.hideModal('edit-profile-modal');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    showChangePassword() {
        // Clear password form
        const form = qs('#change-password-form');
        if (form) form.reset();
        
        this.showModal('change-password-modal');
    }

    handleChangePassword(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        try {
            authManager.changePassword(currentPassword, newPassword, confirmPassword);
            this.showMessage('Password changed successfully!', 'success');
            this.hideModal('change-password-modal');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    showModal(modalId) {
        const modal = qs(`#${modalId}`);
        if (modal) {
            modal.classList.remove('hidden');
            // Focus first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    hideModal(modalId) {
        const modal = qs(`#${modalId}`);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        const messageContainer = qs('#message-container');
        const messageContent = qs('#message-content');
        const messageText = qs('#message-text');

        if (messageContainer && messageContent && messageText) {
            messageText.textContent = message;
            messageContent.className = `message ${type}`;
            messageContainer.classList.remove('hidden');

            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.hideMessage();
            }, 5000);
        }
    }

    hideMessage() {
        const messageContainer = qs('#message-container');
        if (messageContainer) {
            messageContainer.classList.add('hidden');
        }
    }

    showFieldError(errorElementId, message) {
        const errorElement = qs(`#${errorElementId}`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = message ? 'block' : 'none';
        }
    }

    clearAllErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    clearAllForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
        this.clearAllErrors();
    }
}

// Initialize account manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Account();
});

// Export for testing purposes
export { Account as AccountManager };