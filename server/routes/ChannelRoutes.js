import { Router } from "express";
import {
  createChannel,
  getChannelMessages,
  getUserChannels,
  addMembersToChannel,
  removeMemberFromChannel,
  deleteChannel,
} from "../controllers/ChannelControllers.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";

const channelRoutes = Router();

channelRoutes.post("/create-channel", verifyToken, createChannel);
channelRoutes.get("/get-user-channels", verifyToken, getUserChannels);
channelRoutes.get(
  "/get-channel-messages/:channelId",
  verifyToken,
  getChannelMessages
);
channelRoutes.post("/:channelId/add-members", verifyToken, addMembersToChannel);
channelRoutes.post("/:channelId/remove-member", verifyToken, removeMemberFromChannel);
channelRoutes.delete("/:channelId", verifyToken, deleteChannel);

export default channelRoutes;
