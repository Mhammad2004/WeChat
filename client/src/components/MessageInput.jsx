import { useState } from "react";

function MessageInput({
  socket,
  selectedUser,
  selectedGroup,
}) {

  const [message, setMessage] =
    useState("");


  const handleSubmit = (event) => {

    event.preventDefault();


    if (!message.trim()) {
      return;
    }


    // ==========================================
    // GROUP MESSAGE
    // ==========================================

    if (selectedGroup) {

      socket.emit(
        "send_group_message",
        {
          groupId:
            selectedGroup.id,

          text:
            message.trim(),
        }
      );

    }


    // ==========================================
    // DIRECT MESSAGE
    // ==========================================

    else if (selectedUser) {

      socket.emit(
        "send_message",
        {
          text:
            message.trim(),

          recipientId:
            selectedUser.id,
        }
      );

    }


    setMessage("");

  };


  return (
    <form
      className="message-input"
      onSubmit={handleSubmit}
    >

      <input
        type="text"
        placeholder={
          selectedGroup
            ? `Message ${selectedGroup.name}...`
            : "Type a message..."
        }
        value={message}
        onChange={(event) =>
          setMessage(
            event.target.value
          )
        }
      />


      <button type="submit">
        ➤
      </button>

    </form>
  );
}

export default MessageInput;