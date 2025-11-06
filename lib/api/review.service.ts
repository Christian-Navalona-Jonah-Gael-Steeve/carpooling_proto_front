import {
    CreateReviewRequest,
    DriverRating,
    IReview,
    UpdateReviewRequest
} from "../types/review.types";
import { api } from "./base/api";

export const ReviewService = {
    createReview: async (payload: CreateReviewRequest): Promise<IReview> => {
        const response = await api.post<IReview>('/reviews', payload);
        return response.data;
    },

    updateReview: async (reviewId: number, payload: UpdateReviewRequest): Promise<IReview> => {
        const response = await api.put<IReview>(`/reviews/${reviewId}`, payload);
        return response.data;
    },

    deleteReview: async (reviewId: number): Promise<void> => {
        await api.delete(`/reviews/${reviewId}`);
    },

    getDriverReviews: async (driverId: string): Promise<IReview[]> => {
        const response = await api.get<IReview[]>(`/reviews/user/${driverId}`);
        return response.data;
    },

    getDriverRating: async (driverId: string): Promise<DriverRating> => {
        const response = await api.get<DriverRating>(`/reviews/user/${driverId}/rating`);
        return response.data;
    },

    getUserReviewForDriver: async (driverId: string, reviewerId: string): Promise<IReview | null> => {
        const response = await api.get<IReview>(`/reviews/user/${driverId}/reviewer/${reviewerId}`);
        return response.data;
    }
};