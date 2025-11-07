"use client";

const CART_KEY = "cart_v1";

export function getCart() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}


export function addToCart(item) {
  const cart = getCart();

  if (!item || typeof item.id === "undefined") {
    return { ok: false, reason: "invalid-item" };
  }
  if (typeof item.stock === "number" && item.stock <= 0) {
    return { ok: false, reason: "no-stock" };
  }

  const idx = cart.findIndex((x) => x.id === item.id);

  if (idx > -1) {
    const max = typeof item.stock === "number" ? item.stock : (cart[idx].stock ?? 9999);
    if ((cart[idx].qty ?? 1) >= max) {
      return { ok: false, reason: "stock-limit" };
    }
    cart[idx].qty = (cart[idx].qty ?? 1) + 1;
    if (typeof item.stock === "number") cart[idx].stock = item.stock;
    if (typeof item.price === "number") cart[idx].price = item.price;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price || 0,
      qty: 1,
      stock: typeof item.stock === "number" ? item.stock : undefined,
    });
  }

  saveCart(cart);
  return { ok: true };
}

export function setQty(id, qty) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.id === id);
  if (idx > -1) {
    const n = Math.max(1, Number(qty) || 1);
    cart[idx].qty = n;
    saveCart(cart);
  }
  return getCart();
}

export function removeFromCart(id) {
  const cart = getCart().filter((x) => x.id !== id);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
  return [];
}

export function addKitToCart(kit) {
  const cart = getCart();

  const lineId = `kit-${kit.id}`;
  const total = (Array.isArray(kit.items) ? kit.items : []).reduce((acc, it) => {
    const price = Number(it?.product?.price || 0);
    const qty = Number(it?.quantity || 0);
    return acc + price * qty;
  }, 0);

  const idx = cart.findIndex((x) => x.id === lineId);
  if (idx > -1) {
    cart[idx].qty += 1;
  } else {
    cart.push({
      id: lineId,
      type: "kit",
      name: `Kit: ${kit.name}`,
      price: total,  
      qty: 1,
      detail: kit.items?.map((it) => ({
        productId: it.productId,
        name: it.product?.name,
        unitPrice: it.product?.price,
        quantity: it.quantity,
      })) || [],
    });
  }

  saveCart(cart);
  return { ok: true };
}

// Add a custom (non-persisted) kit to cart, with optional paperType and extra fee
export function addCustomKitToCart({ name, items, paperType, extraFee = 0 }) {
  const cart = getCart();

  const lineId = `kit-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const base = (Array.isArray(items) ? items : []).reduce((acc, it) => {
    const price = Number(it?.unitPrice || 0);
    const qty = Number(it?.quantity || 0);
    return acc + price * qty;
  }, 0);
  const total = base + Number(extraFee || 0);

  cart.push({
    id: lineId,
    type: "customKit",
    name: `Kit: ${name || "Personalizado"}`,
    price: total,
    qty: 1,
    paperType: paperType || null,
    extraFee: Number(extraFee || 0),
    detail: (items || []).map((it) => ({
      productId: it.productId,
      name: it.name,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
    })),
  });

  saveCart(cart);
  return { ok: true };
}
