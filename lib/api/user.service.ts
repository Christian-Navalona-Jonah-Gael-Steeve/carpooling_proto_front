import { IUser } from "../types/user.types";
import { api } from "./base/api";

export const UserService = {
    /**
     * Get user by ID
     */
    getUserById: async (userId: string): Promise<IUser> => {
        const response = await api.get<IUser>(`/users/${userId}`);
        return response.data;
    }
};
