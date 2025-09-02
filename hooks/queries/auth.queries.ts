import { GET_CURRENT_USER } from "@/constants/query-keys.constants"
import { AuthServive } from "@/lib/api/auth.service"
import { useQuery } from "@tanstack/react-query"

export const useGetCurrentUser = () => {
    return useQuery({
        queryKey: [GET_CURRENT_USER],
        queryFn: AuthServive.getCurrentUser,
    })
}