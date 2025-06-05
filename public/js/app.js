document.addEventListener('DOMContentLoaded', function() {
  // Variables globales
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Elementos del DOM
  const cartCount = document.getElementById('cart-count');
  const cartModal = document.getElementById('cart-modal');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  const closeModal = document.querySelector('.close');
  
  // Inicializar
  updateCartCount();
  loadProducts();
  setupEventListeners();
  
  // Cargar productos desde la API
  async function loadProducts() {
    try {
      const response = await fetch('/api/products');
      const products = await response.json();
      renderProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }
  
  // Renderizar productos
  function renderProducts(products) {
    const productsContainer = document.querySelector('.productos-grid');
    
    products.forEach(product => {
      const productElement = document.createElement('div');
      productElement.className = 'mates';
      productElement.dataset.aos = 'fade-up';
      productElement.dataset.aosDuration = '1200';
      productElement.innerHTML = `
        <div class="imagen-container">
          <img src="${product.images[0]}" alt="${product.name}">
        </div>
        <h1>${product.name}</h1>
        <h1>$${product.price.toLocaleString('es-AR')}</h1>
        <button class="btn-comprar add-to-cart" data-id="${product._id}">COMPRAR</button>
      `;
      productsContainer.appendChild(productElement);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', addToCart);
    });
  }
  
  // Agregar al carrito
  function addToCart(e) {
    const productId = e.target.dataset.id;
    const productName = e.target.parentElement.querySelector('h1').textContent;
    const productPrice = parseFloat(e.target.parentElement.querySelector('h1:nth-of-type(2)').textContent.replace('$', '').replace('.', ''));
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: productPrice,
        quantity: 1
      });
    }
    
    updateCart();
    showCartNotification(productName);
  }
  
  // Actualizar carrito
  function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
  }
  
  // Actualizar contador del carrito
  function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
    cartCount.style.display = count > 0 ? 'flex' : 'none';
  }
  
  // Renderizar items del carrito
  function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p>Tu carrito está vacío</p>';
      cartTotal.textContent = '$0';
      checkoutBtn.disabled = true;
      return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;
      
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>$${item.price.toLocaleString('es-AR')} x ${item.quantity}</p>
        </div>
        <div class="cart-item-actions">
          <span>$${itemTotal.toLocaleString('es-AR')}</span>
          <button class="btn-remove" data-id="${item.id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
      cartItemsContainer.appendChild(cartItem);
    });
    
    cartTotal.textContent = `$${total.toLocaleString('es-AR')}`;
    checkoutBtn.disabled = false;
    
    // Agregar event listeners a los botones de eliminar
    document.querySelectorAll('.btn-remove').forEach(button => {
      button.addEventListener('click', removeFromCart);
    });
  }
  
  // Eliminar del carrito
  function removeFromCart(e) {
    const productId = e.target.closest('.btn-remove').dataset.id;
    cart = cart.filter(item => item.id !== productId);
    updateCart();
  }
  
  // Mostrar notificación de producto añadido
  function showCartNotification(productName) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
      <p>¡${productName} añadido al carrito!</p>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // Procesar pago con MercadoPago
  async function processPayment() {
    try {
      // Convertir carrito a formato de MercadoPago
      const items = cart.map(item => ({
        id: item.id,
        title: item.name,
        description: item.name,
        picture_url: '', // Agregar URL de imagen
        category_id: 'art', // Categoría genérica
        quantity: item.quantity,
        unit_price: item.price
      }));
      
      // Datos de envío (ajustar según necesidad)
      const shipping = {
        cost: 0, // Envío gratuito o calcular costo
        mode: 'not_specified',
        receiver_address: {
          zip_code: '5000', // Código postal de Córdoba
          street_name: 'Blvd. Pte. Arturo Umberto Illia',
          street_number: '235'
        }
      };
      
      // Datos del comprador (se pueden capturar en un formulario)
      const payer = {
        name: 'Comprador',
        surname: 'Surate',
        email: 'test_user_123456@testuser.com',
        phone: {
          area_code: '351',
          number: '2174433'
        },
        address: {
          zip_code: '5000',
          street_name: 'Blvd. Pte. Arturo Umberto Illia',
          street_number: '235'
        }
      };
      
      const response = await fetch('/api/payments/create_preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items, shipping, payer })
      });
      
      const data = await response.json();
      
      // Redirigir a MercadoPago
      window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.id}`;
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Ocurrió un error al procesar el pago. Por favor, intenta nuevamente.');
    }
  }
  
  // Configurar event listeners
  function setupEventListeners() {
    // Abrir modal del carrito
    document.getElementById('cart-icon').addEventListener('click', () => {
      cartModal.style.display = 'block';
    });
    
    // Cerrar modal del carrito
    closeModal.addEventListener('click', () => {
      cartModal.style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
      if (e.target === cartModal) {
        cartModal.style.display = 'none';
      }
    });
    
    // Botón de checkout
    checkoutBtn.addEventListener('click', processPayment);
    
    // Botón de cambiar tema
    document.querySelector('.theme-toggle-btn').addEventListener('click', toggleTheme);
    
    // Botón para volver arriba
    window.addEventListener('scroll', () => {
      const btn = document.getElementById('btn-volver-arriba');
      if (window.scrollY > 300) {
        btn.style.display = 'block';
      } else {
        btn.style.display = 'none';
      }
    });
    
    document.getElementById('btn-volver-arriba').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  // Cambiar tema claro/oscuro
  function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-toggle-btn i');
    
    if (body.classList.contains('dark-theme')) {
      body.classList.remove('dark-theme');
      themeIcon.classList.remove('bi-sun');
      themeIcon.classList.add('bi-moon-stars');
      localStorage.setItem('theme', 'light');
    } else {
      body.classList.add('dark-theme');
      themeIcon.classList.remove('bi-moon-stars');
      themeIcon.classList.add('bi-sun');
      localStorage.setItem('theme', 'dark');
    }
  }
  
  // Aplicar tema guardado
  function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeIcon = document.querySelector('.theme-toggle-btn i');
    
    if (savedTheme === 'dark') {
      body.classList.add('dark-theme');
      themeIcon.classList.remove('bi-moon-stars');
      themeIcon.classList.add('bi-sun');
    }
  }
  
  // Inicializar tema al cargar
  applySavedTheme();
});
