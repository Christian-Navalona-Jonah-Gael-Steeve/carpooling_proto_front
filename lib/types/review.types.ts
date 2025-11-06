export interface IReview {
    id: number;
    reviewerId: string;
    driverId: string;
    rating: number;
    comment?: string;
    createdAt: string;
    updatedAt: string;
    reviewer?: {
        uid: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface CreateReviewRequest {
    reviewerId: string;
    driverId: string;
    rating: number;
    comment?: string;
}

export interface UpdateReviewRequest {
    rating?: number;
    comment?: string;
}

export interface DriverRating {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}