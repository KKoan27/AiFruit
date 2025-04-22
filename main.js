// Variáveis globais
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;

// DOM Elements
const productGrid = document.getElementById('product-grid');
const categoryGrid = document.getElementById('category-grid');
const categoryFilter = document.getElementById('category-filter');
const sortBy = document.getElementById('sort-by');
const loginBtn = document.getElementById('login-btn');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.querySelector('.cart-count');
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const closeModals = document.querySelectorAll('.close-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Função para buscar produtos da API
async function fetchProducts() {
  try {
    const response = await fetch('http://localhost/API/Controllers/ProductController.php');
    if (!response.ok) throw new Error('Erro ao carregar produtos');
    const data = await response.json();
    products = data.data;
    renderProducts(products);
  } catch (error) {
    console.error('Erro:', error);
    productGrid.innerHTML = '<p class="error">Erro ao carregar produtos. Tente novamente mais tarde.</p>';
  }
}

// Função para buscar categorias da API
async function fetchCategories() {
  try {
    const response = await fetch('http://localhost/api/categories');
    if (!response.ok) throw new Error('Erro ao carregar categorias');
    const data = await response.json();
    categories = data.data;
    renderCategories(categories);
    populateCategoryFilter(categories);
  } catch (error) {
    console.error('Erro:', error);
  }
}

// Função para renderizar produtos usando .map()
function renderProducts(productsToRender) {
  if (productsToRender.length === 0) {
    productGrid.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
    return;
  }

  productGrid.innerHTML = productsToRender.map(product => `
    <div class="product-card" data-id="${product.id}">
      ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
      <img src="${product.image_url || 'https://via.placeholder.com/300'}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-meta">
          <span class="price">R$ ${product.price.toFixed(2)}</span>
          <div class="rating">
            ${renderRating(product.rating)}
            <span>(${product.reviews || 0})</span>
          </div>
        </div>
        <p class="product-description">${product.description || 'Descrição não disponível'}</p>
        <div class="product-actions">
          <button class="btn-cart" data-id="${product.id}">
            <i class="fas fa-shopping-cart"></i> Adicionar
          </button>
          <button class="btn-favorite" data-id="${product.id}">
            <i class="far fa-heart"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Adiciona event listeners aos botões
  document.querySelectorAll('.btn-cart').forEach(btn => {
    btn.addEventListener('click', addToCart);
  });

  document.querySelectorAll('.btn-favorite').forEach(btn => {
    btn.addEventListener('click', toggleFavorite);
  });
}

// Função para renderizar categorias
function renderCategories(categories) {
  categoryGrid.innerHTML = categories.map(category => `
    <div class="category-item" data-id="${category.id}">
      <img src="${category.image_url || 'https://via.placeholder.com/300'}" alt="${category.name}">
      <h3>${category.name}</h3>
    </div>
  `).join('');

  // Adiciona event listeners às categorias
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      const categoryId = item.getAttribute('data-id');
      filterProductsByCategory(categoryId);
    });
  });
}

// Função para popular o filtro de categorias
function populateCategoryFilter(categories) {
  categoryFilter.innerHTML = `
    <option value="0">Todas Categorias</option>
    ${categories.map(category => `
      <option value="${category.id}">${category.name}</option>
    `).join('')}
  `;
}

// Função para renderizar avaliação em estrelas
function renderRating(rating) {
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating || 0) % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return `
    ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
    ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
    ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
  `;
}

// Função para filtrar produtos por categoria
function filterProductsByCategory(categoryId) {
  if (categoryId === '0') {
    renderProducts(products);
    return;
  }

  const filteredProducts = products.filter(product => product.category_id == categoryId);
  renderProducts(filteredProducts);
}

// Função para ordenar produtos
function sortProducts(sortType) {
  let sortedProducts = [...products];
  
  switch(sortType) {
    case 'name':
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'price_asc':
      sortedProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      sortedProducts.sort((a, b) => b.price - a.price);
      break;
    default:
      break;
  }
  
  renderProducts(sortedProducts);
}

// Função para adicionar ao carrinho
function addToCart(e) {
  const productId = e.currentTarget.getAttribute('data-id');
  const product = products.find(p => p.id == productId);
  
  if (!product) return;
  
  const existingItem = cart.find(item => item.id == productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }
  
  updateCart();
  showToast('Produto adicionado ao carrinho!');
}

// Função para atualizar o carrinho
function updateCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
}

// Função para alternar favorito
function toggleFavorite(e) {
  const btn = e.currentTarget;
  btn.classList.toggle('active');
  btn.innerHTML = btn.classList.contains('active') ? 
    '<i class="fas fa-heart"></i>' : 
    '<i class="far fa-heart"></i>';
}

// Função para mostrar toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Função para login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'login',
        email,
        password
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = JSON.parse(atob(data.token));
      localStorage.setItem('userToken', data.token);
      loginModal.style.display = 'none';
      showToast('Login realizado com sucesso!');
      updateUserUI();
    } else {
      throw new Error(data.message || 'Erro no login');
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast(error.message);
  }
}

// Função para registro
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  
  try {
    const response = await fetch('http://localhost/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'register',
        name,
        email,
        password
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      registerModal.style.display = 'none';
      showToast('Registro realizado com sucesso! Faça login.');
      loginModal.style.display = 'block';
    } else {
      throw new Error(data.message || 'Erro no registro');
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast(error.message);
  }
}

// Função para atualizar UI do usuário
function updateUserUI() {
  if (currentUser) {
    loginBtn.innerHTML = `<i class="fas fa-user-check"></i>`;
    loginBtn.title = currentUser.name;
  } else {
    loginBtn.innerHTML = `<i class="fas fa-user"></i>`;
    loginBtn.title = 'Login';
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  fetchCategories();
  updateCart();
  
  // Verifica se há usuário logado
  const token = localStorage.getItem('userToken');
  if (token) {
    try {
      currentUser = JSON.parse(atob(token));
      updateUserUI();
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
    }
  }
});

categoryFilter.addEventListener('change', (e) => {
  filterProductsByCategory(e.target.value);
});

sortBy.addEventListener('change', (e) => {
  sortProducts(e.target.value);
});

loginBtn.addEventListener('click', (e) => {
  e.preventDefault();
  loginModal.style.display = 'block';
});

cartBtn.addEventListener('click', (e) => {
  e.preventDefault();
  // Aqui você pode redirecionar para a página do carrinho
  showToast('Redirecionando para o carrinho...');
});

showRegister.addEventListener('click', (e) => {
  e.preventDefault();
  loginModal.style.display = 'none';
  registerModal.style.display = 'block';
});

showLogin.addEventListener('click', (e) => {
  e.preventDefault();
  registerModal.style.display = 'none';
  loginModal.style.display = 'block';
});

closeModals.forEach(btn => {
  btn.addEventListener('click', () => {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target === loginModal) loginModal.style.display = 'none';
  if (e.target === registerModal) registerModal.style.display = 'none';
});

loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);

// Adiciona estilo para o toast
const style = document.createElement('style');
style.textContent = `
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 1000;
  }
  .toast.show {
    opacity: 1;
  }
`;
document.head.appendChild(style);