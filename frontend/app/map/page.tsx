"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PartySidebar, Member } from "@/components/ui/party-sidebar";
import { socket } from "@/lib/socket";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

interface PartyUser {
  id: string;
  username: string;
}

interface PartyJoinedPayload {
  partyCode: string;
  users: PartyUser[];
}

function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["red", "blue", "green", "gold", "violet", "orange"];
  return colors[Math.abs(hash) % colors.length];
}

function notify(msg: string) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.className =
    "fixed bottom-6 right-6 bg-neutral-900 text-white px-4 py-2 rounded-xl shadow-lg z-[9999]";

  document.body.appendChild(t);

  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 300);
  }, 2500);
}


export default function MapPage() {
  const [partyCode, setPartyCode] = useState("");
  const [selfId, setSelfId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 👤 USERNAME (RESTORED & FIXED)
  useEffect(() => {
    let name = sessionStorage.getItem("username");
    if (!name) {
      name = prompt("Enter your name") || "Guest";
      sessionStorage.setItem("username", name);
    }
    socket.emit("register-user", name);
  }, []);

  // 🔌 SOCKET EVENTS
  useEffect(() => {
    socket.on("connect", () => {
      setSelfId(socket.id || "");
    });

    socket.on("partyJoined", ({ partyCode, users }: PartyJoinedPayload) => {
      setPartyCode(partyCode);
      setMembers(
        users.map((u) => ({
          id: u.id,
          username: u.username,
          color: hashColor(u.id),
          online: true,
        }))
      );
    });

    socket.on("userJoined", (user: PartyUser) => {
        notify(`🟢 ${user.username} joined the party`);
        setMembers(prev => [
            ...prev,
            {
                id: user.id,
                username: user.username,
                color: hashColor(user.id),
                online: true,
            },
        ]);
    });

    socket.on("user-disconnected", (id: string) => {
        setMembers(prev => prev.filter(u => u.id !== id));
        notify("🔴 A user left the party");
    });


    return () => {
      socket.off("connect");
      socket.off("partyJoined");
      socket.off("userJoined");
      socket.off("user-disconnected");
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">

      {/* 🗺 MAP */}
      <div className="absolute inset-0 z-0">
        <LiveMap />
      </div>

      {/* 🧭 NAVBAR */}
      <div className="absolute top-0 left-0 right-0 h-16 z-40 bg-[#0b1220] text-white flex items-center px-4 gap-4">

        <button
          onClick={() => setSidebarOpen(true)}
          className="text-2xl"
        >
          ☰
        </button>

        <h1 className="font-extrabold">LiveTrack</h1>

        <span className="bg-red-700 px-3 py-1 rounded-md text-sm">
          {partyCode ? "In Party" : "Not in party"}
        </span>

        <span className="bg-black/40 px-3 py-1 rounded-md text-sm">
          Code: {partyCode || "—"}
        </span>

        {!partyCode && (
          <>
            <button
              className="bg-white text-black px-3 py-1 rounded-md text-sm"
              onClick={() => {
                const name = sessionStorage.getItem("username") || "Guest";
                socket.emit("createParty", name);
              }}
            >
              Create Party
            </button>

            <button
              className="bg-white text-black px-3 py-1 rounded-md text-sm"
              onClick={() => {
                const code = prompt("Enter party code");
                const name = sessionStorage.getItem("username") || "Guest";
                if (code) {
                  socket.emit("joinParty", {
                    partyCode: code.trim().toUpperCase(),
                    username: name,
                  });
                }
              }}
            >
              Join Party
            </button>
          </>
        )}

        <div className="ml-auto">
          <button className="bg-red-500 px-4 py-2 rounded-lg">
            🚨 SOS
          </button>
        </div>
      </div>

      {/* 📦 SIDEBAR */}
      <PartySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        partyCode={partyCode}
        members={members}
        selfId={selfId}
        onLeave={() => {
          setSidebarOpen(false);
          socket.disconnect();
        }}
      />
    </div>
  );
}
