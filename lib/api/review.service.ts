import { CreateReviewRequest, DriverRating, IReview, UpdateReviewRequest } from '@/lib/types/review.types';

export class ReviewService {
static async createReview(data: CreateReviewRequest): Promise<IReview> {
    try {
        const response = await fetch('http://10.78.221.229:8080/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        // NE PAS utiliser response.text() ET response.json()
        // Choisir une seule méthode pour lire la réponse
        const responseText = await response.text();
        
        if (!response.ok) {
            let errorMessage = 'Erreur lors de la création de l\'avis';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch {
                errorMessage = responseText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        // Parser la réponse seulement si elle n'est pas vide
        if (responseText) {
            return JSON.parse(responseText);
        } else {
            throw new Error('Réponse vide du serveur');
        }
    } catch (error) {
        console.error('Erreur ReviewService.createReview:', error);
        throw error;
    }
}

static async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<IReview> {
    try {
        const response = await fetch(`http://10.78.221.229:8080/api/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
            let errorMessage = 'Erreur lors de la modification de l\'avis';
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch {
                errorMessage = responseText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        if (responseText) {
            return JSON.parse(responseText);
        } else {
            throw new Error('Réponse vide du serveur');
        }
    } catch (error) {
        console.error('Erreur ReviewService.updateReview:', error);
        throw error;
    }
}
    static async getDriverReviews(driverId: string): Promise<IReview[]> {
        try {
            const response = await fetch(`http://10.78.221.229:8080/api/reviews/driver/${driverId}`);
            
            if (!response.ok) {
                return []; // Tableau vide sans erreur
            }
            
            return await response.json();
        } catch (error) {
            return []; // Tableau vide sans erreur
        }
    }

    static async getDriverRating(driverId: string): Promise<DriverRating> {
        try {
            const response = await fetch(`http://10.78.221.229:8080/api/reviews/user/${driverId}/rating`);
            
            if (!response.ok) {
                // Retourner des valeurs par défaut sans logger d'erreur
                return {
                    totalReviews: 0,
                    averageRating: 0
                };
            }
            
            const data = await response.json();
            return {
                totalReviews: data.totalReviews || 0,
                averageRating: data.averageRating || 0
            };
        } catch (error) {
            // Ne pas logger l'erreur pour éviter de polluer la console
            return {
                totalReviews: 0,
                averageRating: 0
            };
        }
    }

    static async getUserReviewForDriver(driverId: string, reviewerId: string): Promise<IReview | null> {
        try {
            const response = await fetch(`http://10.78.221.229:8080/api/reviews/driver/${driverId}/reviewer/${reviewerId}`);
            
            if (!response.ok) {
                return null;
            }
            
            return await response.json();
        } catch {
            return null;
        }
    }
}