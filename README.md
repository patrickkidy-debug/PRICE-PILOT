# Price Pilot

Assistant d'achat qui **cherche les prix en temps réel sur le web**. L'utilisateur
décrit ce qu'il veut acheter ; l'IA interroge les sites marchands, lit les vraies
pages produit, compare, et renvoie le meilleur plan avec le lien pour acheter et
les sources citées. La localisation est **détectée automatiquement** — aucun
sélecteur de pays à remplir.

## État actuel

- **Recherche web réelle.** L'assistant tourne sur Claude (`lib/ai/`,
  `ANTHROPIC_API_KEY`) et interroge le web via `lib/search/webSearch.ts`.
  Trois fournisseurs interchangeables selon les clés présentes :
  Tavily (1000 recherches/mois offertes) → Google Programmable Search
  (100/jour offertes) → DuckDuckGo (bloque les robots, dépannage seulement).
  Les réponses listent les pages réellement consultées.
  Choix de coût délibéré : l'outil de recherche web intégré d'Anthropic coûte
  10 $ / 1000 recherches, alors que Tavily les couvre gratuitement — on ne paie
  donc que les tokens Claude. Modèle réglé dans `lib/ai/assistant.ts`
  (`claude-opus-5` ; `claude-haiku-4-5` divise la facture par cinq).
- **Quota gratuit épuisé** : l'utilisateur voit un message explicite l'invitant
  à réessayer le lendemain — jamais de bascule silencieuse vers du payant.
- **Localisation automatique** (`lib/geolocation.ts`) : en-têtes de l'hébergeur
  (Vercel/Cloudflare) en production, fuseau horaire du navigateur en repli. Si
  aucune source ne conclut, le pays reste `null` — jamais deviné.
- **Base locale complémentaire** : l'assistant interroge aussi la base PricePilot,
  qui contient les prix de petits commerçants signalés via `/contribuer` et
  introuvables en ligne.
- Multi-devises (`lib/money.ts`) sans conversion : sans taux de change fiable,
  les prix restent dans leur devise d'origine.
- Paliers tarifaires avec restrictions appliquées côté serveur (`lib/quota.ts`).
  Paiement en ligne non intégré : modèle de données prêt, seam Stripe en place.
- Interface en thème sombre.

## Démarrage local

1. Copier `.env.example` en `.env` et renseigner `DATABASE_URL` / `DIRECT_URL`
   (base Postgres Neon recommandée) ainsi que `AUTH_SECRET` (générer avec
   `npx auth secret`).
2. Installer les dépendances :
   ```
   npm install
   ```
3. Appliquer le schéma et activer l'extension `pg_trgm` (nécessaire à la
   recherche floue) :
   ```
   npx prisma migrate dev --name init
   ```
   Si l'extension `pg_trgm` n'est pas activée automatiquement par la base
   (selon l'hébergeur), exécuter manuellement :
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE INDEX product_normalized_name_trgm_idx ON "Product" USING GIN ("normalizedName" gin_trgm_ops);
   ```
4. Peupler les données de démonstration :
   ```
   npm run prisma:seed
   ```
5. Lancer le serveur de développement :
   ```
   npm run dev
   ```
6. Lancer les tests unitaires :
   ```
   npm test
   ```

## Prochaines étapes (hors périmètre de cette itération)

- Slice 2 : premier scraper réel (Auchan ou Kirene), matching produit,
  exécution planifiée via GitHub Actions.
- Slice 3 : intégration paiement réelle (Stripe ou gateway local) branchée
  sur le modèle `Subscription` déjà en place.
- Slice 4 : alertes de prix (notifications par email).
- Phase 2 : couverture des petites boutiques/marchés informels via
  soumission communautaire de prix (`ObservationSource.USER_SUBMITTED`,
  déjà réservé dans le schéma).
