# Gimarry — Confeitaria (frontend + backend)

Monorepo com deploys independentes para Hostinger compartilhada (PHP 8 + MySQL opcional).

## Estrutura

```text
frontend/          → site estático (HTML/CSS/JS modular)
  public/          → conteúdo de public_html
  src/             → módulos ES (shared, site, admin)
backend/           → API REST Clean Architecture
  public/          → entrypoint HTTP
  src/Domain|Application|Infrastructure|Interfaces
  database/        → schema.sql + seed
docs/              → deploy Hostinger
```

## Desenvolvimento

```bash
# Sincronizar módulos JS para public/
cd frontend && npm run sync
```

- Frontend: sirva `frontend/public` (Live Server / qualquer static server).
- Backend: aponte o document root da API para `backend/public` (ou use o fluxo Hostinger em `docs/deploy-hostinger.md`).

`API_BASE_URL` padrão: `origin/api` — sobrescreva com `window.__API_BASE_URL` se preciso.

## API (resumo)

| Método | Rota | Auth |
|--------|------|------|
| GET | `/catalog` | público |
| POST | `/orders` | público |
| POST | `/auth/login` | — |
| GET/POST/PUT/DELETE | `/orders`, `/products`, `/categories`, `/clients`, `/settings` | admin |
| GET | `/finance/summary` | admin |

## Admin

- URL: `/admin/login.html`
- Padrão: `admin@sthevandev.com.br` / `admin123`

## Deploy

Veja [docs/deploy-hostinger.md](docs/deploy-hostinger.md).
