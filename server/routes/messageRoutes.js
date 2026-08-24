const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");


router.get(
  "/group/:groupId",
  authMiddleware,
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      // Check membership
      const [members] = await db.query(
        `
        SELECT *
        FROM group_members
        WHERE group_id = ?
        AND user_id = ?
        `,
        [groupId, userId]
      );

      if (members.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this group"
        });
      }

      // Find when THIS user cleared the group
      const [clearRows] = await db.query(
        `
        SELECT cleared_at
        FROM group_conversation_clears
        WHERE group_id = ?
        AND user_id = ?
        `,
        [groupId, userId]
      );

      let clearedAt = null;

      if (clearRows.length > 0) {
        clearedAt = clearRows[0].cleared_at;
      }

      let query = `
        SELECT
          messages.id,
          messages.sender_id AS senderId,
          users.username AS senderName,
          messages.group_id AS groupId,
          messages.message AS text,
          messages.created_at AS createdAt
        FROM messages
        JOIN users
          ON users.id = messages.sender_id
        WHERE messages.group_id = ?
      `;

      const params = [groupId];

      if (clearedAt) {
        query += `
          AND messages.created_at > ?
        `;

        params.push(clearedAt);
      }

      query += `
        ORDER BY messages.created_at ASC
      `;

      const [messages] = await db.query(
        query,
        params
      );

      res.json(messages);

    } catch (error) {
      console.error(
        "Group messages error:",
        error
      );

      res.status(500).json({
        message: "Failed to load group messages"
      });
    }
  }
);



router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = Number(req.params.userId);

    // Find when THIS user cleared this conversation
    const [clearRows] = await db.query(
      `SELECT cleared_at
       FROM conversation_clears
       WHERE user_id = ?
       AND other_user_id = ?`,
      [currentUserId, otherUserId]
    );

    let clearedAt = null;

    if (clearRows.length > 0) {
      clearedAt = clearRows[0].cleared_at;
    }

    let query = `
    SELECT
  id,
  sender_id AS senderId,
  receiver_id AS receiverId,
  message AS text,
  created_at AS createdAt
      FROM messages
      WHERE
        (
          (sender_id = ? AND receiver_id = ?)
          OR
          (sender_id = ? AND receiver_id = ?)
        )
    `;

    const params = [
      currentUserId,
      otherUserId,
      otherUserId,
      currentUserId
    ];

    // IMPORTANT:
    // Apply the clear time to the ENTIRE conversation,
    // not to only one sender.
    if (clearedAt) {
      query += `
        AND created_at > ?
      `;

      params.push(clearedAt);
    }

    query += `
      ORDER BY created_at ASC
    `;

    const [messages] = await db.query(
      query,
      params
    );

    res.json(messages);

  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    res.status(500).json({
      message: "Failed to load messages"
    });
  }
});

module.exports = router;