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
    const recipientSocketId = userSocketMap.get(message.recipient);
    const senderSocketId = userSocketMap.get(message.sender);

    const createdMessage = await Message.create(message);
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
  };

  const sendChannelMessage = async (message) => {
    const { channelId, sender, content, messageType, fileUrl } = message;

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
  };


  const handleAddMembersToChannel = async (data) => {
    const { channelId, newMembers, addedBy } = data;
    
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
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      userSocketMap.set(userId, socket.id);
      updateUserStatus(userId, 'online');
      console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
    } else {
      console.log("User ID not provided during connection.");
    }

    socket.on("add-channel-notify", addChannelNotify);

    socket.on("sendMessage", sendMessage);

    socket.on("send-channel-message", sendChannelMessage);
    socket.on("delete-message", deleteMessageSocket);
    socket.on("edit-message", editMessageSocket);
    
    // Group management socket events
    socket.on("add-members-to-channel", handleAddMembersToChannel);
    socket.on("remove-member-from-channel", handleRemoveMemberFromChannel);
    socket.on("delete-channel", handleDeleteChannel);

    // Status and typing events
    socket.on("user-status", (data) => {
      const { status, currentChat } = data;
      updateUserStatus(userId, status, currentChat);
      broadcastStatus(userId, status, currentChat);
    });

    socket.on("typing", handleTyping);

    socket.on("disconnect", () => {
      if (userId) {
        updateUserStatus(userId, 'offline');
        // Notify all users who were in chat with this user
        User.findById(userId).then(user => {
          if (user && user.currentChat) {
            broadcastStatus(userId, 'offline', user.currentChat);
          }
        });
      }
      disconnect(socket);
    });
  });
};

export default setupSocket;
