import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useState } from "react";
import { useAppStore } from "@/store";
import { HOST, SEARCH_CONTACTS_ROUTES } from "@/lib/constants";
import apiClient from "@/lib/api-client";
import { getColor } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const NewDM = ({ isOpen, onOpenChange }) => {
    const [searchedContacts, setsearchedContacts] = useState([]);
    const { setSelectedChatType, setSelectedChatData } = useAppStore();

    const searchContacts = async (searchTerm) => {
        try {
            if (searchTerm.length > 0) {
                const response = await apiClient.post(
                    SEARCH_CONTACTS_ROUTES,
                    { searchTerm },
                    { withCredentials: true }
                );
                if (response.status === 200 && response.data.contacts) {
                    setsearchedContacts(response.data.contacts);
                }
            } else setsearchedContacts([]);
        } catch (error) {
            console.log(error);
        }
    };

    const selectNewContact = (contact) => {
        onOpenChange(false);
        setSelectedChatType("contact");
        setSelectedChatData(contact);
        setsearchedContacts([]);
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent className="bg-white text-black border rounded-lg w-[400px] h-[400px] flex flex-col">
                <ModalHeader>
                    <h3 className="font-semibold text-lg">Select a contact</h3>
                </ModalHeader>
                <ModalBody>
                    <Input
                        placeholder="Search Contacts"
                        className="rounded-lg p-4 border"
                        onChange={(e) => searchContacts(e.target.value)}
                    />

                    <ScrollArea className="h-[250px] mt-3">
                        <div className="flex flex-col gap-4">
                            {searchedContacts.map((contact) => (
                                <div
                                    className="flex gap-3 items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                                    key={contact.id}
                                    onClick={() => selectNewContact(contact)}
                                >
                                    <div className="w-12 h-12 relative">
                                        <Avatar className="w-12 h-12 rounded-full overflow-hidden">
                                            {contact.image ? (
                                                <img
                                                    src={`${HOST}/${contact.image}`}
                                                    alt="profile"
                                                    className="object-cover w-full h-full rounded-full"
                                                />
                                            ) : (
                                                <div
                                                    className={`uppercase w-12 h-12 text-lg border ${getColor(
                                                        contact.color
                                                    )} flex items-center justify-center rounded-full`}
                                                >
                                                    {contact.firstName
                                                        ? contact.firstName[0]
                                                        : contact.email[0]}
                                                </div>
                                            )}
                                        </Avatar>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {contact.firstName && contact.lastName
                                                ? `${contact.firstName} ${contact.lastName}`
                                                : ""}
                                        </span>
                                        <span className="text-xs text-gray-500">{contact.email}</span>
                                    </div>
                                </div>
                            ))}
                            {searchedContacts.length <= 0 && (
                                <div className="flex flex-col justify-center items-center text-gray-500 mt-5">
                                    <h3 className="text-center">
                                        Hi<span className="text-violet">!</span> Search new
                                        <span className="text-violet"> Contact. </span>
                                    </h3>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default NewDM;
