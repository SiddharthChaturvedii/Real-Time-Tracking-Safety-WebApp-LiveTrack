"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import MiniMapDemo from "../components/MiniMapDemo";
import { GlowingEffect } from "../components/ui/glowing-effect";
import Footerdemo from "../components/ui/footer-section";
import { Switch } from "../components/ui/switch";
import { useState } from "react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

// ✅ FIXED: Frontend map route
const MAP_APP_URL = "/map";

export default function Home() {
  useEffect(() => {
    gsap.utils.toArray(".reveal").forEach((el: any) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          scrollTrigger: { trigger: el, start: "top 80%" },
        }
      );
    });
  }, []);

  return (
    <main className="bg-[#050b18] text-white min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="w-full h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#050b18] via-[#070d1a] to-[#020617]" />
          <motion.div
            animate={{
              x: ["-10%", "10%"],
              y: ["-10%", "10%"]
            }}
            transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
            className="absolute top-[10%] left-[10%] w-[60%] h-[60%] bg-cyan-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              x: ["10%", "-10%"],
              y: ["10%", "-10%"]
            }}
            transition={{ duration: 25, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-[10%] right-[10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px]"
          />
        </div>
      </div>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter"
        >
          Track Live Locations
          <span className="block text-cyan-300">in Realtime</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-gray-300 max-w-2xl"
        >
          Share your GPS location and watch friends move live on a shared map —
          instantly.
        </motion.p>

        <div className="relative mt-10 rounded-xl p-[1px]">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={2}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (window.location.href = MAP_APP_URL)}
            className="relative px-8 py-3 bg-cyan-400 hover:bg-cyan-300 transition rounded-xl text-black font-semibold"
          >
            ⚡ Open App
          </motion.button>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-8 max-w-6xl mx-auto reveal">
        <h2 className="text-center text-3xl sm:text-4xl font-black tracking-tighter mb-14">
          Powerful <span className="text-cyan-300">Features</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            [
              "Realtime Updates",
              "Instant GPS updates via WebSockets — no refresh needed",
            ],
            [
              "Unique Identity",
              "Each user gets a color-coded marker and name",
            ],
            ["Online Status", "See who’s online in realtime"],
            ["Works Everywhere", "Mobile, tablet, or desktop — just a browser"],
          ].map(([title, desc], i) => (
            <div
              key={i}
              className="relative group p-[1px] rounded-2xl"
            >
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <div className={cn(
                "relative p-6 rounded-2xl h-full border transition-colors duration-500",
                "bg-white/5 border-white/5"
              )}>
                <p className="text-xl font-semibold tracking-tight">{title}</p>
                <p className={cn("mt-2 text-sm", "text-gray-400")}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section className="py-24 px-8 max-w-5xl mx-auto text-center reveal">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-10">
          See It <span className="text-cyan-300">In Action</span>
        </h2>

        <p className="text-gray-400 mb-6">
          Live realtime map preview — simulated demo 🚀
        </p>

        <div className="relative p-[1px] rounded-[18px]">
          <GlowingEffect
            spread={50}
            glow={true}
            disabled={false}
            proximity={80}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <div className="relative rounded-[18px] overflow-hidden border border-white/10">
            <MiniMapDemo />
          </div>
        </div>
      </section>

      <Footerdemo isDarkMode={true} />
    </main>
  );
}

