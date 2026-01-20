"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import dynamic from "next/dynamic";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

interface PartyUser {
  id: string;
  username: string;
}

interface PartyJoinedPayload {
  partyCode: string;
  users: PartyUser[];
}

export default function MapPage() {
  const [partyCode, setPartyCode] = useState<string | null>(null);
  const [members, setMembers] = useState<PartyUser[]>([]);
  const [username, setUsername] = useState("");

  /* ---------- USERNAME ---------- */
  useEffect(() => {
    let name = sessionStorage.getItem("username");
    if (!name) {
      name = prompt("Enter your name") || "Guest";
      sessionStorage.setItem("username", name);
    }
    setUsername(name);
    socket.emit("register-user", name);
  }, []);

  /* ---------- SOCKET ---------- */
  useEffect(() => {
    socket.on("partyJoined", ({ partyCode, users }: PartyJoinedPayload) => {
      setPartyCode(partyCode);
      setMembers(users);
    });

    socket.on("userJoined", (user: PartyUser) => {
      setMembers((p) => [...p, user]);
    });

    socket.on("user-disconnected", (id: string) => {
      setMembers((p) => p.filter((u) => u.id !== id));
    });

    socket.on("partyClosed", () => {
      setPartyCode(null);
      setMembers([]);
    });

    return () => {
      socket.off("partyJoined");
      socket.off("userJoined");
      socket.off("user-disconnected");
      socket.off("partyClosed");
    };
  }, []);

  const inParty = Boolean(partyCode);

  function leaveParty() {
    socket.emit("leaveParty");
    setPartyCode(null);
    setMembers([]);
  }

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col">
      {/* NAVBAR */}
      <div className="h-14 bg-black/80 flex items-center px-4 gap-4">
        <h1 className="font-semibold">LiveTrack</h1>

        <span className="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400">
          {inParty ? "IN PARTY" : "NOT IN PARTY"}
        </span>

        {inParty && (
          <span className="text-xs font-mono">Code: {partyCode}</span>
        )}

        {!inParty && (
          <>
            <button onClick={() => socket.emit("createParty", username)}>
              Create
            </button>
            <button
              onClick={() => {
                const code = prompt("Enter party code");
                if (code)
                  socket.emit("joinParty", {
                    partyCode: code.trim().toUpperCase(),
                    username,
                  });
              }}
            >
              Join
            </button>
          </>
        )}

        {inParty && (
          <button className="ml-auto" onClick={leaveParty}>
            Leave
          </button>
        )}
      </div>

      {/* MAP ALWAYS ON */}
      <div className="flex-1 relative">
        <LiveMap username={username} inParty={inParty} />
      </div>
    </div>
  );
}
