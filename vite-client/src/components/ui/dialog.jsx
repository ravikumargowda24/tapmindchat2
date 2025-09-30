import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";

export const Dialog = Modal;
export const DialogContent = ModalContent;
export const DialogHeader = ModalHeader;
export const DialogBody = ModalBody;
export const DialogTitle = ({ children }) => <h3>{children}</h3>;
export const DialogDescription = ({ children }) => <p>{children}</p>;