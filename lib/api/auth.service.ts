import { AuthResponse, SigninPayload, SignupPayload } from "../types/auth.types"
import { IUser } from "../types/user.types"
import { api } from "./base/api"

export const AuthServive = {
    signin: async (payload: SigninPayload): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/signin', payload)
        return response.data
    },
    signup: async (payload: SignupPayload): Promise<any> => {
        const response = await api.post<any>('/auth/signup', payload)
        return response.data
    },
    getCurrentUser: async (): Promise<IUser> => {
        const response = await api.get<IUser>('/auth/me')
        return response.data
    }
}