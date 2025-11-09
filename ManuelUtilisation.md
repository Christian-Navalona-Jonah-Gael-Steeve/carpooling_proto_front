# Application de Covoiturage - Manuel d'Utilisation

## Table des Matières
1. [Première Connexion](#première-connexion)
2. [Recherche de Trajets](#recherche-de-trajets)
3. [Proposer un Trajet](#proposer-un-trajet)
4. [Messagerie](#messagerie)
5. [Système d'Évaluation](#système-dévaluation)

---

## Première Connexion

### Écran de Connexion


![Aperçu de l'application](images/Connexion.jpg)

Interface d'authentification avec champs email et mot de passe

### Création de Compte
1. **Lancez l'application**
2. **Cliquez sur "S'inscrire"**
3. **Remplissez le formulaire :**

![Aperçu de l'application](images/1.jpg)
![Aperçu de l'application](images/2.jpg)
![Aperçu de l'application](images/3.jpg)
![Aperçu de l'application](images/4.jpg)
![Aperçu de l'application](images/5.jpg)
![Aperçu de l'application](images/6.jpg)
![Aperçu de l'application](images/7.jpg)

Formulaire d'inscription avec tous les champs requis

```json
{
  "email": "votre@email.com",
  "password": "votre_mot_de_passe",
  "firstName": "Votre Prénom",
  "lastName": "Votre Nom",
  "phoneNumber": "+33123456789",
  "cinNumber": "123456789012",
  "gender": "Votre genre",
  "justificatifUrl": "pièce justificatif",
  "city": "Votre ville",
  "codePostal": "Votre code postal",
  "address": "Votre adresse",
  "roles": ["PASSENGER"]
}
```

### Dashboard après Connexion

![Aperçu de l'application](images/8.jpg)

Écran d'accueil après connexion réussie avec navigation

---

## Recherche de Trajets

### Interface de Recherche

![Aperçu de l'application](images/9.jpg)

Écran de recherche avec carte et filtres

### Résultats de Recherche
![Aperçu de l'application](images/10.jpg)

Liste des trajets disponibles avec informations détaillées

## Proposer un Trajet

### Création de Trajet
![Aperçu de l'application](images/11.jpg)
Formulaire de création d'un nouveau trajet

---

## Messagerie

### Liste des Conversations
*Liste des conversations avec indicateurs de statut*

**Indicateurs visuels :**
- En ligne /  Hors ligne
- Statut des messages

### Interface de Chat
![Aperçu de l'application](images/12.jpg)
Interface de discussion en temps réel

### Envoi de Message
*Zone de saisie de message avec bouton d'envoi*

**Statuts des messages :**
- ✓ Envoyé (gris)
- ✓✓ Livré (gris)  
- ✓✓ Lu (bleu)

---

## Système d'Évaluation

### Interface d'Évaluation*
![Aperçu de l'application](images/12.jpg)

Écran de notation avec système d'étoiles

### Profil avec Notes
![Aperçu de l'application](images/9.jpg)
Page de profil affichant la note moyenne

**Informations affichées :**
- Note moyenne (ex: 4/5)
- Nombre total d'avis

---

## Support

### En Cas de Problème
1. **Vérifiez la connexion internet**
2. **Redémarrez l'application**

### Logs Techniques
- **Logs React Native** pour mobile
- **Endpoints de test** disponibles

---