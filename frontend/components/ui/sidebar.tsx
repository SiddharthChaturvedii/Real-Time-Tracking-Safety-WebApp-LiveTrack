"use client";

import { cn } from "@/lib/utils";
import React, { createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SidebarContextProps {
  close: () => void;
}

const SidebarContext = createContext<SidebarContextProps | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used inside <Sidebar />");
  }
  return ctx;
}

export function Sidebar({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <SidebarContext.Provider value={{ close: onClose }}>
      <AnimatePresence>
        {open && (
          <>
            {/* BACKDROP */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* SIDEBAR */}
            <motion.aside
              className="fixed top-16 left-0 h-[calc(100vh-64px)] w-[260px] bg-neutral-900 z-50 shadow-2xl"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>

              <div className="h-full px-4 py-6 flex flex-col">
                {children}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </SidebarContext.Provider>
  );
}

export function SidebarSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export function SidebarItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-neutral-200 hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}
