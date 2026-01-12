"use client";

import { useEffect, useState } from "react";
import { registerToast } from "@/lib/toast";

export default function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    registerToast((m) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 3000);
    });
  }, []);

  if (!msg) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-black/80 backdrop-blur text-white px-5 py-3 rounded-xl shadow-lg animate-fade">
      {msg}
    </div>
  );
}
