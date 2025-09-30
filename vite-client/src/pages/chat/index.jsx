import { useEffect } from "react";
import ChatContainer from "./components/chat-container";
import ContactsContainer from "./components/contacts-container";
import { useAppStore } from "../../store";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import EmptyChatContainer from "./components/empty-chat-container";
import { useSocket } from "../../contexts/SocketContext";

const Chat = () => {
    const {
        userInfo,
        selectedChatType,
        selectedChatData,
        isUploading,
        fileUploadProgress,
        isDownloading,
        downloadProgress,
        removeMessage,
        updateMessage,
        setUserStatus,
        setTypingUser,
    } = useAppStore();

    const navigate = useNavigate();
    const socket = useSocket();

    useEffect(() => {
        if (!userInfo.profileSetup) {
            toast("Please setup profile to continue.");
            navigate("/profile");
        }
    }, [userInfo, navigate]);

    useEffect(() => {
        if (socket) {
            const handleMessageDeleted = (data) => {
                removeMessage(data.messageId);
            };

            const handleMessageEdited = (data) => {
                updateMessage(data.messageId, data.updatedMessage);
            };

            const handleUserStatusChanged = (data) => {
                setUserStatus(data.userId, data.status);
            };

            const handleUserTyping = (data) => {
                setTypingUser(data.userId, data.isTyping);
            };

            socket.on("message-deleted", handleMessageDeleted);
            socket.on("message-edited", handleMessageEdited);
            socket.on("user-status-changed", handleUserStatusChanged);
            socket.on("user-typing", handleUserTyping);

            return () => {
                socket.off("message-deleted", handleMessageDeleted);
                socket.off("message-edited", handleMessageEdited);
                socket.off("user-status-changed", handleUserStatusChanged);
                socket.off("user-typing", handleUserTyping);
            };
        }
    }, [socket, removeMessage, updateMessage, setUserStatus, setTypingUser]);

    // Update user status when chat changes
    useEffect(() => {
        if (socket && selectedChatType === "contact" && selectedChatData?._id) {
            socket.emit("user-status", {
                status: "online",
                currentChat: selectedChatData._id,
            });
        } else if (socket) {
            socket.emit("user-status", {
                status: "away",
                currentChat: null,
            });
        }
    }, [socket, selectedChatType, selectedChatData]);

    /** NEW EFFECT: Trigger "away" when tab is inactive */
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (socket) {
                    socket.emit("user-status", {
                        status: "away",
                        currentChat: selectedChatData?._id || null,
                    });
                }
            } else {
                if (socket && selectedChatType === "contact" && selectedChatData?._id) {
                    socket.emit("user-status", {
                        status: "online",
                        currentChat: selectedChatData._id,
                    });
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [socket, selectedChatType, selectedChatData]);

    return (
        <div className="flex h-[100vh] text-white overflow-hidden">
            {isUploading && (
                <div className="h-[100vh] w-[100vw] fixed top-0 z-10 left-0 bg-black/80 flex items-center justify-center flex-col gap-5">
                    <h5 className="text-5xl animate-pulse">Uploading File</h5>
                    {fileUploadProgress}%
                </div>
            )}
            {isDownloading && (
                <div className="h-[100vh] w-[100vw] fixed top-0 z-10 left-0 bg-black/80 flex items-center justify-center flex-col gap-5">
                    <h5 className="text-5xl animate-pulse">Downloading File</h5>
                    {downloadProgress}%
                </div>
            )}
            <ContactsContainer />
            {selectedChatType === undefined ? (
                <EmptyChatContainer />
            ) : (
                <ChatContainer />
            )}
        </div>
    );
};

export default Chat;
