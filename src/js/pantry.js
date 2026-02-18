// Pantry page functionality with authentication integration
import { authManager, requireAuth } from './auth.mjs';
import { qs, setClick } from './utils.mjs';

class PantryManager {
    constructor() {
        // Ensure user is authenticated
        if (!requireAuth()) {
            return;
        }
        
        this.selectedItems = new Set();
        this.init();
    }

    init() {
        this.loadUserPantry();
        this.sortByName(); 
        this.updatePantryDisplay();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add ingredient form
        const addIngredientForm = qs('#add-ingredient-form');
        if (addIngredientForm) {
            addIngredientForm.addEventListener('submit', (e) => this.handleAddIngredient(e));
        }

        // Search/filter functionality
        const searchInput = qs('#pantry-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterPantry(e.target.value));
        }

        // Sort functionality
        const sortSelect = qs('#pantry-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.sortPantry(e.target.value));
        }

        // Select all checkbox
        const selectAllCheckbox = qs('#select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => this.selectAllItems(e.target.checked));
        }

        // Bulk actions
        setClick('#add-selected-to-shopping', () => this.addSelectedToShoppingList());
        setClick('#remove-selected-items', () => this.removeSelectedItems());
        setClick('#clear-selection', () => this.clearSelection());
    }

    loadUserPantry() {
        const user = authManager.getCurrentUser();
        if (user && user.pantry) {
            this.pantryItems = [...user.pantry];
        } else {
            this.pantryItems = [];
        }
    }

    sortByName() {
        this.pantryItems.sort((a, b) => a.name.localeCompare(b.name));
    }

    updatePantryDisplay() {
        const tbody = qs('#pantry-tbody');
        const pantryTable = qs('#pantry-items');
        const pantryCount = qs('#pantry-count');
        const emptyState = qs('#empty-pantry');

        if (!tbody) return;

        // Update count
        if (pantryCount) {
            pantryCount.textContent = this.pantryItems.length;
        }

        // Show/hide empty state
        if (this.pantryItems.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (pantryTable) pantryTable.classList.add('hidden');
            tbody.innerHTML = '';
            this.updateSelectedActionsDisplay();
            return;
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            if (pantryTable) pantryTable.classList.remove('hidden');
        }

        // Render pantry items as table rows
        tbody.innerHTML = this.pantryItems.map(item => this.createTableRowHTML(item)).join('');

        // Add event listeners to new elements
        this.attachItemEventListeners();
    }

    createTableRowHTML(item) {
        const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
        const isExpiringSoon = expiryDate && this.isExpiringSoon(expiryDate);
        const isExpired = expiryDate && expiryDate < new Date();
        
        const statusClass = isExpired ? 'expired' : isExpiringSoon ? 'expiring-soon' : '';
        const expiryText = expiryDate 
            ? (isExpired ? 'Expired' : 'Expires') + ': ' + this.formatDate(expiryDate)
            : 'No expiry';

        return `
            <tr class="pantry-row ${statusClass}" data-item-id="${item.id}">
                <td class="checkbox-col">
                    <input type="checkbox" class="item-checkbox" data-item-id="${item.id}" aria-label="Select ${item.name}">
                </td>
                <td class="name-col">${this.escapeHtml(item.name)}</td>
                <td class="quantity-col">${item.quantity} ${item.unit}</td>
                <td class="expiry-col" title="${expiryText}">${expiryText}</td>
                <td class="added-col">${this.formatDate(new Date(item.addedDate))}</td>
                <td class="actions-col">
                    <button class="btn-icon edit-item" data-item-id="${item.id}" title="Edit">
                        <span class="icon">✏️</span>
                    </button>
                </td>
            </tr>
        `;
    }

    attachItemEventListeners() {
        // Item checkboxes
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        itemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = e.target.getAttribute('data-item-id');
                if (e.target.checked) {
                    this.selectedItems.add(itemId);
                } else {
                    this.selectedItems.delete(itemId);
                }
                this.updateSelectedActionsDisplay();
                this.updateSelectAllCheckbox();
            });
        });

        // Edit item buttons 
        const editButtons = document.querySelectorAll('.edit-item');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = btn.getAttribute('data-item-id');
                this.editItem(itemId);
            });
        });
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = qs('#select-all-checkbox');
        if (!selectAllCheckbox) return;

        const totalItems = this.pantryItems.length;
        const selectedCount = this.selectedItems.size;

        if (selectedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedCount === totalItems) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.indeterminate = true;
        }
    }

    selectAllItems(selectAll) {
        this.selectedItems.clear();
        if (selectAll) {
            this.pantryItems.forEach(item => {
                this.selectedItems.add(item.id);
            });
        }
        
        // Update all checkboxes
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        itemCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
        });

        this.updateSelectedActionsDisplay();
    }

    updateSelectedActionsDisplay() {
        const selectedActionsDiv = qs('#selected-actions');
        const selectedCountSpan = qs('#selected-count');

        if (!selectedActionsDiv) return;

        if (this.selectedItems.size > 0) {
            selectedActionsDiv.classList.remove('hidden');
            if (selectedCountSpan) {
                selectedCountSpan.textContent = this.selectedItems.size;
            }
        } else {
            selectedActionsDiv.classList.add('hidden');
        }
    }

    addSelectedToShoppingList() {
        if (this.selectedItems.size === 0) {
            this.showMessage('Please select items first', 'error');
            return;
        }

        const selectedItemsList = this.pantryItems.filter(item => this.selectedItems.has(item.id));
        const itemsStr = selectedItemsList.map(item => `${item.quantity} ${item.unit} ${item.name}`).join(', ');
        
        this.showMessage(`Added ${this.selectedItems.size} item(s) to shopping list: ${itemsStr}`, 'success');
        
        // TODO: Implement actual shopping list integration
        // For now, this just shows a message
    }

    removeSelectedItems() {
        if (this.selectedItems.size === 0) {
            this.showMessage('Please select items first', 'error');
            return;
        }

        const itemCount = this.selectedItems.size;
        const message = itemCount === 1 
            ? 'Are you sure you want to remove this item from your pantry?' 
            : `Are you sure you want to remove ${itemCount} items from your pantry?`;

        if (confirm(message)) {
            try {
                // Remove selected items
                this.selectedItems.forEach(itemId => {
                    authManager.removeFromPantry(itemId);
                });

                // Update local list
                this.pantryItems = this.pantryItems.filter(item => !this.selectedItems.has(item.id));
                this.selectedItems.clear();
                
                this.updatePantryDisplay();
                this.showMessage(`Removed ${itemCount} item(s) from pantry`, 'success');
            } catch (error) {
                this.showMessage(error.message, 'error');
            }
        }
    }

    clearSelection() {
        this.selectedItems.clear();
        const itemCheckboxes = document.querySelectorAll('.item-checkbox');
        itemCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        const selectAllCheckbox = qs('#select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        this.updateSelectedActionsDisplay();
    }

    handleAddIngredient(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const ingredient = {
            name: formData.get('name')?.trim(),
            quantity: parseFloat(formData.get('quantity')) || 1,
            unit: formData.get('unit')?.trim() || 'item',
            expiryDate: formData.get('expiryDate') || null
        };

        if (!ingredient.name) {
            this.showMessage('Please enter an ingredient name', 'error');
            return;
        }

        try {
            const addedItem = authManager.addToPantry(ingredient);
            this.pantryItems.push(addedItem);
            this.sortByName(); 
            this.updatePantryDisplay();
            this.showMessage(`Added ${ingredient.name} to your pantry!`, 'success');
            event.target.reset();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    editItem(itemId) {
        const item = this.pantryItems.find(item => item.id === itemId);
        if (!item) return;

        // Prompt for new name
        const newName = prompt(`Edit name:`, item.name);
        if (newName === null) return;

        // Prompt for new quantity
        const newQuantity = prompt(`Edit quantity for ${newName}:`, item.quantity);
        if (newQuantity === null) return; 

        // Prompt for new unit
        const newUnit = prompt(`Edit unit for ${newName}:`, item.unit);
        if (newUnit === null) return; 

        // Prompt for new expiry date (format: YYYY-MM-DD)
        const currentExpiryDate = item.expiryDate ? item.expiryDate.split('T')[0] : '';
        const newExpiryDate = prompt(`Edit expiry date for ${newName}: (YYYY-MM-DD, leave blank for none)`, currentExpiryDate);
        if (newExpiryDate === null) return; 
        
        if (newName && newQuantity && newUnit) {
            try {
                item.name = newName.trim();
                item.quantity = parseFloat(newQuantity) || item.quantity;
                item.unit = newUnit.trim() || item.unit;
                item.expiryDate = newExpiryDate ? newExpiryDate : null;
                
                authManager.updateUserData();
                this.sortByName(); 
                this.updatePantryDisplay();
                this.showMessage('Item updated successfully', 'success');
            } catch (error) {
                this.showMessage(error.message, 'error');
            }
        }
    }

    filterPantry(searchTerm) {
        const rows = document.querySelectorAll('.pantry-row');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const nameCell = row.querySelector('.name-col');
            if (nameCell) {
                const itemName = nameCell.textContent.toLowerCase();
                if (itemName.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    }

    sortPantry(sortBy) {
        switch (sortBy) {
            case 'name':
                this.pantryItems.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'expiry':
                this.pantryItems.sort((a, b) => {
                    if (!a.expiryDate && !b.expiryDate) return 0;
                    if (!a.expiryDate) return 1;
                    if (!b.expiryDate) return -1;
                    return new Date(a.expiryDate) - new Date(b.expiryDate);
                });
                break;
            case 'added':
                this.pantryItems.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));
                break;
            default:
                this.sortByName();
        }
        
        this.clearSelection();
        this.updatePantryDisplay();
    }

    isExpiringSoon(expiryDate) {
        const today = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);
        
        return expiryDate >= today && expiryDate <= threeDaysFromNow;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(message, type = 'info') {
        let messageContainer = qs('#message-container');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.className = 'message-container';
            document.body.appendChild(messageContainer);
        }

        messageContainer.innerHTML = `
            <div class="message ${type}">
                <span>${message}</span>
                <button class="message-close">&times;</button>
            </div>
        `;
        
        messageContainer.classList.remove('hidden');
        const closeBtn = messageContainer.querySelector('.message-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                messageContainer.classList.add('hidden');
            });
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageContainer.classList.add('hidden');
        }, 3000);
    }
}

// Initialize pantry manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PantryManager();
});

export { PantryManager };