import { USER_KEY } from "@/constants/query-keys.constants"
import { AuthServive } from "@/lib/api/auth.service"
import { useQuery } from "@tanstack/react-query"

export const useGetCurrentUser = () => {
    return useQuery({
        queryKey: [USER_KEY],
        queryFn: AuthServive.getCurrentUser,
    })
}