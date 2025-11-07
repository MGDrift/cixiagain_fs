"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { addCustomKitToCart } from "../../libs/cart";
import { useToast } from "../../components/ToastProvider";

export default function CreateKitPage() {
  const [name, setName] = useState("");
  const [paperType, setPaperType] = useState("");
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const toast = useToast();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const router = useRouter();

  const paperExtras = useMemo(() => ({
    "Mate 90g": 10,
    "Satinado 115g": 20,
    "Fotográfico": 30,
    "Reciclado": 15,
    "Bond": 5,
  }), []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    })();
  }, []);

  const toggle = (pId, checked) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) {
        next[pId] = next[pId] ?? 1;
      } else {
        delete next[pId];
      }
      return next;
    });
  };

  const setQty = (pId, v) => {
    setSelected((prev) => ({
      ...prev,
      [pId]: Math.max(1, Math.floor(Number(v) || 1)),
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Require login for creating kits (both admin and user flows)
    if (!session?.user?.id) {
      toast.info("Inicia sesión para crear un kit");
      router.push("/auth/login");
      return;
    }

    const items = Object.entries(selected).map(([productId, quantity]) => ({
      productId: Number(productId),
      quantity,
    }));

    if (items.length === 0) {
      toast.info("Selecciona al menos un producto para crear un kit");
      return; 
    }

    if (!name.trim()) {
      toast.warn("Ingresa un nombre para el kit");
      return;
    }

    setLoading(true);
    try {
      if (isAdmin) {
        // Admin: persist as real Kit
        const res = await fetch("/api/kits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), items, paperType: paperType || null }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.error || `Error ${res.status}`);
          return;
        }
        setName("");
        setPaperType("");
        setSelected({});
        setMessage("");
        toast.success("Kit creado y publicado");
        // Opcional: ir al home para ver el kit en la lista (usuarios lo verán allí)
        router.push("/");
      } else {
        // Usuario: no persiste; arma kit y agrega al carrito con extra por papel
        const chosen = Object.entries(selected).map(([productId, quantity]) => {
          const p = products.find((x) => x.id === Number(productId));
          return {
            productId: Number(productId),
            name: p?.name ?? `Prod ${productId}`,
            unitPrice: Number(p?.price || 0),
            quantity,
          };
        });
        const extraFee = paperType ? (paperExtras[paperType] || 0) : 0;
        const r = addCustomKitToCart({ name: name.trim(), items: chosen, paperType: paperType || null, extraFee });
        if (!r.ok) {
          toast.error("No se pudo agregar el kit al carrito");
          return;
        }
        setName("");
        setPaperType("");
        setSelected({});
        setMessage("");
        toast.success("Tu kit fue agregado al carrito");
        router.push("/cart");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-white">

      {/* Contenido */}
      <div className="flex justify-center pt-10 px-4 pb-16">
        <div className="w-3/5 space-y-6">
          <h2 className="text-3xl text-white font-bold text-center">Crear kit</h2>

          <form onSubmit={submit} className="card p-4 space-y-4">
            <div>
              <label className="block text-[#623645] text-sm font-semibold mb-1">Nombre del kit</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Kit de baño"
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
                    <li
                      key={p.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between shadow-sm"
                    >
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
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-4 py-2 text-sm"
              >
                {loading ? "Creando..." : "Crear kit"}
              </button>
            </div>

            {message && (
              <p className="text-center text-slate-700 text-sm font-semibold">{message}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
