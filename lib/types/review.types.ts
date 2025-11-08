export interface IReview {
  id: string;
  reviewer: {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  driver: {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  reviewerId: string;
  driverId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string;
}

export interface DriverRating {
  totalReviews: number;
  averageRating: number;
}