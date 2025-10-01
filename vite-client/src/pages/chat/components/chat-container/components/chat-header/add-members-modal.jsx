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
    Input,
    Chip,
} from "@heroui/react";
import { useAppStore } from "@/store";
import apiClient from "@/lib/api-client";
import { GET_ALL_CONTACTS, ADD_MEMBERS_TO_CHANNEL } from "@/lib/constants";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";

const AddMembersModal = ({ isOpen, onClose, channel }) => {
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { userInfo } = useAppStore();
    const socket = useSocket();

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
        }
    }, [isOpen]);

    useEffect(() => {
        // Filter contacts based on search term
        if (searchTerm.trim() === "") {
            setFilteredContacts(contacts);
        } else {
            const filtered = contacts.filter(contact =>
                `${contact.firstName} ${contact.lastName} ${contact.email}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
            setFilteredContacts(filtered);
        }
    }, [contacts, searchTerm]);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(GET_ALL_CONTACTS, { withCredentials: true });

            // Filter out current user and existing channel members
            const existingMemberIds = channel.members?.map(member => member._id) || [];
            const filteredContacts = response.data.contacts.filter(
                contact => contact._id !== userInfo.id && !existingMemberIds.includes(contact._id)
            );

            setContacts(filteredContacts);
            setFilteredContacts(filteredContacts);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleContactToggle = (contactId) => {
        setSelectedContacts(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleAddMembers = async () => {
        if (selectedContacts.length === 0) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await apiClient.post(
                `${ADD_MEMBERS_TO_CHANNEL.replace(':channelId', channel._id)}`,
                { memberIds: selectedContacts },
                { withCredentials: true }
            );

            if (response.status === 200) {
                // Emit socket event for real-time updates
                socket.emit("channel-members-added", {
                    channelId: channel._id,
                    newMembers: response.data.channel.members,
                    addedBy: userInfo.id
                });

                toast.success(`Successfully added ${selectedContacts.length} member${selectedContacts.length > 1 ? 's' : ''} to ${channel.name}`);

                // Reset selections and close modal
                setSelectedContacts([]);
                setSearchTerm("");
                onClose();
            }
        } catch (error) {
            console.error("Error adding members to channel:", error);
            toast.error("Failed to add members to channel. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedContacts([]);
        setSearchTerm("");
        setContacts([]);
        setFilteredContacts([]);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalContent>
                <ModalHeader>
                    <h3 className="text-lg font-semibold">Add Members to {channel?.name}</h3>
                </ModalHeader>
                <ModalBody>
                    {/* Search Input */}
                    <div className="mb-4">
                        <Input
                            placeholder="Search contacts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    {/* Contacts List */}
                    <div className="max-h-60 overflow-y-auto">
                        {loading ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Loading contacts...
                            </p>
                        ) : filteredContacts.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                {searchTerm ? "No contacts found" : "No contacts available"}
                            </p>
                        ) : (
                            filteredContacts.map((contact) => (
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
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {contact.firstName} {contact.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500">{contact.email}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Selected Contacts Preview */}
                    {selectedContacts.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">
                                {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedContacts.map(contactId => {
                                    const contact = contacts.find(c => c._id === contactId);
                                    return contact ? (
                                        <Chip
                                            key={contactId}
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            onClose={() => handleContactToggle(contactId)}
                                        >
                                            {contact.firstName} {contact.lastName}
                                        </Chip>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleAddMembers}
                        isLoading={submitting}
                        isDisabled={selectedContacts.length === 0}
                    >
                        {submitting ? "Adding..." : `Add ${selectedContacts.length} Member${selectedContacts.length > 1 ? 's' : ''}`}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddMembersModal;