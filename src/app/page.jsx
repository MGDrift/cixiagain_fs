"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { addToCart } from "../libs/cart";
import { addKitToCart } from "../libs/cart";
import { useToast } from "../components/ToastProvider";

function CommentsBox({ productId, avg = 0, ratingCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [count, setCount] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const { data: session } = useSession();
  const toast = useToast();
  const [displayAvg, setDisplayAvg] = useState(Number(avg || 0));
  const [displayCount, setDisplayCount] = useState(Number(ratingCount || 0));

  useEffect(() => {
    setDisplayAvg(Number(avg || 0));
    setDisplayCount(Number(ratingCount || 0));
  }, [avg, ratingCount]);

  async function loadComments() {
    const res = await fetch(`/api/products/${productId}/comments`, { cache: "no-store" });
    const data = await res.json();
    setList(Array.isArray(data.comments) ? data.comments : []);
    setCount(Number(data.count || 0));
  }

  useEffect(() => {
    if (open) loadComments();
  }, [open]);

  const publish = async () => {
    const txt = content.trim();
    if (!txt) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: txt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      const created = await res.json();
      setList((prev) => [
        { id: created?.id ?? Math.random(), content: txt, createdAt: created?.createdAt ?? new Date().toISOString() },
        ...prev,
      ]);
      setCount((c) => c + 1);
      setContent("");
      setRating(0);
      toast.success("Comentario publicado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end w-full">
      {/* Fila superior: botón de comentarios */}
      <div className="flex items-center gap-3">
        <button onClick={() => setOpen((v) => !v)} className="btn-secondary">
          Comentarios ({count})
        </button>
      </div>
      {/* Estrellas debajo, alineadas a la derecha */}
      <div className="mt-1 flex items-center" title={rating ? `${rating} / 5` : "Calificar"}>
        {[1,2,3,4,5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`Calificar ${i} estrella${i>1?"s":""}`}
            className="p-0.5"
            onClick={async () => {
              if (!session?.user?.id) {
                toast.info("Inicia sesión para calificar");
                return;
              }
              setRating(i);
              try {
                const res = await fetch(`/api/ratings/create`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId, value: i })
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  toast.error(err?.error || `Error ${res.status}`);
                  return;
                }
                // refrescar promedio para este producto
                const pr = await fetch(`/api/products`, { cache: "no-store" });
                const list = await pr.json();
                const me = Array.isArray(list) ? list.find((x) => x.id === productId) : null;
                if (me) {
                  setDisplayAvg(Number(me.averageRating || 0));
                  setDisplayCount(Number((me.ratings || []).length || 0));
                }
                toast.success("¡Gracias por tu calificación!");
              } catch {
                toast.error("No se pudo guardar tu calificación");
              }
            }}
          >
            <span
              className="text-lg"
              style={{ color: i <= rating ? "#f7c3c9" : "rgb(148 163 184)" }}
            >
              {i <= rating ? "★" : "☆"}
            </span>
          </button>
        ))}
        <span className="ml-2 text-xs text-slate-600">{Number(displayAvg || 0).toFixed(1)} ({displayCount || 0})</span>
      </div>
      {open && (
        <div className="mt-3 w-full card p-4 text-slate-900">
          <div className="mb-3">
            <textarea
              rows={3}
              maxLength={500}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu comentario (máx. 500)"
              className="w-full input-base"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={publish}
                disabled={loading || content.trim().length === 0}
                className="btn-secondary"
              >
                {loading ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
          {list.length === 0 ? (
            <p className="text-xs text-slate-700">No hay comentarios aún.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c.id} className="card p-3">
                  <div className="text-xs text-slate-700">
                    <div className="opacity-80">{c.content}</div>
                    <div className="opacity-60 mt-1">{new Date(c.createdAt).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [kits, setKits] = useState([]);
  const fmt = useMemo(() => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }), []);
  const toast = useToast();

  async function loadProducts() {
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || `Error ${res.status}`);
        setProducts([]);
        return;
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar los productos");
      setProducts([]);
    }
  }

  async function loadKits() {
    const res = await fetch("/api/kits", { cache: "no-store" });
    const data = await res.json();
    setKits(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadProducts();
    loadKits();
  }, []);

  // Si es admin y entra al home, redirigir a /products/pricing
  useEffect(() => {
    if (isAdmin) {
      router.replace("/products/pricing");
    }
  }, [isAdmin, router]);

  const kitTotal = (k) =>
    (k.items || []).reduce((acc, it) => acc + (Number(it?.product?.price || 0) * Number(it?.quantity || 0)), 0);

  const deleteKit = async (id) => {
    if (!confirm("¿Eliminar este kit?")) return;
    try {
      const res = await fetch(`/api/kits/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || `Error ${res.status}`);
        return;
      }
      toast.success("Kit eliminado");
      await loadKits();
    } catch (e) {
      toast.error("No se pudo eliminar el kit");
    }
  };

  return (
  <div className="min-h-screen bg-white">

      {/* Productos */}
      <div className="flex justify-center pt-10 px-4">
        <div className="w-3/5 space-y-6">
          <h2 className="text-3xl text-slate-900 font-bold text-center">Nuestros Productos</h2>

          {products.length === 0 ? (
            <p className="text-xs text-slate-200 text-center mt-2">No hay productos disponibles.</p>
          ) : (
            <ul className="space-y-3">
              {products.map((p) => (
                <li key={p.id} className="card p-3 md:p-4 flex items-start gap-3 md:gap-4 text-slate-900">
                  {/* Miniatura con borde/acento igual a admin */}
                  <div className="flex-shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="img-thumb" />
                    ) : (
                      <div className="img-thumb" style={{display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#94a3b8'}}>Sin imagen</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#623645] text-sm md:text-base truncate">{p.name}</div>
                    <div className="text-xs text-slate-600">{p.category ? `Categoría: ${p.category.name}` : "Sin categoría"}</div>
                    <div className="text-xs text-slate-600 line-clamp-2">{p.description ? p.description : "Sin descripción"}</div>
                    <div className="text-xs text-slate-700 mt-1">
                      <div>Precio: {p.price != null ? fmt.format(p.price) : "—"}</div>
                      <div>Disponible: {p.stock != null ? p.stock : 0}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!isAdmin && (
                      <button
                        disabled={p.stock <= 0}
                        onClick={() => {
                          const r = addToCart({ id: p.id, name: p.name, price: p.price, stock: p.stock });
                          if (!r.ok) {
                            if (r.reason === "no-stock") toast.error("Sin stock disponible");
                            if (r.reason === "stock-limit") toast.warn("Alcanzaste el stock disponible");
                            return;
                          }
                            toast.success("Agregado al carrito");
                        }}
                        className="btn-primary"
                      >
                        Agregar al carrito
                      </button>
                    )}
                    <CommentsBox productId={p.id} avg={p.averageRating} ratingCount={(p.ratings || []).length} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* -------------------- KITS -------------------- */}
          <h2 className="text-3xl text-slate-900 font-bold text-center mt-10">Kits</h2>

          {kits.length === 0 ? (
            <p className="text-xs text-slate-200 text-center mt-2">Aún no hay kits.</p>
          ) : (
            <ul className="space-y-3">
              {kits.map((k) => (
                <li key={k.id} className="card p-4 flex flex-col md:flex-row justify-between gap-3 text-slate-900">
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-[#623645] text-lg">{k.name}</div>
                    <ul className="text-xs list-disc ml-4">
                      {(k.items || []).map((it) => (
                        <li key={it.id}>
                          {it.product?.name} × {it.quantity} {it.product?.price != null ? `( $${it.product.price} c/u )` : ""}
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs mt-1">Total del kit: {fmt.format(kitTotal(k))}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isAdmin && (
                      <button
                        onClick={() => {
                          const r = addKitToCart(k);
                          if (!r.ok) return;
                          toast.success("Kit agregado al carrito");
                        }}
                        className="btn-primary"
                      >
                        Agregar al carrito
                      </button>
                    )}

                    {isAdmin && (
                      <>
                        <a href={`/kits/${k.id}`} className="btn-primary">Editar</a>
                        <button onClick={() => deleteKit(k.id)} className="btn-primary">Eliminar</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
