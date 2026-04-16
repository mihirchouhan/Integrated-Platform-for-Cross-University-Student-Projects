const { Server } = require("socket.io");

/**
 * Initialize Socket.io on an HTTP server.
 *
 * Rooms:
 *   collab:<roomId>  – Code-Syncronix collaboration
 *   dm:<sorted-pair>  – Direct messages
 *   notify:<email>    – User notifications
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    /* ---- Join notification room ---- */
    socket.on("auth", (email) => {
      if (email) {
        socket.join(`notify:${email}`);
        socket.data.email = email;
      }
    });

    /* ---- Collaboration rooms ---- */
    socket.on("collab:join", ({ roomId, userName }) => {
      socket.join(`collab:${roomId}`);
      socket.to(`collab:${roomId}`).emit("collab:user-joined", {
        socketId: socket.id,
        userName: userName || "Anonymous",
      });
    });

    socket.on("collab:code-change", ({ roomId, code }) => {
      socket.to(`collab:${roomId}`).emit("collab:code-change", {
        code,
        from: socket.id,
      });
    });

    socket.on("collab:cursor-move", ({ roomId, cursor }) => {
      socket.to(`collab:${roomId}`).emit("collab:cursor-move", {
        cursor,
        from: socket.id,
      });
    });

    socket.on("collab:language-change", ({ roomId, language }) => {
      socket.to(`collab:${roomId}`).emit("collab:language-change", {
        language,
        from: socket.id,
      });
    });

    socket.on("collab:leave", ({ roomId }) => {
      socket.leave(`collab:${roomId}`);
      socket.to(`collab:${roomId}`).emit("collab:user-left", { socketId: socket.id });
    });

    /* ---- DM rooms ---- */
    socket.on("dm:join", ({ peer }) => {
      if (socket.data.email && peer) {
        const room = [socket.data.email, peer].sort().join(":");
        socket.join(`dm:${room}`);
      }
    });

    socket.on("dm:send", ({ to, message }) => {
      if (socket.data.email && to) {
        const room = [socket.data.email, to].sort().join(":");
        io.to(`dm:${room}`).emit("dm:message", {
          from: socket.data.email,
          to,
          message,
          createdAt: new Date().toISOString(),
        });
      }
    });

    /* ---- Disconnect ---- */
    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { initSocket };
