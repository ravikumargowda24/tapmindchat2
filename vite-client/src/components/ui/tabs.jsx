import { Tabs as HeroTabs, Tab as HeroTab } from "@heroui/react";

export const Tabs = HeroTabs;
export const TabsContent = HeroTab;
export const TabsList = ({ children }) => children; // HeroUI handles this differently
export const TabsTrigger = HeroTab;