import { useEffect, useState } from "react";
import axios from "axios";
function Sidebar({
  user,
  onLogout,
  selectedUser,
  onSelectUser,
  selectedGroup,
  onSelectGroup,
}) {
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const token = localStorage.getItem("token");

  // ==========================================
  // LOAD GROUPS
  // ==========================================

  const loadGroups = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/groups",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("GROUPS API RESPONSE:", response.data);

      setGroups(response.data);
    } catch (error) {
      console.error(
        "Failed to load groups:",
        error.response?.data || error.message
      );
    }
  };

  // ==========================================
  // LOAD USERS
  // ==========================================

  const loadUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("USERS API RESPONSE:", response.data);
      console.log("CURRENT USER:", user);

      const otherUsers = response.data.filter(
        (currentUser) => currentUser.id !== user.id
      );

      setUsers(otherUsers);
    } catch (error) {
      console.error(
        "Failed to load users:",
        error.response?.data || error.message
      );
    }
  };


  // ==========================================
  // CLEAR DIRECT CONVERSATION
  // ==========================================

  const handleClearConversation = async (event, otherUserId) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Clear this conversation?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/messages/conversation/${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If this conversation is currently open,
      // close it and let App reset the messages.
      if (selectedUser?.id === otherUserId) {
        onSelectUser(null);
      }

      alert("Conversation cleared successfully.");

    } catch (error) {
      console.error(
        "Clear conversation error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to clear conversation"
      );
    }
  };

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    if (!user) {
      return;
    }

    loadGroups();
    loadUsers();
  }, [user]);

  // ==========================================
  // SELECT MEMBERS
  // ==========================================

  const toggleMember = (userId) => {
    setSelectedMembers((previous) => {
      if (previous.includes(userId)) {
        return previous.filter((id) => id !== userId);
      }

      return [...previous, userId];
    });
  };

  // ==========================================
  // CREATE GROUP
  // ==========================================

  const handleCreateGroup = async (event) => {
    event.preventDefault();

    if (!groupName.trim()) {
      alert("Enter a group name.");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("Select at least one member.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/groups",
        {
          name: groupName.trim(),
          memberIds: selectedMembers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Group created:", response.data);

      setGroupName("");
      setSelectedMembers([]);
      setShowCreateGroup(false);

      await loadGroups();
    } catch (error) {
      console.error(
        "Create group error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to create group"
      );
    }
  };

  // =========================================
  // LOAD FRIEND REQUESTS
  // =========================================
  const loadFriendRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/users/friend-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFriendRequests(response.data);
    } catch (error) {
      console.error("Failed to load friend requests:", error);
    }
  };
  // ==========================================
  // SEARCH USERS
  // ==========================================
  const searchUsers = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `http://localhost:5000/api/users/search?q=${encodeURIComponent(value)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSearchResults(response.data);
    } catch (error) {
      console.error("Search users error:", error);
    }
  };
  // ==========================================
  // SEND FRIEND REQUESTS
  // ==========================================
  const sendFriendRequest = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/users/friend-request/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Friend request sent!");

      // Refresh search results
      if (search.trim()) {
        searchUsers(search);
      }

    } catch (error) {
      console.error("Send friend request error:", error);

      alert(
        error.response?.data?.message ||
        "Failed to send friend request"
      );
    }
  };


  // ==========================================
  // HANDLE UNFREIND REQUEST
  // ==========================================
  const handleUnfriend = async (event, friendId) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to unfriend this person?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/users/friends/${friendId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Close chat if this friend is currently selected
      if (selectedUser?.id === friendId) {
        onSelectUser(null);
      }

      // Refresh friends
      await loadUsers();

      alert("Friend removed successfully.");

    } catch (error) {
      console.error(
        "Unfriend error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to unfriend"
      );
    }
  };
  // ==========================================
  // HANDEL BLOCK
  // ==========================================
  const handleBlock = async (event, userId) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to block this person?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/users/block/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (selectedUser?.id === userId) {
        onSelectUser(null);
      }

      await loadUsers();

      alert("User blocked successfully.");

    } catch (error) {
      console.error(
        "Block error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to block user"
      );
    }
  };
  // ==========================================
  // ACCEPT FREIND REQUEST
  // ==========================================

  const acceptFriendRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/users/friend-requests/${requestId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadFriendRequests();

      // Reload friends/sidebar
      window.location.reload();

    } catch (error) {
      console.error("Accept request error:", error);

      alert(
        error.response?.data?.message ||
        "Failed to accept request"
      );
    }
  };
  // ==========================================
  // REJECT FRIEND REQUEST
  // ==========================================
  const rejectFriendRequest = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/users/friend-requests/${requestId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadFriendRequests();

    } catch (error) {
      console.error("Reject request error:", error);

      alert(
        error.response?.data?.message ||
        "Failed to reject request"
      );
    }
  };
  // ==========================================
  // LOAD BLOCKED USERS
  // ==========================================
  const loadBlockedUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "http://localhost:5000/api/users/blocked",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBlockedUsers(response.data);
    } catch (error) {
      console.error("Failed to load blocked users:", error);
    }
  };
  // ==========================================
  // HANDEL BLOCK USERS
  // ==========================================
  const handleUnblock = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/users/block/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadBlockedUsers();

      alert("User unblocked successfully.");

    } catch (error) {
      console.error("Unblock error:", error);

      alert(
        error.response?.data?.message ||
        "Failed to unblock user"
      );
    }
  };
  // ==========================================
  // RENDER
  // ==========================================
  useEffect(() => {
    if (!user) {
      return;
    }

    loadGroups();
    loadUsers();
    loadFriendRequests();
    loadBlockedUsers();
  }, [user]);


  return (
    <aside className="sidebar">




      {/* HEADER */}

      <div className="sidebar-header">

        {/* <h3>WeChat</h3> */}

        <div className="current-user">

          <span>{user.username}</span>

          <button onClick={onLogout}>
            Logout
          </button>

        </div>

      </div>



      <button
        className="friend-requests-button"
        onClick={() => setShowRequests(!showRequests)}
      >        Friend Requests
        {friendRequests.length > 0 && (
          <span className="count-badge">
            {friendRequests.length}
          </span>)}
      </button>

      {showRequests && (
        <div>
          {friendRequests.length === 0 ? (
            <p>No friend requests</p>
          ) : (
            friendRequests.map((request) => (
              <div key={request.id}>
                <strong>{request.username}</strong>

                <button onClick={() => acceptFriendRequest(request.id)}>
                  Accept
                </button>

                <button onClick={() => rejectFriendRequest(request.id)}>
                  Reject
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <button
        className="blocked-users-button"
        onClick={() => setShowBlocked(!showBlocked)}
      >
        Blocked Users
        {blockedUsers.length > 0 && (
          <span className="count-badge">
            {blockedUsers.length}
          </span>)}
      </button>

      {showBlocked && (
        <div>
          {blockedUsers.length === 0 ? (
            <p>No blocked users</p>
          ) : (
            blockedUsers.map((blockedUser) => (
              <div key={blockedUser.id}>
                <strong>{blockedUser.username}</strong>

                <button
                  onClick={() => handleUnblock(blockedUser.id)}
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* SEARCH */}

      <div className="search-box">

        <input
          type="text"
          placeholder="Search people..."
          value={search}
          onChange={(event) => {
            searchUsers(event.target.value);
          }}
        />

      </div>


      {/* SCROLLABLE CONTENT */}

      <div className="sidebar-scroll">
        {searchResults.length > 0 && (
          <div className="search-results">

            {searchResults.map((searchUser) => (
              <div
                key={searchUser.id}
                className="search-result"
              >

                <div>
                  <strong>{searchUser.username}</strong>
                  <div>{searchUser.email}</div>
                </div>

                <button
                  onClick={() => sendFriendRequest(searchUser.id)}
                >
                  Add Friend
                </button>

              </div>
            ))}

          </div>
        )}
        {/* CHATS */}

        <div className="sidebar-section">

          <div className="section-header">

            <h3>Chats</h3>

          </div>


          <div className="conversation-list">

            {users.length === 0 ? (

              <p className="empty-message">
                No users found
              </p>

            ) : (

              users.map((currentUser) => (

                <div
                  key={currentUser.id}
                  className={`conversation ${selectedUser?.id === currentUser.id
                    ? "active"
                    : ""
                    }`}
                  onClick={() => {
                    console.log("USER CLICKED:", currentUser);

                    onSelectUser(currentUser);
                    // onSelectGroup(null);
                  }}
                >

                  <div className="avatar">

                    {currentUser.username
                      .substring(0, 2)
                      .toUpperCase()}

                  </div>


                  <div className="conversation-info">
                    <h3>
                      {currentUser.username}
                    </h3>

                    <p>
                      message
                    </p>
                  </div>

                  <button
                    className="delete-conversation-button"
                    onClick={(event) =>
                      handleClearConversation(
                        event,
                        currentUser.id
                      )
                    }
                    title="Clear conversation"
                  >
                    🗑️
                  </button>
                  <button
                    className="unfriend-button"
                    onClick={(event) =>
                      handleUnfriend(
                        event,
                        currentUser.id
                      )
                    }
                    title="Unfriend"
                  >
                    💔
                  </button>
                  <button
                    className="block-user-button"
                    onClick={(event) =>
                      handleBlock(event, currentUser.id)
                    }
                    title="Block"
                  >
                    🚫
                  </button>
                </div>

              ))

            )}

          </div>

        </div>


        {/* GROUPS */}

        <div className="sidebar-section">

          <div className="section-header">

            <h3>Groups</h3>

            <button
              className="create-group-button"
              onClick={() => {
                setShowCreateGroup(true);
              }}
            >
              +
            </button>

          </div>


          <div className="conversation-list">

            {groups.length === 0 ? (

              <p className="empty-message">
                No groups yet
              </p>

            ) : (

              groups.map((group) => (

                <div
                  key={group.id}
                  className={`conversation ${selectedGroup?.id === group.id
                    ? "active"
                    : ""
                    }`}
                  onClick={() => {

                    console.log(
                      "GROUP CLICKED:",
                      group
                    );

                    onSelectGroup(group);
                    // onSelectUser(null);

                  }}
                >

                  <div className="avatar group-avatar">
                    👥
                  </div>


                  <div className="conversation-info">

                    <h3>
                      {group.name}
                    </h3>

                    <p>
                      Group
                    </p>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </div>


      {/* CREATE GROUP MODAL */}

      {showCreateGroup && (

        <div className="modal-overlay">

          <div className="create-group-modal">

            <h2>
              Create Group
            </h2>


            <form onSubmit={handleCreateGroup}>

              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(event) => {
                  setGroupName(event.target.value);
                }}
              />


              <h3>
                Select members
              </h3>


              <div className="member-selection">

                {users.map((currentUser) => (

                  <label
                    key={currentUser.id}
                    className="member-option"
                  >

                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(
                        currentUser.id
                      )}
                      onChange={() => {
                        toggleMember(
                          currentUser.id
                        );
                      }}
                    />

                    <span>
                      {currentUser.username}
                    </span>

                  </label>

                ))}

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  onClick={() => {

                    setShowCreateGroup(false);
                    setGroupName("");
                    setSelectedMembers([]);

                  }}
                >
                  Cancel
                </button>


                <button type="submit">
                  Create Group
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </aside>
  );
}
export default Sidebar;

