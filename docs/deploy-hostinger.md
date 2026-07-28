# Deploy Hostinger — frontend e backend separados

## Visão geral

| Pacote | Origem local | Destino Hostinger |
|--------|--------------|-------------------|
| **Frontend** | `frontend/public/` | `public_html/` |
| **Backend** | `backend/public/` + `backend/src/` + `backend/config/` + `backend/storage/` + `backend/database/` | `public_html/api/` (ou subdomínio `api.`) |

A API e o site podem ficar no **mesmo domínio** (`https://gimarrybolos.com.br` + `/api`), o que simplifica cookies de sessão e CORS.

## 1. Banco (opcional nesta fase)

O backend sobe com **`DB_DRIVER=json`** (arquivo em `storage/data.json`) — funciona em hosting compartilhada sem MySQL.

Quando quiser MySQL:

1. Crie o banco no hPanel — já criado: `u586160337_gimarrybolos`.
2. No phpMyAdmin, selecione esse banco e importe `backend/database/hostinger.sql` (schema + seed).
3. Copie `config/.env.example` → `config/.env` e preencha:
   ```env
   DB_DRIVER=mysql
   DB_HOST=localhost
   DB_NAME=u586160337_gimarrybolos
   DB_USER=u586160337_gimarrybolos
   DB_PASS=senha_do_hpanel
   ```
4. (Alternativa API legada) copie `api/config.local.example.php` → `api/config.local.php` com a mesma senha.

## 2. Upload do backend

Estrutura sugerida em `public_html/api/` (tudo no mesmo nível — o `index.php` detecta `src/` ao lado):

```text
api/
├── index.php          ← de backend/public/index.php
├── autoload.php       ← de backend/public/autoload.php
├── .htaccess          ← de backend/public/.htaccess
├── src/               ← backend/src/
├── config/
│   └── .env           ← criado a partir de .env.example
├── storage/           ← gravável (chmod 755/775); data.json nasce sozinho
└── database/          ← schema + seed-catalog.json
```

Passos:

1. Envie os arquivos acima via File Manager ou FTP.
2. Crie `config/.env` com:

```env
DB_DRIVER=json
APP_URL=https://gimarrybolos.com.br
CORS_ORIGIN=https://gimarrybolos.com.br
```

3. Garanta que `storage/` seja gravável pelo PHP.
4. Teste: `https://gimarrybolos.com.br/api/` → JSON `{ "ok": true, ... }`
5. Teste: `https://gimarrybolos.com.br/api/catalog` → catálogo

## 3. Upload do frontend

1. Envie **todo o conteúdo** de `frontend/public/` para `public_html/` (não para uma subpasta).
2. Confirme `js/shared/`, `js/site/`, `js/admin/` no servidor.
3. Ajuste se necessário: no console, `window.__API_BASE_URL = 'https://gimarrybolos.com.br/api'` antes dos módulos (só se a API estiver em outro host).

Por padrão `config.js` usa `${location.origin}/api`.

## 4. CORS e cookies

- `CORS_ORIGIN` deve listar só o domínio do site (ex.: `https://gimarrybolos.com.br`).
- Login admin usa **sessão PHP** (cookie HttpOnly) + token em `sessionStorage` (`X-Admin-Token`).
- Frontend chama a API com `credentials: 'include'`.

Se a API for subdomínio (`api.gimarrybolos.com.br`), configure CORS e cookies `SameSite=None; Secure` no PHP (ajuste `SessionAuth`).

## 5. Conta admin padrão

- E-mail: `admin@sthevandev.com.br`
- Senha: `admin123`  
**Troque no painel** após o primeiro login.

Pedidos e clientes começam **vazios**; o catálogo vem do seed JSON.

## 6. Smoke test

- [ ] Site abre e o loader some
- [ ] Cardápio carrega produtos da API
- [ ] Pedido público com nome + sobrenome + WhatsApp cria registro (`POST /orders`)
- [ ] Login em `/admin/login.html`
- [ ] Pedidos aparecem no dashboard
- [ ] Finalizar pedido exige nome completo + WhatsApp
- [ ] Financeiro conta só status `finalizado`
- [ ] Segundo celular/navegador vê os mesmos dados (sem localStorage como fonte)

## 7. Segurança

- Não exponha `config/.env`, `src/`, `storage/` — o `.htaccess` da pasta `public` já bloqueia caminhos sensíveis se a estrutura estiver correta.
- Remova `api/data.json` legado se ainda existir do sync antigo.
- Altere a senha admin imediatamente em produção.
