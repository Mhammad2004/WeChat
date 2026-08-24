import { useState } from "react";

function Message({
  id,
  text,
  sender,
  isOwn,
  socket,
  createdAt,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleEdit = () => {
    if (!editedText.trim()) {
      return;
    }

    socket.emit("edit_message", {
      messageId: id,
      newText: editedText,
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Delete this message?"
    );

    if (!confirmed) {
      return;
    }

    socket.emit("delete_message", id);
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  return (
    <div
      className={`message ${
        isOwn ? "own" : "other"
      }`}
    >
      <div className="message-bubble">

        <span className="sender">
          {sender}
        </span>

        {!isEditing ? (
          <>
            <p>{text}</p>

            <span className="message-time">
              {formatTime(createdAt)}
            </span>

            {isOwn && (
              <div className="message-actions">

                <button
                  className="edit-button"
                  onClick={() =>
                    setIsEditing(true)
                  }
                >
                  Edit
                </button>

                <button
                  className="delete-button"
                  onClick={handleDelete}
                >
                  Delete
                </button>

              </div>
            )}
          </>
        ) : (
          <div className="edit-container">

            <input
              value={editedText}
              onChange={(event) =>
                setEditedText(
                  event.target.value
                )
              }
              autoFocus
            />

            <div className="edit-actions">

              <button
                onClick={handleEdit}
              >
                Save
              </button>

              <button
                onClick={() => {
                  setEditedText(text);
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Message;