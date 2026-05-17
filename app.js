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
let carrito   = {}; // { id: { producto, cantidad } }

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
function agregarAlCarrito(id, cantidad) {
  const p = productos.find(x => x.id === id);
  if (!p || cantidad < 1) return;
carrito[id] = { producto: p, cantidad };
  renderCarrito();
}

function quitarDelCarrito(id) {
  delete carrito[id];
  renderCarrito();
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
    return;
  }

  bar.classList.add("visible");

lista.innerHTML = items.map(({ producto: p, cantidad }) => `
    <div class="carrito-item">
      <span class="ci-nombre">${p.nombre}</span>
      <span class="ci-cant">x${cantidad}</span>
      <span class="ci-precio">${formatPrecio(p.precio * cantidad)}</span>
      <button class="ci-remove" onclick="quitarDelCarrito(${p.id})">✕</button>
    </div>
    ${p.sinPromo ? `<div class="ci-sinpromo">⚠ No aplica a la promoción</div>` : ""}
  `).join("");

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
        ? (total / 500000) * 100
        : ((total - 500000) / 500000) * 100;
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

  const totalConDesc = desc.pct > 0 ? total * (1 - desc.pct / 100) : total;
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
}

function enviarPorWpp() {
  const items = Object.values(carrito);
  if (items.length === 0) return;

  const total = totalCarrito();
  const desc  = calcularDescuento(total);
  const totalConDesc = desc.pct > 0 ? total * (1 - desc.pct / 100) : total;
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

  document.getElementById("modal-nombre").textContent = p.nombre;
  document.getElementById("modal-precio").textContent = formatPrecio(p.precio);
  document.getElementById("modal-unidad").textContent = p.unidad;
  document.getElementById("modal-desc").textContent = p.descripcion || "";

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

  // qty
  const qtyInput = document.getElementById("modal-qty");
  qtyInput.value = paso;
  qtyInput.min = paso;
  qtyInput.step = paso;

  document.getElementById("modal-qty-minus").onclick = () => {
    qtyInput.value = Math.max(paso, +qtyInput.value - paso);
  };
  document.getElementById("modal-qty-plus").onclick = () => {
    qtyInput.value = Math.min(9999, +qtyInput.value + paso);
  };

  // botón agregar
  const addBtn = document.getElementById("modal-add-btn");
  addBtn.onclick = () => {
    agregarAlCarrito(p.id, +qtyInput.value);
    addBtn.innerHTML = "✓ Agregado";
    addBtn.classList.add("added");
    setTimeout(() => {
      addBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Agregar al carrito`;
      addBtn.classList.remove("added");
    }, 1500);
  };

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
  <div class="card-photo ${p.img ? "" : "img-error"}" data-fallback="${p.emoji || "🍽️"}" onclick="abrirModal(${p.id})" style="cursor:pointer">${badgeHtml}${imgTag}</div>
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
      <button class="add-btn" onclick="
      const input = this.closest('.card-bottom').querySelector('.qty-input');
      agregarAlCarrito(${p.id}, input ? +input.value : 1);
        this.innerHTML = '✓ Agregado';
        this.classList.add('added');
        setTimeout(() => { this.innerHTML = '<svg width=\\'15\\' height=\\'15\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2.5\\'><circle cx=\\'9\\' cy=\\'21\\' r=\\'1\\'/><circle cx=\\'20\\' cy=\\'21\\' r=\\'1\\'/><path d=\\'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6\\'/></svg> Agregar'; this.classList.remove('added'); }, 1500);
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        Agregar
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
  lista.forEach((p, i) => grid.appendChild(buildCardV2(p, i)));
}

// ── FILTRAR ──────────────────────────────────────────────────
function filtrar() {
  let lista = productos;
  if (catActiva !== "todos") lista = lista.filter(p => p.categoria === catActiva);
  if (busqueda.trim()) {
    const q = busqueda.toLowerCase();
    lista = lista.filter(p => p.nombre.toLowerCase().includes(q));
  }
  renderCards(lista);
}

// ── EVENTOS ──────────────────────────────────────────────────
document.getElementById("catPills").addEventListener("click", e => {
  const pill = e.target.closest(".pill");
  if (!pill) return;
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  pill.classList.add("active");
  catActiva = pill.dataset.cat;
  filtrar();
});

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
  .then(data => { productos = data; filtrar(); })
  .catch(() => {
    document.getElementById("grid").innerHTML =
      `<p style="padding:2rem;color:#888">Servir con: <code>npx serve .</code></p>`;
  });

  function filtrarDesdeFooter(cat) {
  catActiva = cat;
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  const pill = document.querySelector(`.pill[data-cat="${cat}"]`);
  if (pill) pill.classList.add("active");
  filtrar();
  document.querySelector(".filters-bar").scrollIntoView({ behavior: "smooth" });
}