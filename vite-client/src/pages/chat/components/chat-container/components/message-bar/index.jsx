import { IoSend } from "react-icons/io5";
import { GrAttachment } from "react-icons/gr";
import { RiEmojiStickerLine } from "react-icons/ri";
import EmojiPicker from "emoji-picker-react";
import { Alert } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";
import { CircleX } from 'lucide-react';
import { Send } from 'lucide-react';
import { useSocket } from "@/contexts/SocketContext";
import { MESSAGE_TYPES, UPLOAD_FILE, FETCH_ALL_MESSAGES_ROUTE, GET_CHANNEL_MESSAGES } from "@/lib/constants";
import apiClient from "@/lib/api-client";

const MessageBar = () => {
    const emojiRef = useRef();
    const fileInputRef = useRef();
    const {
        selectedChatData,
        userInfo,
        selectedChatType,
        setIsUploading,
        setFileUploadProgress,
        setSelectedChatMessages,
    } = useAppStore();

    const [message, setMessage] = useState("");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    const socket = useSocket();

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setEmojiPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [emojiRef]);

    // Cleanup typing indicator on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTyping && selectedChatType === "contact" && selectedChatData?._id) {
                socket.emit("typing", {
                    userId: userInfo.id,
                    recipientId: selectedChatData._id,
                    isTyping: false,
                });
            }
        };
    }, [socket, isTyping, selectedChatType, selectedChatData, userInfo.id]);


    const handleAddEmoji = (emoji) => {
        setMessage((msg) => msg + emoji.emoji);
    };

    const handleMessageChange = (event) => {
        setMessage(event.target.value);

        // Handle typing indicators for direct messages
        if (selectedChatType === "contact" && selectedChatData?._id) {
            if (!isTyping) {
                setIsTyping(true);
                socket.emit("typing", {
                    userId: userInfo.id,
                    recipientId: selectedChatData._id,
                    isTyping: true,
                });
            }

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                socket.emit("typing", {
                    userId: userInfo.id,
                    recipientId: selectedChatData._id,
                    isTyping: false,
                });
            }, 1000);
        }
    };


    const handleSendMessage = async () => {
        if (!message.trim()) {
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000); // hide alert after 3 sec
            return;
        }

        // Stop typing indicator
        if (isTyping && selectedChatType === "contact" && selectedChatData?._id) {
            setIsTyping(false);
            socket.emit("typing", {
                userId: userInfo.id,
                recipientId: selectedChatData._id,
                isTyping: false,
            });
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }

        // Handle send new message
        if (selectedChatType === "contact") {
            socket.emit("sendMessage", {
                sender: userInfo.id,
                content: message,
                recipient: selectedChatData._id,
                messageType: MESSAGE_TYPES.TEXT,
            });
        } else if (selectedChatType === "channel") {
            socket.emit("send-channel-message", {
                sender: userInfo.id,
                content: message,
                messageType: MESSAGE_TYPES.TEXT,
                channelId: selectedChatData._id,
            });
        }
        setMessage("");
    };

    const handleAttachmentChange = async (event) => {
        try {
            const file = event.target.files[0];

            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                setIsUploading(true);

                const response = await apiClient.post(UPLOAD_FILE, formData, {
                    withCredentials: true,
                    onUploadProgress: (data) => {
                        setFileUploadProgress(Math.round((100 * data.loaded) / data.total));
                    },
                });

                setIsUploading(false);

                if (response.status === 200 && response.data) {
                    if (selectedChatType === "contact") {
                        socket.emit("sendMessage", {
                            sender: userInfo.id,
                            content: undefined,
                            recipient: selectedChatData._id,
                            messageType: MESSAGE_TYPES.FILE,
                            fileUrl: response.data.filePath,
                        });
                    } else if (selectedChatType === "channel") {
                        socket.emit("send-channel-message", {
                            sender: userInfo.id,
                            content: undefined,
                            messageType: MESSAGE_TYPES.FILE,
                            fileUrl: response.data.filePath,
                            channelId: selectedChatData._id,
                        });
                    }
                }
            }
        } catch (error) {
            setIsUploading(false);
            console.error({ error });
        }
    };

    const handleAttachmentClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col w-full bg-white">
            {showAlert && (
                <div className="mb-2">
                    <Alert color="danger" title="Message cannot be empty!" />
                </div>
            )}

            <div className="h-[10vh] bg-white border-t border-gray-200 flex justify-center items-center px-6 gap-4">
                <div className="flex-1 flex bg-gray-100 rounded-full items-center gap-3 pr-4 shadow-sm">
                    <input
                        type="text"
                        className="flex-1 p-3 bg-transparent rounded-full focus:outline-none text-gray-800 placeholder-gray-500"
                        placeholder="Enter message"
                        value={message}
                        onChange={handleMessageChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />

                    <button
                        className="text-gray-500 hover:text-gray-700 transition-all duration-200 cursor-pointer"
                        onClick={handleAttachmentClick}
                    >
                        <GrAttachment className="text-xl" />
                    </button>

                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleAttachmentChange}
                    />

                    <div className="relative">
                        <button
                            className="text-gray-500 hover:text-gray-700 transition-all duration-200 cursor-pointer"
                            onClick={() => setEmojiPickerOpen(true)}
                        >
                            <RiEmojiStickerLine className="text-xl " />
                        </button>

                        <div className="absolute bottom-14 right-0 cursor-pointer" ref={emojiRef}>
                            <EmojiPicker
                                theme="light"
                                open={emojiPickerOpen}
                                onEmojiClick={handleAddEmoji}
                                autoFocusSearch={false}
                            />
                        </div>
                    </div>
                </div>

                <button
                    className="bg-primary rounded-full flex items-center justify-center p-2 text-white hover:bg-primary-hover transition-all duration-200 cursor-pointer"
                    onClick={handleSendMessage}
                >
                    <IoSend className="text-xl" />
                </button>
            </div>
        </div>
    );
};

export default MessageBar;