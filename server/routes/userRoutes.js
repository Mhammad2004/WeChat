const express = require("express");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// router.get("/me", authMiddleware, (req, res) => {
//     res.json({
//         message: "Authentication successful",
//         user: req.user
//     });
// });

// router.get("/", authMiddleware, async (req, res) => {
//     try {
//         const [users] = await db.query(
//             `SELECT id, username, email
//              FROM users
//              WHERE id != ?`,
//             [req.user.id]
//         );

//         res.json(users);

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Failed to fetch users"
//         });
//     }
// });


router.get("/me", authMiddleware, (req, res) => {
    res.json({
        message: "Authentication successful",
        user: req.user
    });
});

router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const [friends] = await db.query(
            `
      SELECT u.id, u.username, u.email, u.is_online, u.last_seen
      FROM friendships f
      JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = ?
      ORDER BY u.username ASC
      `,
            [userId]
        );

        res.json(friends);

    } catch (error) {
        console.error("Get friends error:", error);

        res.status(500).json({
            message: "Failed to get friends"
        });
    }
});
router.get("/search", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const search = req.query.q?.trim();

        if (!search) {
            return res.json([]);
        }

        const [users] = await db.query(
            `
      SELECT id, username, email, is_online, last_seen
      FROM users
      WHERE id != ?
        AND (username LIKE ? OR email LIKE ?)
      ORDER BY username ASC
      LIMIT 20
      `,
            [userId, `%${search}%`, `%${search}%`]
        );

        res.json(users);

    } catch (error) {
        console.error("Search users error:", error);

        res.status(500).json({
            message: "Failed to search users"
        });
    }
});
router.post("/friend-request/:userId", authMiddleware, async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = Number(req.params.userId);

        if (!receiverId || senderId === receiverId) {
            return res.status(400).json({
                message: "Invalid user"
            });
        }

        // Check receiver exists
        const [users] = await db.query(
            "SELECT id FROM users WHERE id = ?",
            [receiverId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check if either user blocked the other
        const [blocked] = await db.query(
            `
      SELECT id
      FROM blocked_users
      WHERE (blocker_id = ? AND blocked_id = ?)
         OR (blocker_id = ? AND blocked_id = ?)
      `,
            [senderId, receiverId, receiverId, senderId]
        );

        if (blocked.length > 0) {
            return res.status(403).json({
                message: "Cannot send friend request"
            });
        }

        // Already friends?
        const [friendship] = await db.query(
            `
      SELECT id
      FROM friendships
      WHERE user_id = ? AND friend_id = ?
      `,
            [senderId, receiverId]
        );

        if (friendship.length > 0) {
            return res.status(400).json({
                message: "You are already friends"
            });
        }

        // Existing request?
        const [existingRequest] = await db.query(
            `
      SELECT id, sender_id, receiver_id, status
      FROM friend_requests
      WHERE
        (sender_id = ? AND receiver_id = ?)
        OR
        (sender_id = ? AND receiver_id = ?)
      ORDER BY id DESC
      LIMIT 1
      `,
            [senderId, receiverId, receiverId, senderId]
        );

        if (existingRequest.length > 0) {
            const request = existingRequest[0];

            if (request.status === "pending") {
                return res.status(400).json({
                    message: "Friend request already pending"
                });
            }

            if (
                request.sender_id === receiverId &&
                request.receiver_id === senderId &&
                request.status === "rejected"
            ) {
                await db.query(
                    `
          UPDATE friend_requests
          SET status = 'pending'
          WHERE id = ?
          `,
                    [request.id]
                );

                return res.json({
                    message: "Friend request sent"
                });
            }
        }

        await db.query(
            `
      INSERT INTO friend_requests
      (sender_id, receiver_id, status)
      VALUES (?, ?, 'pending')
      `,
            [senderId, receiverId]
        );

        res.status(201).json({
            message: "Friend request sent"
        });

    } catch (error) {
        console.error("Send friend request error:", error);

        res.status(500).json({
            message: "Failed to send friend request"
        });
    }
});
router.get("/friend-requests", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [requests] = await db.query(
      `
      SELECT
        fr.id,
        fr.sender_id,
        fr.receiver_id,
        fr.status,
        fr.created_at,
        u.username,
        u.email
      FROM friend_requests fr
      JOIN users u ON u.id = fr.sender_id
      WHERE fr.receiver_id = ?
        AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
      `,
      [userId]
    );

    res.json(requests);

  } catch (error) {
    console.error("Get friend requests error:", error);

    res.status(500).json({
      message: "Failed to get friend requests"
    });
  }
});
router.post(
  "/friend-requests/:requestId/accept",
  authMiddleware,
  async (req, res) => {
    const connection = await db.getConnection();

    try {
      const userId = req.user.id;
      const requestId = Number(req.params.requestId);

      await connection.beginTransaction();

      const [requests] = await connection.query(
        `
        SELECT sender_id, receiver_id
        FROM friend_requests
        WHERE id = ?
          AND receiver_id = ?
          AND status = 'pending'
        FOR UPDATE
        `,
        [requestId, userId]
      );

      if (requests.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          message: "Friend request not found"
        });
      }

      const { sender_id, receiver_id } = requests[0];

      await connection.query(
        `
        UPDATE friend_requests
        SET status = 'accepted'
        WHERE id = ?
        `,
        [requestId]
      );

      // Create friendship both ways
      await connection.query(
        `
        INSERT IGNORE INTO friendships
        (user_id, friend_id)
        VALUES (?, ?), (?, ?)
        `,
        [
          sender_id,
          receiver_id,
          receiver_id,
          sender_id
        ]
      );

      await connection.commit();

      res.json({
        message: "Friend request accepted"
      });

    } catch (error) {
      await connection.rollback();

      console.error("Accept friend request error:", error);

      res.status(500).json({
        message: "Failed to accept friend request"
      });

    } finally {
      connection.release();
    }
  }
);
router.post(
  "/friend-requests/:requestId/reject",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const requestId = Number(req.params.requestId);

      const [result] = await db.query(
        `
        UPDATE friend_requests
        SET status = 'rejected'
        WHERE id = ?
          AND receiver_id = ?
          AND status = 'pending'
        `,
        [requestId, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Friend request not found"
        });
      }

      res.json({
        message: "Friend request rejected"
      });

    } catch (error) {
      console.error("Reject friend request error:", error);

      res.status(500).json({
        message: "Failed to reject friend request"
      });
    }
  }
);
router.delete(
  "/friends/:friendId",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const friendId = Number(req.params.friendId);

      if (!friendId || userId === friendId) {
        return res.status(400).json({
          message: "Invalid friend"
        });
      }

      const [result] = await db.query(
        `
        DELETE FROM friendships
        WHERE
          (user_id = ? AND friend_id = ?)
          OR
          (user_id = ? AND friend_id = ?)
        `,
        [
          userId,
          friendId,
          friendId,
          userId
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Friendship not found"
        });
      }

      res.json({
        message: "Friend removed"
      });

    } catch (error) {
      console.error("Unfriend error:", error);

      res.status(500).json({
        message: "Failed to remove friend"
      });
    }
  }
);
router.post(
  "/block/:userId",
  authMiddleware,
  async (req, res) => {
    const connection = await db.getConnection();

    try {
      const blockerId = req.user.id;
      const blockedId = Number(req.params.userId);

      if (!blockedId || blockerId === blockedId) {
        return res.status(400).json({
          message: "Invalid user"
        });
      }

      await connection.beginTransaction();

      await connection.query(
        `
        INSERT IGNORE INTO blocked_users
        (blocker_id, blocked_id)
        VALUES (?, ?)
        `,
        [blockerId, blockedId]
      );

      // Remove friendship in both directions
      await connection.query(
        `
        DELETE FROM friendships
        WHERE
          (user_id = ? AND friend_id = ?)
          OR
          (user_id = ? AND friend_id = ?)
        `,
        [
          blockerId,
          blockedId,
          blockedId,
          blockerId
        ]
      );

      // Remove pending requests in both directions
      await connection.query(
        `
        DELETE FROM friend_requests
        WHERE
          (sender_id = ? AND receiver_id = ?)
          OR
          (sender_id = ? AND receiver_id = ?)
        `,
        [
          blockerId,
          blockedId,
          blockedId,
          blockerId
        ]
      );

      await connection.commit();

      res.json({
        message: "User blocked"
      });

    } catch (error) {
      await connection.rollback();

      console.error("Block user error:", error);

      res.status(500).json({
        message: "Failed to block user"
      });

    } finally {
      connection.release();
    }
  }
);
router.delete(
  "/block/:userId",
  authMiddleware,
  async (req, res) => {
    try {
      const blockerId = req.user.id;
      const blockedId = Number(req.params.userId);

      const [result] = await db.query(
        `
        DELETE FROM blocked_users
        WHERE blocker_id = ?
          AND blocked_id = ?
        `,
        [blockerId, blockedId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "User is not blocked"
        });
      }

      res.json({
        message: "User unblocked"
      });

    } catch (error) {
      console.error("Unblock user error:", error);

      res.status(500).json({
        message: "Failed to unblock user"
      });
    }
  }
);
router.get("/blocked", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      `
      SELECT
        u.id,
        u.username,
        u.email
      FROM blocked_users b
      JOIN users u ON u.id = b.blocked_id
      WHERE b.blocker_id = ?
      ORDER BY u.username ASC
      `,
      [userId]
    );

    res.json(users);

  } catch (error) {
    console.error("Get blocked users error:", error);

    res.status(500).json({
      message: "Failed to get blocked users"
    });
  }
});
module.exports = router;