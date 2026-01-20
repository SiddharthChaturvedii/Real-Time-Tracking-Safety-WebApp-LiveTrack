const express = require("express");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://real-time-tracker-0qge.onrender.com",
    ],
    methods: ["GET", "POST"],
  },
});

// =============================
// STATE (SINGLE SOURCE OF TRUTH)
// =============================
const users = {};          // socket.id -> username
const parties = {};        // partyCode -> [{ id, username }]
const userParty = {};      // socket.id -> partyCode
const userLocations = {};  // socket.id -> { latitude, longitude }

// =============================
// HELPERS
// =============================
function removeUserFromParty(socket) {
  const code = userParty[socket.id];
  if (!code || !parties[code]) return;

  // 1️⃣ Remove user from party list
  parties[code] = parties[code].filter(u => u.id !== socket.id);

  // 2️⃣ Remove socket from room
  socket.leave(code);

  // 3️⃣ Cleanup user mappings
  delete userParty[socket.id];
  delete userLocations[socket.id];

  // 4️⃣ Notify remaining users
  io.to(code).emit("user-disconnected", socket.id);

  // 5️⃣ DESTROY PARTY if <= 1 left
  if (parties[code].length <= 1) {
    // 🔒 Notify via ROOM (not individual IDs)
    io.to(code).emit("partyClosed");

    // Cleanup remaining user mappings
    parties[code].forEach(u => {
      delete userParty[u.id];
      delete userLocations[u.id];
    });

    // Finally delete party
    delete parties[code];
  }
}


// =============================
// SOCKET
// =============================
io.on("connection", (socket) => {
  users[socket.id] = "Guest";

  socket.on("register-user", (username) => {
    users[socket.id] = username || "Guest";
  });

  // ---------- CREATE PARTY ----------
  socket.on("createParty", (username) => {
    const partyCode = uuidv4().slice(0, 6).toUpperCase();

    parties[partyCode] = [{ id: socket.id, username }];
    userParty[socket.id] = partyCode;

    socket.join(partyCode);

    socket.emit("partyJoined", {
      partyCode,
      users: parties[partyCode],
    });
  });

  // ---------- JOIN PARTY ----------
  socket.on("joinParty", ({ partyCode, username }) => {
    if (!parties[partyCode]) {
      socket.emit("partyError", "Party does not exist");
      return;
    }

    const user = { id: socket.id, username };
    parties[partyCode].push(user);
    userParty[socket.id] = partyCode;

    socket.join(partyCode);

    socket.emit("partyJoined", {
      partyCode,
      users: parties[partyCode],
    });

    socket.to(partyCode).emit("userJoined", user);

    // send existing locations
    parties[partyCode].forEach((u) => {
      if (userLocations[u.id]) {
        socket.emit("receive-location", {
          id: u.id,
          username: users[u.id],
          latitude: userLocations[u.id].latitude,
          longitude: userLocations[u.id].longitude,
        });
      }
    });
  });

  // ---------- LOCATION ----------
  socket.on("send-location", ({ latitude, longitude, username }) => {
    const code = userParty[socket.id];
    if (!code || !parties[code]) return;

    userLocations[socket.id] = { latitude, longitude };

    io.to(code).emit("receive-location", {
      id: socket.id,
      username: username || users[socket.id],
      latitude,
      longitude,
    });
  });

  // ---------- LEAVE ----------
  socket.on("leaveParty", () => {
    removeUserFromParty(socket);
  });

  // ---------- DISCONNECT ----------
  socket.on("disconnect", () => {
    removeUserFromParty(socket);
    delete users[socket.id];
  });
});

server.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
