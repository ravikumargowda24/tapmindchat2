import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Checkbox,
    Avatar,
    Chip,
    Tabs,
    Tab,
} from "@heroui/react";
import { useAppStore } from "@/store";
import apiClient from "@/lib/api-client";
import { GET_ALL_CONTACTS, GET_USER_CHANNELS, FORWARD_MESSAGE_ROUTE } from "@/lib/constants";
import { useSocket } from "@/contexts/SocketContext";

const ForwardModal = ({ isOpen, onClose, message }) => {
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [selectedChannels, setSelectedChannels] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(false);
    const { userInfo } = useAppStore();
    const socket = useSocket();

    useEffect(() => {
        if (isOpen) {
            fetchContactsAndChannels();
        }
    }, [isOpen]);

    const fetchContactsAndChannels = async () => {
        try {
            const [contactsResponse, channelsResponse] = await Promise.all([
                apiClient.get(GET_ALL_CONTACTS, { withCredentials: true }),
                apiClient.get(GET_USER_CHANNELS, { withCredentials: true })
            ]);

            // Filter out current user from contacts
            const filteredContacts = contactsResponse.data.contacts.filter(
                contact => contact._id !== userInfo.id
            );
            setContacts(filteredContacts);
            setChannels(channelsResponse.data.channels || []);
        } catch (error) {
            console.error("Error fetching contacts and channels:", error);
        }
    };

    const handleContactToggle = (contactId) => {
        setSelectedContacts(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleChannelToggle = (channelId) => {
        setSelectedChannels(prev =>
            prev.includes(channelId)
                ? prev.filter(id => id !== channelId)
                : [...prev, channelId]
        );
    };

    const handleForward = async () => {
        if (!message || (selectedContacts.length === 0 && selectedChannels.length === 0)) {
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post(FORWARD_MESSAGE_ROUTE, {
                messageId: message._id,
                recipients: selectedContacts,
                channels: selectedChannels
            }, { withCredentials: true });

            if (response.status === 200) {
                // Emit socket events for real-time updates
                response.data.messages.forEach(forwardedMessage => {
                    if (forwardedMessage.channelId) {
                        socket.emit("send-channel-message", forwardedMessage);
                    } else {
                        socket.emit("sendMessage", forwardedMessage);
                    }
                });

                // Reset selections and close modal
                setSelectedContacts([]);
                setSelectedChannels([]);
                onClose();
            }
        } catch (error) {
            console.error("Error forwarding message:", error);
        } finally {
            setLoading(false);
        }
    };

    const getMessagePreview = () => {
        if (!message) return "Loading...";

        if (message.messageType === "text") {
            return message.content.length > 50
                ? `${message.content.substring(0, 50)}...`
                : message.content;
        }
        return "File message";
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader>
                    <h3 className="text-lg font-semibold">Forward Message</h3>
                </ModalHeader>
                <ModalBody>
                    {/* Message Preview */}
                    {message && (
                        <div className="p-3 bg-gray-50 rounded-lg mb-4">
                            <p className="text-sm text-gray-600 mb-1">Message to forward:</p>
                            <p className="text-sm">{getMessagePreview()}</p>
                        </div>
                    )}

                    {/* Selection Tabs */}
                    <Tabs aria-label="Forward options">
                        <Tab key="contacts" title="Contacts">
                            <div className="max-h-60 overflow-y-auto">
                                {contacts.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No contacts available
                                    </p>
                                ) : (
                                    contacts.map((contact) => (
                                        <div
                                            key={contact._id}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                            onClick={() => handleContactToggle(contact._id)}
                                        >
                                            <Checkbox
                                                isSelected={selectedContacts.includes(contact._id)}
                                                onChange={() => handleContactToggle(contact._id)}
                                            />
                                            <Avatar
                                                src={contact.image}
                                                size="sm"
                                                name={`${contact.firstName} ${contact.lastName}`}
                                            />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {contact.firstName} {contact.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">{contact.email}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Tab>
                        <Tab key="channels" title="Channels">
                            <div className="max-h-60 overflow-y-auto">
                                {channels.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        No channels available
                                    </p>
                                ) : (
                                    channels.map((channel) => (
                                        <div
                                            key={channel._id}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                            onClick={() => handleChannelToggle(channel._id)}
                                        >
                                            <Checkbox
                                                isSelected={selectedChannels.includes(channel._id)}
                                                onChange={() => handleChannelToggle(channel._id)}
                                            />
                                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">#</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{channel.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {channel.members?.length || 0} members
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Tab>
                    </Tabs>

                    {/* Selected Recipients Preview */}
                    {(selectedContacts.length > 0 || selectedChannels.length > 0) && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Selected recipients:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedContacts.map(contactId => {
                                    const contact = contacts.find(c => c._id === contactId);
                                    return contact ? (
                                        <Chip
                                            key={contactId}
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                        >
                                            {contact.firstName} {contact.lastName}
                                        </Chip>
                                    ) : null;
                                })}
                                {selectedChannels.map(channelId => {
                                    const channel = channels.find(c => c._id === channelId);
                                    return channel ? (
                                        <Chip
                                            key={channelId}
                                            size="sm"
                                            variant="flat"
                                            color="secondary"
                                        >
                                            #{channel.name}
                                        </Chip>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleForward}
                        isLoading={loading}
                        isDisabled={!message || (selectedContacts.length === 0 && selectedChannels.length === 0)}
                    >
                        {loading ? "Forwarding..." : "Forward"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ForwardModal;