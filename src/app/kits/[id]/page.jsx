"use client";

import { useEffect, useState } from "react";
import { useToast } from "../../../components/ToastProvider";

export default function EditKitPage({ params }) {
  const kitId = Number(params.id);
  const [kit, setKit] = useState(null);
  const [name, setName] = useState("");
  const [paperType, setPaperType] = useState("");
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const [kitRes, prodRes] = await Promise.all([
        fetch(`/api/kits/${kitId}`, { cache: "no-store" }),
        fetch("/api/products", { cache: "no-store" }),
      ]);
      const k = await kitRes.json();
      const ps = await prodRes.json();
      setKit(k);
      setName(k?.name || "");
  setPaperType(k?.paperType || "");
      setProducts(Array.isArray(ps) ? ps : []);
      // map inicial
      const init = {};
      (k?.items || []).forEach((it) => { init[it.productId] = it.quantity; });
      setSelected(init);
    })();
  }, [kitId]);

  const toggle = (pId, checked) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[pId] = next[pId] ?? 1;
      else delete next[pId];
      return next;
    });
  };

  const setQty = (pId, v) => {
    setSelected((prev) => ({ ...prev, [pId]: Math.max(1, Math.floor(Number(v) || 1)) }));
  };

  const save = async (e) => {
    e.preventDefault();
    const items = Object.entries(selected).map(([productId, quantity]) => ({
      productId: Number(productId),
      quantity,
    }));
  if (!name.trim()) { toast.warn("Nombre requerido"); return; }
  if (items.length === 0) { toast.info("Selecciona al menos un producto"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/kits/${kitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), items, paperType: paperType || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || `Error ${res.status}`);
        return;
      }
      toast.success("Kit actualizado");
      setTimeout(() => { window.location.href = "/"; }, 400);
    } finally {
      setLoading(false);
    }
  };

  if (!kit) return <div className="min-h-screen bg-[#b48696]" />;

  return (
    <div className="min-h-screen bg-white">

      <div className="flex justify-center pt-10 px-4 pb-16">
        <div className="w-3/5 space-y-6">
          <h2 className="text-3xl text-white font-bold text-center">Editar kit</h2>

          <form onSubmit={save} className="card p-4 space-y-4">
            <div>
              <label className="block text-[#623645] text-sm font-semibold mb-1">Nombre del kit</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white text-slate-700 text-sm px-3 py-2 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[#623645] text-sm font-semibold mb-1">Tipo de papel (opcional)</label>
              <select
                value={paperType}
                onChange={(e) => setPaperType(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white text-slate-700 text-sm px-3 py-2 shadow-sm"
              >
                <option value="">— Seleccionar —</option>
                <option value="Mate 90g">Mate 90g</option>
                <option value="Satinado 115g">Satinado 115g</option>
                <option value="Fotográfico">Fotográfico</option>
                <option value="Reciclado">Reciclado</option>
                <option value="Bond">Bond</option>
              </select>
            </div>

            <div>
              <div className="text-[#623645] text-sm font-semibold mb-2">Selecciona productos</div>
              <ul className="space-y-2">
                {products.map((p) => {
                  const checked = selected[p.id] != null;
                  const qty = selected[p.id] ?? 1;
                  return (
                    <li key={p.id} className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggle(p.id, e.target.checked)}
                          className="accent-[#623645]"
                        />
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="img-thumb-sm" />
                        ) : (
                          <div className="img-thumb-sm" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#94a3b8'}}>Sin</div>
                        )}
                        <div className="text-sm text-slate-700 min-w-0">
                          <div className="font-semibold text-[#623645] truncate max-w-[180px] md:max-w-xs">{p.name}</div>
                          <div className="kv"><b>Precio:</b>{p.price != null ? `$${p.price}` : "—"}</div>
                          <div className="kv"><b>Disponible:</b>{p.stock ?? 0}</div>
                        </div>
                      </div>
                      {checked && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#623645]">Cantidad</span>
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => setQty(p.id, e.target.value)}
                            className="w-20 text-center rounded-md border border-slate-300 bg-white text-slate-700 text-xs px-2 py-1 shadow-sm"
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary px-4 py-2 text-sm">
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
