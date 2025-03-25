/**
 * script.js
 * =========
 * Carga "productos.xlsx" → lee configuración (brand, colores, placeholder), emojis de categoría,
 * parsea productos (columnas obligatorias: name, description, category, price, images),
 * convierte columnas adicionales en variantes dinámicas,
 * renderiza catálogo filtrable y buscable,
 * muestra modal de detalle con carousel de imágenes + variantes,
 * administra carrito dinámico (add/remove) → genera pedido formateado para WhatsApp.
 */

// Elementos DOM principales
const loading = document.getElementById('loading-indicator');
const categoryButtons = document.getElementById('category-buttons');
const resetFilterBtn = document.getElementById('reset-filter');
const productsContainer = document.getElementById('products-container');
const searchInput = document.getElementById('search-input');
const logoEl = document.querySelector('.logo');
const categoryFilters = document.getElementById('category-filters');
const sendBtn = document.getElementById('send-whatsapp');
const openCartBtn = document.getElementById('open-cart');
const emptyCartMessage = document.getElementById('empty-cart-message');

// Variables globales
let products = [], 
    filtered = [], 
    emojis = {}, 
    cart = JSON.parse(localStorage.getItem('cart') || '[]'), 
    currentCategory = null;
let currentIndex = 0, 
    currentList = [];

let clients = [];

/**
 * Inicialización: enlaza eventos y carga el Excel
 */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Configurar event listeners
  resetFilterBtn.onclick = () => applyFilter(null);
  searchInput.oninput = searchProducts;
  sendBtn.onclick = sendOrder;
  openCartBtn.onclick = () => {
    renderCart();
    document.getElementById('cart-modal').classList.remove('hidden');
  };
  
  // Cerrar modales con Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('product-modal').classList.add('hidden');
      document.getElementById('cart-modal').classList.add('hidden');
    }
  });
  
  // Cerrar modales al hacer clic en backdrop
  document.querySelectorAll('.modal-backdrop').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('product-modal').classList.add('hidden');
      document.getElementById('cart-modal').classList.add('hidden');
    });
  });
  
  // Cerrar modales con botones de cierre
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.add('hidden');
    });
  });
  
  // Cargar datos
  await loadExcel();
}

/**
 * Carga y parsea el archivo Excel
 */
async function loadExcel() {
  loading.style.display = 'flex';
  try {
    const resp = await fetch('productos.xlsx');
    const data = new Uint8Array(await resp.arrayBuffer());
    const wb = XLSX.read(data, { type: 'array' });

    // Aplicar configuración y cargar datos
    applyConfig(wb);
    loadEmojis(wb);
    loadClients(wb);
    populateClientSelect();

    products = parseProducts(wb);
    filtered = [...products];

    // Renderizar interfaz
    renderCategories();
    renderProducts();
    categoryFilters.style.display = 'block';
    updateCartBadge();
  } catch (err) {
    console.error('Error al cargar el Excel:', err);
    alert('Error al cargar los productos: ' + err.message);
  } finally {
    loading.style.display = 'none';
  }
}


function applyConfig(wb) {

  const cfgSheet = wb.SheetNames.find(n => /configuracion/i.test(n));
  if (!cfgSheet) return;
  const cfg = XLSX.utils.sheet_to_json(wb.Sheets[cfgSheet])[0] || {};
  

  // Brand name (texto) dentro de <h1 class="logo"><a>
  const brandLink = document.querySelector('.brand .logo a');
  if (cfg.BrandName) brandLink.textContent = cfg.BrandName;

  // Hero dinámico
  const heroSection = document.querySelector('.hero');
  const heroTitleEl = document.querySelector('.hero-content h1');
  const heroDescEl  = document.querySelector('.hero-content p');

  if (cfg.HeroImage) {
    if (cfg.HeroImage.startsWith('#')) {
      heroSection.style.background = cfg.HeroImage;
    } else {
      heroSection.style.background = `url(${cfg.HeroImage}) center/cover no-repeat`;
    }
  }

  if (cfg.HeroTitle) heroTitleEl.textContent = cfg.HeroTitle;
  if (cfg.HeroDescription) heroDescEl.textContent = cfg.HeroDescription;
  
  // Background fallback color
  if (cfg.HeroBackgroundColor && !cfg.HeroImage) {
    heroSection.style.background = cfg.HeroBackgroundColor;
  }


  // Configurar logo/nombre
  if (cfg.BrandName) logoEl.textContent = cfg.BrandName;
  if (cfg.LogoURL) logoEl.innerHTML = `<img src="${cfg.LogoURL}" alt="${cfg.BrandName}" style="height:2rem">`;
  if (cfg.SearchPlaceholder) searchInput.placeholder = cfg.SearchPlaceholder;
  
  // Configurar colores
  const root = document.documentElement.style;
  if (cfg.PrimaryColor) root.setProperty('--primary', cfg.PrimaryColor);
  if (cfg.PrimaryDarkColor) root.setProperty('--primary-dark', cfg.PrimaryDarkColor);
  if (cfg.SecondaryColor) root.setProperty('--secondary', cfg.SecondaryColor);
  if (cfg.AccentColor) root.setProperty('--accent', cfg.AccentColor);
}

/**
 * Carga emojis de categorías desde hoja "categoryemojis"
 * @param {Object} wb - Workbook de Excel
 */
function loadEmojis(wb) {
  const sheet = wb.SheetNames.find(n => /categoryemojis/i.test(n));
  if (!sheet) return;
  
  XLSX.utils.sheet_to_json(wb.Sheets[sheet]).forEach(r => {
    if (r.Category && r.Emoji) emojis[r.Category] = r.Emoji;
  });
}

/**
 * Parsea hoja "productos" a array de objetos con variantes dinámicas
 * @param {Object} wb - Workbook de Excel
 * @returns {Array} Array de productos
 */
function parseProducts(wb) {
  const sheetName = wb.SheetNames.find(n => /productos/i.test(n));
  if (!sheetName) throw new Error('Hoja "Productos" no encontrada.');
  
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  const reserved = ['id','Id','name','Name','description','Description','category','Category','price','Price','images','Images'];

  return rows.map(r => {
    // Procesar imágenes
    const images = String(r.images || r.Images || '')
      .split(',')
      .map(i => i.trim())
      .filter(Boolean) || ['images/placeholder.png'];

    // Procesar variantes dinámicas
    const variants = {};
    Object.entries(r).forEach(([key, val]) => {
      if (!reserved.includes(key) && val) {
        variants[key] = String(val).split(',').map(x => x.trim());
      }
    });

    // Retornar objeto de producto normalizado
    return {
      id: String(r.id || r.Id || Date.now()),
      name: r.name || r.Name || 'Producto sin nombre',
      description: r.description || r.Description || '',
      category: r.category || r.Category || 'Sin categoría',
      price: parseFloat(r.price || r.Price) || 0,
      images,
      variants
    };
  });
}




const heroSheet = wb.SheetNames.find(n => /hero/i.test(n));
if (heroSheet) {
  const cfg = XLSX.utils.sheet_to_json(wb.Sheets[heroSheet])[0] || {};

  const heroEl      = document.querySelector('.hero');
  const titleEl     = document.querySelector('.hero-title');
  const descEl      = document.querySelector('.hero-desc');
  const btnEl       = document.querySelector('.hero-btn');

  if (cfg.HeroImage) heroEl.style.setProperty('--hero-bg', `url(${cfg.HeroImage})`);
  if (cfg.HeroOverlayColor) document.documentElement.style.setProperty('--hero-overlay-color', cfg.HeroOverlayColor);
  if (cfg.HeroTextColor)      document.documentElement.style.setProperty('--hero-text-color', cfg.HeroTextColor);
  if (cfg.HeroButtonBgColor)  document.documentElement.style.setProperty('--hero-button-bg', cfg.HeroButtonBgColor);
  if (cfg.HeroButtonTextColor)document.documentElement.style.setProperty('--hero-button-text', cfg.HeroButtonTextColor);
  if (cfg.HeroButtonHoverColor) document.documentElement.style.setProperty('--hero-button-hover', cfg.HeroButtonHoverColor);

  titleEl.textContent       = cfg.HeroTitle       || titleEl.textContent;
  descEl.textContent        = cfg.HeroDescription || descEl.textContent;
  btnEl.textContent         = cfg.HeroButtonText  || '';
  btnEl.href                = cfg.HeroButtonUrl   || '#';
  btnEl.style.display       = cfg.HeroButtonText ? 'inline-block' : 'none';
}

/**
 * Renderiza botones de categoría
 */
function renderCategories() {
  categoryButtons.innerHTML = '';
  
  // Obtener categorías únicas
  const categories = [...new Set(products.map(p => p.category))];
  
  // Crear botones para cada categoría
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `category-button${cat === currentCategory ? ' active' : ''}`;
    btn.innerHTML = `${emojis[cat] || '🏷️'} <span>${cat}</span>`;
    btn.onclick = () => applyFilter(cat);
    categoryButtons.appendChild(btn);
  });
}

/**
 * Aplica filtro por categoría y re-renderiza productos
 * @param {string|null} cat - Categoría a filtrar, null para mostrar todas
 */
function applyFilter(cat) {
  currentCategory = cat;
  filtered = cat ? products.filter(p => p.category === cat) : [...products];
  resetFilterBtn.style.display = cat ? 'inline-flex' : 'none';
  renderCategories();
  renderProducts();
}

/**
 * Filtrado en vivo por búsqueda
 */
function searchProducts() {
  const q = searchInput.value.trim().toLowerCase();
  
  // Filtrar productos por búsqueda y categoría actual
  filtered = products.filter(p =>
    (!currentCategory || p.category === currentCategory) &&
    (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  );
  
  renderProducts();
}

/**
 * Renderiza grid de productos
 */
function renderProducts() {
  productsContainer.innerHTML = '';
  
  // Crear tarjeta para cada producto
  filtered.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${p.images[0]}" alt="${p.name}" class="product-image" loading="lazy"/>
      </div>
      <div class="product-info-container">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-price">$${p.price.toFixed(2)}</p>
      </div>`;
    
    // Abrir modal al hacer clic
    card.onclick = () => showProductDetail(filtered[i]);
    productsContainer.appendChild(card);
  });
}

/**
 * Muestra modal de detalle con carousel + variantes
 * @param {Object} product - Producto a mostrar
 */
function showProductDetail(product) {
  // Configurar carousel
  currentList = product.images; 
  currentIndex = 0;
  updateModalImage();
  
  // Llenar información del producto
  document.getElementById('modal-name').textContent = product.name;
  document.getElementById('modal-desc').textContent = product.description;
  document.getElementById('modal-price').textContent = `$${product.price.toFixed(2)}`;
  document.getElementById('modal-category').textContent = product.category;
  
  // Construir miniaturas y variantes
  buildThumbnails();
  buildVariants(product.variants);
  
  // Resetear cantidad
  document.getElementById('modal-quantity').value = 1;
  
  // Configurar botón de agregar al carrito
  document.getElementById('add-to-cart').onclick = () => addToCart(product);
  
  // Mostrar modal
  document.getElementById('product-modal').classList.remove('hidden');
}

/**
 * Construye miniaturas para el carousel
 */
function buildThumbnails() {
  const cont = document.querySelector('.modal-thumbnails');
  cont.innerHTML = '';
  
  // Crear miniatura para cada imagen
  currentList.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Miniatura';
    img.classList.toggle('active', i === currentIndex);
    img.onclick = () => { 
      currentIndex = i; 
      updateModalImage(); 
    };
    cont.appendChild(img);
  });
}

/**
 * Actualiza imagen principal del carousel
 */
function updateModalImage() {
  document.getElementById('modal-image').src = currentList[currentIndex];
  document.getElementById('modal-image').alt = `Imagen ${currentIndex + 1}`;
  
  // Actualizar estado activo de miniaturas
  document.querySelectorAll('.modal-thumbnails img').forEach((t, i) =>
    t.classList.toggle('active', i === currentIndex)
  );
}

/**
 * Construye select o span para variantes
 * @param {Object} vars - Objeto de variantes
 */
function buildVariants(vars) {
  const cont = document.getElementById('modal-variants');
  cont.innerHTML = '';
  
  // Crear elemento para cada variante
  Object.entries(vars).forEach(([name, opts]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'variant-wrapper';
    
    const label = document.createElement('label');
    label.textContent = name;
    wrapper.appendChild(label);
    
    // Si hay múltiples opciones, crear select
    if (opts.length > 1) {
      const select = document.createElement('select');
      select.id = `variant-${name}`;
      select.name = name;
      
      opts.forEach(o => {
        const option = document.createElement('option');
        option.value = o;
        option.textContent = o;
        select.appendChild(option);
      });
      
      wrapper.appendChild(select);
    } else {
      // Si hay una sola opción, mostrar como texto
      const span = document.createElement('span');
      span.className = 'variant-single';
      span.textContent = opts[0];
      wrapper.appendChild(span);
    }
    
    cont.appendChild(wrapper);
  });
}

/**
 * Navega carousel
 * @param {number} step - Dirección de navegación (-1 o 1)
 */
function changeImage(step) {
  currentIndex = (currentIndex + step + currentList.length) % currentList.length;
  updateModalImage();
}

/**
 * Cierra modal detalle
 */
function closeModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

/**
 * Ajusta cantidad en el selector de cantidad
 * @param {number} change - Cantidad a ajustar (-1 o 1)
 */
function adjustQuantity(change) {
  const input = document.getElementById('modal-quantity');
  const newValue = Math.max(1, parseInt(input.value) + change);
  input.value = newValue;
}

/**
 * Añade item al carrito
 * @param {Object} product - Producto a añadir
 */
function addToCart(product) {
  // Recopilar variantes seleccionadas
  const selected = {};
  Object.keys(product.variants).forEach(k => {
    const variantEl = document.getElementById(`variant-${k}`);
    selected[k] = variantEl ? variantEl.value : product.variants[k][0];
  });
  
  // Obtener cantidad
  const qty = Math.max(1, parseInt(document.getElementById('modal-quantity').value, 10));
  
  // Añadir al carrito
  cart.push({ 
    id: product.id,
    name: product.name, 
    variants: selected, 
    qty, 
    price: product.price,
    image: product.images[0]
  });
  
  // Guardar en localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Notificar al usuario
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-check-circle"></i>
      <span>Producto agregado al carrito</span>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Eliminar notificación después de 3 segundos
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
  
  // Cerrar modal y actualizar carrito
  closeModal();
  renderCart();
  updateCartBadge();
}

/**
 * Renderiza modal carrito
 */
function renderCart() {
  const list = document.getElementById('cart-items');
  list.innerHTML = '';
  let total = 0;

  // Mostrar/ocultar mensaje de carrito vacío
  if (cart.length === 0) {
    emptyCartMessage.style.display = 'flex';
    document.querySelector('.cart-container').style.display = 'none';
  } else {
    emptyCartMessage.style.display = 'none';
    document.querySelector('.cart-container').style.display = 'block';
    
    // Crear elemento para cada item del carrito
    cart.forEach((item, i) => {
      const line = item.price * item.qty;
      total += line;

      const li = document.createElement('li');
      li.className = 'cart-item';
      
      // Información del producto
      const infoDiv = document.createElement('div');
      infoDiv.className = 'cart-item-info';
      infoDiv.innerHTML = `
        <strong>${item.name}</strong>
        ${Object.entries(item.variants).map(([k,v]) => `<small>${k}: ${v}</small>`).join(' • ')}
      `;
      
      // Acciones (cantidad, precio, eliminar)
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'cart-item-actions';
      
      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.value = item.qty;
      qtyInput.className = 'cart-qty-input';
      qtyInput.addEventListener('change', () => updateCartItem(i, qtyInput.value));
      
      const priceSpan = document.createElement('span');
      priceSpan.className = 'cart-line-price';
      priceSpan.textContent = `$${line.toFixed(2)}`;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'cart-remove';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.addEventListener('click', () => removeFromCart(i));
      
      actionsDiv.appendChild(qtyInput);
      actionsDiv.appendChild(priceSpan);
      actionsDiv.appendChild(removeBtn);
      
      li.appendChild(infoDiv);
      li.appendChild(actionsDiv);
      list.appendChild(li);
    });
  }

  // Actualizar total
  document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

/**
 * Elimina item del carrito
 * @param {number} idx - Índice del item a eliminar
 */
function removeFromCart(idx) {
  cart.splice(idx, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartBadge();
}

/**
 * Actualiza cantidad de un item del carrito
 * @param {number} index - Índice del item
 * @param {number|string} newQty - Nueva cantidad
 */
function updateCartItem(index, newQty) {
  cart[index].qty = Math.max(1, parseInt(newQty, 10));
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartBadge();
}

/**
 * Actualiza badge del carrito
 */
function updateCartBadge() {
  const cartCount = document.querySelector('.cart-count');
  cartCount.textContent = cart.length;
  
  // Mostrar/ocultar botón de WhatsApp
  sendBtn.classList.toggle('hidden', cart.length === 0);
}

/**
 * Arma texto WhatsApp y abre chat
 */
function sendOrder() {
  if (!cart.length) {
    alert('El carrito está vacío');
    return;
  }
  
  const name = prompt('¿Cómo te llamas?') || 'Cliente';
  let total = 0;
  let text = `Hola, soy ${name}. Te paso mi pedido:%0A%0A`;
  
  // Construir mensaje con items del carrito
  cart.forEach((item, i) => {
    const lineTotal = item.price * item.qty;
    total += lineTotal;
    
    text += `*${i+1}.* ${item.name} (${item.qty}x $${item.price.toFixed(2)})%0A`;
    Object.entries(item.variants).forEach(([k,v]) => text += `• ${k}: ${v}%0A`);
    text += `• Subtotal: $${lineTotal.toFixed(2)}%0A%0A`;
  });
  
  // Añadir total
  text += `*TOTAL: $${total.toFixed(2)}*%0A%0A`;
  text += `Gracias!`;
  
  // Abrir WhatsApp
  // window.open(`https://wa.me/?text=${text}`, '_blank');

  const phone = sendBtn.dataset.whatsapp.replace(/\D/g,'');
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  
}

// Configurar event listeners para navegación del carousel
document.getElementById('prev-img').onclick = () => changeImage(-1);
document.getElementById('next-img').onclick = () => changeImage(1);

// Añadir estilos dinámicos para notificaciones
const style = document.createElement('style');
style.textContent = `
  .notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary);
    color: white;
    padding: 12px 20px;
    border-radius: 50px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideUp 0.3s ease;
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .notification.fade-out {
    opacity: 0;
    transform: translate(-50%, 10px);
    transition: all 0.3s ease;
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`;
document.head.appendChild(style);


function loadClients(wb) {
  const sheet = wb.SheetNames.find(n => /clientes/i.test(n));
  if (!sheet) return;
  clients = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
}

function populateClientSelect() {
  const select = document.getElementById('client-select');
  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.ClientPhone;
    opt.textContent = `${c.ClientName} — ${c.ClientAddress}`;
    opt.dataset.name = c.ClientName;
    opt.dataset.address = c.ClientAddress;
    select.appendChild(opt);
  });
}
document.getElementById('client-search').addEventListener('input', e => {
  const query = e.target.value.toLowerCase().trim();
  const options = document.querySelectorAll('#client-select option');
  options.forEach(opt => {
    // Siempre mostrar la opción vacía
    if (!opt.value) return opt.hidden = false;
    opt.hidden = !opt.textContent.toLowerCase().includes(query);
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
