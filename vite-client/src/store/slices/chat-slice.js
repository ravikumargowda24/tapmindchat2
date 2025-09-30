export const createChatSlice = (set, get) => ({
    selectedChatType: undefined,
    selectedChatData: undefined,
    selectedChatMessages: [],
    directMessagesContacts: [],
    channels: [],
    unreadCounts: (() => {
        try {
            const stored = localStorage.getItem('unreadCounts');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    })(),
    isUploading: false,
    fileUploadProgress: 0,
    isDownloading: false,
    downloadProgress: 0,
    setIsUploading: (isUploading) => set({ isUploading }),
    setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
    setIsDownloading: (isDownloading) => set({ isDownloading }),
    setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
    setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
    setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
    setChannels: (channels) => set({ channels }),
    setSelectedChatMessages: (selectedChatMessages) =>
        set({ selectedChatMessages }),
    setDirectMessagesContacts: (directMessagesContacts) =>
        set({ directMessagesContacts }),
    closeChat: () =>
        set({
            selectedChatData: undefined,
            selectedChatType: undefined,
            selectedChatMessages: [],
        }),
    addMessage: (message) => {
        const selectedChatMessages = get().selectedChatMessages;
        const selectedChatType = get().selectedChatType;
        set({
            selectedChatMessages: [
                ...selectedChatMessages,
                {
                    ...message,
                    recipient:
                        selectedChatType === "channel"
                            ? message.recipent
                            : message.recipient._id,
                    sender:
                        selectedChatType === "channel"
                            ? message.sender
                            : message.sender._id,
                },
            ],
        });
    },
    removeMessage: (messageId) => {
        const selectedChatMessages = get().selectedChatMessages;
        set({
            selectedChatMessages: selectedChatMessages.filter((msg) => msg._id !== messageId),
        });
    },
    updateMessage: (messageId, updatedMessage) => {
        const selectedChatMessages = get().selectedChatMessages;
        set({
            selectedChatMessages: selectedChatMessages.map((msg) =>
                msg._id === messageId ? { ...msg, ...updatedMessage } : msg
            ),
        });
    },
    userStatus: {},
    setUserStatus: (userId, status) => {
        set((state) => ({
            userStatus: {
                ...state.userStatus,
                [userId]: status,
            },
        }));
    },
    typingUsers: {},
    setTypingUser: (userId, isTyping) => {
        set((state) => ({
            typingUsers: {
                ...state.typingUsers,
                [userId]: isTyping,
            },
        }));
    },

    addChannel: (channel) => {
        const channels = get().channels;
        set({ channels: [channel, ...channels] });
    },
    addContactInDMContacts: (message) => {
        console.log({ message });
        const userId = get().userInfo.id;
        const fromId =
            message.sender._id === userId
                ? message.recipient._id
                : message.sender._id;
        const fromData =
            message.sender._id === userId ? message.recipient : message.sender;
        const dmContacts = get().directMessagesContacts;
        const data = dmContacts.find((contact) => contact._id === fromId);
        const index = dmContacts.findIndex((contact) => contact._id === fromId);
        console.log({ data, index, dmContacts, userId, message, fromData });
        if (index !== -1 && index !== undefined) {
            console.log("in if condition");
            dmContacts.splice(index, 1);
            dmContacts.unshift(data);
        } else {
            console.log("in else condition");
            dmContacts.unshift(fromData);
        }
        set({ directMessagesContacts: dmContacts });
    },
    addChannelInChannelLists: (message) => {
        const channels = get().channels;
        const data = channels.find((channel) => channel._id === message.channelId);
        const index = channels.findIndex(
            (channel) => channel._id === message.channelId
        );
        if (index !== -1 && index !== undefined) {
            channels.splice(index, 1);
            channels.unshift(data);
            set({ channels: [...channels] });
        }
    },
    incrementUnreadCount: (chatId, chatType) => {
        const key = `${chatType}_${chatId}`;
        set((state) => {
            const newCounts = {
                ...state.unreadCounts,
                [key]: (state.unreadCounts[key] || 0) + 1,
            };
            localStorage.setItem('unreadCounts', JSON.stringify(newCounts));
            return { unreadCounts: newCounts };
        });
    },
    resetUnreadCount: (chatId, chatType) => {
        const key = `${chatType}_${chatId}`;
        set((state) => {
            const newCounts = {
                ...state.unreadCounts,
                [key]: 0,
            };
            localStorage.setItem('unreadCounts', JSON.stringify(newCounts));
            return { unreadCounts: newCounts };
        });
    },
    markAsRead: async (chatId, chatType) => {
        const { resetUnreadCount } = get();
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/messages/mark-as-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ chatId, chatType }),
            });
            if (response.ok) {
                resetUnreadCount(chatId, chatType);
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    },
});