import { SOCKET_HOST } from "../lib/constants";
import { useAppStore } from "../store";
import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socket = useRef();
    const { userInfo } = useAppStore();

    useEffect(() => {
        if (userInfo) {
            socket.current = io(SOCKET_HOST, {
                withCredentials: true,
                query: { userId: userInfo.id },
            });
            socket.current.on("connect", () => {
                console.log("Connected to socket server");
            });

            const handleReceiveMessage = (message) => {
                // Access the latest state values
                const {
                    selectedChatData: currentChatData,
                    selectedChatType: currentChatType,
                    addMessage,
                    addContactInDMContacts,
                    incrementUnreadCount,
                } = useAppStore.getState();

                const isCurrentChat = currentChatType !== undefined &&
                    (currentChatData._id === message.sender._id ||
                        currentChatData._id === message.recipient._id);

                if (isCurrentChat) {
                    addMessage(message);
                } else {
                    const userId = useAppStore.getState().userInfo.id;
                    const chatId = message.sender._id === userId ? message.recipient._id : message.sender._id;
                    incrementUnreadCount(chatId, 'contact');
                }
                addContactInDMContacts(message);
            };

            const handleReceiveChannelMessage = (message) => {
                const {
                    selectedChatData,
                    selectedChatType,
                    addMessage,
                    addChannelInChannelLists,
                    incrementUnreadCount,
                } = useAppStore.getState();

                const isCurrentChat = selectedChatType !== undefined &&
                    selectedChatData._id === message.channelId;

                if (isCurrentChat) {
                    addMessage(message);
                } else {
                    incrementUnreadCount(message.channelId, 'channel');
                }
                addChannelInChannelLists(message);
            };

            const addNewChannel = (channel) => {
                const { addChannel } = useAppStore.getState();
                addChannel(channel);
            };

            socket.current.on("receiveMessage", handleReceiveMessage);
            socket.current.on("recieve-channel-message", handleReceiveChannelMessage);
            socket.current.on("new-channel-added", addNewChannel);

            return () => {
                socket.current.disconnect();
            };
        }
    }, [userInfo]);

    return (
        <SocketContext.Provider value={socket.current}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;