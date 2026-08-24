const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Server } = require("socket.io");

const jwt = require("jsonwebtoken");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const groupRoutes = require("./routes/groupRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Chat App API is running :)"
  });
});

app.get("/test-db", async (req, res) => {
  try {
    const [result] = await db.query("SELECT 1");

    res.json({
      message: "MySQL connected successfully ✅",
      result
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "MySQL connection failed ❌"
    });
  }
});

// app.use("/api/auth", authRoutes);

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const http = require("http");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.user = decoded;

    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.username);


  socket.on("send_group_message", async (data) => {
    try {
      const { groupId, text } = data;

      if (!groupId || !text || !text.trim()) {
        return;
      }

      const senderId = socket.user.id;
      const senderName = socket.user.username;

      // Make sure sender belongs to the group
      const [members] = await db.query(
        `
      SELECT *
      FROM group_members
      WHERE group_id = ?
      AND user_id = ?
      `,
        [groupId, senderId]
      );

      if (members.length === 0) {
        console.log("User is not a member of this group");
        return;
      }

      // Save group message
      const [result] = await db.query(
        `
      INSERT INTO messages
      (sender_id, group_id, message)
      VALUES (?, ?, ?)
      `,
        [senderId, groupId, text.trim()]
      );

      const newMessage = {
        id: result.insertId,
        text: text.trim(),
        senderId,
        senderName,
        groupId,
      };

      console.log("Group message received:", newMessage);

      // Get all group members
      const [groupMembers] = await db.query(
        `
      SELECT user_id
      FROM group_members
      WHERE group_id = ?
      `,
        [groupId]
      );

      // Send to every online member
      for (const member of groupMembers) {
        const memberSocketId = onlineUsers.get(member.user_id);

        if (memberSocketId) {
          io.to(memberSocketId).emit(
            "receive_group_message",
            newMessage
          );
        }
      }

    } catch (error) {
      console.error(
        "Group message error:",
        error
      );
    }
  });


  // Store the user's socket ID
  onlineUsers.set(socket.user.id, socket.id);

  socket.on("send_message", async (message) => {
    try {
      const { text, recipientId } = message;

      const senderId = socket.user.id;
      const senderName = socket.user.username;

      // Save message to MySQL
      const [result] = await db.query(
        `INSERT INTO messages
      (sender_id, receiver_id, message)
      VALUES (?, ?, ?)`,
        [senderId, recipientId, text]
      );

      const newMessage = {
        id: result.insertId,
        text,
        senderId,
        senderName,
        recipientId,
        createdAt: new Date(),
      };

      console.log("Message received:", newMessage);

      // Send message back to sender
      io.to(socket.id).emit(
        "receive_message",
        newMessage
      );

      // Send message to recipient
      const recipientSocketId =
        onlineUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit(
          "receive_message",
          newMessage
        );
      }

    } catch (error) {
      console.error("Message error:", error);
    }
  });
  socket.on("edit_message", async (data) => {
    try {
      const { messageId, newText } = data;

      if (!newText || !newText.trim()) {
        return;
      }

      // Check that this message belongs to the logged-in user
      const [messages] = await db.query(
        `SELECT *
       FROM messages
       WHERE id = ?
       AND sender_id = ?`,
        [messageId, socket.user.id]
      );

      if (messages.length === 0) {
        return;
      }

      // Update message in MySQL
      await db.query(
        `UPDATE messages
       SET message = ?
       WHERE id = ?`,
        [newText.trim(), messageId]
      );

      const message = messages[0];

      const updatedMessage = {
        id: message.id,
        text: newText.trim(),
        senderId: message.sender_id,
        recipientId: message.receiver_id,
      };

      console.log("Message edited:", updatedMessage);

      const recipientSocketId =
        onlineUsers.get(message.receiver_id);

      // Tell sender
      io.to(socket.id).emit(
        "message_edited",
        updatedMessage
      );

      // Tell recipient
      if (recipientSocketId) {
        io.to(recipientSocketId).emit(
          "message_edited",
          updatedMessage
        );
      }

    } catch (error) {
      console.error("Edit message error:", error);
    }
  });


  // ===============================
  // DELETE MESSAGE
  // ===============================

  socket.on("delete_message", async (messageId) => {
    try {
      // Check that the message belongs to the logged-in user
      const [messages] = await db.query(
        `SELECT *
       FROM messages
       WHERE id = ?
       AND sender_id = ?`,
        [messageId, socket.user.id]
      );

      if (messages.length === 0) {
        console.log(
          "Message not found or not owned by user"
        );
        return;
      }

      const message = messages[0];

      // Delete from MySQL
      await db.query(
        `DELETE FROM messages
       WHERE id = ?`,
        [messageId]
      );

      console.log(
        "Message deleted:",
        messageId
      );

      const deletedMessage = {
        id: message.id,
        senderId: message.sender_id,
        recipientId: message.receiver_id,
      };

      // Tell sender
      io.to(socket.id).emit(
        "message_deleted",
        deletedMessage
      );

      // Tell recipient
      const recipientSocketId =
        onlineUsers.get(message.receiver_id);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit(
          "message_deleted",
          deletedMessage
        );
      }

    } catch (error) {
      console.error(
        "Delete message error:",
        error
      );
    }
  });

  socket.on("clear_conversation", async (otherUserId) => {
    try {
      const userId = socket.user.id;

      await db.query(
        `INSERT INTO conversation_clears
       (user_id, other_user_id, cleared_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       cleared_at = NOW()`,
        [userId, otherUserId]
      );

      console.log(
        `Conversation cleared for user ${userId} with user ${otherUserId}`
      );

      // Only clear the conversation for THIS user
      io.to(socket.id).emit(
        "conversation_cleared",
        {
          otherUserId
        }
      );

    } catch (error) {
      console.error(
        "Clear conversation error:",
        error
      );
    }
  });
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.user.id);

    console.log(
      "User disconnected:",
      socket.user.username
    );
  });

});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});