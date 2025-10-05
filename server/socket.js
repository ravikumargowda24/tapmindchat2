import { Server as SocketIOServer } from "socket.io";
import Message from "./model/MessagesModel.js";
import Channel from "./model/ChannelModel.js";
import User from "./model/UserModel.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const userSocketMap = new Map(); // ✅ Move before usage
  const typingUsers = new Map(); // Track typing users
  const recentMessages = new Map(); // Cache for message deduplication

  // Update user status
  const updateUserStatus = async (userId, status, currentChat = null) => {
    try {
      await User.findByIdAndUpdate(userId, {
        status,
        lastSeen: new Date(),
        currentChat,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  // Broadcast status to relevant users
  const broadcastStatus = (userId, status, currentChat = null) => {
    const userSocketId = userSocketMap.get(userId);
    if (userSocketId) {
      // If user is in a direct chat, notify the other person
      if (currentChat) {
        const otherUserSocketId = userSocketMap.get(currentChat);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("user-status-changed", {
            userId,
            status,
            lastSeen: new Date(),
          });
        }
      }
    }
  };

  // Handle typing indicators
  const handleTyping = (data) => {
    const { userId, recipientId, isTyping } = data;
    const recipientSocketId = userSocketMap.get(recipientId);

    if (recipientSocketId) {
      if (isTyping) {
        typingUsers.set(userId, { recipientId, timestamp: Date.now() });
        io.to(recipientSocketId).emit("user-typing", { userId, isTyping: true });

        // Auto-stop typing after 3 seconds
        setTimeout(() => {
          if (typingUsers.has(userId)) {
            typingUsers.delete(userId);
            io.to(recipientSocketId).emit("user-typing", { userId, isTyping: false });
          }
        }, 3000);
      } else {
        typingUsers.delete(userId);
        io.to(recipientSocketId).emit("user-typing", { userId, isTyping: false });
      }
    }
  };

  // const deleteMessageSocket = async (data) => {
  //   const { messageId, channelId } = data;

  //   if (channelId) {
  //     const channel = await Channel.findById(channelId).populate("members");
  //     if (channel) {
  //       // Broadcast to channel room
  //       io.to(`channel_${channelId}`).emit("message-deleted", { messageId, channelId });
  //     }
  //   } else {
  //     const message = await Message.findById(messageId);
  //     if (message) {
  //       // Broadcast to sender and recipient rooms
  //       io.to(`user_${message.sender}`).emit("message-deleted", { messageId });
  //       io.to(`user_${message.recipient}`).emit("message-deleted", { messageId });
  //     }
  //   }
  // };
  const deleteMessageSocket = async (data) => {
    const { messageId, senderId, recipientId, channelId } = data;
    const emitData = { messageId };
    if (channelId) {
      const channel = await Channel.findById(channelId).populate("members");
      if (!channel) return;
      channel.members.forEach((member) => {
        const socketId = userSocketMap.get(member._id.toString());
        if (socketId) io.to(socketId).emit("message-deleted", emitData);
      });
      const adminSocketId = userSocketMap.get(channel.admin._id.toString());
      if (adminSocketId) io.to(adminSocketId).emit("message-deleted", emitData);
    } else {
      const recipientSocketId = recipientId ? userSocketMap.get(recipientId) : null;
      const senderSocketId = senderId ? userSocketMap.get(senderId) : null;
      if (recipientSocketId) io.to(recipientSocketId).emit("message-deleted", emitData);
      if (senderSocketId) io.to(senderSocketId).emit("message-deleted", emitData);
    }
  };

  const editMessageSocket = async (data) => {
    const { messageId, senderId, recipientId, channelId, updatedMessage } = data;
    const emitData = { messageId, updatedMessage };
    if (channelId) {
      const channel = await Channel.findById(channelId).populate("members");
      if (!channel) return;
      channel.members.forEach((member) => {
        const socketId = userSocketMap.get(member._id.toString());
        if (socketId) io.to(socketId).emit("message-edited", emitData);
      });
      const adminSocketId = userSocketMap.get(channel.admin._id.toString());
      if (adminSocketId) io.to(adminSocketId).emit("message-edited", emitData);
    } else {
      const recipientSocketId = recipientId ? userSocketMap.get(recipientId) : null;
      const senderSocketId = senderId ? userSocketMap.get(senderId) : null;
      if (recipientSocketId) io.to(recipientSocketId).emit("message-edited", emitData);
      if (senderSocketId) io.to(senderSocketId).emit("message-edited", emitData);
    }
  };

  // Add these console.logs to your deleteMessageSocket function:

  // const deleteMessageSocket = async (data) => {
  //   const { messageId, channelId, userId } = data;

  //   console.log("Delete request received:", { messageId, channelId, userId }); // Debug

  //   try {
  //     const message = await Message.findById(messageId);
  //     if (!message) {
  //       console.log("Message not found:", messageId); // Debug
  //       return;
  //     }

  //     console.log("Found message:", message); // Debug

  //     // Permission check — sender or channel admin
  //     if (message.sender.toString() !== userId) {
  //       if (message.recipient) {
  //         console.log("Permission denied: not sender of personal message"); // Debug
  //         return;
  //       }
  //       const channel = await Channel.findOne({ messages: messageId });
  //       if (!channel || channel.admin.toString() !== userId) {
  //         console.log("Permission denied: not channel admin"); // Debug
  //         return;
  //       }
  //     }

  //     // Delete from DB
  //     const deletedMessage = await Message.findByIdAndDelete(messageId);
  //     console.log("Message deleted from DB:", deletedMessage ? "success" : "failed"); // Debug

  //     // Remove from channel if applicable
  //     if (!message.recipient) {
  //       const channelUpdate = await Channel.findOneAndUpdate(
  //         { messages: messageId },
  //         { $pull: { messages: messageId } }
  //       );
  //       console.log("Channel updated:", channelUpdate ? "success" : "failed"); // Debug
  //     }

  //     // Emit deletion event to all relevant clients
  //     const emitData = { messageId };
  //     if (channelId) {
  //       console.log(`Emitting to channel_${channelId}:`, emitData); // Debug
  //       io.to(`channel_${channelId}`).emit("message-deleted", emitData);
  //     } else {
  //       console.log(`Emitting to users:`, {
  //         sender: message.sender,
  //         recipient: message.recipient
  //       }); // Debug
  //       io.to(`user_${message.recipient}`).emit("message-deleted", emitData);
  //       io.to(`user_${message.sender}`).emit("message-deleted", emitData);


  //     }
  //   } catch (err) {
  //     console.error("Delete message error:", err);
  //   }
  // };
  const addChannelNotify = async (channel) => {
    if (channel && channel.members) {
      channel.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("new-channel-added", channel);
        }
      });
    }
  };

  const sendMessage = async (message) => {
    try {
      const recipientSocketId = userSocketMap.get(message.recipient);
      const senderSocketId = userSocketMap.get(message.sender);

      // Create a unique message identifier to prevent duplicates
      const messageKey = `${message.sender}_${message.recipient}_${message.content}_${message.timestamp || Date.now()}`;

      // Check if we've already processed this message recently (within 5 seconds)
      if (recentMessages.has(messageKey)) {
        console.log("Duplicate message detected, ignoring:", messageKey);
        return;
      }

      // Add to recent messages cache
      recentMessages.set(messageKey, Date.now());
      setTimeout(() => recentMessages.delete(messageKey), 5000);

      // Remove _id if it exists to let MongoDB generate a new one
      const { _id, ...messageWithoutId } = message;

      const createdMessage = await Message.create(messageWithoutId);
      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .populate("recipient", "id email firstName lastName image color")
        .exec();

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", messageData);
      }
      if (senderSocketId) {
        io.to(senderSocketId).emit("receiveMessage", messageData);
      }
    } catch (error) {
      if (error.code === 11000) {
        console.log("Duplicate key error caught, message already exists:", error.keyValue);
        // Message already exists, this is not an error condition
        return;
      }
      console.error("Error sending message:", error);
    }
  };

  const sendChannelMessage = async (message) => {
    try {
      const { channelId, sender, content, messageType, fileUrl } = message;

      // Create a unique message identifier to prevent duplicates
      const messageKey = `${sender}_${channelId}_${content}_${message.timestamp || Date.now()}`;

      // Check if we've already processed this message recently (within 5 seconds)
      if (recentMessages.has(messageKey)) {
        console.log("Duplicate channel message detected, ignoring:", messageKey);
        return;
      }

      // Add to recent messages cache
      recentMessages.set(messageKey, Date.now());
      setTimeout(() => recentMessages.delete(messageKey), 5000);

      // Create and save the message
      const createdMessage = await Message.create({
        sender,
        recipient: null, // Channel messages don't have a single recipient
        content,
        messageType,
        timestamp: new Date(),
        fileUrl,
      });

      const messageData = await Message.findById(createdMessage._id)
        .populate("sender", "id email firstName lastName image color")
        .exec();

      // Add message to the channel
      await Channel.findByIdAndUpdate(channelId, {
        $push: { messages: createdMessage._id },
      });

      // Fetch all members of the channel
      const channel = await Channel.findById(channelId).populate("members");

      const finalData = { ...messageData._doc, channelId: channel._id };
      if (channel && channel.members) {
        channel.members.forEach((member) => {
          const memberSocketId = userSocketMap.get(member._id.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("recieve-channel-message", finalData);
          }
        });
        const adminSocketId = userSocketMap.get(channel.admin._id.toString());
        if (adminSocketId) {
          io.to(adminSocketId).emit("recieve-channel-message", finalData);
        }
      }
    } catch (error) {
      if (error.code === 11000) {
        console.log("Duplicate key error caught for channel message, message already exists:", error.keyValue);
        // Message already exists, this is not an error condition
        return;
      }
      console.error("Error sending channel message:", error);
    }
  };

  const loadMessages = async (data) => {
    try {
      const { userId, chatId, chatType } = data;
      const userSocketId = userSocketMap.get(userId);

      if (!userSocketId) {
        console.log("User socket not found for loading messages:", userId);
        return;
      }

      let messages = [];

      if (chatType === "contact") {
        // Load direct messages between two users
        messages = await Message.find({
          $or: [
            { sender: userId, recipient: chatId },
            { sender: chatId, recipient: userId },
          ],
        })
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color")
          .sort({ timestamp: 1 })
          .exec();
      } else if (chatType === "channel") {
        // Load channel messages
        const channel = await Channel.findById(chatId).populate("messages");
        if (channel && channel.messages) {
          messages = await Message.find({ _id: { $in: channel.messages } })
            .populate("sender", "id email firstName lastName image color")
            .sort({ timestamp: 1 })
            .exec();
        }
      }

      // Send messages back to the requesting user
      io.to(userSocketId).emit("messages-loaded", {
        chatId,
        chatType,
        messages,
      });

      console.log(`Loaded ${messages.length} messages for ${chatType} ${chatId}`);
    } catch (error) {
      console.error("Error loading messages:", error);
      const userSocketId = userSocketMap.get(data.userId);
      if (userSocketId) {
        io.to(userSocketId).emit("messages-load-error", {
          error: "Failed to load messages",
        });
      }
    }
  };

  const handleMessageRead = async (data) => {
    try {
      const { senderId, recipientId, messageId, chatType, readerId } = data;

      // Notify the sender that their message was read
      const senderSocketId = userSocketMap.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message-read", {
          messageId,
          recipientId,
          chatType,
          readerId,
          readAt: new Date(),
        });
      }

      // Update unread count for the sender
      if (chatType === "contact") {
        const recipientSocketId = userSocketMap.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("update-unread-count", {
            chatId: senderId,
            chatType: "contact",
            action: "decrement",
          });
        }
      }

      // console.log(`Message ${messageId} marked as read by ${recipientId || readerId}`);
    } catch (error) {
      console.error("Error handling message read:", error);
    }
  };

  const handleMarkChatAsRead = async (data) => {
    try {
      const { userId, chatId, chatType } = data;

      // Notify the chat partner that all messages have been read
      const partnerSocketId = userSocketMap.get(chatId);
      if (partnerSocketId) {
        io.to(partnerSocketId).emit("chat-marked-read", {
          chatId: userId,
          chatType,
          markedAt: new Date(),
        });
      }

      console.log(`Chat ${chatId} marked as read by ${userId}`);
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };


  const handleAddMembersToChannel = async (data) => {
    const { channelId, newMembers, addedMembers, addedBy } = data;

    try {
      const channel = await Channel.findById(channelId).populate("members");
      if (channel && channel.members) {
        // Notify all existing members about new members
        channel.members.forEach((member) => {
          const memberSocketId = userSocketMap.get(member._id.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("members-added-to-channel", {
              channelId,
              newMembers,
              addedBy
            });
          }
        });

        // Notify new members to add the channel
        addedMembers.forEach((memberId) => {
          const memberSocketId = userSocketMap.get(memberId);
          if (memberSocketId) {
            io.to(memberSocketId).emit("new-channel-added", channel);
          }
        });
      }
    } catch (error) {
      console.error("Error handling add members:", error);
    }
  };

  const handleRemoveMemberFromChannel = async (data) => {
    const { channelId, removedMemberId, removedBy } = data;

    try {
      const channel = await Channel.findById(channelId).populate("members");
      if (channel && channel.members) {
        // Notify all members about removed member
        channel.members.forEach((member) => {
          const memberSocketId = userSocketMap.get(member._id.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("member-removed-from-channel", {
              channelId,
              removedMemberId,
              removedBy
            });
          }
        });

        // Notify the removed member
        const removedMemberSocketId = userSocketMap.get(removedMemberId);
        if (removedMemberSocketId) {
          io.to(removedMemberSocketId).emit("removed-from-channel", {
            channelId,
            removedBy
          });
        }
      }
    } catch (error) {
      console.error("Error handling remove member:", error);
    }
  };

  const handleDeleteChannel = async (data) => {
    const { channelId, deletedBy } = data;

    try {
      const channel = await Channel.findById(channelId).populate("members");
      if (channel && channel.members) {
        // Notify all members about channel deletion
        channel.members.forEach((member) => {
          const memberSocketId = userSocketMap.get(member._id.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit("channel-deleted", {
              channelId,
              deletedBy
            });
          }
        });
      }
    } catch (error) {
      console.error("Error handling delete channel:", error);
    }
  };

  const disconnect = (socket) => {
    console.log("Client disconnected", socket.id);
    let disconnectedUserId = null;

    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        disconnectedUserId = userId;
        break;
      }
    }

    // Clean up any cached data for this user
    if (disconnectedUserId) {
      // Remove any typing indicators for this user
      typingUsers.delete(disconnectedUserId);

      // Update user status to offline
      updateUserStatus(disconnectedUserId, 'offline');
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      // Handle multiple connections from the same user (e.g., multiple tabs)
      const existingSocketId = userSocketMap.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        console.log(`User ${userId} connected from new socket ${socket.id}, replacing old socket ${existingSocketId}`);
      }

      userSocketMap.set(userId, socket.id);
      updateUserStatus(userId, 'online');
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User ID not provided during connection.");
      socket.disconnect();
      return;
    }

    // Add error handling for socket events
    socket.on("error", (error) => {
      console.error(`Socket error for user ${userId}:`, error);
    });

    socket.on("add-channel-notify", addChannelNotify);

    socket.on("sendMessage", sendMessage);

    socket.on("send-channel-message", sendChannelMessage);
    socket.on("load-messages", loadMessages);
    socket.on("message-read", handleMessageRead);
    socket.on("mark-chat-read", handleMarkChatAsRead);
    socket.on("delete-message", deleteMessageSocket);
    socket.on("edit-message", editMessageSocket);

    // Group management socket events
    socket.on("channel-members-added", handleAddMembersToChannel);
    socket.on("channel-member-removed", handleRemoveMemberFromChannel);
    socket.on("delete-channel", handleDeleteChannel);

    // Status and typing events
    socket.on("user-status", (data) => {
      try {
        const { status, currentChat } = data;
        updateUserStatus(userId, status, currentChat);
        broadcastStatus(userId, status, currentChat);
      } catch (error) {
        console.error(`Error handling user-status for user ${userId}:`, error);
      }
    });

    socket.on("typing", handleTyping);

    socket.on("disconnect", () => {
      try {
        if (userId) {
          updateUserStatus(userId, 'offline');
          // Notify all users who were in chat with this user
          User.findById(userId).then(user => {
            if (user && user.currentChat) {
              broadcastStatus(userId, 'offline', user.currentChat);
            }
          }).catch(error => {
            console.error(`Error updating status on disconnect for user ${userId}:`, error);
          });
        }
        disconnect(socket);
      } catch (error) {
        console.error(`Error during disconnect for socket ${socket.id}:`, error);
      }
    });
  });

};

export default setupSocket;
