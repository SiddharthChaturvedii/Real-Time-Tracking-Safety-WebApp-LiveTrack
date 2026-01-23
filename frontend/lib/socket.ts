"use client";
import io from "socket.io-client";

export const socket = io(
  process.env.NEXT_PUBLIC_SOCKET_URL!,
  {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    autoConnect: true,
  }
);
