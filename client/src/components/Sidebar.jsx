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

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <aside className="sidebar">

      {/* HEADER */}

      <div className="sidebar-header">

        <h2>WeChat</h2>

        <div className="current-user">

          <span>{user.username}</span>

          <button onClick={onLogout}>
            Logout
          </button>

        </div>

      </div>


      {/* SEARCH */}

      <div className="search-box">

        <input
          type="text"
          placeholder="Search people..."
        />

      </div>


      {/* SCROLLABLE CONTENT */}

      <div className="sidebar-scroll">

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
                      Direct message
                    </p>

                  </div>

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

