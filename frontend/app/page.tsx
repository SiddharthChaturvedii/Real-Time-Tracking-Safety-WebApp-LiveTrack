"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import MiniMapDemo from "../components/MiniMapDemo";
import { GlowingEffect } from "../components/ui/glowing-effect";
import { Footerdemo } from "../components/ui/footer-section";
import { Switch } from "../components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

gsap.registerPlugin(ScrollTrigger);

// ✅ FIXED: Frontend map route
const MAP_APP_URL = "/map";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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
    <main className={`transition-colors duration-700 ${isDarkMode ? "bg-black text-white" : "bg-white text-black"} min-h-screen relative`}>
      {/* Theme Toggle Top Left */}
      <div className="fixed top-6 left-6 z-[1000] flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl transition-all hover:scale-105 group">
        <Sun className={`h-4 w-4 transition-colors ${isDarkMode ? "text-white/30" : "text-orange-500"}`} />
        <Switch
          id="global-dark-mode"
          checked={isDarkMode}
          onCheckedChange={setIsDarkMode}
          className="data-[state=checked]:bg-cyan-600"
        />
        <Moon className={`h-4 w-4 transition-colors ${isDarkMode ? "text-cyan-400" : "text-black/30"}`} />
      </div>

      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 transition-opacity duration-700">
        {!isDarkMode ? (
          /* Bright Mode Gradient */
          <svg
            className="w-full h-full blur-3xl opacity-50"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00fff2" />
                <stop offset="50%" stopColor="#ff00ff" />
                <stop offset="100%" stopColor="#00b3ff" />
              </linearGradient>
            </defs>

            <motion.circle
              cx="30%"
              cy="30%"
              r="200"
              fill="url(#grad1)"
              animate={{ cx: "70%", cy: "60%" }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            />

            <motion.circle
              cx="70%"
              cy="50%"
              r="250"
              fill="url(#grad1)"
              animate={{ cx: "20%", cy: "70%" }}
              transition={{ duration: 12, repeat: Infinity, repeatType: "reverse" }}
            />
          </svg>
        ) : (
          /* Dark Mode Bubbles */
          <div className="w-full h-full bg-black relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] border border-white/5 rounded-full" />
            <div className="absolute bottom-[20%] left-[10%] w-[20%] h-[20%] border border-white/5 rounded-full" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)]" />
          </div>
        )}
      </div>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-6xl font-bold"
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
        <h2 className="text-center text-4xl font-bold mb-14">
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
                isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
              )}>
                <p className="text-xl font-semibold tracking-tight">{title}</p>
                <p className={cn("mt-2 text-sm", isDarkMode ? "text-gray-400" : "text-gray-600")}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section className="py-24 px-8 max-w-5xl mx-auto text-center reveal">
        <h2 className="text-4xl font-bold mb-10">
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

      <Footerdemo isDarkMode={isDarkMode} />
    </main>
  );
}

