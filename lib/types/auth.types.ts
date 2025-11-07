export interface SigninPayload {
    email: string
    password: string
}

export interface SignupPayload {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    cinNumber: string
    password: string
    confirmPassword: string
    city: string
    address: string
    codePostal: string
}

export interface AuthResponse {
    accessToken: string
    refreshToken: string
}