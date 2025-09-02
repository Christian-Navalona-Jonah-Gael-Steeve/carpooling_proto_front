import { AuthServive } from "@/lib/api/auth.service"
import { useMutation } from "@tanstack/react-query"

export const useSigninMutation = () => {
    return useMutation({
        mutationFn: AuthServive.signin
    })
}

export const useSignupMutation = () => {
    return useMutation({
        mutationFn: AuthServive.signup
    })
}