import { AuthResponse, SigninPayload, SignupPayload } from "../types/auth.types"
import { IUser } from "../types/user.types"
import { api } from "./base/api"

export const AuthServive = {
    signin: (payload: SigninPayload): Promise<AuthResponse> => {
        return api.post<AuthResponse>('/auth/signin', payload).then(response => response.data)
    },
    signup: (payload: SignupPayload): Promise<any> => {
        return api.post<any>('/auth/signup', payload).then(response => response.data)
    },
    getCurrentUser: (): Promise<IUser> => {
        return api.get<IUser>('/auth/me').then(response => response.data)
    }
}