import { HOST } from "@/lib/constants";
import { getColor } from "@/lib/utils";
import { useAppStore } from "@/store";
import { Avatar } from "@/components/ui/avatar";
import { FiMoreVertical } from "react-icons/fi";
import moment from "moment";



const ContactList = ({ contacts, isChannel = false }) => {
    const {
        selectedChatData,
        setSelectedChatType,
        setSelectedChatData,
        setSelectedChatMessages,
        unreadCounts,
        markAsRead,
    } = useAppStore();
    console.log(contacts, "contact")

    const handleClick = (contact) => {
        if (isChannel) setSelectedChatType("channel");
        else setSelectedChatType("contact");
        setSelectedChatData(contact);
        if (selectedChatData && selectedChatData._id !== contact._id) {
            setSelectedChatMessages([]);
        }
        // Mark as read
        const chatType = isChannel ? "channel" : "contact";
        markAsRead(contact._id, chatType);
    };
    const darkColors = [
        "#581C87", // violet
    ];

    function getRandomDarkColor() {
        const index = Math.floor(Math.random() * darkColors.length);
        return darkColors[index];
    }
    console.log(selectedChatData, "selectedChatData")
    return (
        <div className="mt-5">
            {contacts.length > 0 ? (<>
                {
                    contacts.map((contact) => (
                        <div
                            key={contact._id}
                            className={`p-2 py-2 transition-all border border-violet flex w-full duration-300 cursor-pointer shadow-lg rounded-xl h-18 my-3 ${selectedChatData && selectedChatData._id === contact._id
                                ? "bg-light-purple text-black "
                                : "hover:bg-gray-100 text-gray-700"
                                }`}
                            onClick={() => handleClick(contact)}
                        >
                            <div className="flex gap-3 justify-between w-[100%]">
                                {!isChannel && (
                                    <Avatar className="h-10 w-10">
                                        {contact.image ? (
                                            <img
                                                src={`${HOST}/${contact.image}`}
                                                alt="profile"
                                                className="rounded-full object-cover h-full w-full"
                                            />
                                        ) : (
                                            <div
                                                className={`uppercase ${selectedChatData &&
                                                    selectedChatData._id === contact._id
                                                    ? "bg-[#ffffff22] border border-white/50 text-white"
                                                    : getColor(contact.color)
                                                    } h-10 w-10 flex items-center justify-center rounded-full`}
                                            >
                                                {contact.firstName?.[0]}
                                            </div>
                                        )}
                                    </Avatar>
                                )}
                                {isChannel && (
                                    <div
                                        style={{ backgroundColor: getRandomDarkColor() }}
                                        className="text-white h-10 w-10 flex items-center justify-center rounded-full"
                                    >
                                        G
                                    </div>
                                )}
                                {isChannel ? (
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{contact.name}</span>
                                            {unreadCounts[`channel_${contact._id}`] > 0 && (
                                                <span className="ml-2 w-6 h-6 flex justify-center items-center bg-red-500 text-white text-xs p-2 rounded-full">
                                                    {unreadCounts[`channel_${contact._id}`]}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 truncate w-40">
                                            {contact.lastMessageTime
                                                ? moment(contact.lastMessageTime).calendar(null, {
                                                    sameDay: "[Today] h:mm A",
                                                    lastDay: "[Yesterday] h:mm A",
                                                    lastWeek: "ddd h:mm A",
                                                    sameElse: "DD/MM/YYYY h:mm A"
                                                })
                                                : "No messages yet"}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{`${contact.firstName}`}</span>
                                            {unreadCounts[`contact_${contact._id}`] > 0 && (
                                                <span className="ml-2 w-6 h-6 flex justify-center items-center bg-red-500 text-white text-xs p-2 rounded-full">
                                                    {unreadCounts[`contact_${contact._id}`]}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 truncate w-40">
                                            {contact.lastMessageTime
                                                ? moment(contact.lastMessageTime).calendar(null, {
                                                    sameDay: "[Today] h:mm A",
                                                    lastDay: "[Yesterday] h:mm A",
                                                    lastWeek: "ddd h:mm A",
                                                    sameElse: "DD/MM/YYYY h:mm A"
                                                })
                                                : "No messages yet"}
                                        </span>
                                    </div>
                                )}
                                {/* <div className="cursor-pointer flex items-center"><FiMoreVertical /></div> */}

                            </div>
                        </div>
                    ))
                }
            </>) : <div className="text-center text-gray-500 text-sm py-4">
                No Results
            </div>}
        </div>
    );
};

export default ContactList;
