// import { useEffect, useState } from "react";
// import axios from "axios";

// function GroupDetails({
//   group,
//   user,
//   onClose,
// }) {
//   const [members, setMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [users, setUsers] = useState([]);
//   const [showAddMembers, setShowAddMembers] = useState(false);
//   const [selectedMember, setSelectedMember] = useState("");
//   const token = localStorage.getItem("token");

//   const loadGroupDetails = async () => {
//     try {
//       setLoading(true);

//       const response = await axios.get(
//         `http://localhost:5000/api/groups/${group.id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       console.log("GROUP DETAILS:", response.data);

//       setMembers(response.data.members);

//     } catch (error) {
//       console.error(
//         "Failed to load group details:",
//         error.response?.data || error.message
//       );
//     } finally {
//       setLoading(false);
//     }


//   };
//   const handleAddMember = async () => {
//     if (!selectedMember) {
//       alert("Select a user first.");
//       return;
//     }

//     try {
//       await axios.post(
//         `http://localhost:5000/api/groups/${group.id}/members`,
//         {
//           userId: Number(selectedMember),
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       setSelectedMember("");
//       setShowAddMembers(false);

//       await loadGroupDetails();

//     } catch (error) {
//       console.error(
//         "Failed to add member:",
//         error.response?.data || error.message
//       );

//       alert(
//         error.response?.data?.message ||
//         "Failed to add member"
//       );
//     }
//   };

//   const handleRemoveMember = async (memberId, username) => {
//     const confirmed = window.confirm(
//       `Are you sure you want to remove ${username} from the group?`
//     );

//     if (!confirmed) return;

//     try {
//       await axios.delete(
//         `http://localhost:5000/api/groups/${group.id}/members/${memberId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       await loadGroupDetails();

//     } catch (error) {
//       console.error(
//         "Failed to remove member:",
//         error.response?.data || error.message
//       );

//       alert(
//         error.response?.data?.message ||
//         "Failed to remove member"
//       );
//     }
//   };
//   const handleDeleteMemberMessages = async (
//     memberId,
//     username
//   ) => {
//     const confirmed = window.confirm(
//       `Delete ALL messages sent by ${username}?\n\nThis will permanently remove their messages for everyone.`
//     );

//     if (!confirmed) return;

//     const secondConfirmation = window.confirm(
//       `Are you absolutely sure you want to delete ${username}'s messages?`
//     );

//     if (!secondConfirmation) return;

//     try {
//       const response = await axios.delete(
//         `http://localhost:5000/api/groups/${group.id}/messages/member/${memberId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       alert(
//         response.data.message
//       );

//     } catch (error) {
//       console.error(
//         "Failed to delete member messages:",
//         error.response?.data ||
//         error.message
//       );

//       alert(
//         error.response?.data?.message ||
//         "Failed to delete member messages"
//       );
//     }
//   };
//   // ==========================================
//   // CLEAR GROUP CONVERSATION
//   // ==========================================

//   const handleClearGroupConversation = async () => {
//     const confirmed = window.confirm(
//       "Clear this group conversation for yourself?"
//     );

//     if (!confirmed) return;

//     try {
//       await axios.delete(
//         `http://localhost:5000/api/messages/group/${group.id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       alert("Group conversation cleared successfully.");

//       onClose();
//     } catch (error) {
//       console.error(
//         "Failed to clear group conversation:",
//         error.response?.data || error.message
//       );

//       alert(
//         error.response?.data?.message ||
//         "Failed to clear group conversation"
//       );
//     }
//   };

//   const handleDeleteAllMessages = async () => {
//     const confirmed = window.confirm(
//       "DELETE ALL messages in this group?\n\nThis will permanently remove the messages for EVERYONE."
//     );

//     if (!confirmed) return;

//     const secondConfirmation = window.confirm(
//       "Are you absolutely sure? This cannot be undone."
//     );

//     if (!secondConfirmation) return;

//     try {
//       await axios.delete(
//         `http://localhost:5000/api/groups/${group.id}/messages`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       alert("All group messages have been deleted.");

//       onClose();

//     } catch (error) {
//       console.error(
//         "Failed to delete all messages:",
//         error.response?.data || error.message
//       );

//       alert(
//         error.response?.data?.message ||
//         "Failed to delete all messages"
//       );
//     }
//   };

//   const handleLeaveGroup = async () => {
//     const confirmed = window.confirm(
//       "Are you sure you want to leave this group?"
//     );

//     if (!confirmed) return;

//     try {
//       const response = await axios.post(
//         `http://localhost:5000/api/groups/${group.id}/leave`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       alert(response.data.message);

//       onClose();

//     } catch (error) {
//       console.error(
//         "Failed to leave group:",
//         error.response?.data || error.message
//       );

//       alert(
//         error.response?.data?.message ||
//         "Failed to leave group"
//       );
//     }
//   };

//   const loadUsers = async () => {
//     try {
//       const response = await axios.get(
//         "http://localhost:5000/api/users",
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const existingMemberIds = members.map(
//         (member) => Number(member.user_id)
//       );

//       const availableUsers = response.data.filter(
//         (currentUser) =>
//           !existingMemberIds.includes(
//             Number(currentUser.id)
//           )
//       );

//       setUsers(availableUsers);

//     } catch (error) {
//       console.error(
//         "Failed to load users:",
//         error.response?.data || error.message
//       );
//     }
//   };




//   useEffect(() => {
//     if (group) {
//       loadGroupDetails();
//     }
//   }, [group]);

//   return (
//     <div className="group-details-overlay">

//       <div className="group-details">

//         <div className="group-details-header">
//           <div>
//             <h2>{group.name}</h2>
//             <p>{members.length} members</p>
//           </div>

//           <button onClick={onClose}>
//             ✕
//           </button>
//         </div>

//         <button
//           onClick={handleClearGroupConversation}
//         >
//           🗑️ Clear Group Chat
//         </button>

//         {Number(user.id) === Number(group.owner_id) && (

//           <button
//             onClick={handleDeleteAllMessages}
//           >
//             🗑️ Delete All Messages
//           </button>
//         )}


//         <button
//           onClick={handleLeaveGroup}
//         >
//           Leave Group
//         </button>


//         <div className="group-members">

//           <h2>Members</h2>


//           <button
//             onClick={() => {
//               setShowAddMembers(true);
//               loadUsers();
//             }}
//           >
//             + Add Members
//           </button>

//           {showAddMembers && (
//             <div className="add-members">

//               <h3>Add Member</h3>

//               {users.length === 0 ? (
//                 <p>No users available to add.</p>
//               ) : (
//                 <select
//                   value={selectedMember}
//                   onChange={(event) =>
//                     setSelectedMember(event.target.value)
//                   }
//                 >
//                   <option value="">
//                     Select a user
//                   </option>

//                   {users.map((currentUser) => (
//                     <option
//                       key={currentUser.id}
//                       value={currentUser.id}
//                     >
//                       {currentUser.username}
//                     </option>
//                   ))}
//                 </select>
//               )}

//               <div className="add-member-actions">

//                 <button
//                   onClick={() => {
//                     setShowAddMembers(false);
//                     setSelectedMember("");
//                   }}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   onClick={handleAddMember}
//                   disabled={!selectedMember}
//                 >
//                   Add
//                 </button>

//               </div>

//             </div>
//           )}

//           {loading ? (
//             <p>Loading members...</p>
//           ) : members.length === 0 ? (
//             <p>No members found.</p>
//           ) : (

//             members.map((member) => (

//               <div
//                 className="group-member"
//                 key={member.user_id}
//               >

//                 <div className="avatar">
//                   {member.username
//                     .substring(0, 2)
//                     .toUpperCase()}
//                 </div>

//                 <div>
//                   <strong>
//                     {member.username}
//                   </strong>

//                   {Number(member.user_id) ===
//                     Number(group.owner_id) && (
//                       <span className="group-admin">
//                         Admin
//                       </span>
//                     )}
//                 </div>

//                 {Number(user.id) === Number(group.owner_id) &&
//                   Number(member.user_id) !== Number(group.owner_id) && (
//                     <>
//                       <button
//                         onClick={() =>
//                           handleRemoveMember(
//                             member.user_id,
//                             member.username
//                           )
//                         }
//                       >
//                         Remove
//                       </button>

//                       <button
//                         onClick={() =>
//                           handleDeleteMemberMessages(
//                             member.user_id,
//                             member.username
//                           )
//                         }
//                       >
//                         🗑️ Delete Messages
//                       </button>
//                     </>
//                   )}

//               </div>

//             ))

//           )}

//         </div>

//       </div>

//     </div>
//   );
// }

// export default GroupDetails;




import { useEffect, useState } from "react";
import axios from "axios";

function GroupDetails({
  group,
  user,
  onClose,
}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const token = localStorage.getItem("token");

  const loadGroupDetails = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `http://localhost:5000/api/groups/${group.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("GROUP DETAILS:", response.data);

      setMembers(response.data.members);

    } catch (error) {
      console.error(
        "Failed to load group details:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }


  };
  const handleAddMember = async () => {
    if (!selectedMember) {
      alert("Select a user first.");
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/groups/${group.id}/members`,
        {
          userId: Number(selectedMember),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedMember("");
      setShowAddMembers(false);

      await loadGroupDetails();

    } catch (error) {
      console.error(
        "Failed to add member:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to add member"
      );
    }
  };

  const handleRemoveMember = async (memberId, username) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${username} from the group?`
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/groups/${group.id}/members/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadGroupDetails();

    } catch (error) {
      console.error(
        "Failed to remove member:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to remove member"
      );
    }
  };
  const handleDeleteMemberMessages = async (
    memberId,
    username
  ) => {
    const confirmed = window.confirm(
      `Delete ALL messages sent by ${username}?\n\nThis will permanently remove their messages for everyone.`
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      `Are you absolutely sure you want to delete ${username}'s messages?`
    );

    if (!secondConfirmation) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/groups/${group.id}/messages/member/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        response.data.message
      );

    } catch (error) {
      console.error(
        "Failed to delete member messages:",
        error.response?.data ||
        error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to delete member messages"
      );
    }
  };
  // ==========================================
  // CLEAR GROUP CONVERSATION
  // ==========================================

  const handleClearGroupConversation = async () => {
    const confirmed = window.confirm(
      "Clear this group conversation for yourself?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/messages/group/${group.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Group conversation cleared successfully.");

      onClose();
    } catch (error) {
      console.error(
        "Failed to clear group conversation:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to clear group conversation"
      );
    }
  };

  const handleDeleteAllMessages = async () => {
    const confirmed = window.confirm(
      "DELETE ALL messages in this group?\n\nThis will permanently remove the messages for EVERYONE."
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      "Are you absolutely sure? This cannot be undone."
    );

    if (!secondConfirmation) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/groups/${group.id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("All group messages have been deleted.");

      onClose();

    } catch (error) {
      console.error(
        "Failed to delete all messages:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to delete all messages"
      );
    }
  };

  const handleLeaveGroup = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to leave this group?"
    );

    if (!confirmed) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/api/groups/${group.id}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);

      onClose();

    } catch (error) {
      console.error(
        "Failed to leave group:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to leave group"
      );
    }
  };

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

      const existingMemberIds = members.map(
        (member) => Number(member.user_id)
      );

      const availableUsers = response.data.filter(
        (currentUser) =>
          !existingMemberIds.includes(
            Number(currentUser.id)
          )
      );

      setUsers(availableUsers);

    } catch (error) {
      console.error(
        "Failed to load users:",
        error.response?.data || error.message
      );
    }
  };




  useEffect(() => {
    if (group) {
      loadGroupDetails();
    }
  }, [group]);

  return (
    <div className="group-details-overlay">

      <div className="group-details">

        <div className="group-details-header">
          <div>
            <h2>{group.name}</h2>
            <p>{members.length} members</p>
          </div>

          <button className="group-details-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="group-details-actions">

          <button
            className="group-clear-button"
            onClick={handleClearGroupConversation}
          >
            🗑️ Clear Group Chat
          </button>

          {Number(user.id) === Number(group.owner_id) && (

            <button
              className="group-delete-all-button"
              onClick={handleDeleteAllMessages}
            >
              🗑️ Delete All Messages
            </button>
          )}


          <button
            className="group-leave-button"
            onClick={handleLeaveGroup}
          >
            Leave Group
          </button>

        </div>


        <div className="group-members">

          <div className="group-members-header">
            <h3>Members</h3>

            <button
              className="add-members-button"
              onClick={() => {
                setShowAddMembers(true);
                loadUsers();
              }}
            >
              + Add Members
            </button>
          </div>

          {showAddMembers && (
            <div className="add-members">

              <h3>Add Member</h3>

              {users.length === 0 ? (
                <p>No users available to add.</p>
              ) : (
                <select
                  className="add-member-select"
                  value={selectedMember}
                  onChange={(event) =>
                    setSelectedMember(event.target.value)
                  }
                >
                  <option value="">
                    Select a user
                  </option>

                  {users.map((currentUser) => (
                    <option
                      key={currentUser.id}
                      value={currentUser.id}
                    >
                      {currentUser.username}
                    </option>
                  ))}
                </select>
              )}

              <div className="add-member-actions">

                <button
                  onClick={() => {
                    setShowAddMembers(false);
                    setSelectedMember("");
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleAddMember}
                  disabled={!selectedMember}
                >
                  Add
                </button>

              </div>

            </div>
          )}

          <div className="group-members-list">
            {loading ? (
              <p className="empty-message">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="empty-message">No members found.</p>
            ) : (

              members.map((member) => (

                <div
                  className="group-member"
                  key={member.user_id}
                >

                  <div className="avatar">
                    {member.username
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="group-member-info">
                    <strong>
                      {member.username}
                    </strong>

                    {Number(member.user_id) ===
                      Number(group.owner_id) && (
                        <span className="group-admin">
                          Admin
                        </span>
                      )}
                  </div>

                  {Number(user.id) === Number(group.owner_id) &&
                    Number(member.user_id) !== Number(group.owner_id) && (
                      <div className="group-member-actions">
                        <button
                          className="member-remove-button"
                          onClick={() =>
                            handleRemoveMember(
                              member.user_id,
                              member.username
                            )
                          }
                        >
                          Remove
                        </button>

                        <button
                          className="member-delete-messages-button"
                          onClick={() =>
                            handleDeleteMemberMessages(
                              member.user_id,
                              member.username
                            )
                          }
                        >
                          🗑️
                        </button>
                      </div>
                    )}

                </div>

              ))

            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export default GroupDetails;