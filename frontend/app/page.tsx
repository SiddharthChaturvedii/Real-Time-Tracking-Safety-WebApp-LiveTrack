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
import CurvedLoop from "../components/CurvedLoop";

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
    <main className="text-white min-h-screen relative overflow-hidden">

      {/* TOP BANNER / CURVED LOOP */}
      <div className="w-full pt-10 sm:pt-20 opacity-80 hover:opacity-100 transition-opacity duration-1000 z-10 relative pointer-events-none sm:pointer-events-auto">
        <CurvedLoop
          marqueeText="Real✦ Time ✦ Tracking ✦ For ✦ the ✦ people ✦ who ✦ matter ✦ the ✦ most"
          speed={1.5}
          curveAmount={180}
          direction="right"
          interactive={true}
          className="drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
        />
      </div>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 relative z-20 -mt-20 sm:-mt-32">
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

      {/* CTA SECTION */}
      <section className="py-32 px-8 flex flex-col items-center justify-center text-center reveal relative isolate">
        <div className="absolute inset-0 bg-cyan-500/5 blur-[120px] -z-10 rounded-full w-3/4 h-3/4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-6">
          Ready to Start <span className="text-cyan-300">Tracking?</span>
        </h2>

        <p className="text-gray-400 max-w-xl mb-12 text-lg">
          Join users around the world sharing their live locations securely and effortlessly. Try it instantly in your browser.
        </p>

        <div className="relative rounded-2xl p-[1px]">
          <GlowingEffect
            spread={60}
            glow={true}
            disabled={false}
            proximity={80}
            inactiveZone={0.01}
            borderWidth={2}
          />
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(34,211,238,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => (window.location.href = MAP_APP_URL)}
            className="relative px-10 py-5 text-lg sm:text-xl bg-cyan-400 hover:bg-cyan-300 transition rounded-2xl text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(34,211,238,0.3)]"
          >
            ⚡ Launch LiveTrack
          </motion.button>
        </div>
      </section>

      <Footerdemo isDarkMode={true} />
    </main>
  );
}

