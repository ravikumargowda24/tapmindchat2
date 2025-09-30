import { RiCloseFill } from "react-icons/ri";
import { Avatar } from "@/components/ui/avatar";
import { useAppStore } from "@/store";
import { HOST } from "@/lib/constants";
import { getColor } from "@/lib/utils";
import { FiMoreVertical } from "react-icons/fi";
import moment from "moment";
import { useEffect, useState, useRef } from "react";
import apiClient from "@/lib/api-client";
import { GET_USER_STATUS_ROUTE } from "@/lib/constants";

const ChatHeader = () => {
    const {
        selectedChatData,
        closeChat,
        selectedChatType,
        userStatus,
        typingUsers
    } = useAppStore();

    const [userStatusData, setUserStatusData] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch user status
    useEffect(() => {
        const fetchUserStatus = async () => {
            if (selectedChatType === "contact" && selectedChatData?._id) {
                try {
                    const response = await apiClient.get(
                        `${GET_USER_STATUS_ROUTE}/${selectedChatData._id}`,
                        { withCredentials: true }
                    );
                    setUserStatusData(response.data);
                } catch (error) {
                    console.error("Error fetching user status:", error);
                }
            }
        };
        fetchUserStatus();
    }, [selectedChatData, selectedChatType]);

    // Dropdown click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getStatusText = () => {
        if (selectedChatType !== "contact" || !selectedChatData?._id) return null;

        const userId = selectedChatData._id;
        const isTyping = typingUsers[userId];
        const status = userStatus[userId] || userStatusData?.status;

        if (isTyping) {
            return "typing...";
        }

        switch (status) {
            case "online":
                return "Online";
            case "away":
                return "Away";
            case "offline":
                if (userStatusData?.lastSeen) {
                    const lastSeen = moment(userStatusData.lastSeen);
                    return `Last seen ${lastSeen.fromNow()}`;
                }
                return "Offline";
            default:
                return "Offline";
        }
    };

    const getStatusColor = () => {
        if (selectedChatType !== "contact" || !selectedChatData?._id) return "text-gray-500";

        const userId = selectedChatData._id;
        const isTyping = typingUsers[userId];
        const status = userStatus[userId] || userStatusData?.status;

        if (isTyping) {
            return "text-blue-500";
        }

        switch (status) {
            case "online":
                return "text-green-500";
            case "away":
                return "text-yellow-500";
            case "offline":
                return "text-gray-500";
            default:
                return "text-gray-500";
        }
    };

    const darkColors = ["#581C87"];

    function getRandomDarkColor() {
        const index = Math.floor(Math.random() * darkColors.length);
        return darkColors[index];
    }

    const handleDropdownToggle = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleDelete = () => {
        console.log(selectedChatType === "contact" ? "Delete Chat" : "Delete Channel");
        setDropdownOpen(false);
    };

    const handleAddMember = () => {
        console.log("Add Member");
        setDropdownOpen(false);
    };

    const handleRemoveMember = () => {
        console.log("Remove Member");
        setDropdownOpen(false);
    };

    return (
        <div className="h-[10vh] border-b border-gray-200 bg-white flex items-center justify-between px-6 shadow-sm relative">
            <div className="flex gap-4 items-center">
                <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 relative flex items-center justify-center">
                        {selectedChatType === "contact" ? (
                            <Avatar className="w-12 h-12 rounded-full overflow-hidden">
                                {selectedChatData.image ? (
                                    <img
                                        src={`${HOST}/${selectedChatData.image}`}
                                        alt="profile"
                                        className="object-cover w-full h-full rounded-full"
                                    />
                                ) : (
                                    <div
                                        className={`uppercase w-12 h-12 text-lg font-medium border ${getColor(
                                            selectedChatData.color
                                        )} flex items-center justify-center rounded-full`}
                                    >
                                        {selectedChatData.firstName
                                            ? selectedChatData.firstName[0]
                                            : selectedChatData.email[0]}
                                    </div>
                                )}
                            </Avatar>
                        ) : (
                            <div
                                style={{ backgroundColor: getRandomDarkColor() }}
                                className="text-white h-10 w-10 flex items-center justify-center rounded-full"
                            >
                                G
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="text-gray-900 font-medium">
                            {selectedChatType === "channel" && selectedChatData.name}
                            {selectedChatType === "contact" &&
                                selectedChatData.firstName &&
                                selectedChatData.lastName
                                ? `${selectedChatData.firstName} ${selectedChatData.lastName}`
                                : ""}
                        </div>
                        {selectedChatType === "contact" && (
                            <div className={`text-sm ${getStatusColor()}`}>
                                {getStatusText()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                <button
                    className="text-gray-500 focus:outline-none transition-all duration-200 relative"
                    onClick={handleDropdownToggle}
                >
                    <FiMoreVertical className="text-3xl cursor-pointer" />
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white text-black  rounded-md shadow-md w-48 z-50">
                        {selectedChatType === "contact" && (
                            <button
                                onClick={handleDelete}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                                Delete Chat
                            </button>
                        )}

                        {selectedChatType === "channel" && (
                            <>
                                <button
                                    onClick={handleDelete}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                    Delete Channel
                                </button>
                                <button
                                    onClick={handleAddMember}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                    Add Member
                                </button>
                                <button
                                    onClick={handleRemoveMember}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                    Remove Member
                                </button>
                            </>
                        )}
                    </div>
                )}

                <button
                    className="text-gray-500 hover:text-red-500 focus:outline-none transition-all duration-200"
                    onClick={closeChat}
                >
                    <RiCloseFill className="text-3xl cursor-pointer" />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
