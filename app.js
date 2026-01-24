const express = require("express");
const http = require("http");
const partyManager = require("./managers/PartyManager");
const logger = require("./utils/logger");
const { isValidUsername, isValidPartyCode, isValidLocation } = require("./utils/validation");

const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 2 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  },
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://real-time-tracker-0qge.onrender.com",
      "https://real-time-tracker-three.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

// =============================
// SOCKET
// =============================
io.on("connection", (socket) => {
  if (socket.recovered) {
    logger.info(`Socket recovered: ${socket.id}`);
    // recovery successful, socket.id, socket.rooms and socket.data are restored
  } else {
    logger.info(`Socket connected: ${socket.id}`);
    partyManager.registerUser(socket.id, "Guest");
  }

  socket.on("register-user", (username) => {
    if (!isValidUsername(username)) return;
    partyManager.registerUser(socket.id, username);
  });

  // ---------- CREATE PARTY ----------
  socket.on("createParty", (username) => {
    if (!isValidUsername(username)) {
      socket.emit("partyError", "Invalid username");
      return;
    }

    const { partyCode, users, creator } = partyManager.createParty(socket.id, username);
    socket.join(partyCode);

    socket.emit("partyJoined", {
      partyCode,
      users,
      creator
    });
  });

  // ---------- JOIN PARTY ----------
  socket.on("joinParty", ({ partyCode, username }) => {
    if (!isValidPartyCode(partyCode) || !isValidUsername(username)) {
      socket.emit("partyError", "Invalid input");
      return;
    }

    const result = partyManager.joinParty(socket.id, username, partyCode);

    if (result.error) {
      logger.warn(`Join failed: ${result.error}`);
      socket.emit("partyError", result.error);
      return;
    }

    const { users, creator } = result;

    socket.join(partyCode);

    // Notify SELF
    socket.emit("partyJoined", {
      partyCode,
      users, // Full list including self
      creator
    });

    // Notify OTHERS
    socket.to(partyCode).emit("userJoined", { id: socket.id, username });

    // Send existing locations to NEW USER (Iterate users in party and send their cached locs)
    // NOTE: PartyManager has userLocations.
    users.forEach(u => {
      const loc = partyManager.userLocations[u.id];
      if (loc) {
        socket.emit("receive-location", {
          id: u.id,
          username: u.username,
          latitude: loc.latitude,
          longitude: loc.longitude
        });
      }
    });
  });

  // ---------- LOCATION ----------
  socket.on("send-location", ({ latitude, longitude, username }) => {
    if (!isValidLocation(latitude, longitude)) return;

    const partyCode = partyManager.updateLocation(socket.id, latitude, longitude);

    if (partyCode) {
      // Broadcast to party (excluding sender)
      socket.to(partyCode).emit("receive-location", {
        id: socket.id,
        username: username || partyManager.getUser(socket.id),
        latitude,
        longitude,
      });
    }
  });

  // ---------- LEAVE ----------
  socket.on("leaveParty", () => {
    logger.info(`[LEAVE] Socket ${socket.id} requested to leave party`);
    const result = partyManager.leaveParty(socket.id);

    if (result && result.partyCode) {
      socket.leave(result.partyCode);
      socket.emit("partyClosed"); // Or just clear local state

      // Notify others
      socket.to(result.partyCode).emit("user-disconnected", socket.id);

      if (result.partyClosed) {
        socket.to(result.partyCode).emit("partyClosed");
      }
    }
  });

  // ---------- DISCONNECT ----------
  socket.on("disconnect", () => {
    logger.info(`[DISCONNECT] Socket disconnected: ${socket.id}`);
    const result = partyManager.handleDisconnect(socket.id);

    if (result && result.partyCode) {
      // Notify others
      socket.to(result.partyCode).emit("user-disconnected", socket.id);

      if (result.partyClosed) {
        socket.to(result.partyCode).emit("partyClosed");
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});

