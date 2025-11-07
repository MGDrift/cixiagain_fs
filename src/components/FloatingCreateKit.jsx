"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";

export default function FloatingCreateKit() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const isAdmin = session?.user?.role === "admin";

  // Hide on auth pages, kits builder itself, and admin management pages
  if (
    pathname?.startsWith("/auth") ||
    pathname === "/kits" ||
    pathname?.startsWith("/products/pricing") ||
    pathname?.startsWith("/categories")
  ) {
    return null;
  }

  // Optional: show to both roles; requirement focuses on user
  // We'll show for non-admin users only to avoid duplication with admin navbar link
  if (isAdmin) return null;

  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-40 btn-primary shadow-lg px-4 py-3 text-sm"
      title="Crear kit"
      onClick={() => {
        if (!session?.user?.id) {
          toast.info("Inicia sesión para crear un kit");
          router.push("/auth/login");
          return;
        }
        router.push("/kits");
      }}
    >
      + Crear kit
    </button>
  );
}
