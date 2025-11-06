import { ReviewService } from '@/lib/api/review.service';
import { hasCompletedTripWithDriver } from '@/lib/api/trips.service';
import { UpdateReviewRequest } from '@/lib/types/review.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const reviewKeys = {
    all: ['reviews'] as const,
    driver: (driverId: string) => [...reviewKeys.all, 'driver', driverId] as const,
    userRating: (driverId: string) => [...reviewKeys.all, 'rating', driverId] as const,
    userReview: (driverId: string, reviewerId: string) => [...reviewKeys.all, 'user', driverId, reviewerId] as const,
    tripCheck: (passengerId: string, driverId: string) => [...reviewKeys.all, 'trip-check', passengerId, driverId] as const,
};

export const useDriverReviews = (driverId: string) => {
    return useQuery({
        queryKey: reviewKeys.driver(driverId),
        queryFn: () => ReviewService.getDriverReviews(driverId),
        enabled: !!driverId,
    });
};

export const useDriverRating = (driverId: string) => {
    return useQuery({
        queryKey: reviewKeys.userRating(driverId),
        queryFn: () => ReviewService.getDriverRating(driverId),
        enabled: !!driverId,
    });
};

export const useUserReviewForDriver = (driverId: string, reviewerId: string) => {
    return useQuery({
        queryKey: reviewKeys.userReview(driverId, reviewerId),
        queryFn: () => ReviewService.getUserReviewForDriver(driverId, reviewerId),
        enabled: !!driverId && !!reviewerId,
    });
};

export const useHasCompletedTrip = (passengerId: string, driverId: string) => {
    return useQuery({
        queryKey: reviewKeys.tripCheck(passengerId, driverId),
        queryFn: () => hasCompletedTripWithDriver(passengerId, driverId),
        enabled: !!passengerId && !!driverId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useCreateReview = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ReviewService.createReview,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ 
                queryKey: reviewKeys.driver(variables.driverId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: reviewKeys.userRating(variables.driverId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: reviewKeys.userReview(variables.driverId, variables.reviewerId) 
            });
        },
    });
};

export const useUpdateReview = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ reviewId, data }: { reviewId: number; data: UpdateReviewRequest }) =>
            ReviewService.updateReview(reviewId, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ 
                queryKey: reviewKeys.driver(data.driverId) 
            });
            queryClient.invalidateQueries({ 
                queryKey: reviewKeys.userRating(data.driverId) 
            });
        },
    });
};

export const useDeleteReview = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ReviewService.deleteReview,
        onSuccess: (_, reviewId) => {
            queryClient.invalidateQueries({ 
                queryKey: reviewKeys.all 
            });
        },
    });
};