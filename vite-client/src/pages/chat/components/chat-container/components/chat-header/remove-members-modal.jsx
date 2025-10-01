import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Avatar,
    Chip,
} from "@heroui/react";
import { useAppStore } from "@/store";
import apiClient from "@/lib/api-client";
import { REMOVE_MEMBER_FROM_CHANNEL } from "@/lib/constants";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";

const RemoveMembersModal = ({ isOpen, onClose, channel }) => {
    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { userInfo } = useAppStore();
    const socket = useSocket();

    useEffect(() => {
        if (isOpen && channel) {
            // Filter out the admin from removable members
            const removableMembers = channel.members?.filter(member => member._id !== channel.admin) || [];
            setMembers(removableMembers);
        }
    }, [isOpen, channel]);

    const handleMemberToggle = (memberId) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleRemoveMembers = async () => {
        if (selectedMembers.length === 0) {
            return;
        }

        setSubmitting(true);
        try {
            // Remove members one by one
            const removePromises = selectedMembers.map(memberId =>
                apiClient.post(
                    `${REMOVE_MEMBER_FROM_CHANNEL.replace(':channelId', channel._id)}`,
                    { memberId },
                    { withCredentials: true }
                )
            );

            const responses = await Promise.all(removePromises);

            if (responses.every(response => response.status === 200)) {
                // Emit socket event for real-time updates
                selectedMembers.forEach(memberId => {
                    socket.emit("channel-member-removed", {
                        channelId: channel._id,
                        removedMemberId: memberId,
                        removedBy: userInfo.id
                    });
                });

                toast.success(`Successfully removed ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} from ${channel.name}`);

                // Reset selections and close modal
                setSelectedMembers([]);
                onClose();
            }
        } catch (error) {
            console.error("Error removing members from channel:", error);
            toast.error("Failed to remove members from channel. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedMembers([]);
        setMembers([]);
        onClose();
    };

    const getMemberName = (member) => {
        if (member.firstName && member.lastName) {
            return `${member.firstName} ${member.lastName}`;
        }
        return member.email || 'Unknown User';
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalContent>
                <ModalHeader>
                    <h3 className="text-lg font-semibold">Remove Members from {channel?.name}</h3>
                </ModalHeader>
                <ModalBody>
                    {/* Warning message */}
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                        <p className="text-sm text-yellow-800">
                            ⚠️ Warning: Removed members will lose access to this channel and its message history.
                        </p>
                    </div>

                    {/* Members List */}
                    <div className="max-h-60 overflow-y-auto">
                        {loading ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Loading members...
                            </p>
                        ) : members.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                No removable members available
                            </p>
                        ) : (
                            members.map((member) => (
                                <div
                                    key={member._id}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => handleMemberToggle(member._id)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(member._id)}
                                        onChange={() => handleMemberToggle(member._id)}
                                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                                    />
                                    <Avatar
                                        src={member.image}
                                        size="sm"
                                        name={getMemberName(member)}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {getMemberName(member)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {member._id === userInfo.id ? 'You' : 'Member'}
                                        </p>
                                    </div>
                                    {member._id === channel.admin && (
                                        <Chip size="sm" color="warning" variant="flat">
                                            Admin
                                        </Chip>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Selected Members Preview */}
                    {selectedMembers.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">
                                {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected for removal:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedMembers.map(memberId => {
                                    const member = members.find(m => m._id === memberId);
                                    return member ? (
                                        <Chip
                                            key={memberId}
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                            onClose={() => handleMemberToggle(memberId)}
                                        >
                                            {getMemberName(member)}
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
                        color="danger"
                        onPress={handleRemoveMembers}
                        isLoading={submitting}
                        isDisabled={selectedMembers.length === 0}
                    >
                        {submitting ? "Removing..." : `Remove ${selectedMembers.length} Member${selectedMembers.length > 1 ? 's' : ''}`}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default RemoveMembersModal;