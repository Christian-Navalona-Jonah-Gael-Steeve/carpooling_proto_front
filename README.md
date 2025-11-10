# Application de Covoiturage

## Présentation

Ce projet a été réalisé dans le cadre du **Projet d'Innovation (TPI)** du **Master 2 MIAGE – parcours MBDS**.
Il s'agit d'une **application mobile de covoiturage** visant à faciliter le partage de trajets entre particuliers, en mettant l'accent sur la **simplicité, la sécurité** et l'**expérience utilisateur en temps réel**.

## Fonctionnalités principales

- **Inscription utilisateur complète** : Upload de photo de profil et de justificatifs (CIN/Passeport/Permis/Carte étudiant), avec envoi de mail de confirmation pour la validation du compte
- **Connexion utilisateur** : Authentification sécurisée via Firebase Authentication
- **Covoiturage planifié et non planifié** : Recherche rapide de covoiturage adapté à votre itinéraire et à votre horaire, avec notifications des trajets à proximité
- **Messagerie instantanée P2P** : Communication décentralisée en peer-to-peer entre conducteur et passager une fois mis en relation
- **Intégration de l'API Google Maps** : Définition et visualisation des trajets sur la carte avec géolocalisation en temps réel
- **Communication en temps réel P2P** : Appels audio et vidéo directs via WebRTC

## Technologies utilisées

### Backend
- **Spring Boot** : Framework Java pour créer des applications robustes et scalables
- **PostgreSQL + PostGIS** : Base de données relationnelle avec extension géospatiale pour la gestion des données de localisation

### Frontend
- **React Native** : Framework JavaScript pour créer une application mobile multiplateforme (iOS et Android)
- **Expo** : Plateforme pour faciliter le développement et le déploiement d'applications React Native

### Services & APIs
- **Firebase Authentication** : Service d'authentification sécurisé pour la gestion des utilisateurs
- **Google Maps API** : API de cartographie pour le suivi des trajets et la navigation
- **WebRTC** : Technologie de communication pair-à-pair pour les appels audio/vidéo en temps réel

## Démarche et mise en place

### Pré-requis

- [Node.js](https://nodejs.org/) (version LTS recommandée)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Un émulateur Android/iOS ou un appareil physique

### Lancement de l'application

1. Cloner le projet frontend:
   ```bash
   git clone https://github.com/Christian-Navalona-Jonah-Gael-Steeve/carpooling_proto_front.git
   ```
2. Cloner, configurer et lancer le projet backend sur [https://github.com/Christian-Navalona-Jonah-Gael-Steeve/carpooling_app_api.git](https://github.com/Christian-Navalona-Jonah-Gael-Steeve/carpooling_app_api.git)

3. Installer les dépendances :
   ```bash
   npm install
   ```

4. Configurer les variables d'environnement :
   - Créer un fichier `.env` à la racine du projet
   - Ajouter l'URL de l'API
      - Utiliser l'addresse IP pour lancer sur mobile

5. Connecter un ou plusieurs émulateurs ou appareils physiques :
   - Pour tester les fonctionnalités de communication P2P, il est recommandé d'avoir au moins deux instances de l'application en cours d'exécution

6. Connecter tout sur le même réseau

7. Lancer l'application :
   - Expo
   ```bash
   npx expo start
   ```
   - Android parce que Expo ne supporte pas WebRTC: appel audio/vidéo
   ```bash
   npx expo run:android
   ```
### Branche principale

La branche par défaut pour ce projet est `main`. Toutes les contributions doivent être basées sur cette branche.

## Documentation

Pour plus d'informations sur le développement :

- [Documentation React Native](https://reactnative.dev/docs/getting-started)
- [Documentation Expo](https://docs.expo.dev/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [WebRTC Documentation](https://webrtc.org/)

## Contribution

Ce projet est développé dans le cadre académique de l'Université Côte d'Azur (MIAGE MBDS).
