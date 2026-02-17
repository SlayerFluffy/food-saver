import { authManager, requireAuth } from './auth.mjs';
import { qs } from './utils.mjs';

function normalizeShoppingList(list) {
  if (!Array.isArray(list)) return [];

  return list.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `legacy-${index}`,
        name: item,
        amount: 0,
        unit: ''
      };
    }

    return {
      id: item.id || `item-${index}`,
      name: item.name || '',
      amount: item.amount || 0,
      unit: item.unit || ''
    };
  }).filter(item => item.name);
}

function saveShoppingList(items) {
  const currentUser = authManager.getCurrentUser();
  if (!currentUser) return;

  currentUser.shoppingList = items;
  authManager.updateUserData();
}

function renderShoppingList(items) {
  const listContainer = qs('#shopping-list-items');
  const emptyState = qs('#shopping-list-empty');

  if (!listContainer) return;

  if (!items.length) {
    listContainer.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  listContainer.innerHTML = items.map(item => {
    const amountText = item.amount > 0 ? `${item.amount}` : '';
    const unitText = item.unit ? ` ${item.unit}` : '';
    return `
      <div class="shopping-item">
        <label class="shopping-item-check">
          <input type="checkbox" class="shopping-item-checkbox" data-id="${item.id}">
        </label>
        <div class="shopping-item-text">
          <span class="shopping-item-amount">${amountText}${unitText}</span>
          <span class="shopping-item-name">${item.name}</span>
        </div>
        <button class="btn btn-secondary shopping-item-remove" data-id="${item.id}" aria-label="Remove ${item.name}">Remove</button>
      </div>
    `;
  }).join('');
}

function setupShoppingList() {
  if (!requireAuth()) return;

  const form = qs('#shopping-list-form');
  const nameInput = qs('#shopping-item-name');
  const amountInput = qs('#shopping-item-amount');
  const unitInput = qs('#shopping-item-unit');
  const addToPantryBtn = qs('#add-to-pantry-btn');

  let items = normalizeShoppingList(authManager.getShoppingList());
  renderShoppingList(items);

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = nameInput ? nameInput.value.trim() : '';
      const amount = amountInput ? parseFloat(amountInput.value) : 0;
      const unit = unitInput ? unitInput.value.trim() : '';

      if (!name) {
        alert('Please enter an ingredient name.');
        return;
      }

      const newItem = {
        id: `manual-${Date.now()}`,
        name,
        amount: Number.isFinite(amount) ? amount : 0,
        unit
      };

      items = [newItem, ...items];
      saveShoppingList(items);
      renderShoppingList(items);

      if (nameInput) nameInput.value = '';
      if (amountInput) amountInput.value = '';
      if (unitInput) unitInput.value = '';
    });
  }

  const listContainer = qs('#shopping-list-items');
  if (listContainer) {
    listContainer.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.classList.contains('shopping-item-remove')) {
        const id = target.dataset.id;
        items = items.filter(item => item.id !== id);
        saveShoppingList(items);
        renderShoppingList(items);
      }
    });
  }

  if (addToPantryBtn) {
    addToPantryBtn.addEventListener('click', () => {
      const currentUser = authManager.getCurrentUser();
      if (!currentUser) return;

      const checked = listContainer
        ? Array.from(listContainer.querySelectorAll('.shopping-item-checkbox:checked'))
        : [];

      if (checked.length === 0) {
        alert('Select at least one item to add to your pantry.');
        return;
      }

      const pantryItems = Array.isArray(currentUser.pantry) ? [...currentUser.pantry] : [];
      const addedDate = new Date().toISOString();

      const idsToRemove = new Set();

      checked.forEach((input, index) => {
        const id = input.dataset.id;
        const item = items.find(entry => entry.id === id);
        if (!item) return;

        idsToRemove.add(id);

        const unit = item.unit || '';
        const quantity = item.amount > 0 ? item.amount : 1;
        const existing = pantryItems.find(pantryItem => (
          pantryItem.name.toLowerCase() === item.name.toLowerCase() && (pantryItem.unit || '') === unit
        ));

        if (existing) {
          existing.quantity = (existing.quantity || 0) + quantity;
          existing.addedDate = addedDate;
        } else {
          pantryItems.push({
            id: `pantry-${Date.now()}-${index}`,
            name: item.name,
            quantity,
            unit,
            addedDate,
            expiryDate: null
          });
        }
      });

      currentUser.pantry = pantryItems;
      authManager.updateUserData();

      items = items.filter(item => !idsToRemove.has(item.id));
      saveShoppingList(items);
      renderShoppingList(items);

      checked.forEach(input => {
        input.checked = false;
      });

      alert(`Added ${checked.length} item(s) to your pantry.`);
    });
  }
}

document.addEventListener('DOMContentLoaded', setupShoppingList);
