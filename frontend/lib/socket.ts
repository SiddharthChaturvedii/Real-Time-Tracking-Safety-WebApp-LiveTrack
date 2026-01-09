"use client";

import  io  from "socket.io-client";

// SINGLETON SOCKET INSTANCE
export const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  autoConnect: true,
});
