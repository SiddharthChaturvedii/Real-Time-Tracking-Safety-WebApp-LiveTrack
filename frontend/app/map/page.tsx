"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "@/lib/socket";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Menu, X, Users, LogOut, Copy, Trash2, Info, Phone, ShieldAlert, Heart, Siren, CheckCircle2, Navigation, AlertCircle, Moon, Sun } from "lucide-react";
import { getHelplinesByLocation, Helpline } from "@/lib/helplines";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

interface PartyUser {
  id: string;
  username: string;
}

interface PartyJoinedPayload {
  partyCode: string;
  users: PartyUser[];
  creator?: string;
  sosUsers?: string[];
}

interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'error' | 'success';
}

const springConfig = { type: "spring" as const, stiffness: 400, damping: 30 };

export default function MapPage() {
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [members, setMembers] = useState<PartyUser[]>([]);
  const [username, setUsername] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // SOS & Emergency State
  const [sosUsers, setSosUsers] = useState<string[]>([]);
  const [waypoints, setWaypoints] = useState<Array<{ id: string, lat: number, lng: number, label: string }>>([]);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  // Theme State
  const [mapTheme, setMapTheme] = useState<"bright" | "dark">("dark");

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const inSOS = sosUsers.includes(socket.id || "");
  const someoneInSOS = sosUsers.length > 0;

  const addToast = (message: string, type: Exclude<Toast['type'], undefined> = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const playSiren = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.0);
      osc.start();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
      osc.stop(ctx.currentTime + 3);
    } catch (e) { console.error("Siren error", e); }
  };

  const handleSOS = () => {
    if (!partyCode) return;
    if (confirm("🚨 ACTIVATE SOS SIGNAL? \nThis alert is persistent and will be visible to all members.")) {
      socket.emit("sos-signal");
      setIsActionSheetOpen(true);
    }
  };

  const handleImSafe = () => {
    socket.emit("clear-sos");
    setIsActionSheetOpen(false);
    addToast("Status updated to Safe.");
  };

  useEffect(() => {
    if (!username) return;

    socket.on("partyJoined", ({ partyCode, users, creator, sosUsers: initialSos, waypoints: initialWaypoints }: PartyJoinedPayload & { waypoints: any[] }) => {
      setPartyCode(partyCode);
      setMembers(users);
      setIsCreator(creator === username);
      if (initialSos) setSosUsers(initialSos);
      if (initialWaypoints) setWaypoints(initialWaypoints);
      addToast(creator === username ? "Party created!" : `Joined ${creator}'s party!`, 'success');
    });

    socket.on("userJoined", (user: PartyUser) => {
      setMembers((prev) => [...prev, user]);
      addToast(`${user.username} joined`, 'info');
    });

    socket.on("user-disconnected", (id: string) => {
      setMembers((prev) => {
        const user = prev.find(u => u.id === id);
        if (user) addToast(`${user.username} left`, 'info');
        return prev.filter(u => u.id !== id);
      });
      setSosUsers(prev => prev.filter(uid => uid !== id));
    });

    socket.on("partyClosed", () => {
      addToast("Party closed by host.", 'error');
      resetPartyState();
    });

    socket.on("partyLeft", () => {
      addToast("You left the party.", 'info');
      resetPartyState();
    });

    socket.on("sos-alert", ({ id, username: sender, sosUsers: currentSos }: { id: string, username: string, sosUsers: string[] }) => {
      setSosUsers(currentSos);
      if (id !== socket.id) {
        addToast(`🚨 ALERT: ${sender} needs help!`, 'error');
        playSiren();
      }
    });

    socket.on("sos-cleared", ({ id, sosUsers: currentSos }: { id: string, sosUsers: string[] }) => {
      setSosUsers(currentSos);
      const user = members.find(m => m.id === id);
      if (user) addToast(`✅ ${user.username} is now safe.`, 'success');
    });

    // --- WAYPOINTS ---
    socket.on("waypoint-dropped", (waypoint: any) => {
      setWaypoints(prev => [...prev, waypoint]);
      addToast(`📍 New Waypoint: ${waypoint.label}`, 'info');
    });

    socket.on("waypoints-cleared", () => {
      setWaypoints([]);
      addToast("🧹 All waypoints cleared", 'info');
    });

    socket.on("partyError", (msg: string) => addToast(msg, 'error'));

    return () => {
      socket.off("partyJoined");
      socket.off("userJoined");
      socket.off("user-disconnected");
      socket.off("partyClosed");
      socket.off("partyLeft");
      socket.off("sos-alert");
      socket.off("sos-cleared");
      socket.off("waypoint-dropped");
      socket.off("waypoints-cleared");
      socket.off("partyError");
    };
  }, [username, members]);

  const resetPartyState = () => {
    setPartyCode(null);
    setMembers([]);
    setIsCreator(false);
    setIsSidebarOpen(false);
    setSosUsers([]);
    setWaypoints([]);
    setIsActionSheetOpen(false);
  };

  useEffect(() => {
    let name = sessionStorage.getItem("username");
    if (!name) {
      name = prompt("Enter your name") || "Guest";
      sessionStorage.setItem("username", name);
    }
    setUsername(name || "Guest");
    socket.emit("register-user", name || "Guest");

    // Watch location for helplines
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleJoinParty = () => {
    const code = prompt("Enter party code");
    if (code) {
      socket.emit("joinParty", {
        partyCode: code.trim().toUpperCase(),
        username,
      });
    }
  };

  const handleKick = (userId: string) => {
    if (confirm("Are you sure you want to kick this user?")) {
      socket.emit("kick-user", { userId, partyCode });
      setMembers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const helplines = getHelplinesByLocation(userLocation?.lat, userLocation?.lng);

  return (
    <div className={`h-screen w-screen flex flex-col relative overflow-hidden font-sans selection:bg-cyan-500/30 transition-colors duration-500 ${mapTheme === 'dark' ? 'bg-black text-white' : 'bg-white/80 text-black'}`}>

      {/* TOAST CONTAINER */}
      <div className="absolute bottom-6 right-6 z-[2000] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 20, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
              className={`backdrop-blur-2xl border px-5 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-center gap-4 min-w-[260px] ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-100' :
                toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-100' :
                  'bg-white/5 border-white/10 text-white'
                }`}
            >
              {toast.type === 'error' ? <AlertCircle size={22} className="text-red-400" /> :
                toast.type === 'success' ? <CheckCircle2 size={22} className="text-green-400" /> :
                  <Info size={22} className="text-cyan-400" />}
              <span className="text-sm font-bold tracking-tight">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* EMERGENCY OVERLAY */}
      <AnimatePresence>
        {someoneInSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[900] bg-red-600 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(220,38,38,0.5) 0%, rgba(0,0,0,0) 80%)',
              animation: 'pulse 2s infinite ease-in-out'
            }}
          />
        )}
      </AnimatePresence>

      {/* NAVBAR / EMERGENCY HEADER */}
      <div className={`h-16 flex items-center px-6 border-b transition-all duration-700 z-[1000] justify-between ${someoneInSOS ? 'bg-red-950/50 border-red-500/40 shadow-[0_0_50px_rgba(220,38,38,0.25)]' :
        mapTheme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white/60 border-black/5'} backdrop-blur-3xl`}>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSidebarOpen(true)}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10"
          >
            <Menu size={24} />
          </motion.button>

          <div className="flex flex-col text-left">
            <motion.h1
              layout
              className={`font-black text-lg sm:text-2xl tracking-tighter ${someoneInSOS ? 'text-white' : 'bg-gradient-to-br from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent'}`}
            >
              {someoneInSOS ? "EMERGENCY" : "LiveTrack"}
            </motion.h1>
            <AnimatePresence mode="wait">
              {someoneInSOS && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[10px] text-red-200/50 uppercase font-black tracking-[0.25em] -mt-1 animate-pulse"
                >
                  Critical Alert
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {partyCode ? (
            <div className="flex items-center gap-2">
              {inSOS ? (
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34,197,94,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleImSafe}
                  className="bg-green-600 outline-none text-white px-6 py-2.5 rounded-full text-xs sm:text-sm font-black shadow-lg flex items-center gap-2 border border-green-400/40 transition-all uppercase tracking-tighter"
                >
                  <CheckCircle2 size={18} /> I AM SAFE
                </motion.button>
              ) : someoneInSOS ? (
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(220,38,38,0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsActionSheetOpen(true)}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-100 p-3 rounded-2xl border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-bounce"
                >
                  <ShieldAlert size={22} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(220,38,38,0.6)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSOS}
                  className="bg-red-600 outline-none text-white px-7 py-2.5 rounded-full text-xs sm:text-sm font-black shadow-2xl flex items-center gap-2 border border-red-500/40 transition-all uppercase tracking-tighter"
                >
                  🚨 SOS
                </motion.button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-black px-6 py-2.5 rounded-2xl text-sm font-black shadow-2xl transition-all"
                onClick={() => socket.emit("createParty", username)}
              >
                Create
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/5 text-white px-6 py-2.5 rounded-2xl text-sm font-bold border border-white/10 backdrop-blur-md transition-all"
                onClick={() => handleJoinParty()}
              >
                Join
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* EMERGENCY ACTION SHEET */}
      <AnimatePresence>
        {isActionSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActionSheetOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-lg z-[1600]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={springConfig}
              className="absolute bottom-0 left-0 right-0 bg-[#060606]/95 backdrop-blur-[40px] border-t border-red-500/30 rounded-t-[3.5rem] z-[1700] p-10 pb-14 shadow-[0_-25px_80px_rgba(220,38,38,0.25)] max-h-[90vh] flex flex-col"
            >
              <div className="w-20 h-1.5 bg-white/15 rounded-full mx-auto mb-10" />

              <div className="flex items-center justify-between mb-10">
                <div className="text-left">
                  <h2 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-4 tracking-tighter">
                    <Siren className="text-red-500 w-8 h-8 sm:w-10 sm:h-10" /> ASSISTANCE
                  </h2>
                  <p className="text-red-100/30 text-sm mt-2 font-black uppercase tracking-[0.2em] italic">Emergency Protocol Active</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setIsActionSheetOpen(false)}
                  className="p-4 bg-white/5 rounded-full hover:bg-white/10 border border-white/5"
                >
                  <X size={28} />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-5 flex-1 overflow-y-auto pr-3 custom-scrollbar">
                {helplines.map((help, idx) => (
                  <motion.a
                    key={idx}
                    href={`tel:${help.number}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.04, ...springConfig }}
                    whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.07)" }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border transition-all ${idx === 0 ? 'bg-red-600/30 border-red-500/50 col-span-2 py-10 shadow-lg shadow-red-900/20' : 'bg-white/5 border-white/5'}`}
                  >
                    <span className="text-5xl mb-4 filter drop-shadow-[0_4px_12px_rgba(220,38,38,0.4)]">{help.icon}</span>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.35em] mb-2">{help.label}</span>
                    <span className="text-xl sm:text-3xl font-black text-white tracking-[0.15em]">{help.number}</span>
                    <Phone size={16} className="mt-4 text-red-500/50" />
                  </motion.a>
                ))}
              </div>

              {inSOS && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleImSafe}
                  className="mt-6 sm:mt-10 w-full py-4 sm:py-6 bg-green-600 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-2xl shadow-3xl shadow-green-900/50 border border-green-400/40 transition-all flex items-center justify-center gap-4 uppercase tracking-tighter"
                >
                  <Heart size={24} className="animate-pulse" /> Confirm Safety
                </motion.button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md z-[1400]"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={springConfig}
              className="absolute top-0 left-0 h-full w-full sm:w-[400px] bg-[#030303]/98 backdrop-blur-[50px] z-[1500] border-r border-white/5 shadow-[20px_0_100px_rgba(0,0,0,0.8)] flex flex-col pt-safe text-left"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                    <Users size={28} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-tighter">NETWORK</span>
                    <span className="text-[10px] text-white/30 font-black tracking-[0.3em] uppercase -mt-1">Real-time Stats</span>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                {partyCode ? (
                  <LayoutGroup>
                    <motion.div layout className="bg-white/[0.02] p-8 rounded-[3rem] border border-white/[0.06] shadow-2xl text-left">
                      <span className="text-[11px] text-blue-400 font-black uppercase tracking-[0.25em]">Access ID</span>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-4xl font-black text-white tracking-widest leading-none pr-4">{partyCode}</span>
                        <motion.button
                          whileTap={{ scale: 0.7 }}
                          className="p-4 bg-blue-500/20 rounded-[1.5rem] border border-blue-500/30 shadow-lg shadow-blue-950/40"
                          onClick={() => { navigator.clipboard.writeText(partyCode); addToast("Code copied to clipboard!", 'success'); }}
                        >
                          <Copy size={20} className="text-blue-300" />
                        </motion.button>
                      </div>
                    </motion.div>

                    <div className="space-y-6 text-left">
                      <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                        Live Status ({members.length})
                      </span>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {members.map((m, idx) => (
                          <motion.div
                            layout
                            key={m.id}
                            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
                            transition={{ delay: idx * 0.05, ...springConfig }}
                            className={`flex items-center justify-between p-5 rounded-[2.5rem] border transition-all duration-500 ${sosUsers.includes(m.id) ? 'bg-red-500/10 border-red-500/40 shadow-2xl shadow-red-900/30 scale-[1.02]' : 'bg-white/[0.03] border-white/5'
                              }`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`relative w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-xl shadow-inner ${sosUsers.includes(m.id) ? 'bg-red-600 text-white animate-pulse' : 'bg-[#0f0f0f] text-white border border-white/10'
                                }`}>
                                {m.username.slice(0, 1).toUpperCase()}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-black ${sosUsers.includes(m.id) ? 'bg-red-500' : 'bg-blue-500'}`} />
                              </div>
                              <div className="flex flex-col text-left">
                                <p className="font-black text-sm tracking-tighter text-white/90">{m.username} {m.id === socket.id && <span className="text-[10px] opacity-30 font-black ml-1 uppercase">Host</span>}</p>
                                {sosUsers.includes(m.id) ? (
                                  <span className="text-[10px] text-red-500 font-black animate-pulse uppercase tracking-[0.1em]">Signal Lost</span>
                                ) : (
                                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest opacity-60">Connected</span>
                                )}
                              </div>
                            </div>
                            {isCreator && m.id !== socket.id && (
                              <motion.button
                                whileHover={{ scale: 1.2, backgroundColor: "rgba(220,38,38,0.2)" }}
                                whileTap={{ scale: 0.8 }}
                                onClick={() => handleKick(m.id)}
                                className="p-3 text-white/10 hover:text-red-500 transition-all rounded-2xl"
                              >
                                <Trash2 size={20} />
                              </motion.button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* THEME TOGGLE */}
                    <div className="pt-6 border-t border-white/5">
                      <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMapTheme(prev => prev === "dark" ? "bright" : "dark")}
                        className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
                            {mapTheme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-black uppercase tracking-widest text-white/90">Map Theme</span>
                            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                              Current: {mapTheme.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${mapTheme === "dark" ? 'bg-cyan-600' : 'bg-gray-600'}`}>
                          <motion.div
                            animate={{ x: mapTheme === "dark" ? 24 : 0 }}
                            className="w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </div>
                      </motion.button>
                    </div>
                  </LayoutGroup>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                      <Users size={80} strokeWidth={1} />
                    </motion.div>
                    <p className="mt-6 font-black text-xs tracking-[0.5em] uppercase text-center w-full">Offline Session</p>
                  </div>
                )}
              </div>

              {partyCode && (
                <div className="p-10 border-t border-white/5 bg-white/[0.01]">
                  <motion.button
                    whileHover={{ backgroundColor: "rgba(220,38,38,0.15)", scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => socket.emit("leaveParty")}
                    className="w-full flex items-center justify-center gap-3 text-red-500 py-5 rounded-[1.8rem] font-black border border-red-500/20 transition-all uppercase tracking-[0.15em] shadow-xl shadow-red-950/20"
                  >
                    <LogOut size={22} /> Hard Disconnect
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAP */}
      <div className="flex-1 relative z-0">
        <LiveMap
          key={partyCode || "standalone"}
          username={username}
          members={members}
          sosUsers={sosUsers}
          waypoints={waypoints}
          addToast={addToast}
          theme={mapTheme}
        />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 12px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }
        
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
