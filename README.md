# Mansa Vibes — l'atelier de couture, à la voix

Application mobile (PWA) pour les tailleurs et leurs clients : clients et mesures, commandes, encaissements,
suivi de production — et un **assistant vocal** qui remplit les formulaires à partir d'une note vocale.

```
backend/    Django 6 + DRF + JWT — API REST, assistant (Claude + Whisper local)
frontend/   Next.js 16 (App Router) + Tailwind v4 — mobile first, installable, hors ligne
deploy/     nginx interne du déploiement
```

Le code Laravel d'origine (racine du dépôt : `app/`, `routes/`, `resources/`…) reste comme référence
pendant la migration.

## Ce que l'application apporte

- **Assistant vocal** — « Nouvelle cliente Awa, 76 12 34 56, boubou bazin pour samedi, 45 000, acompte
  20 000 en Wave ». La note est transcrite sur le serveur (faster-whisper, rien ne part chez un tiers),
  comprise par Claude, puis affichée en **formulaires pré-remplis** (client, mesures, commande, paiement,
  statut, message WhatsApp) que l'utilisateur corrige et valide d'un tap. Rien n'est enregistré sans
  validation ; les droits du rôle (gérant / tailleur) s'appliquent à chaque action.
- **Aujourd'hui** — un seul écran : en retard, à livrer, prêtes à prévenir, encaissé du jour, reste à encaisser.
- **Une action, un tap** — « Marquer prête », « Encaisser », « Prévenir sur WhatsApp » depuis les listes.
- **Espace client sans compte** — chaque client a un lien privé `/suivi/<jeton>` (envoyé par WhatsApp) :
  avancement de sa tenue, reste à payer, ses mesures, contact de l'atelier. Lien révocable.
- **Commande express** en 3 étapes (client → tenue → prix et date), dictée possible des détails.
- **PWA** — installable sur l'écran d'accueil, fonctionne avec une connexion instable (dernières données
  consultées disponibles hors ligne), mode sombre automatique.

## Développement local (sans Docker)

```bash
# backend — SQLite automatiquement quand POSTGRES_DB n'est pas défini
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
cp .env.example .env
./.venv/Scripts/python.exe manage.py migrate
./.venv/Scripts/python.exe manage.py createsuperuser
./.venv/Scripts/python.exe manage.py runserver 8000

# frontend (autre terminal)
cd frontend
npm install
npm run dev            # http://localhost:3000, API sur http://127.0.0.1:8000/api/v1
```

Pour activer la compréhension des notes vocales, ajouter `ANTHROPIC_API_KEY=...` dans `backend/.env`.
Sans clé, l'application fonctionne normalement ; seule la compréhension des notes vocales est désactivée.
Le premier enregistrement télécharge le modèle Whisper (`WHISPER_MODEL`, `small` par défaut, environ 460 Mo).

Tests backend : `./.venv/Scripts/python.exe manage.py test apps`

## Production

Docker n'est utilisé que sur le serveur :

```bash
cp .env.prod.example .env.prod      # puis remplir les secrets
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

La pile (Postgres, Django/gunicorn, Next.js standalone, nginx interne) écoute sur `127.0.0.1:8500` ;
le nginx de l'hôte termine le HTTPS (Let's Encrypt) et redirige vers ce port.
