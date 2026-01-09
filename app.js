const express = require("express");
const app = express();
const http = require("http");
const { v4: uuidv4 } = require("uuid");

const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

// =============================
// STATE
// =============================
const users = {};
const parties = {};
const userParty = {};

// =============================
// SOCKET
// =============================
io.on("connection", (socket) => {
  users[socket.id] = "Guest";

  socket.on("register-user", (username) => {
    users[socket.id] = username || "Guest";
  });

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
  });

  socket.on("send-location", (data) => {
    const code = userParty[socket.id];
    if (!code) return;

    io.to(code).emit("receive-location", {
      id: socket.id,
      username: users[socket.id],
      latitude: data.latitude,
      longitude: data.longitude,
    });
  });

  socket.on("disconnect", () => {
    const code = userParty[socket.id];
    if (code && parties[code]) {
      parties[code] = parties[code].filter(
        (u) => u.id !== socket.id
      );
      io.to(code).emit("user-disconnected", socket.id);
      if (!parties[code].length) delete parties[code];
    }
    delete users[socket.id];
    delete userParty[socket.id];
  });
});

server.listen(3000, () =>
  console.log("Backend running on http://localhost:3000")
);
