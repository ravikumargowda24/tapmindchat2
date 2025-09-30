import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import animationData from "@/assets/lottie-json";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const colors = [
    "bg-avatar-pink/30 text-avatar-pink border border-avatar-pink/70",
    "bg-avatar-yellow/15 text-avatar-yellow border border-avatar-yellow/70",
    "bg-avatar-green/15 text-avatar-green border border-avatar-green/70",
    "bg-avatar-blue/15 text-avatar-blue border border-avatar-blue/70",
];

export const getColor = (color) => {
    if (color >= 0 && color < colors.length) {
        return colors[color];
    }
    return colors[0]; // Fallback to the first color if out of range
};

export const animationDefaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
    },
};