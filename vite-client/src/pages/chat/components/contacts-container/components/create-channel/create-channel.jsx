import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    Select,
    SelectItem,
} from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // ✅
import apiClient from "@/lib/api-client";
import { CREATE_CHANNEL, GET_ALL_CONTACTS } from "@/lib/constants";
import { useSocket } from "@/contexts/SocketContext";
import { useAppStore } from "@/store";

const CreateChannel = ({ isOpen, onOpenChange }) => {
    const [allContacts, setAllContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [channelName, setChannelName] = useState("");
    const socket = useSocket();
    const { addChannel } = useAppStore();

    // Fetch all contacts
    useEffect(() => {
        const getData = async () => {
            try {
                const response = await apiClient.get(GET_ALL_CONTACTS, {
                    withCredentials: true,
                });
                setAllContacts(response.data.contacts);
            } catch (error) {
                console.error("Failed to fetch contacts", error);
            }
        };
        if (isOpen) getData();
    }, [isOpen]);

    // Create new channel
    const createChannel = async () => {
        if (!channelName.trim() || selectedContacts.length === 0) return;

        try {
            const response = await apiClient.post(
                CREATE_CHANNEL,
                {
                    name: channelName,
                    members: selectedContacts,
                },
                { withCredentials: true }
            );

            if (response.status === 201) {
                setChannelName("");
                setSelectedContacts([]);
                onOpenChange(false);
                addChannel(response.data.channel);
                socket.emit("add-channel-notify", response.data.channel);
            }
        } catch (error) {
            console.error("Failed to create channel", error);
        }
    };

    // Remove contact
    const removeContact = (id) => {
        setSelectedContacts((prev) => prev.filter((c) => c !== id));
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent className="bg-white text-black border rounded-lg w-[400px] h-max flex flex-col">
                <ModalHeader>
                    <h3 className="font-semibold text-lg">Create a new Channel</h3>
                </ModalHeader>
                <ModalBody className="flex flex-col gap-4">
                    {/* Selected contacts preview */}
                    {selectedContacts.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 rounded-md border bg-gray-50">
                            <AnimatePresence>
                                {selectedContacts.map((id) => {
                                    const contact = allContacts.find((c) => c._id === id);
                                    return (
                                        <motion.div
                                            key={id}
                                            initial={{ y: -20, scale: 0.5, opacity: 0 }}
                                            animate={{
                                                y: 0,
                                                scale: 1,
                                                opacity: 1,
                                            }}
                                            exit={{
                                                y: 20,
                                                scale: 0.5,
                                                opacity: 0,
                                            }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 20,
                                            }}
                                            className="flex items-center gap-2 px-3 py-1 bg-violet text-white rounded-full shadow-sm"
                                        >
                                            <span>{contact?.firstName || "Unknown"}</span>
                                            <button
                                                className="ml-1 text-xs bg-white text-violet rounded-full w-5 h-5 flex items-center justify-center hover:bg-gray-200"
                                                onClick={() => removeContact(id)}
                                            >
                                                ✕
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Channel Name Input */}
                    <Input
                        placeholder="Channel Name"
                        className="rounded-md"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                    />

                    {/* Contact Selector */}
                    <Select
                        label="Select Contacts"
                        selectionMode="multiple"
                        placeholder="Search Contacts"
                        selectedKeys={selectedContacts}
                        onSelectionChange={(keys) =>
                            setSelectedContacts(Array.from(keys))
                        }
                    >
                        {allContacts.map((contact) => (
                            <SelectItem key={contact._id} value={contact._id}>
                                {contact.firstName}
                            </SelectItem>
                        ))}
                    </Select>

                    {/* Create Button */}
                    <Button
                        onClick={createChannel}
                        className="w-full mt-2 bg-violet hover:bg-violet/90 text-white transition-all duration-300"
                    >
                        Create Channel
                    </Button>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default CreateChannel;
