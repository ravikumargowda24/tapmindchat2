import ContactList from "@/components/common/contact-list";
import Logo from "@/components/common/logo";
import ProfileInfo from "./components/profile-info";
import apiClient from "@/lib/api-client";
import {
    GET_CONTACTS_WITH_MESSAGES_ROUTE,
    GET_USER_CHANNELS,
    GET_ALL_CONTACTS,
} from "@/lib/constants";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/react";

import { Tabs, Tab } from "@heroui/react";
import { useEffect, useState } from "react";
import { MessageCirclePlus, Search } from "lucide-react";
import { useAppStore } from "@/store";
import { motion } from "framer-motion";
import NewDM from "./components/new-dm/new-dm";
import CreateChannel from "./components/create-channel/create-channel";

const ContactsContainer = () => {
    const {
        setDirectMessagesContacts,
        directMessagesContacts,
        channels,
        setChannels,
    } = useAppStore();

    // modal states
    const [isNewDMOpen, setIsNewDMOpen] = useState(false);
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchTermGroup, setSearchTermGroup] = useState("");
    const [searchAllContact, setsearchAllContact] = useState("");

    const [allContacts, setAllContacts] = useState([]);

    useEffect(() => {
        const getContactsWithMessages = async () => {
            const response = await apiClient.get(
                GET_CONTACTS_WITH_MESSAGES_ROUTE,
                {
                    withCredentials: true,
                }
            );
            if (response.data.contacts) {
                setDirectMessagesContacts(response.data.contacts);
            }
        };
        getContactsWithMessages();
    }, [setDirectMessagesContacts]);

    useEffect(() => {
        const getChannels = async () => {
            const response = await apiClient.get(GET_USER_CHANNELS, {
                withCredentials: true,
            });
            if (response.data.channels) {
                setChannels(response.data.channels);
            }
        };
        getChannels();
    }, [setChannels]);

    useEffect(() => {
        const getAllContacts = async () => {
            const response = await apiClient.get(GET_ALL_CONTACTS, {
                withCredentials: true,
            });
            if (response.data.contacts) {
                setAllContacts(response.data.contacts);
            }
        };
        getAllContacts();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" },
        },
    };

    // Filter contacts based on search term
    const filterContacts = (contacts) => {
        if (!searchTerm) return contacts;
        return contacts.filter((contact) => {
            const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`;
            return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    };
    const filterGroups = (contacts) => {
        if (!searchTermGroup) return contacts;
        return contacts.filter((contact) => {
            const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`;
            return name.toLowerCase().includes(searchTermGroup.toLowerCase());
        });
    };
    const filterAll = (contacts) => {
        if (!searchAllContact) return contacts;
        return contacts.filter((contact) => {
            const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`;
            return name.toLowerCase().includes(searchAllContact.toLowerCase());
        });
    };



    return (
        <motion.div
            className="relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] bg-white border-r border-gray-200 w-full flex flex-col h-full"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header */}
            <div className="pt-4 pb-3 px-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Dropdown>
                            <DropdownTrigger>
                                <motion.div
                                    className="cursor-pointer bg-violet w-8 h-8 rounded-full flex justify-center items-center text-white hover:bg-violet/90 transition-colors"
                                >
                                    <MessageCirclePlus size={16} />
                                </motion.div>
                            </DropdownTrigger>

                            <DropdownMenu aria-label="New Options" variant="flat">
                                <DropdownItem key="new-dm" onClick={() => setIsNewDMOpen(true)}>
                                    New DM
                                </DropdownItem>
                                <DropdownItem key="create-channel" onClick={() => setIsCreateChannelOpen(true)}>
                                    Create Channel
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </motion.div>
                </div>


            </div>

            {/* Tabs */}
            <div className="px-4 mb-2">
                <Tabs aria-label="Chat Options" className="w-full">
                    <Tab key="direct" title={
                        <span className="text-xs font-semibold tracking-wider uppercase">
                            DIRECT
                        </span>
                    }>

                        <div className="mt-2">
                            {directMessagesContacts && directMessagesContacts.length > 0 ? (
                                <>
                                    {/* Search Bar */}
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 text-black bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet  transition-all"
                                        />
                                    </div>
                                    <ContactList contacts={filterContacts(directMessagesContacts)} />
                                </>
                            ) : (
                                <div className="text-center text-gray-500 text-sm py-8">
                                    No Chats
                                </div>
                            )}
                        </div>
                    </Tab>
                    <Tab key="groups" title={
                        <span className="text-xs font-semibold tracking-wider uppercase">
                            GROUPS
                        </span>
                    }>
                        <div className="mt-2">
                            {channels && channels.length > 0 ? (
                                <>
                                    {/* Search Bar */}
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            value={searchTermGroup}
                                            onChange={(e) => setSearchTermGroup(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 text-black bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet  transition-all"
                                        />
                                    </div>
                                    <ContactList contacts={filterGroups(channels)} isChannel />
                                </>
                            ) : (
                                <div className="text-center text-gray-500 text-sm py-8">
                                    No groups
                                </div>
                            )}
                        </div>
                    </Tab>
                    <Tab key="public" title={
                        <span className="text-xs font-semibold tracking-wider uppercase">
                            CONTACT
                        </span>
                    }>
                        <div className="mt-2">
                            {allContacts && allContacts.length > 0 ? (
                                <>
                                    {/* Search Bar */}
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            value={searchAllContact}
                                            onChange={(e) => setsearchAllContact(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 text-black bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet  transition-all"
                                        />
                                    </div>
                                    <ContactList contacts={filterAll(allContacts)} />
                                </>
                            ) : (
                                <div className="text-center text-gray-500 text-sm py-8">
                                    No Contacts
                                </div>
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </div>

            {/* Spacer to push ProfileInfo to bottom */}
            <div className="flex-1"></div>

            <ProfileInfo />

            {/* Modals */}
            <NewDM isOpen={isNewDMOpen} onOpenChange={setIsNewDMOpen} />
            <CreateChannel isOpen={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen} />
        </motion.div>
    );
};

export default ContactsContainer;