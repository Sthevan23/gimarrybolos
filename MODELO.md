# Site modelo — padrão Aurora / Gimarry

Demonstração pronta para **anunciar** e para usar como **base** de novos clientes.

## Como ver

Abra `modelo/index.html` no navegador (duplo clique ou Live Server).

## O que já está incluso

- Hero com marca + palavras animadas
- Faixa marquee
- Sobre / história
- Mais vendidos
- Cardápio com filtros e sabores
- Galeria
- Passo a passo de encomendas
- Seção **O que o cliente recebe** (para vender o serviço)
- Contato → WhatsApp
- Carrinho com retirada/entrega
- Barra superior “Quero um site assim”

## Personalizar um cliente novo

Edite só `js/data.js`:

1. `settings.brandName` / `brandSub` / textos / cidade
2. `whatsapp` da confeitaria (DDI+DDD+número)
3. `sellerWhatsapp` — o seu número para quem quiser contratar o site
4. Fotos (`heroImage`, `aboutImage`, produtos, galeria)
5. Cardápio em `products`

Cores e tipografia ficam em `style.css` (`:root`) — mesmo visual rosa/creme/marrom dos sites Aurora e Gimarry.

## Relação com os projetos reais

| Projeto | Pasta |
|--------|--------|
| Aurora Confeitaria | `Desktop/aurora_confeitaria` |
| Gimarry Bolos | `Project vendas/gimarry_bolos` |
| Este modelo | `confeitaria_financeiro/modelo` |

Os dois primeiros têm painel admin + API PHP/MySQL. Este modelo é a **vitrine** (front público) para mostrar e adaptar rápido.
