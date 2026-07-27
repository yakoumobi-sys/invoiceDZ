# invoicedz · Mise à jour majeure

## Ce qui change

**Identité & accueil**
- Nouvelle page d'accueil en français, aux couleurs de votre logo (vert sapin + vert feuille), avec une facture animée qui se remplit toute seule, les fonctionnalités, une FAQ honnête et un positionnement clair : **100 % gratuit, illimité**.
- Logo intégré partout (`public/logo.jpg`) + favicon (`app/icon.png`).

**Création de documents (`/nouveau`)**
- Numérotation automatique séquentielle par type et par année (FAC-2026-0001, DEV-2026-0001…), modifiable.
- Sélecteur de client depuis le répertoire + case « Ajouter ce client à mon répertoire ».
- Catalogue produits : tapez une désignation connue, le prix, l'unité et la TVA se remplissent seuls.
- Mode de paiement ; en **Espèces**, le **droit de timbre** est calculé selon le barème de la loi de finances 2025 (1 % / 1,5 % / 2 %, min 5 DA, arrondi au dinar supérieur) et ajouté au net à payer.
- **Montant en toutes lettres** généré automatiquement (« Arrêté le présent document à la somme de… »).
- Modification d'un document existant via `/nouveau?id=…`.
- Export PDF sans fenêtre popup (impression directe du document, compatible mobile).

**Tableau de bord (`/dashboard`)**
- Statistiques : CA facturé, encaissé, en attente, nombre de documents + graphique du CA sur 12 mois.
- Filtres par type, statut et recherche.
- Menu d'actions par document : voir, modifier, dupliquer, **convertir** (devis → facture, proforma → facture, BC → facture/BL, facture → BL), **enregistrer un paiement** (statut Partiel/Payé automatique, solde restant), supprimer.

**Nouvelles pages**
- `/clients` — CRM simple : coordonnées, notes, CA et impayés par client, historique des documents.
- `/produits` — catalogue produits & services.
- `/parametres` — profil entreprise (RC, NIF, AI, NIS…), logo, valeurs par défaut.

**Mode invité**
- Tout fonctionne **sans compte** : les données restent sur l'appareil (localStorage). Après connexion, un bouton importe les documents invités dans le compte.

**Sécurité**
- En-têtes HTTP sur toutes les pages (`next.config.js`) : Content-Security-Policy (scripts et styles du site uniquement, connexions limitées à Supabase), X-Frame-Options DENY (anti-clickjacking), nosniff, Referrer-Policy, Permissions-Policy.
- Ancienne fenêtre popup d'impression supprimée : elle injectait du HTML non échappé (risque XSS) — l'export PDF passe désormais par l'impression directe du document.
- `supabase/schema.sql` active la sécurité ligne par ligne (RLS) sur documents, clients et produits : chaque compte ne voit que ses propres données. **À exécuter une fois** (voir plus bas) — la clé « anon » du site est publique par conception, c'est la RLS qui protège les données.
- React échappe automatiquement toutes les saisies (noms, notes…) ; données invité stockées uniquement sur l'appareil ; logos redimensionnés côté client.

**Tests**
- `npm test` : 86 tests (montant en lettres, timbre, totaux, numérotation, conversions, CRUD invité, rendu du document).

## Déployer

```bash
git add -A
git commit -m "v2 : refonte verte, CRM, catalogue, timbre, montant en lettres, mode invité"
git push
```
Vercel redéploie automatiquement. Aucune variable d'environnement à ajouter.

## Facultatif : synchroniser clients & produits dans le cloud

Sans cette étape, clients et produits restent enregistrés sur l'appareil (les documents, eux, sont déjà dans Supabase pour les comptes connectés).

1. Ouvrez **Supabase → SQL Editor**.
2. Collez le contenu de `supabase/schema.sql` et cliquez **Run**.
3. Dans le site : **Paramètres → Réessayer**.

Ce script active aussi la sécurité ligne par ligne (RLS) : chaque utilisateur ne voit que ses propres données.
