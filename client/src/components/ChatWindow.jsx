import Message from "./Message";
import MessageInput from "./MessageInput";
import GroupDetails from "./GroupDetails";
import { useState } from "react";

function ChatWindow({
  messages,
  setMessages,
  socket,
  user,
  selectedUser,
  selectedGroup,
  onBack
}) {
  console.log("Selected group:", selectedGroup);
  // ==========================================
  // NO CHAT SELECTED
  // ==========================================


  const [showGroupDetails, setShowGroupDetails] = useState(false);


  const isGroup =
    Boolean(selectedGroup);
  if (!selectedUser && !selectedGroup) {

    return (
      <main className="chat-window">

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8b8f9a",
          }}
        >
          Select a conversation to start chatting
        </div>
        {isGroup && showGroupDetails && (
          <GroupDetails
            group={selectedGroup}
            user={user}
            onClose={() => setShowGroupDetails(false)}
          />
        )}
      </main>
    );

  }





  return (
    <main className="chat-window">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="chat-header">
        <button
          className="back-button"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          ←
        </button>
        {isGroup && (
          <button
            onClick={() => setShowGroupDetails(true)}
          >
            ⚙️
          </button>
        )}
        <div className="avatar">

          {isGroup
            ? "👥"
            : selectedUser.username
              .substring(0, 2)
              .toUpperCase()}

        </div>


        <div>

          <h2>

            {isGroup
              ? selectedGroup.name
              : selectedUser.username}

          </h2>


          <p>

            {isGroup
              ? "Group"
              : "Online"}

          </p>

        </div>

      </header>


      {/* ======================================
          MESSAGES
      ====================================== */}

      <div className="messages">

        {messages.map(
          (message, index) => (

            <Message
              key={
                message.id || index
              }

              id={message.id}

              text={message.text}

              sender={
                message.senderName
              }

              isOwn={
                message.isOwn
              }

              socket={socket}

              isGroup={isGroup}

              isAdmin={
                isGroup &&
                Number(user.id) ===
                Number(selectedGroup.owner_id)
              }
            />

          )
        )}

      </div>


      {/* ======================================
          INPUT
      ====================================== */}

      <MessageInput
        socket={socket}
        user={user}
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}




      />
      {isGroup && showGroupDetails && (
        <GroupDetails
          group={selectedGroup}
          user={user}
          onClose={() => setShowGroupDetails(false)}
        />
      )}
    </main>
  );
}

export default ChatWindow;