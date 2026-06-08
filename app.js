// ── CATEGORÍAS ────────────────────────────────────────────────
const CATEGORIAS = [
  { id: "platos",    nombre: "",          img: "img/platos.png" },
  { id: "vasos_y_copas",     nombre: "",   img: "img/copas.png" },
  { id: "cubiertos", nombre: "",       img: "img/cubiertos.png" },
  { id: "combos",    nombre: "",   img: "img/combo.png" },
  { id: "bowls",     nombre: "",img: "img/bowls.png" },
  { id: "cafeteria", nombre: "",       img: "img/cafeteria.png" },
  { id: "fuentes",     nombre: "",      img: "img/fuente.png" },
  { id: "freidoras",     nombre: "",        img: "img/freidora.png" },
];

function renderCategorias() {
  const grid = document.getElementById("categorias-grid");
  if (!grid) return;
  grid.innerHTML = CATEGORIAS.map(cat => `
    <div class="cat-card" onclick="mostrarCategoria('${cat.id}', '${cat.nombre}')">
      <div class="cat-card-img" style="background-image:url('${cat.img}')">
        <div class="cat-card-overlay"></div>
        <div class="cat-card-nombre">${cat.nombre}</div>
      </div>
    </div>
  `).join("");

  // footer cats
  const footerCats = document.getElementById("footer-cats");
  if (footerCats) {
    footerCats.innerHTML = CATEGORIAS.map(cat =>
      `<li><a href="#" onclick="mostrarCategoria('${cat.id}', '${cat.nombre}')">${cat.nombre}</a></li>`
    ).join("");
  }
}

function mostrarHome() {
  document.getElementById("page-home").style.display = "block";
  document.getElementById("page-categoria").style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function mostrarCategoria(catId, catNombre) {
  document.getElementById("page-home").style.display = "none";
  document.getElementById("page-categoria").style.display = "block";
  document.getElementById("cat-page-titulo").textContent = catNombre;
  catActiva = catId;
  busqueda = "";
  document.getElementById("buscador").value = "";
  filtrar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleMenu() {
  document.getElementById("header-nav").classList.toggle("open");
}

// ── CONFIG ──────────────────────────────────────────────────
const WPP_NUMERO = "5491168660232"; 

// ── COLORES POR CATEGORÍA ────────────────────────────────────
const CAT_COLORS = {
  platos:    { bar: "#FFF", label: "#FFF" },
  cubiertos:     { bar: "#FFF", label: "#FFF" },
  vasos_y_copas:     { bar: "#FFF", label: "#FFF" },
  bowls: { bar: "#FFF", label: "#FFF" },
  cafeteria: { bar: "#FFF", label: "#FFF" },
  otros:     { bar: "#FFF", label: "#FFF" },
};

// ── ESTADO ───────────────────────────────────────────────────
let productos = [];
let catActiva = "todos";
let busqueda  = "";
let carrito = JSON.parse(localStorage.getItem("carrito") || "{}");

// limpiar items inválidos del localStorage
Object.keys(carrito).forEach(key => {
  if (!carrito[key] || !carrito[key].producto) delete carrito[key];
});
const isV2 = true;

// ── UTILS ────────────────────────────────────────────────────
function formatPrecio(n) {
  return "$\u202F" + n.toLocaleString("es-AR");
}

// ── CONFETI ───────────────────────────────────────────────────
function lanzarConfeti() {
  const colors = ["#C9922A", "#F0B942", "#C8FF00", "#fff", "#FF4D2E"];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement("div");
    el.style.cssText = `
      position: fixed;
      top: -10px;
      left: ${Math.random() * 100}vw;
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > .5 ? "50%" : "2px"};
      z-index: 99999;
      pointer-events: none;
      animation: confetiFall ${1.5 + Math.random() * 2}s ease forwards;
      animation-delay: ${Math.random() * .5}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

function mostrarNotifDescuento(pct) {
  let notif = document.getElementById("descuento-notif");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "descuento-notif";
    notif.className = "descuento-notif";
    document.body.appendChild(notif);
  }
  notif.textContent = `🎉 ¡Descuento del ${pct}% aplicado!`;
  notif.classList.add("show");
  setTimeout(() => notif.classList.remove("show"), 3000);
}

// ── CARRITO ───────────────────────────────────────────────────
function agregarAlCarrito(id, cantidad, precioOverride, medidaOverride) {
  const p = productos.find(x => x.id === id);
  if (!p || cantidad < 1) return;
  const precio = precioOverride || p.precio;
  const key = medidaOverride ? `${id}-${medidaOverride}` : String(id);
  carrito[key] = {
    producto: {
      ...p,
      precio,
      nombre: medidaOverride ? `${p.nombre} (${medidaOverride})` : p.nombre
    },
    cantidad
  };
  renderCarrito();
  
}

function quitarDelCarrito(key) {
  delete carrito[key];
  renderCarrito();
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function totalCarrito() {
  return Object.values(carrito).reduce((acc, { producto, cantidad }) => {
    return acc + producto.precio * cantidad;
  }, 0);
}

function totalConPromo() {
  return Object.values(carrito).reduce((acc, { producto, cantidad }) => {
    if (producto.sinPromo) return acc;
    return acc + producto.precio * cantidad;
  }, 0);
}

function cantidadItems() {
  return Object.values(carrito).reduce((acc, { cantidad }) => acc + cantidad, 0);
}

function calcularDescuento(total) {
  if (total >= 1000000) return { pct: 10, siguiente: null, falta: 0 };
  if (total >= 500000)  return { pct: 5, siguiente: 1000000, falta: 1000000 - total };
  return { pct: 0, siguiente: 500000, falta: 500000 - total };
}
  function cambiarCantidadBtn(btn) {
  const key = btn.dataset.key;
  const nuevaCantidad = +btn.dataset.cant;
  const paso = +btn.dataset.paso;
  if (!carrito[key]) return;
  if (nuevaCantidad < paso) {
    quitarDelCarrito(key);
    return;
  }
  carrito[key].cantidad = nuevaCantidad;
  renderCarrito();
}

function renderCarrito() {
  const bar     = document.getElementById("carrito-bar");
  const lista   = document.getElementById("carrito-lista");
  const totalEl = document.getElementById("carrito-total");
  const badge   = document.getElementById("carrito-badge");
  const wrap    = document.getElementById("descuento-wrap");
  const items   = Object.values(carrito);

  if (badge) {
    badge.textContent = cantidadItems();
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }

  if (items.length === 0) {
    bar.classList.remove("visible");
    renderCarrito._prevPct = 0;
    return;
  }

  bar.classList.add("visible");

lista.innerHTML = items.map(({ producto: p, cantidad }, i) => {
    const key = Object.keys(carrito)[i];
    const paso = p.paso || 1;
    return `
      <div class="carrito-item">
        <span class="ci-nombre">${p.nombre}</span>
        <div class="ci-qty-control">
          <button class="ci-qty-btn" data-key="${key}" data-cant="${cantidad - paso}" data-paso="${paso}" onclick="cambiarCantidadBtn(this)">−</button>
<span class="ci-cant">${cantidad}</span>
<button class="ci-qty-btn" data-key="${key}" data-cant="${cantidad + paso}" data-paso="${paso}" onclick="cambiarCantidadBtn(this)">+</button>
        </div>
        <span class="ci-precio">${formatPrecio(p.precio * cantidad)}</span>
        <button class="ci-remove" onclick="quitarDelCarrito('${key}')">✕</button>
      </div>
      ${p.sinPromo ? `<div class="ci-sinpromo">⚠ No aplica a la promoción</div>` : ""}
    `;
  }).join("");


  const total = totalCarrito();
  const desc  = calcularDescuento(totalConPromo());
  const prevPct = renderCarrito._prevPct || 0;

  if (desc.pct > prevPct) {
    lanzarConfeti();
    mostrarNotifDescuento(desc.pct);
  }
  renderCarrito._prevPct = desc.pct;

  if (wrap) {
    if (desc.siguiente) {
      const progreso = desc.pct === 0
        ? (totalConPromo() / 500000) * 100
        : ((totalConPromo() - 500000) / 500000) * 100;
      const labelMeta = desc.pct === 0 ? "5% de descuento" : "10% de descuento";
      wrap.innerHTML = `
        <div class="desc-info">
          <span>Te faltan <strong>${formatPrecio(desc.falta)}</strong> para ${labelMeta}</span>
        </div>
        <div class="desc-track">
          <div class="desc-fill" style="width: ${Math.min(progreso, 100)}%"></div>
        </div>
      `;
    } else {
      wrap.innerHTML = `
        <div class="desc-info desc-ok">
          <span>🎉 ¡Tenés <strong>10% de descuento</strong> aplicado!</span>
        </div>
      `;
    }
  }

  const basePromo = totalConPromo();
const baseNoPromo = total - basePromo;
const totalConDesc = desc.pct > 0 
  ? baseNoPromo + basePromo * (1 - desc.pct / 100) 
  : total;
const ahorro = total - totalConDesc;
  if (totalEl) totalEl.textContent = formatPrecio(totalConDesc);

  let ahorroEl = document.getElementById("carrito-ahorro");
  if (!ahorroEl) {
    ahorroEl = document.createElement("div");
    ahorroEl.id = "carrito-ahorro";
    ahorroEl.className = "desc-ahorro";
    totalEl.parentElement.appendChild(ahorroEl);
  }
  ahorroEl.textContent = desc.pct > 0
    ? `Ahorrás ${formatPrecio(ahorro)} (${desc.pct}% off)`
    : "";

  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function enviarPorWpp() {
  const items = Object.values(carrito);
  if (items.length === 0) return;

  const total = totalCarrito();
  const desc  = calcularDescuento(totalConPromo());
  const basePromo = totalConPromo();
  const baseNoPromo = total - basePromo;
  const totalConDesc = desc.pct > 0
    ? baseNoPromo + basePromo * (1 - desc.pct / 100)
    : total;
  const ahorro = total - totalConDesc;

  const lineas = items.map(({ producto: p, cantidad }) =>
    `• ${p.nombre} (${p.unidad}) x${cantidad} = ${formatPrecio(p.precio * cantidad)}`
  ).join("\n");

  const descTxt = desc.pct > 0
    ? `\n🎉 Descuento ${desc.pct}% aplicado: -${formatPrecio(ahorro)}`
    : "";
  const msg = `Hola! Quiero hacer el siguiente pedido:\n\n${lineas}${descTxt}\n\n*Total: ${formatPrecio(totalConDesc)}*\n\n¿Tienen todo disponible?`;
  window.open(`https://wa.me/${WPP_NUMERO}?text=${encodeURIComponent(msg)}`, "_blank");
}
// ── MODAL ─────────────────────────────────────────────────────
let productoModal = null;

function abrirModal(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  productoModal = p;

  const paso = p.paso || 1;
  let varActiva = p.variantes && p.variantes.length ? p.variantes[0] : null;

  document.getElementById("modal-nombre").textContent = p.nombre;
  document.getElementById("modal-unidad").textContent = p.unidad;
  document.getElementById("modal-desc").textContent = p.descripcion || "";

  // precio inicial
  document.getElementById("modal-precio").textContent = formatPrecio(varActiva ? varActiva.precio : p.precio);

  // variantes
  const varWrap = document.getElementById("modal-variantes");
  varWrap.innerHTML = "";
  if (p.variantes && p.variantes.length) {
    p.variantes.forEach((v, i) => {
      const btn = document.createElement("button");
      btn.className = "var-btn" + (i === 0 ? " activa" : "");
      btn.textContent = v.medida;
      btn.onclick = () => {
        varActiva = v;
        document.getElementById("modal-precio").textContent = formatPrecio(v.precio);
        document.querySelectorAll(".var-btn").forEach(b => b.classList.remove("activa"));
        btn.classList.add("activa");

        // actualizar precio y medida en la card
        const card = document.querySelector(`.card[data-id="${p.id}"]`);
        if (card) {
          card.querySelector(".price-num").textContent = formatPrecio(v.precio);
          const addBtn = card.querySelector(".add-btn");
          if (addBtn) {
            addBtn.dataset.precio = v.precio;
            addBtn.dataset.medida = v.medida;
          }
        }
      };
      varWrap.appendChild(btn);
    });
  }

  // badge
  const badgeMap = { "más vendido": "mas-vendido", "oferta": "oferta", "nuevo": "nuevo", "últimos": "ultimos" };
  const bw = document.getElementById("modal-badge-wrap");
  bw.innerHTML = p.badge
    ? `<div class="card-badge ${badgeMap[p.badge] || ""}">${p.badge}</div>`
    : "";

  // detalles
  const det = document.getElementById("modal-detalles");
  det.innerHTML = "";
  if (p.material) det.innerHTML += `<div class="modal-detalle-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9922A" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>${p.material}</div>`;
  if (p.medida)   det.innerHTML += `<div class="modal-detalle-item"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9922A" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>${p.medida}</div>`;

  // fotos
  const fotos = p.fotos && p.fotos.length ? p.fotos : (p.img ? [p.img] : []);
  const mainImg = document.getElementById("modal-foto-main");
  mainImg.src = fotos[0] || "";

  const mins = document.getElementById("modal-miniaturas");
  mins.innerHTML = "";
  if (fotos.length > 1) {
    fotos.forEach((f, i) => {
      const div = document.createElement("div");
      div.className = "modal-miniatura" + (i === 0 ? " activa" : "");
      div.innerHTML = `<img src="${f}" alt="">`;
      div.onclick = () => {
        mainImg.src = f;
        document.querySelectorAll(".modal-miniatura").forEach(m => m.classList.remove("activa"));
        div.classList.add("activa");
      };
      mins.appendChild(div);
    });
  }



  document.getElementById("modal-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

// cerrar con ESC
document.addEventListener("keydown", e => {
  if (e.key === "Escape") cerrarModal();
});
// ── CARD ──────────────────────────────────────────────────────
function buildCardV2(p, i) {
  const colors = CAT_COLORS[p.categoria] || { bar: "#8B5CF6", label: "#8B5CF6" };
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = p.id;

  
  const imgTag = p.img
  ? `<img src="${p.img}" alt="${p.nombre}" loading="lazy" onerror="this.parentElement.classList.add('img-error');this.style.display='none'">`
  : "";

  const badgeMap = {
  "más vendido": "mas-vendido",
  "oferta":      "oferta",
  "nuevo":       "nuevo",
  "últimos":     "ultimos",
};
const badgeHtml = p.badge
  ? `<div class="card-badge ${badgeMap[p.badge] || ""}">${p.badge}</div>`
  : "";
const paso = p.paso || 1;
const qtyHtml = `
  <div class="qty-control">
    <button class="qty-btn" onclick="this.nextElementSibling.value = Math.max(${paso}, +this.nextElementSibling.value - ${paso})">−</button>
    <input class="qty-input" type="number" value="${paso}" min="${paso}" step="${paso}" max="9999">
    <button class="qty-btn" onclick="this.previousElementSibling.value = Math.min(9999, +this.previousElementSibling.value + ${paso})">+</button>
  </div>
`;

card.innerHTML = `
  <div class="card-topbar" style="background:${colors.bar}"></div>
  <div class="card-photo ${p.img ? "" : "img-error"}" data-fallback="${p.emoji || "🍽️"}" onclick="abrirModal(${p.id})" style="cursor:pointer">
  ${badgeHtml}${imgTag}
  <div class="card-photo-hint">Ver más Info</div>
</div>
  <div class="card-inner">
    <div class="card-name">${p.nombre}</div>
    <div class="card-bottom">
      <div class="card-actions-row">
        <div class="card-price">
          <span class="price-num">${formatPrecio(p.precio)}</span>
          <span class="price-unit">${p.unidad}</span>
        </div>
        ${qtyHtml}
      </div>
<button class="add-btn ${p.sinStock ? 'sin-stock' : ''}" 
  ${p.sinStock ? 'disabled' : `onclick="
    const input = this.closest('.card-bottom').querySelector('.qty-input');
    const precio = +this.dataset.precio || ${p.precio};
    const medida = this.dataset.medida || null;
    agregarAlCarrito(${p.id}, input ? +input.value : 1, precio, medida);
    const original = this.innerHTML;
    this.innerHTML = '✓ Agregado';
    this.classList.add('added');
    setTimeout(() => { this.innerHTML = original; this.classList.remove('added'); }, 1500);
  "`}>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  ${p.sinStock ? 'Sin stock' : 'Agregar'}
</button>
    </div>
  </div>
`;
return card;
}

// ── RENDER CARDS ─────────────────────────────────────────────
function renderCards(lista) {
  const grid  = document.getElementById("grid");
  const empty = document.getElementById("empty");
  const label = document.getElementById("count-label");
  grid.innerHTML = "";

  if (lista.length === 0) {
    empty.style.display = "block";
    if (label) label.textContent = "";
    return;
  }

  empty.style.display = "none";
  if (label) label.textContent = `${lista.length} producto${lista.length !== 1 ? "s" : ""}`;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "100px" });

  lista.forEach((p, i) => {
    const card = buildCardV2(p, i);
    card.classList.add("card-hidden");
    grid.appendChild(card);
    observer.observe(card);
  });
}

// ── FILTRAR ──────────────────────────────────────────────────
function filtrar() {
  let lista = productos;
  if (catActiva !== "todos") lista = lista.filter(p => 
  Array.isArray(p.categoria) 
    ? p.categoria.includes(catActiva) 
    : p.categoria === catActiva
);
  if (busqueda.trim()) {
    const q = busqueda.toLowerCase();
    lista = lista.filter(p => p.nombre.toLowerCase().includes(q));
  }
  renderCards(lista);
}

// ── EVENTOS ──────────────────────────────────────────────────
const catPillsEl = document.getElementById("catPills");
if (catPillsEl) {
  catPillsEl.addEventListener("click", e => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    catActiva = pill.dataset.cat;
    filtrar();
  });
}

document.getElementById("buscador").addEventListener("input", e => {
  busqueda = e.target.value;
  filtrar();
});

// toggle detalle del carrito
document.getElementById("carrito-toggle").addEventListener("click", () => {
  document.getElementById("carrito-bar").classList.toggle("expanded");
});

// ── CARGA ─────────────────────────────────────────────────────
fetch("productos.json")
  .then(r => r.json())
  .then(data => { 
    productos = data; 
    renderCategorias();
    filtrar(); 
  })

  function filtrarDesdeFooter(cat) {
  catActiva = cat;
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  const pill = document.querySelector(`.pill[data-cat="${cat}"]`);
  if (pill) pill.classList.add("active");
  filtrar();
  document.querySelector(".filters-bar").scrollIntoView({ behavior: "smooth" });
}
