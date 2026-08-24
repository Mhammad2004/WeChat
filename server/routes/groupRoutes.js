const express = require("express");
const db = require("../config/db");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ===============================
// AUTH MIDDLEWARE
// ===============================

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};


// ===============================
// CREATE GROUP
// ===============================

router.post("/", authenticate, async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required"
      });
    }

    const ownerId = req.user.id;

    // Create group
    const [groupResult] = await db.query(
      `INSERT INTO chat_groups
       (name, owner_id)
       VALUES (?, ?)`,
      [name.trim(), ownerId]
    );

    const groupId = groupResult.insertId;

    // Add creator
    await db.query(
      `INSERT INTO group_members
       (group_id, user_id)
       VALUES (?, ?)`,
      [groupId, ownerId]
    );

    // Add selected members
    for (const memberId of memberIds) {

      if (Number(memberId) === Number(ownerId)) {
        continue;
      }

      await db.query(
        `INSERT INTO group_members
         (group_id, user_id)
         VALUES (?, ?)`,
        [groupId, memberId]
      );
    }

    res.status(201).json({
      message: "Group created successfully",
      groupId
    });

  } catch (error) {

    console.error("Create group error:", error);

    res.status(500).json({
      message: "Failed to create group"
    });
  }
});


// ===============================
// GET MY GROUPS
// ===============================

router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [groups] = await db.query(
      `
      SELECT
        g.id,
        g.name,
        g.owner_id,
        g.created_at,
        gm.is_pinned
      FROM chat_groups g
      INNER JOIN group_members gm
        ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY gm.is_pinned DESC, g.created_at DESC
      `,
      [userId]
    );

    res.json(groups);

  } catch (error) {
    console.error("Get groups error:", error);

    res.status(500).json({
      message: "Failed to get groups"
    });
  }
});
// ===============================
// PIN / UNPIN GROUP
// ===============================

router.patch(
  "/:groupId/pin",
  authenticate,
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      const [membership] = await db.query(
        `
        SELECT is_pinned
        FROM group_members
        WHERE group_id = ?
        AND user_id = ?
        `,
        [groupId, userId]
      );

      if (membership.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this group"
        });
      }

      const newPinnedState =
        membership[0].is_pinned ? 0 : 1;

      await db.query(
        `
        UPDATE group_members
        SET is_pinned = ?
        WHERE group_id = ?
        AND user_id = ?
        `,
        [newPinnedState, groupId, userId]
      );

      res.json({
        message: newPinnedState
          ? "Group pinned"
          : "Group unpinned",
        isPinned: newPinnedState
      });

    } catch (error) {
      console.error("Pin group error:", error);

      res.status(500).json({
        message: "Failed to pin group"
      });
    }
  }
);
// ===============================
// GET GROUP DETAILS + MEMBERS
// ===============================

router.get("/:groupId", authenticate, async (req, res) => {
  try {

    const { groupId } = req.params;
    const userId = req.user.id;

    // Check membership
    const [membership] = await db.query(
      `
      SELECT *
      FROM group_members
      WHERE group_id = ?
      AND user_id = ?
      `,
      [groupId, userId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        message: "You are not a member of this group"
      });
    }

    // Get group
    const [groups] = await db.query(
      `
      SELECT *
      FROM chat_groups
      WHERE id = ?
      `,
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({
        message: "Group not found"
      });
    }

    // Get members
    const [members] = await db.query(
      `
      SELECT
        gm.user_id,
        u.username,
        u.email,
        gm.joined_at
      FROM group_members gm
      INNER JOIN users u
        ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at ASC
      `,
      [groupId]
    );

    res.json({
      group: groups[0],
      members
    });

  } catch (error) {

    console.error("Get group error:", error);

    res.status(500).json({
      message: "Failed to get group"
    });
  }
});


// ===============================
// ADD MEMBER
// ===============================

router.post("/:groupId/members", authenticate, async (req, res) => {
  try {

    const { groupId } = req.params;
    const { userId } = req.body;

    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required"
      });
    }

    // Check current user is a member
    const [membership] = await db.query(
      `
      SELECT *
      FROM group_members
      WHERE group_id = ?
      AND user_id = ?
      `,
      [groupId, currentUserId]
    );

    if (membership.length === 0) {
      return res.status(403).json({
        message: "You are not a group member"
      });
    }

    // Check target user exists
    const [users] = await db.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Check already member
    const [existing] = await db.query(
      `
      SELECT *
      FROM group_members
      WHERE group_id = ?
      AND user_id = ?
      `,
      [groupId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "User is already a member"
      });
    }

    // Add member
    await db.query(
      `
      INSERT INTO group_members
      (group_id, user_id)
      VALUES (?, ?)
      `,
      [groupId, userId]
    );

    res.json({
      message: "Member added successfully"
    });

  } catch (error) {

    console.error("Add member error:", error);

    res.status(500).json({
      message: "Failed to add member"
    });
  }
});


// ===============================
// REMOVE MEMBER — ADMIN ONLY
// ===============================

router.delete(
  "/:groupId/members/:memberId",
  authenticate,
  async (req, res) => {
    try {
      const { groupId, memberId } = req.params;
      const currentUserId = req.user.id;

      // Check group
      const [groups] = await db.query(
        `
        SELECT owner_id
        FROM chat_groups
        WHERE id = ?
        `,
        [groupId]
      );

      if (groups.length === 0) {
        return res.status(404).json({
          message: "Group not found",
        });
      }

      // Only admin can remove members
      if (
        Number(groups[0].owner_id) !==
        Number(currentUserId)
      ) {
        return res.status(403).json({
          message: "Only the admin can remove members",
        });
      }

      // Don't allow admin to remove themselves
      if (
        Number(memberId) ===
        Number(currentUserId)
      ) {
        return res.status(400).json({
          message: "Admin cannot remove themselves",
        });
      }

      // Check target member
      const [membership] = await db.query(
        `
        SELECT *
        FROM group_members
        WHERE group_id = ?
        AND user_id = ?
        `,
        [groupId, memberId]
      );

      if (membership.length === 0) {
        return res.status(404).json({
          message: "User is not a member of this group",
        });
      }

      // Remove member
      await db.query(
        `
        DELETE FROM group_members
        WHERE group_id = ?
        AND user_id = ?
        `,
        [groupId, memberId]
      );

      res.json({
        message: "Member removed successfully",
      });

    } catch (error) {
      console.error(
        "Remove member error:",
        error
      );

      res.status(500).json({
        message: "Failed to remove member",
      });
    }
  }
);

// ===============================
// REMOVE MEMBER — ADMIN ONLY
// ===============================

// router.delete(
//   "/:groupId",
//   authenticate,
//   async (req, res) => {
//     try {
//       const { groupId } = req.params;
//       const userId = req.user.id;

//       const [groups] = await db.query(
//         `
//         SELECT owner_id
//         FROM chat_groups
//         WHERE id = ?
//         `,
//         [groupId]
//       );

//       if (groups.length === 0) {
//         return res.status(404).json({
//           message: "Group not found"
//         });
//       }

//       if (
//         Number(groups[0].owner_id) !==
//         Number(userId)
//       ) {
//         return res.status(403).json({
//           message: "Only the admin can delete the group"
//         });
//       }

//       await db.query(
//         `
//         DELETE FROM messages
//         WHERE group_id = ?
//         `,
//         [groupId]
//       );

//       await db.query(
//         `
//         DELETE FROM group_conversation_clears
//         WHERE group_id = ?
//         `,
//         [groupId]
//       );

//       await db.query(
//         `
//         DELETE FROM group_members
//         WHERE group_id = ?
//         `,
//         [groupId]
//       );

//       await db.query(
//         `
//         DELETE FROM chat_groups
//         WHERE id = ?
//         `,
//         [groupId]
//       );

//       res.json({
//         message: "Group deleted successfully"
//       });

//     } catch (error) {
//       console.error(
//         "Delete group error:",
//         error
//       );

//       res.status(500).json({
//         message: "Failed to delete group"
//       });
//     }
//   }
// );


// ===============================
// CHANGE GROUP NAME — ADMIN ONLY
// ===============================

router.patch(
  "/:groupId",
  authenticate,
  async (req, res) => {

    try {

      const { groupId } = req.params;
      const { name } = req.body;

      const currentUserId = req.user.id;

      if (!name || !name.trim()) {
        return res.status(400).json({
          message: "Group name is required"
        });
      }

      const [groups] = await db.query(
        `
        SELECT owner_id
        FROM chat_groups
        WHERE id = ?
        `,
        [groupId]
      );

      if (groups.length === 0) {
        return res.status(404).json({
          message: "Group not found"
        });
      }

      if (
        Number(groups[0].owner_id) !==
        Number(currentUserId)
      ) {
        return res.status(403).json({
          message: "Only the admin can rename the group"
        });
      }

      await db.query(
        `
        UPDATE chat_groups
        SET name = ?
        WHERE id = ?
        `,
        [name.trim(), groupId]
      );

      res.json({
        message: "Group name updated successfully"
      });

    } catch (error) {

      console.error("Rename group error:", error);

      res.status(500).json({
        message: "Failed to rename group"
      });
    }
  }
);


// ===============================
// LEAVE GROUP
// ===============================

router.post(
  "/:groupId/leave",
  authenticate,
  async (req, res) => {

    try {

      const { groupId } = req.params;

      const userId = req.user.id;

      // Get group
      const [groups] = await db.query(
        `
        SELECT owner_id
        FROM chat_groups
        WHERE id = ?
        `,
        [groupId]
      );

      if (groups.length === 0) {
        return res.status(404).json({
          message: "Group not found"
        });
      }

      const currentAdmin =
        Number(groups[0].owner_id);

      // Check membership
      const [membership] = await db.query(
        `
        SELECT *
        FROM group_members
        WHERE group_id = ?
        AND user_id = ?
        `,
        [groupId, userId]
      );

      if (membership.length === 0) {
        return res.status(400).json({
          message: "You are not a member of this group"
        });
      }

      // If regular member leaves
      if (currentAdmin !== Number(userId)) {

        await db.query(
          `
          DELETE FROM group_members
          WHERE group_id = ?
          AND user_id = ?
          `,
          [groupId, userId]
        );

        return res.json({
          message: "You left the group"
        });
      }

      // Admin leaving
      const [nextMembers] = await db.query(
        `
        SELECT user_id
        FROM group_members
        WHERE group_id = ?
        AND user_id != ?
        ORDER BY joined_at ASC
        LIMIT 1
        `,
        [groupId, userId]
      );

      // No members left
      if (nextMembers.length === 0) {

        await db.query(
          `
          DELETE FROM group_members
          WHERE group_id = ?
          `,
          [groupId]
        );

        await db.query(
          `
          DELETE FROM chat_groups
          WHERE id = ?
          `,
          [groupId]
        );

        return res.json({
          message: "Group deleted because no members remain"
        });
      }

      // Promote earliest member
      const newAdmin =
        nextMembers[0].user_id;

      await db.query(
        `
        UPDATE chat_groups
        SET owner_id = ?
        WHERE id = ?
        `,
        [newAdmin, groupId]
      );

      await db.query(
        `
        DELETE FROM group_members
        WHERE group_id = ?
        AND user_id = ?
        `,
        [groupId, userId]
      );

      res.json({
        message: "You left the group",
        newAdmin
      });

    } catch (error) {

      console.error("Leave group error:", error);

      res.status(500).json({
        message: "Failed to leave group"
      });
    }
  }
);


// ===============================
// DELETE ENTIRE GROUP — ADMIN ONLY
// ===============================

router.delete(
  "/:groupId",
  authenticate,
  async (req, res) => {

    try {

      const { groupId } = req.params;

      const userId = req.user.id;

      const [groups] = await db.query(
        `
        SELECT owner_id
        FROM chat_groups
        WHERE id = ?
        `,
        [groupId]
      );

      if (groups.length === 0) {
        return res.status(404).json({
          message: "Group not found"
        });
      }

      if (
        Number(groups[0].owner_id) !==
        Number(userId)
      ) {
        return res.status(403).json({
          message: "Only the admin can delete the group"
        });
      }

      await db.query(
        `
        DELETE FROM chat_groups
        WHERE id = ?
        `,
        [groupId]
      );

      res.json({
        message: "Group deleted successfully"
      });

    } catch (error) {

      console.error("Delete group error:", error);

      res.status(500).json({
        message: "Failed to delete group"
      });
    }
  }
);


// ===============================
// DELETE GROUP CHAT FOR MYSELF
// ===============================

router.post(
  "/:groupId/clear",
  authenticate,
  async (req, res) => {

    try {

      const { groupId } = req.params;

      const userId = req.user.id;

      // Check membership
      const [membership] = await db.query(
        `
        SELECT *
        FROM group_members
        WHERE group_id = ?
        AND user_id = ?
        `,
        [groupId, userId]
      );

      if (membership.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this group"
        });
      }

      await db.query(
        `
        INSERT INTO group_conversation_clears
        (group_id, user_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        cleared_at = CURRENT_TIMESTAMP
        `,
        [groupId, userId]
      );

      res.json({
        message: "Group chat cleared for you"
      });

    } catch (error) {

      console.error("Clear group chat error:", error);

      res.status(500).json({
        message: "Failed to clear group chat"
      });
    }
  }
);


module.exports = router;