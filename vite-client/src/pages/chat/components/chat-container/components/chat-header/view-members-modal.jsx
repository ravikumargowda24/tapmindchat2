import React, { useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Avatar,
    Chip,
    Badge,
} from "@heroui/react";
import { useAppStore } from "@/store";
import { HOST } from "@/lib/constants";
import { getColor } from "@/lib/utils";

const ViewMembersModal = ({ isOpen, onClose, channel }) => {
    const { userInfo } = useAppStore();

    const getMemberName = (member) => {
        if (member.firstName && member.lastName) {
            return `${member.firstName} ${member.lastName}`;
        }
        return member.email || 'Unknown User';
    };

    const getMemberInitials = (member) => {
        if (member.firstName) {
            return member.firstName[0].toUpperCase();
        }
        return member.email ? member.email[0].toUpperCase() : 'U';
    };

    const isAdmin = (memberId) => {
        return channel?.admin?._id === memberId;
    };

    const isCurrentUser = (memberId) => {
        return userInfo?.id === memberId;
    };

    const getRoleBadge = (member) => {
        if (isAdmin(member._id)) {
            return (
                <Chip size="sm" color="warning" variant="flat">
                    Admin
                </Chip>
            );
        }
        if (isCurrentUser(member._id)) {
            return (
                <Chip size="sm" color="primary" variant="flat">
                    You
                </Chip>
            );
        }
        return (
            <Chip size="sm" color="default" variant="flat">
                Member
            </Chip>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader>
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Channel Members</h3>

                    </div>
                </ModalHeader>
                <ModalBody>
                    {!channel?.members || channel.members.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No members in this channel</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {/* Admin Section */}
                            {channel.admin && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Admin</h4>
                                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                                        <Avatar
                                            src={channel.admin.image ? `${HOST}/${channel.admin.image}` : undefined}
                                            size="md"
                                            name={getMemberName(channel.admin)}
                                            className="flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900">
                                                    {getMemberName(channel.admin)}
                                                    {isCurrentUser(channel.admin._id) && (
                                                        <span className="text-sm text-gray-500 ml-1">(You)</span>
                                                    )}
                                                </p>
                                                <Chip size="sm" color="warning" variant="flat">
                                                    Admin
                                                </Chip>
                                            </div>
                                            <p className="text-sm text-gray-500">{channel.admin.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Members Section */}
                            {channel.members && channel.members.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Members ({channel.members.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {channel.members.map((member) => (
                                            <div
                                                key={member._id}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <Avatar
                                                    src={member.image ? `${HOST}/${member.image}` : undefined}
                                                    size="md"
                                                    name={getMemberName(member)}
                                                    className="flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-gray-900">
                                                            {getMemberName(member)}
                                                            {isCurrentUser(member._id) && (
                                                                <span className="text-sm text-gray-500 ml-1">(You)</span>
                                                            )}
                                                        </p>
                                                        {getRoleBadge(member)}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{member.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ViewMembersModal;