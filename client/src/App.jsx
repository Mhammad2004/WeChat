import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

import "./App.css";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [selectedGroup, setSelectedGroup] =
    useState(null);

  const [showRegister, setShowRegister] =
    useState(false);

  const [messages, setMessages] =
    useState([]);

  const [socket, setSocket] =
    useState(null);


  // ==========================================
  // SOCKET CONNECTION
  // ==========================================

  useEffect(() => {
    if (!user) {
      return;
    }

    const token =
      localStorage.getItem("token");

    const newSocket = io(
      "http://localhost:5000",
      {
        auth: {
          token,
        },
      }
    );

    setSocket(newSocket);


    newSocket.on("connect", () => {
      console.log(
        "Authenticated socket connected:",
        newSocket.id
      );
    });


    newSocket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket authentication failed:",
          error.message
        );
      }
    );


    // ==========================================
    // DIRECT MESSAGE
    // ==========================================

    const handleReceiveMessage =
      (message) => {

        setMessages(
          (previousMessages) => [
            ...previousMessages,
            {
              ...message,
              isOwn:
                message.senderId ===
                user.id,
            },
          ]
        );
      };


    newSocket.on(
      "receive_message",
      handleReceiveMessage
    );


    // ==========================================
    // GROUP MESSAGE
    // ==========================================

    const handleReceiveGroupMessage =
      (message) => {

        setMessages(
          (previousMessages) => [
            ...previousMessages,
            {
              ...message,
              isOwn:
                message.senderId ===
                user.id,
            },
          ]
        );
      };


    newSocket.on(
      "receive_group_message",
      handleReceiveGroupMessage
    );


    // ==========================================
    // EDIT MESSAGE
    // ==========================================

    const handleMessageEdited =
      (updatedMessage) => {

        setMessages(
          (previousMessages) =>
            previousMessages.map(
              (message) =>
                message.id ===
                  updatedMessage.id
                  ? {
                    ...message,
                    text:
                      updatedMessage.text,
                  }
                  : message
            )
        );
      };


    newSocket.on(
      "message_edited",
      handleMessageEdited
    );


    // ==========================================
    // DELETE MESSAGE
    // ==========================================

    const handleMessageDeleted =
      (deletedMessage) => {

        setMessages(
          (previousMessages) =>
            previousMessages.filter(
              (message) =>
                message.id !==
                deletedMessage.id
            )
        );
      };


    newSocket.on(
      "message_deleted",
      handleMessageDeleted
    );


    return () => {

      newSocket.off(
        "receive_message",
        handleReceiveMessage
      );

      newSocket.off(
        "receive_group_message",
        handleReceiveGroupMessage
      );

      newSocket.off(
        "message_edited",
        handleMessageEdited
      );

      newSocket.off(
        "message_deleted",
        handleMessageDeleted
      );

      newSocket.disconnect();
    };

  }, [user]);


  // ==========================================
  // LOAD DIRECT CHAT
  // ==========================================

  useEffect(() => {

    if (!selectedUser || selectedGroup) {
      return;
    }

    const loadMessages = async () => {

      try {

        const token =
          localStorage.getItem(
            "token"
          );

        const response =
          await axios.get(
            `http://localhost:5000/api/messages/${selectedUser.id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        setMessages(
          response.data.map(
            (message) => ({
              ...message,
              isOwn:
                message.senderId ===
                user.id,
            })
          )
        );

      } catch (error) {

        console.error(
          "Failed to load messages:",
          error.response?.data ||
          error.message
        );

      }

    };

    loadMessages();

  }, [selectedUser, selectedGroup, user]);


  // ==========================================
  // LOAD GROUP CHAT
  // ==========================================

  useEffect(() => {

    if (!selectedGroup) {
      return;
    }

    const loadGroupMessages =
      async () => {

        try {
          const token = localStorage.getItem("token");


          //DEBUGGINGGGGG

          console.log("LOADING GROUP:", selectedGroup);
          console.log(
            "GROUP URL:",
            `http://localhost:5000/api/messages/group/${selectedGroup.id}`
          );


          const response =
            await axios.get(
              `http://localhost:5000/api/messages/group/${selectedGroup.id}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          setMessages(
            response.data.map(
              (message) => ({
                ...message,
                isOwn:
                  message.senderId ===
                  user.id,
              })
            )
          );

        } catch (error) {

          console.error(
            "Failed to load group messages:",
            error.response?.data ||
            error.message
          );

        }

      };

    loadGroupMessages();

  }, [selectedGroup, user]);


  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin =
    (loggedInUser) => {

      setUser(loggedInUser);

    };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    setUser(null);
    setSocket(null);
    setMessages([]);
    setSelectedUser(null);
    setSelectedGroup(null);

  };


  // ==========================================
  // LOGIN / REGISTER
  // ==========================================

  if (!user) {

    if (showRegister) {

      return (
        <Register
          onRegister={() =>
            setShowRegister(false)
          }
          onSwitchToLogin={() =>
            setShowRegister(false)
          }
        />
      );

    }

    return (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() =>
          setShowRegister(true)
        }
      />
    );

  }


  if (!socket) {

    return (
      <div>
        Connecting to chat...
      </div>
    );

  }


  return (
    <div className="app">

      <Sidebar
        user={user}
        onLogout={handleLogout}
        selectedUser={selectedUser}
        onSelectUser={(selected) => {

          setSelectedUser(selected);
          setSelectedGroup(null);
          setMessages([]);

        }}
        selectedGroup={selectedGroup}
        onSelectGroup={(group) => {

          setSelectedGroup(group);
          setSelectedUser(null);
          setMessages([]);

        }}
      />


      <ChatWindow
        messages={messages}
        setMessages={setMessages}
        socket={socket}
        user={user}
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
      />

    </div>
  );
}

export default App;