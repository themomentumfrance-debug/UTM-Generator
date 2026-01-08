# Project TODO - Générateur de Liens UTM

## Base de données et schéma
- [x] Créer table socials (id, nom)
- [x] Créer table content_types (id, nom)
- [x] Créer table objectives (id, nom)
- [x] Créer table channels (id, nom, lien)
- [x] Créer table utm_links avec toutes les relations
- [x] Créer table publication_images pour les visuels S3
- [x] Pousser les migrations vers la base de données

## Backend - Routes tRPC
- [x] CRUD socials avec ajout dynamique
- [x] CRUD content_types avec ajout dynamique
- [x] CRUD objectives avec ajout dynamique
- [x] CRUD channels avec ajout dynamique
- [x] CRUD utm_links avec génération automatique UTM
- [x] Route pour upload d'images vers S3
- [x] Route pour synchronisation Google Drive (export CSV côté client)
- [x] Route pour suggestions LLM

## Frontend - Interface utilisateur
- [x] Layout dashboard professionnel
- [x] Formulaire de création UTM avec menus déroulants dynamiques
- [x] Option "Autre" pour ajouter nouvelles valeurs aux menus
- [x] Champs texte libre (destination, canal, angle, hook, audience, budget)
- [x] Génération automatique du lien UTM
- [x] Interface de visualisation des liens générés
- [x] Bouton copier le lien UTM
- [x] Upload de visuels/captures d'écran

## Intégrations
- [x] Intégration Google Drive pour export des données (export CSV)
- [x] Upload S3 pour les visuels
- [x] Intégration LLM pour suggestions d'optimisation

## Tests
- [x] Tests unitaires pour les routes tRPC
- [x] Validation du formulaire
- [x] Test de génération UTM

## Bugs à corriger
- [x] Erreurs tRPC retournant HTML au lieu de JSON (routes non trouvées) - Résolu après redémarrage serveur

## Tableau de bord analytique
- [x] Créer composant AnalyticsDashboard avec graphiques
- [x] Graphique par réseau social (répartition des liens)
- [x] Graphique par type de contenu
- [x] Graphique par objectif
- [x] Graphique d'évolution temporelle des liens créés
- [x] Statistiques globales (total liens, réseaux utilisés, etc.)
- [x] Intégrer le tableau de bord dans l'interface principale

## Mise à jour majeure - Améliorations métier

### 1. Paramètres UTM (génération automatique)
- [x] Masquer les champs UTM de l'interface utilisateur
- [x] Générer automatiquement utm_source depuis le réseau social
- [x] Générer automatiquement utm_medium depuis le type de contenu
- [x] Générer automatiquement utm_campaign depuis l'objectif (slugifié)
- [x] Générer automatiquement utm_content depuis le hook/angle (slugifié)
- [x] Générer automatiquement utm_term depuis l'audience ciblée
- [x] Afficher le lien UTM final en lecture seule avec bouton copie

### 2. Nettoyage des données
- [x] Supprimer les entrées contenant "Test" de la base de données
- [x] Nettoyer les données de test existantes

### 3. Réseaux sociaux et plateformes publicitaires
- [x] Ajouter tous les réseaux sociaux requis (YouTube, YouTube Ads, Facebook, Instagram, WhatsApp, Meta Ads, TikTok, TikTok for Business, X, X Ads, Snapchat, Snapchat Ads, LinkedIn, LinkedIn Ads, Pinterest, Pinterest Ads, Google Ads, Apple Search Ads)
- [x] Grouper les réseaux par plateforme logique dans les menus

### 4. Affichage du lien UTM généré
- [x] Afficher le lien UTM immédiatement après génération sur le dashboard
- [x] Ajouter bouton "Copier le lien" visible

### 5. Filtres section "Mes liens"
- [x] Filtre par réseau social
- [x] Filtre par type de contenu
- [x] Filtre par objectif

### 6. Filtres section "Statistiques"
- [x] Filtre par réseau social
- [x] Filtre par type de contenu
- [x] Filtre par objectif

### 7. Raccourcisseur de liens interne
- [x] Ajouter champ slug et shortUrl dans le schéma de base de données
- [x] Générer automatiquement un slug unique pour chaque lien
- [x] Créer route de redirection pour les liens courts
- [x] Afficher lien UTM complet ET lien raccourci
- [x] Boutons de copie pour les deux liens

### 8. Assistant IA - améliorations UX
- [x] Corriger l'affichage de la fenêtre modale
- [x] Rendre la fenêtre redimensionnable ou plein écran
- [x] Ajouter bouton de réinitialisation
- [x] Améliorer le design avec thème amber/or
- [x] Ajouter animation de chargement améliorée
- [ ] Permettre l'analyse des angles marketing, hooks, objectifs
- [ ] Permettre l'analyse des performances par réseau/type/objectif

## Améliorations v3 - Janvier 2026

### 1. Audience ciblée
- [x] Ajouter "Étudiants" dans les options d'audience
- [x] Ajouter "Salariés" dans les options d'audience
- [x] Remplacer "entrepreneur débutant" par "entrepreneur"

### 2. Suggestions IA - affichage amélioré
- [x] Affichage format plus grand et lisible
- [x] Fenêtre persistante à l'écran (panneau flottant en bas à droite)
- [x] Possibilité de fermer et réouvrir la fenêtre
- [x] Possibilité de minimiser/agrandir le panneau

### 3. Liens raccourcis - optimisation
- [x] Générer des slugs plus courts (5 caractères au lieu de 8, style Bitly)
- [x] Afficher le lien avec https:// grisé et domaine+slug en gras
- [x] Rendre les liens facilement identifiables et mémorisables

### 4. Nettoyage final des données de test
- [x] Supprimer toutes les entrées contenant "Test" de la base
- [x] Nettoyer tous les menus déroulants
- [x] Vérifier qu'aucune donnée de test n'apparaît dans l'application

## Améliorations UI/UX v4 - Janvier 2026

### 1. Hiérarchie visuelle réseaux sociaux
- [x] Titres de groupes en couleur différente (bleu) non cliquables
- [x] Plateformes cliquables avec style standard

### 2. Restructuration plateformes Meta
- [x] Supprimer "Meta Ads" générique
- [x] Ajouter Facebook Ads sous Facebook
- [x] Ajouter Instagram Ads sous Instagram
- [x] Ajouter WhatsApp Ads sous WhatsApp
- [x] Ajouter Threads et Threads Ads
- [x] Chaque plateforme avec ID unique

### 3. Bulles d'aide contextuelle
- [x] Ajouter icône info pour "Nom du canal/chaîne"
- [x] Ajouter icône info pour "Lien du canal/chaîne"
- [x] Message explicatif sur le support de publication

### 4. Types de contenu
- [x] Supprimer "Carrousel"
- [x] Ajouter "Visuel" pour contenu statique


## Améliorations Architecture v5 - Janvier 2026

### 1. Isolation des données par utilisateur
- [x] Ajouter champ userId dans table utm_links
- [x] Ajouter champ userId dans table channels
- [x] Ajouter champ userId dans table audiences
- [x] Filtrer toutes les requêtes par userId pour utilisateurs standards
- [x] Utilisateur ne voit QUE ses propres données

### 2. Rôle administrateur
- [x] Implémenter vérification du rôle admin dans les routes
- [x] Admin voit toutes les données de tous les utilisateurs
- [x] Admin peut filtrer par utilisateur
- [x] Vue globale réservée à l'admin

### 3. Export CSV amélioré
- [x] Inclure userId dans l'export
- [x] Inclure nom utilisateur dans l'export
- [x] Inclure email utilisateur dans l'export
- [x] Structurer colonnes pour lecture claire par utilisateur
### 4. Tracking de clics type Bitly
- [x] Créer table click_events (utmLinkId, clickedAt, country, city, device, browser, os, referer, userAgent, ipAddress)
- [x] Ajouter champ clickCount dans utm_links
- [x] Implémenter route de redirection avec enregistrement du clic
- [x] Géolocalisation via IP (pays, ville)
- [x] Détection appareil (mobile, desktop, tablette)
- [x] Détection navigateur

### 5. Interface de rapports détaillés
- [x] Créer composant StatsDialog pour chaque lien
- [x] Afficher nombre total de clics
- [x] Afficher répartition par pays
- [x] Afficher répartition par appareil
- [x] Afficher répartition par navigateur
- [x] Afficher chronologie des clics
- [x] Filtres par date, plateforme
- [x] Admin: filtre par utilisateur

### 6. Nettoyage final
- [x] Supprimer toutes les données contenant "Test" (aucune trouvée)
- [x] Nettoyer tables utilisateurs, liens, contenus, audiences
- [x] Vérifier aucune donnée de test ne subsiste


## Améliorations v6 - Janvier 2026

### 1. Nettoyage des données
- [x] Supprimer "Meta Ads" de la section réseau social
- [x] Supprimer "X" de la section réseau social
- [x] Supprimer "Carrousel" du type de contenu
- [x] Supprimer "entrepreneur débutant" de l'audience ciblée

### 2. Filtres admin
- [x] Ajouter filtre par utilisateur dans "Mes liens" pour admin

### 3. Lien raccourci
- [x] Ajouter bouton de redirection pour ouvrir le lien court dans une nouvelle page

### 4. Statistiques de clics
- [x] Afficher spécifiquement le type d'appareil dans Vue d'ensemble
- [x] Enlever le système d'exploitation de Vue d'ensemble

### 5. Filtre par période
- [x] Ajouter filtre par période (date) avec calendrier
- [x] Permettre de sélectionner une plage de dates (ex: 05/12/2025-05/01/2026)

### 6. Optimisation visuelle
- [x] Optimiser les couleurs pour un aspect professionnel (palette slate)
- [x] Améliorer les textes et l'affichage général


## Corrections affichage v6.1 - Janvier 2026

### StatsDialog
- [x] Centrer les textes en vue maximale
- [x] Corriger les textes qui sortent de leur case
- [x] Améliorer la visibilité dans Vue d'ensemble, Géographie, Appareils, Chronologie

### AnalyticsDashboard
- [x] Corriger la lisibilité du diagramme circulaire "Clics par réseau social" (remplacé par graphique en barres)
- [x] S'assurer que tous les textes sont lisibles
