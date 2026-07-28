-- ============================================================
-- Gimarry Bolos — MySQL Hostinger (phpMyAdmin)
-- Banco: u586160337_gimarrybolos  (gimarrybolos.com.br)
--
-- Como usar:
-- 1. No hPanel → Bancos de Dados → MySQL → phpMyAdmin
-- 2. Selecione o banco: u586160337_gimarrybolos
-- 3. Aba SQL → cole este arquivo inteiro → Executar
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- Tabelas ----------

CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
  payload JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category_id VARCHAR(32) NOT NULL,
  image VARCHAR(500) DEFAULT '',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  from_price TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  email VARCHAR(190) DEFAULT '',
  phone VARCHAR(32) NOT NULL,
  address VARCHAR(255) DEFAULT '',
  UNIQUE KEY uq_clients_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  number VARCHAR(40) NOT NULL UNIQUE,
  client_id VARCHAR(32) NOT NULL,
  client_name VARCHAR(190) NOT NULL,
  client_whatsapp VARCHAR(32) NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('novo','preparo','entrega','finalizado','cancelado') NOT NULL DEFAULT 'novo',
  notes TEXT,
  source VARCHAR(40) DEFAULT 'site',
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_orders_client FOREIGN KEY (client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(32) NOT NULL,
  product_id VARCHAR(32) DEFAULT NULL,
  name VARCHAR(190) NOT NULL,
  qty INT UNSIGNED NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  detail VARCHAR(500) DEFAULT '',
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  text TEXT NOT NULL,
  rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
  avatar VARCHAR(8) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS faq (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  question VARCHAR(255) NOT NULL,
  answer TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------- Dados iniciais ----------
-- Admin: admin@sthevandev.com.br / admin123  (troque depois do 1º login)

INSERT INTO admin_users (email, password_hash) VALUES
('admin@sthevandev.com.br', '$2y$10$S5Ob2w6E0s0Cb6UEfw6PBO86fI3ui7MKDt7jAw2GYJr6LE3dluw06')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

INSERT INTO settings (id, payload) VALUES (1, JSON_OBJECT(
  'name', 'Gimarry Bolos',
  'brandSub', 'Bolos e Doces',
  'tagline', 'Escolha no cardápio, monte seu pedido e finalize pelo WhatsApp.',
  'whatsapp', '5537988554691',
  'email', 'admin@gimarry.com.br',
  'instagram', 'https://instagram.com/confeitosgimarry',
  'instagramUser', '@confeitosgimarry',
  'facebook', '',
  'address', 'Rua Nossa Senhora das Graças, 361 — Bairro Manoel Valinhas',
  'city', 'Divinópolis, MG',
  'hours', 'Seg a Sáb · consulte horário no Instagram',
  'deliveryFee', 0,
  'deliveryNote', 'Retirada no local · valores sob consulta no WhatsApp'
)) ON DUPLICATE KEY UPDATE payload = VALUES(payload);

INSERT INTO categories (id, name, slug) VALUES
('cat-bolos', 'Bolos', 'bolos'),
('cat-pronta', 'Pronta entrega', 'pronta'),
('cat-bento', 'Bento Cake', 'bento'),
('cat-kits', 'Kits Bento', 'kits'),
('cat-destaques', 'Destaques', 'destaques')
ON DUPLICATE KEY UPDATE name = VALUES(name), slug = VALUES(slug);

INSERT INTO products (id, name, description, price, category_id, image, featured, from_price) VALUES
('p1', 'Bolo de Casamento', 'Elegante para casamentos, com acabamento limpo e flores.', 0.00, 'cat-bolos', 'fotos_bolos/bolos_amostra/WhatsApp Image 2026-07-08 at 13.08.11.jpeg', 1, 1),
('p2', 'Bolo de Chocolate', 'Camadas de chocolate com cobertura cremosa.', 0.00, 'cat-bolos', 'fotos_bolos/bolos_amostra/WhatsApp Image 2026-07-08 at 13.08.12.jpeg', 1, 1),
('p9', 'Bolo do Dia — Chocolate', 'Pronta entrega · retire no local.', 0.00, 'cat-pronta', 'fotos_bolos/pronto_entrega/WhatsApp Image 2026-07-08 at 08.58.36.jpeg', 1, 0),
('p13', 'Bento Cake Frase', 'Mini bolo com frase personalizada.', 0.00, 'cat-bento', 'fotos_bolos/bolos_bentocake/WhatsApp Image 2026-07-08 at 13.05.27.jpeg', 1, 0),
('p17', 'Destaque — Rosa Elegante', 'Um dos mais pedidos da casa.', 0.00, 'cat-destaques', 'fotos_bolos/bolos_destaques/WhatsApp Image 2026-07-08 at 12.56.55.jpeg', 1, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  image = VALUES(image),
  featured = VALUES(featured);

INSERT INTO reviews (id, name, text, rating, avatar) VALUES
('r1', 'Juliana Ferreira', 'O bolo ficou lindo e o sabor impecável!', 5, 'JF'),
('r2', 'Roberto Almeida', 'Encomendei e ficou perfeito.', 5, 'RA'),
('r3', 'Camila Santos', 'Doces deliciosos e atendimento ótimo.', 5, 'CS')
ON DUPLICATE KEY UPDATE name = VALUES(name), text = VALUES(text);

INSERT INTO faq (id, question, answer) VALUES
('f1', 'Como faço meu pedido?', 'Escolha no cardápio, monte o pedido e finalize no site. O pedido segue para o WhatsApp.'),
('f2', 'Tem retirada?', 'Sim. Retirada no local em Rua Nossa Senhora das Graças, 361 — Bairro Manoel Valinhas.'),
('f3', 'Quais formas de pagamento?', 'PIX, cartão e dinheiro — confirmamos no atendimento.')
ON DUPLICATE KEY UPDATE question = VALUES(question), answer = VALUES(answer);

INSERT INTO gallery (image_url, sort_order)
SELECT * FROM (
  SELECT 'fotos_bolos/foto_da_loja.jpeg' AS image_url, 1 AS sort_order
  UNION ALL SELECT 'fotos_bolos/bolos_destaques/WhatsApp Image 2026-07-08 at 12.55.35.jpeg', 2
  UNION ALL SELECT 'fotos_bolos/bolos_destaques/WhatsApp Image 2026-07-08 at 12.56.11.jpeg', 3
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM gallery LIMIT 1);
