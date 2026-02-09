// wrapper for querySelector
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

// pull in templates for header and footer to build as modules for all pages.
export async function loadTemplate(path) {
  const res = await fetch(path);
  const template = await res.text();
  return template;
}

// render from a template function. Set template to parent element.
export function renderWithTemplate(template, parentElement, data, callback) {
  parentElement.innerHTML = template;
  if (callback) {
    callback(data);
  }
}

// use loadTemplate to grab header and footer html files, select elements in index files, then render from template
export async function loadHeaderFooter() {
  const headerTemplate = await loadTemplate('/partials/headerElement.html');
  const footerTemplate = await loadTemplate('/partials/footer.html');
  const headerElement = qs('#main-header');
  const footerElement = qs('#main-footer');

  renderWithTemplate(headerTemplate, headerElement);
  renderWithTemplate(footerTemplate, footerElement);
}

// get and set local storage

export function getLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}

export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// add event listeners
export function setClick(selector, callback) {
  qs(selector).addEventListener("touchend", (event) => {
    event.preventDefault();
    callback();
  });
  qs(selector).addEventListener("click", (event) => {
    event.preventDefault();
    callback();
  });
}