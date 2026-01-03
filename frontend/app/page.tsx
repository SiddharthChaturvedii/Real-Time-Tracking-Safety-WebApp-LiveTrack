"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const APP_URL = "http://localhost:3000"; // TODO: change to your deployed tracker URL later

export default function Home() {

  const [name, setName] = useState("");

  const openApp = () => {

    const final = name.trim() || "Guest";

    // store username for your realtime tracker
    sessionStorage.setItem("username", final);
    localStorage.setItem("username", final);

    window.location.href = APP_URL;
  };

  return (
    <main className="bg-[#050B18] text-white min-h-screen overflow-x-hidden">

      {/* HERO SECTION */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6">

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="bg-[#0b132b] p-6 rounded-2xl mb-6"
        >
          📡
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl font-bold"
        >
          Track Live Locations
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            in Realtime
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-gray-300 max-w-lg"
        >
          Share your GPS location and see friends move live on a shared map
        </motion.p>


        <div className="mt-8 flex gap-3">
          <input
            placeholder="Enter your name"
            className="px-4 py-2 rounded-xl text-black"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            onClick={openApp}
            className="bg-cyan-500 hover:bg-cyan-400 px-6 py-2 rounded-xl font-semibold"
          >
            ⚡ Open App
          </button>
        </div>

      </section>


      {/* FEATURES SECTION */}
      <SectionTitle title="Powerful" highlight="Features" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto px-8 py-12">

        <Feature icon="📡" title="Realtime Updates"
                 text="Live GPS streaming via WebSockets — no refresh needed" />

        <Feature icon="🎯" title="Unique Identity"
                 text="Color-coded markers with usernames" />

        <Feature icon="🟢" title="Online Status"
                 text="Instantly see who joins or leaves" />

        <Feature icon="📱" title="Works Everywhere"
                 text="Mobile, desktop — any browser" />
      </div>


      {/* HOW IT WORKS */}
      <SectionTitle title="How It" highlight="Works" />
      <Steps />


      {/* LAUNCH SECTION */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="max-w-lg mx-auto my-32 bg-[#0b132b] rounded-2xl p-10 text-center"
      >
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Realtime Tracker
        </h2>

        <p className="text-gray-400 mt-2">
          Ready to track live locations with friends?
        </p>

        <button
          onClick={openApp}
          className="bg-cyan-500 hover:bg-cyan-400 mt-6 px-6 py-3 rounded-xl font-semibold"
        >
          Launch App ↗
        </button>
      </motion.div>

    </main>
  );
}

function SectionTitle({ title, highlight }: any) {
  return (
    <h2 className="text-4xl font-bold text-center pt-20">
      {title}{" "}
      <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
        {highlight}
      </span>
    </h2>
  );
}

function Feature({ icon, title, text }: any) {
  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.5 }}
      className="bg-[#0b132b] p-6 rounded-2xl"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-xl">{title}</h3>
      <p className="text-gray-400 mt-1">{text}</p>
    </motion.div>
  );
}

function Steps() {
  return (
    <div className="max-w-5xl mx-auto px-8 text-center py-20 grid grid-cols-1 md:grid-cols-3 gap-10">
      <Step num="01" icon="👤" title="Enter Name" />
      <Step num="02" icon="📍" title="Allow Location" />
      <Step num="03" icon="🛰" title="Track Live" />
    </div>
  );
}

function Step({ num, icon, title }: any) {
  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.5 }}
      className="bg-[#0b132b] rounded-2xl p-6"
    >
      <div className="text-cyan-400 text-4xl font-bold">{num}</div>
      <div className="text-5xl my-2">{icon}</div>
      <div className="font-bold text-lg">{title}</div>
    </motion.div>
  );
}
