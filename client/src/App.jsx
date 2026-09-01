import { useEffect, useState, useRef } from "react";
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
  const selectedUserRef =
    useRef(selectedUser);

  const selectedGroupRef =
    useRef(selectedGroup);
  useEffect(() => {
    selectedUserRef.current =
      selectedUser;

    selectedGroupRef.current =
      selectedGroup;
  }, [selectedUser, selectedGroup]);
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
    // old function
    // const handleReceiveMessage =
    //   (message) => {

    //     setMessages(
    //       (previousMessages) => [
    //         ...previousMessages,
    //         {
    //           ...message,
    //           isOwn:
    //             message.senderId ===
    //             user.id,
    //         },
    //       ]
    //     );
    //   };

    // new function
    const handleReceiveMessage = (message) => {

      const currentUser =
        selectedUserRef.current;

      const currentGroup =
        selectedGroupRef.current;

      // We are currently viewing a group
      if (currentGroup) {
        return;
      }

      // No private conversation is open
      if (!currentUser) {
        return;
      }

      // This message isn't part of the
      // currently opened private conversation
      if (
        Number(message.senderId) !==
        Number(currentUser.id) &&
        Number(message.recipientId) !==
        Number(currentUser.id)
      ) {
        return;
      }

      setMessages(
        (previousMessages) => [
          ...previousMessages,
          {
            ...message,
            isOwn:
              Number(message.senderId) ===
              Number(user.id),
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
    // old function
    // const handleReceiveGroupMessage =
    //   (message) => {

    //     setMessages(
    //       (previousMessages) => [
    //         ...previousMessages,
    //         {
    //           ...message,
    //           isOwn:
    //             message.senderId ===
    //             user.id,
    //         },
    //       ]
    //     );
    //   };


    // new function
    const handleReceiveGroupMessage = (message) => {

      const currentGroup =
        selectedGroupRef.current;

      // No group is currently open
      if (!currentGroup) {
        return;
      }

      // Message belongs to another group
      if (
        Number(message.groupId) !==
        Number(currentGroup.id)
      ) {
        return;
      }

      setMessages(
        (previousMessages) => [
          ...previousMessages,
          {
            ...message,
            isOwn:
              Number(message.senderId) ===
              Number(user.id),
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

  }, [selectedUser, selectedGroup, user]);


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
    <div
      className={`app ${selectedUser || selectedGroup ? "chat-open" : ""
        }`}
    >

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
        onBack={() => {
          setSelectedUser(null);
          setSelectedGroup(null);
          setMessages([]);
        }}
      />

    </div>
  );
}

export default App;