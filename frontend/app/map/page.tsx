"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Users, LogOut, Copy, Trash2, Info } from "lucide-react";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

interface PartyUser {
  id: string;
  username: string;
}

interface PartyJoinedPayload {
  partyCode: string;
  users: PartyUser[];
  creator?: string; // Added creator field
}

// Simple Toast Interface
interface Toast {
  id: string;
  message: string;
}

export default function MapPage() {
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [members, setMembers] = useState<PartyUser[]>([]);
  const [username, setUsername] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);
  // SOS State
  const [isSosActive, setIsSosActive] = useState(false);

  const addToast = (message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- SOS AUDIO HELPER ---
  const playSiren = () => {
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

    // Repeat for 3 seconds
    osc.start();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);
    osc.stop(ctx.currentTime + 3);
  };

  const handleSOS = () => {
    if (!inParty) return;
    confirm("🚨 ACTIVATE SOS SIGNAL? \nThis will alert all party members.") && socket.emit("sos-signal");
  };

  useEffect(() => {
    // ... existing interactions ...
  }, []); // Only run once for setup

  // SOS Listener
  useEffect(() => {
    socket.on("sos-alert", (senderName: string) => {
      setIsSosActive(true);
      addToast(`🚨 SOS: ${senderName} needs help!`);
      playSiren();

      // Auto-turn off visual red flash after 5s
      setTimeout(() => setIsSosActive(false), 5000);
    });

    return () => {
      socket.off("sos-alert");
    };
  }, []);

  useEffect(() => {
    let name = sessionStorage.getItem("username");
    if (!name) {
      name = prompt("Enter your name") || "Guest";
      sessionStorage.setItem("username", name);
    }
    setUsername(name);
    socket.emit("register-user", name);
  }, []);

  useEffect(() => {
    socket.on("partyJoined", ({ partyCode, users, creator }: PartyJoinedPayload) => {
      setPartyCode(partyCode);
      setMembers(users);

      // If we are strictly the joiner (not creator), creator check helps
      // For the creator themselves, effectively they are the creator.
      const amICreator = creator === username;
      setIsCreator(amICreator);

      if (!amICreator && creator) {
        addToast(`Joined ${creator}'s party!`);
      } else if (amICreator) {
        addToast("Party created successfully!");
      }
    });

    socket.on("userJoined", (user: PartyUser) => {
      setMembers((prev) => [...prev, user]);
      addToast(`${user.username} joined the party`);
    });

    socket.on("user-disconnected", (id: string) => {
      // Find username for better toast? 
      // We only have ID here unless we lookup in `members` before filtering
      setMembers((prev) => {
        const user = prev.find(u => u.id === id);
        if (user) addToast(`${user.username} left the party`);
        return prev.filter((u) => u.id !== id);
      });
    });

    socket.on("partyClosed", () => {
      addToast("Party was closed by the host.");
      setPartyCode(null);
      setMembers([]);
      setIsCreator(false);
      setIsSidebarOpen(false);
    });

    socket.on("partyError", (msg: string) => {
      addToast(msg); // Removed blocking alert
    });

    return () => {
      socket.off("partyJoined");
      socket.off("userJoined");
      socket.off("user-disconnected");
      socket.off("partyClosed");
      socket.off("partyLeft");
      socket.off("partyError");
    };
  }, [username]); // depend on username for creator check logic

  // Add listener for successful leave
  useEffect(() => {
    socket.on("partyLeft", () => {
      setPartyCode(null);
      setMembers([]);
      setIsCreator(false);
      setIsSidebarOpen(false);
      addToast("You left the party.");
    });

    return () => {
      socket.off("partyLeft");
    };
  }, []);

  const handleCreateParty = () => {
    socket.emit("createParty", username);
  };

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

  const inParty = Boolean(partyCode);

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col relative overflow-hidden">

      {/* TOAST CONSTAINER */}
      <div className="absolute bottom-6 right-6 z-[2000] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="bg-black/80 backdrop-blur border border-white/20 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[200px]"
            >
              <Info size={18} className="text-cyan-400" />
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 left-0 h-full w-80 bg-black/90 backdrop-blur-xl z-[1500] border-r border-white/10 shadow-2xl flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Party Stats
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Party Info */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {inParty ? (
                <>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">
                      Party Code
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-bold text-cyan-400">
                        {partyCode}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(partyCode!);
                          addToast("Party code copied!");
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition"
                        title="Copy Code"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Users size={14} /> Members ({members.length})
                      </div>
                    </div>

                    <div className="space-y-3">
                      {members.map((member) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs uppercase">
                              {member.username.slice(0, 2)}
                            </div>
                            <span className="font-medium flex flex-col">
                              {member.username}
                              {member.id === socket.id && <span className="text-[10px] text-gray-500">You</span>}
                              {isCreator && member.username === username && <span className="text-[10px] text-cyan-400">Host</span>}
                            </span>
                          </div>

                          {isCreator && member.id !== socket.id && (
                            <button
                              onClick={() => handleKick(member.id)}
                              className="text-red-500 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition"
                              title="Kick User"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>Not in a party.</p>
                  <p className="text-sm mt-2">Create or join one to see stats.</p>
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            {inParty && (
              <div className="p-6 border-t border-white/10">
                <button
                  onClick={() => socket.emit("leaveParty")}
                  className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 py-3 rounded-xl transition font-medium border border-red-600/20"
                >
                  <LogOut size={18} /> Leave Party
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOS RED FLASH OVERLAY */}
      <AnimatePresence>
        {isSosActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[9999] bg-red-600 pointer-events-none animate-pulse"
          />
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <div className="h-14 bg-black/70 backdrop-blur flex items-center px-4 gap-4 border-b border-white/10 z-[1000]">

        {/* Hamburger Trigger */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 mr-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>

        <h1 className="font-semibold text-lg tracking-tight">
          LiveTrack
        </h1>

        <span className={`text-xs px-2 py-1 rounded bg-green-600/20 text-green-400 ${!inParty && 'opacity-0'}`}>
          IN PARTY
        </span>

        {inParty && (
          <>
            <span className="hidden md:inline-block text-xs font-mono text-white/60">
              {partyCode}
            </span>

            {/* SOS BUTTON */}
            <button
              onClick={handleSOS}
              className="ml-auto bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.7)] transition flex items-center gap-2"
            >
              🚨 SOS
            </button>
          </>
        )}

        {!inParty && (
          <div className="ml-auto flex gap-3">
            <button
              className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              onClick={handleCreateParty}
            >
              Create
            </button>

            <button
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition border border-white/10"
              onClick={handleJoinParty}
            >
              Join
            </button>
          </div>
        )}
      </div>

      {/* MAP */}
      <div className="flex-1 relative z-0">
        <LiveMap username={username} />
      </div>
    </div>
  );
}
