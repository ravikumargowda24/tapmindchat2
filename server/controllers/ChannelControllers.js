import mongoose from "mongoose";
import Channel from "../model/ChannelModel.js";
import User from "../model/UserModel.js";

export const createChannel = async (request, response, next) => {
  try {
    const { name, members } = request.body;
    const userId = request.userId;
    const admin = await User.findById(userId);
    if (!admin) {
      return response.status(400).json({ message: "Admin user not found." });
    }

    const validMembers = await User.find({ _id: { $in: members } });
    if (validMembers.length !== members.length) {
      return response
        .status(400)
        .json({ message: "Some members are not valid users." });
    }

    const newChannel = new Channel({
      name,
      members,
      admin: userId,
    });

    await newChannel.save();

    return response.status(201).json({ channel: newChannel });
  } catch (error) {
    console.error("Error creating channel:", error);
    return response.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserChannels = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const channels = await Channel.find({
      $or: [{ admin: userId }, { members: userId }],
    })
      .populate("admin", "firstName lastName email image color")
      .populate("members", "firstName lastName email image color")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ channels });
  } catch (error) {
    console.error("Error getting user channels:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId).populate({
      path: "messages",
      populate: {
        path: "sender",
        select: "firstName lastName email _id image color",
      },
    });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const messages = channel.messages;
    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error getting channel messages:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addMembersToChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { memberIds } = req.body;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user is admin
    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Validate new members
    const validMembers = await User.find({ _id: { $in: memberIds } });
    if (validMembers.length !== memberIds.length) {
      return res.status(400).json({ message: "Some members are not valid users" });
    }

    // Add new members (avoid duplicates)
    const existingMemberIds = channel.members.map(member => member.toString());
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ message: "All selected users are already members" });
    }

    channel.members.push(...newMemberIds);
    await channel.save();

    // Populate the updated channel
    const updatedChannel = await Channel.findById(channelId)
      .populate("members", "firstName lastName email image color")
      .populate("admin", "firstName lastName email image color");

    return res.status(200).json({
      message: "Members added successfully",
      channel: updatedChannel
    });
  } catch (error) {
    console.error("Error adding members to channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeMemberFromChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { memberId } = req.body;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user is admin
    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Check if trying to remove admin
    if (channel.admin.toString() === memberId) {
      return res.status(400).json({ message: "Cannot remove admin from channel" });
    }

    // Remove member
    channel.members = channel.members.filter(member => member.toString() !== memberId);
    await channel.save();

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member from channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user is admin
    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: "Only admin can delete channel" });
    }

    await Channel.findByIdAndDelete(channelId);

    return res.status(200).json({ message: "Channel deleted successfully" });
  } catch (error) {
    console.error("Error deleting channel:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
