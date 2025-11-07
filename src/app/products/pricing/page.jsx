"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "../../../components/ToastProvider";

function CreateProductForm({ categories, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // Subida a Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "cixi_products"); // reemplaza con tu preset
    const res = await fetch("https://api.cloudinary.com/v1_1/doh7f2dbo/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploadedImageUrl(data.secure_url);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        price: price === "" ? null : Number(price),
        stock: stock === "" ? 0 : Number(stock),
        categoryId: categoryId !== "" ? Number(categoryId) : null,
        image: uploadedImageUrl,
      };
      console.log("Body a enviar:", body);

      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      // Resetear formulario
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategoryId("");
      setImageFile(null);
      setImagePreview(null);
      setUploadedImageUrl(null);

      await onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <h3 className="text-slate-900 font-semibold text-lg">Crear producto</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="input-base"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input-base"
        >
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Precio"
          className="input-base"
        />
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Cantidad"
          className="input-base"
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full input-base"
        />

        {imagePreview && (
          <img
            src={imagePreview}
            alt="Vista previa"
            className="w-32 h-32 object-cover rounded shadow mt-2"
          />
        )}
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        rows={3}
        className="w-full input-base"
      />

      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "Creando..." : "Crear"}
      </button>
    </form>
  );
}

function CommentsAdminBox({ productId, inline = false }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const toast = useToast();

  const load = async () => {
    const res = await fetch(`/api/products/${productId}/comments`, { cache: 'no-store' });
    const data = await res.json();
    setList(Array.isArray(data?.comments) ? data.comments : []);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const remove = async (commentId) => {
    if (!confirm('¿Eliminar comentario?')) return;
    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || `Error ${res.status}`);
        return;
      }
      toast.success('Comentario eliminado');
      await load();
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <div className={inline ? "mt-0" : "mt-3"}>
      <button onClick={() => setOpen(v => !v)} className="btn-secondary">{open ? 'Ocultar' : 'Ver'} comentarios</button>
      {open && (
        <ul className="mt-2 space-y-2">
          {list.length === 0 ? (
            <li className="text-xs text-slate-600">Sin comentarios</li>
          ) : (
            list.map(c => (
              <li key={c.id} className="card p-3 text-xs text-slate-700 flex items-start justify-between gap-3">
                <div>
                  <div className="opacity-80">{c.content}</div>
                  <div className="opacity-60 mt-1">{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <button onClick={() => remove(c.id)} className="btn-primary text-xs">Borrar</button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function ProductRow({ p, onChanged, isAdmin }) {
  const [price, setPrice] = useState(p.price ?? 0);
  const [stock, setStock] = useState(p.stock ?? 0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const save = async () => {
    setLoading(true);
    try {
      await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(price), stock: Number(stock) }),
      });
      await onChanged();
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || `Error ${res.status}`);
        return;
      }
      toast.success('Producto eliminado');
      await onChanged();
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="card p-3 md:p-4 text-slate-900">
      {/* Encabezado a ancho completo: nombre y descripción */}
      <div className="mb-2 md:mb-3">
        <div className="font-semibold text-[#623645] text-sm md:text-base">{p.name}</div>
        <div className="text-xs text-slate-600 text-clip-2 mt-0.5">{p.description || "Sin descripción"}</div>
      </div>

      <div className="product-row">
        {/* Imagen */}
        <div>
          {p.image ? (
            <img src={p.image} alt={p.name} className="img-thumb" />
          ) : (
            <div className="img-thumb" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#94a3b8'}}>Sin imagen</div>
          )}
        </div>

        {/* Detalles */}
        <div className="min-w-0">
          <div className="text-xs text-slate-600">{p.category ? `Categoría: ${p.category.name}` : "Sin categoría"}</div>
          {!isAdmin && (
            <div className="mt-1 space-y-0.5">
              <div className="kv"><b>Precio:</b>{p.price != null ? `$${p.price}` : "—"}</div>
              <div className="kv"><b>Disponible:</b>{p.stock != null ? p.stock : 0}</div>
            </div>
          )}
        </div>

        {/* Acciones */}
        {isAdmin && (
          <div className="product-actions">
            <span className="text-xs text-slate-700">Precio:</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="input-base input-sm w-24"
            />
            <span className="text-xs text-slate-700">Stock:</span>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              placeholder="Cantidad"
              className="input-base input-sm w-24"
            />
            <button onClick={save} disabled={loading} className="btn-primary">
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={remove} disabled={loading} className="btn-primary">
              {loading ? "Eliminando..." : "Eliminar"}
            </button>
            <CommentsAdminBox productId={p.id} inline />
          </div>
        )}
      </div>
    </li>
  );
}

export default function PricingPage() {
  const { data: session } = useSession();

  useEffect(() => {
    console.log("Sesión frontend:", session);
  }, [session]);
  const isAdmin = session?.user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadProducts() {
    const res = await fetch("/api/products", { cache: "no-store" });
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
  }

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Filtrar productos por categoría y por término de búsqueda (nombre, descripción o categoría)
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredByCategory = selectedCategoryId
    ? products.filter((p) => p.categoryId === selectedCategoryId)
    : products;

  const filteredProducts = filteredByCategory.filter((p) => {
    if (!normalizedSearch) return true;
    const name = (p.name || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();
    const cat = (p.category?.name || "").toLowerCase();
    return (
      name.includes(normalizedSearch) ||
      desc.includes(normalizedSearch) ||
      cat.includes(normalizedSearch)
    );
  });

  // ===== Export helpers (admin only) =====
  const csvEscape = (val) => {
    if (val == null) return "";
    const s = String(val).replace(/"/g, '""');
    if (/[",\n]/.test(s)) return `"${s}"`;
    return s;
  };

  const exportCSV = async () => {
    try {
      const rows = filteredProducts; // export what is currently filtered
      const headers = [
        "ID","Nombre","Categoría","Descripción","Precio","Disponible","Promedio","Calificaciones","Imagen"
      ];
      const lines = [headers.join(",")];
      rows.forEach((p) => {
        const line = [
          csvEscape(p.id),
          csvEscape(p.name),
          csvEscape(p.category?.name || ""),
          csvEscape(p.description || ""),
          csvEscape(p.price ?? ""),
          csvEscape(p.stock ?? 0),
          csvEscape(typeof p.averageRating === 'number' ? p.averageRating.toFixed(2) : ''),
          csvEscape(Array.isArray(p.ratings) ? p.ratings.length : 0),
          csvEscape(p.image || "")
        ].join(",");
        lines.push(line);
      });
      const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const fname = `productos_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}.csv`;
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("No se pudo exportar CSV");
    }
  };

  const exportPDF = () => {
    try {
      const rows = filteredProducts;
      const w = window.open("", "_blank");
      if (!w) return;
      const style = `
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial; color: #111827; }
          h1 { font-size: 18px; margin: 0 0 12px; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background:#fff5f7; color:#111827; }
          .muted { color:#64748b; }
        </style>`;
      const head = `<head><meta charset="utf-8"/>${style}<title>Productos</title></head>`;
      const header = `<h1>Listado de productos</h1>`;
      const thead = `
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Descripción</th>
          <th>Precio</th>
          <th>Disponible</th>
          <th>Promedio</th>
          <th># Calif.</th>
        </tr>`;
      const rowsHtml = rows.map(p => `
        <tr>
          <td>${p.id ?? ''}</td>
          <td>${p.name ?? ''}</td>
          <td>${p.category?.name ?? ''}</td>
          <td class="muted">${(p.description ?? '').replace(/</g,'&lt;')}</td>
          <td>${p.price ?? ''}</td>
          <td>${p.stock ?? 0}</td>
          <td>${typeof p.averageRating === 'number' ? p.averageRating.toFixed(2) : ''}</td>
          <td>${Array.isArray(p.ratings) ? p.ratings.length : 0}</td>
        </tr>`).join("");
      const html = `<!doctype html><html>${head}<body>${header}<table><thead>${thead}</thead><tbody>${rowsHtml}</tbody></table></body></html>`;
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    } catch (e) {
      console.error(e);
      alert("No se pudo generar el PDF");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Buscador (pequeño) + Botón Categorías fuera del navbar */}
      <div className="flex items-center justify-between gap-3 pt-10 px-6">
        {/* Export botones (solo admin) */}
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <a href="/kits" className="btn-secondary flex items-center gap-2" title="Crear kit">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Crear kit</span>
            </a>
            <button onClick={exportCSV} className="btn-primary flex items-center gap-2" title="Descargar CSV">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Descargar CSV</span>
            </button>
            <button onClick={exportPDF} className="btn-secondary flex items-center gap-2" title="Imprimir PDF">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>PDF</span>
            </button>
          </div>
        ) : <div />}
        {/* Buscador pequeño, visible para todos */}
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="w-56 input-base"
        />
        {/* Categorías button + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="rounded px-4 py-1 text-xs font-semibold shadow-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            aria-haspopup="listbox"
            aria-expanded={showCategories}
          >
            <span>Categorías</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`h-3 w-3 transition-transform duration-200 ${showCategories ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showCategories && (
            <ul className="absolute right-0 mt-1 bg-white border border-slate-200 rounded shadow-md max-h-48 overflow-auto w-48 text-slate-700 text-xs z-50">
              <li
                onClick={() => {
                  setSelectedCategoryId(null);
                  setShowCategories(false);
                }}
                className={`px-4 py-1 cursor-pointer hover-accent ${
                  selectedCategoryId === null ? "is-active-accent" : ""
                }`}
              >
                Ver todos
              </li>
              {categories.length === 0 ? (
                <li className="px-4 py-1 text-center">No hay categorías</li>
              ) : (
                categories.map((cat) => (
                  <li
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setShowCategories(false);
                    }}
                    className={`px-4 py-1 cursor-pointer hover-accent ${
                      selectedCategoryId === cat.id ? "is-active-accent" : ""
                    }`}
                  >
                    {cat.name}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-center pt-10 px-4">
        <div className="w-3/5 space-y-6">
          <h2 className="text-3xl text-slate-900 font-bold text-center">Productos</h2>

          {isAdmin && <CreateProductForm categories={categories} onCreated={loadProducts} />}

          {filteredProducts.length === 0 ? (
            <p className="text-xs text-slate-200 text-center mt-2">No hay productos disponibles.</p>
          ) : (
            <ul className="space-y-3">
              {filteredProducts.map((p) => (
                <ProductRow key={p.id} p={p} onChanged={loadProducts} isAdmin={isAdmin} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
