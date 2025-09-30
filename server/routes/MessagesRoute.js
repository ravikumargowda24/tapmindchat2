import { Router } from "express";
import { getMessages, uploadFile, forwardMessage, deleteMessage, editMessage, markAsRead } from "../controllers/MessagesController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import multer from "multer";
const messagesRoutes = Router();
const upload = multer({ dest: "uploads/files/" });
messagesRoutes.post("/get-messages", verifyToken, getMessages);
messagesRoutes.post(
  "/upload-file",
  verifyToken,
  upload.single("file"),
  uploadFile
);

messagesRoutes.post("/forward-message", verifyToken, forwardMessage);

messagesRoutes.delete("/delete-message", verifyToken, deleteMessage);

messagesRoutes.put("/edit-message", verifyToken, editMessage);

messagesRoutes.post("/mark-as-read", verifyToken, markAsRead);
export default messagesRoutes;
