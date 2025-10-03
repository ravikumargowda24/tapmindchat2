import Message from "../model/MessagesModel.js";
import Channel from "../model/ChannelModel.js"; // Add this
import { mkdirSync, renameSync } from "fs";

export const getMessages = async (req, res, next) => {
  try {
    const user1 = req.userId;
    const user2 = req.body.id;
    if (!user1 || !user2) {
      return res.status(400).send("Both user IDs are required.");
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, recipient: user2 },
        { sender: user2, recipient: user1 },
      ],
    }).sort({ timestamp: 1 });

    return res.status(200).json({ messages });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const uploadFile = async (request, response, next) => {
  try {
    if (request.file) {
      console.log("in try if");
      const date = Date.now();
      let fileDir = `uploads/files/${date}`;
      let fileName = `${fileDir}/${request.file.originalname}`;

      // Create directory if it doesn't exist
      mkdirSync(fileDir, { recursive: true });

      renameSync(request.file.path, fileName);
      return response.status(200).json({ filePath: fileName });
    } else {
      return response.status(404).send("File is required.");
    }
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error.");
  }
};

export const forwardMessage = async (req, res, next) => {
  try {
    const { messageId, recipients, channels } = req.body;
    const userId = req.userId;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).send("Original message not found.");
    }

    const forwardedMessages = [];

    // Forward to individual contacts
    if (recipients && recipients.length > 0) {
      for (const recipientId of recipients) {
        const messageData = {
          sender: userId,
          recipient: recipientId,
          content: originalMessage.content,
          messageType: originalMessage.messageType,
          fileUrl: originalMessage.fileUrl,
          timestamp: new Date(),
          forwarded: true,
          originalMessageId: messageId
        };

        forwardedMessages.push(messageData);
      }
    }

    // Forward to channels
    if (channels && channels.length > 0) {
      for (const channelId of channels) {
        const channel = await Channel.findById(channelId);
        if (!channel) continue;

        const messageData = {
          sender: userId,
          recipient: null,
          content: originalMessage.content,
          messageType: originalMessage.messageType,
          fileUrl: originalMessage.fileUrl,
          timestamp: new Date(),
          forwarded: true,
          originalMessageId: messageId,
          channelId
        };

        forwardedMessages.push(messageData);
      }
    }

    return res.status(200).json({ messages: forwardedMessages });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.body;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).send("Message not found.");
    }

    // Sender can delete DM; channel admin can delete channel message
    if (message.sender.toString() !== userId) {
      if (message.recipient) {
        return res.status(403).send("Unauthorized.");
      } else {
        const channel = await Channel.findOne({ messages: messageId });
        if (!channel || channel.admin.toString() !== userId) {
          return res.status(403).send("Unauthorized.");
        }
      }
    }

    await Message.findByIdAndDelete(messageId);

    let channelId = null;
    let recipientId = message.recipient ? message.recipient.toString() : null;
    const senderId = message.sender.toString();

    if (!message.recipient) {
      const channel = await Channel.findOneAndUpdate(
        { messages: messageId },
        { $pull: { messages: messageId } },
        { new: true }
      );
      channelId = channel?._id ? channel._id.toString() : null;
    }

    return res.status(200).json({ messageId, senderId, recipientId, channelId });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { messageId, content } = req.body;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).send("Message not found.");
    }

    // Only sender can edit their own messages
    if (message.sender.toString() !== userId) {
      return res.status(403).send("Unauthorized.");
    }

    // Only text messages can be edited
    if (message.messageType !== "text") {
      return res.status(400).send("Only text messages can be edited.");
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { content, edited: true, editedAt: new Date() },
      { new: true }
    ).populate("sender", "id email firstName lastName image color")
      .populate("recipient", "id email firstName lastName image color")
      .exec();

    let channelId = null;
    let recipientId = message.recipient ? message.recipient.toString() : null;
    const senderId = message.sender.toString();

    if (!message.recipient) {
      const channel = await Channel.findOne({ messages: messageId });
      channelId = channel?._id ? channel._id.toString() : null;
    }

    return res.status(200).json({
      messageId,
      senderId,
      recipientId,
      channelId,
      updatedMessage
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { chatId, chatType } = req.body;
    const userId = req.userId;

    // For now, just return success. In a real app, you might update a lastRead timestamp
    // But since unread counts are managed client-side, this is sufficient
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Internal Server Error");
  }
};

// export const deleteMessage = async (req, res, next) => {
//   try {
//     const { messageId } = req.body;
//     const userId = req.userId;

//     const message = await Message.findById(messageId);
//     if (!message) {
//       return res.status(404).send("Message not found.");
//     }

//     // Check if user is sender or admin (for channels)
//     if (message.sender.toString() !== userId) {
//       // For channels, check if user is admin
//       if (message.recipient) {
//         // Personal message, only sender can delete
//         return res.status(403).send("Unauthorized.");
//       } else {
//         // Channel message, check if user is channel admin
//         const channel = await Channel.findOne({ messages: messageId });
//         if (!channel || channel.admin.toString() !== userId) {
//           return res.status(403).send("Unauthorized.");
//         }
//       }
//     }

//     await Message.findByIdAndDelete(messageId);

//     // Remove from channel if it's a channel message
//     if (!message.recipient) {
//       await Channel.findOneAndUpdate(
//         { messages: messageId },
//         { $pull: { messages: messageId } }
//       );
//     }

//     return res.status(200).json({ messageId });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).send("Internal Server Error");
//   }
// };
