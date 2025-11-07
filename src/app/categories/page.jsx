"use client";
import { useEffect, useState } from "react";

export default function CategoriesPage() {
  const [name, setName] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/categories", { cache: "no-store" });
    const data = await res.json();
    setList(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setName("");
      setMsg("✅ Categoría creada");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data?.error || "❌ Error creando categoría");
    }
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-4 pt-10">
      <div className="w-full max-w-md space-y-4">
        <form className="card p-5" onSubmit={createCategory}>
          <h1 className="text-slate-900 font-bold text-2xl mb-3 text-center">Crear categoría</h1>

          <label className="label">Nombre de la categoría</label>
          <input
            className="input-base w-full mb-2"
            placeholder="Ej. Skincare"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <button className="btn-primary w-full mt-2">Crear</button>

          {msg && <p className="alert-soft mt-3">{msg}</p>}
        </form>

        <div className="card p-5">
          <h2 className="text-slate-900 font-semibold text-lg mb-3">Categorías existentes</h2>

          {loading && <p className="text-xs text-slate-700">Cargando...</p>}

          {!loading && list.length === 0 && (
            <p className="text-xs text-slate-600">No hay categorías aún.</p>
          )}

          {!loading && list.length > 0 && (
            <ul className="space-y-2">
              {list.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-slate-900 text-sm">
                  <span>{c.name}</span>
                  <span className="badge">ID {c.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
