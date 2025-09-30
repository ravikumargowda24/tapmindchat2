import { useAppStore } from "@/store";
import apiClient from "@/lib/api-client";
import { HOST, LOGOUT_ROUTE } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { FiEdit2 } from "react-icons/fi";
import { IoPowerSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getColor } from "@/lib/utils";

const ProfileInfo = () => {
    const { userInfo, setUserInfo } = useAppStore();
    const navigate = useNavigate();

    const logout = async () => {
        try {
            const response = await apiClient.post(
                LOGOUT_ROUTE,
                {},
                { withCredentials: true }
            );
            if (response.status === 200) {
                navigate("/auth");
                setUserInfo(undefined);
            }
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="absolute bottom-0 h-16 flex items-center justify-between px-6 w-full bg-white shadow-md border-t border-gray-200">
            <div className="flex gap-3 items-center">
                <div className="w-12 h-12 relative">
                    <Avatar className="w-12 h-12 rounded-full overflow-hidden border border-gray-300">
                        {userInfo.image ? (
                            <Avatar
                                src={`${HOST}/${userInfo.image}`}
                                alt="profile"
                                className="object-cover w-full h-full rounded-full"
                            />
                        ) : (
                            <div
                                className={`uppercase w-12 h-12 text-lg border border-gray-300 ${getColor(
                                    userInfo.color
                                )} flex items-center justify-center rounded-full`}
                            >
                                {userInfo.firstName
                                    ? userInfo.firstName[0]
                                    : userInfo.email[0]}
                            </div>
                        )}
                    </Avatar>
                </div>
                <div className="text-gray-800 font-medium">
                    {userInfo.firstName && userInfo.lastName
                        ? `${userInfo.firstName} ${userInfo.lastName}`
                        : ""}
                </div>
            </div>
            <div className="flex gap-4">
                <Tooltip content="Edit Profile">
                    <FiEdit2
                        className="text-blue-500 text-xl cursor-pointer hover:text-blue-700 transition"
                        onClick={() => navigate("/profile")}
                    />
                </Tooltip>
                <Tooltip content="Logout">
                    <IoPowerSharp
                        className="text-red-500 text-xl cursor-pointer hover:text-red-700 transition"
                        onClick={logout}
                    />
                </Tooltip>
            </div>
        </div>
    );
};

export default ProfileInfo;
