import { USER_BY_ID_KEY, USER_KEY } from "@/constants/query-keys.constants"
import { UserService } from "@/lib/api/user.service"
import { useQuery } from "@tanstack/react-query"

export const useGetUserById = (userId: string | null | undefined) => {
    return useQuery({
        queryKey: [USER_KEY, USER_BY_ID_KEY, userId],
        queryFn: async () => UserService.getUserById(userId!),
        enabled: !!userId,
    })
}