-- Seed inicial Gimarry Bolos
-- Pedidos/clientes começam vazios.
-- Admin padrão: admin@sthevandev.com.br / admin123 (troque depois do 1º login)

-- Hash bcrypt de: admin123
INSERT INTO admin_users (email, password_hash) VALUES
('admin@sthevandev.com.br', '$2y$10$S5Ob2w6E0s0Cb6UEfw6PBO86fI3ui7MKDt7jAw2GYJr6LE3dluw06')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

INSERT INTO settings (id, payload) VALUES (1, JSON_OBJECT(
  'name', 'Gimarry Bolos',
  'tagline', 'Encomenda ou pronta entrega — escolha o bolo no cardápio e finalize seu pedido em minutos.',
  'whatsapp', '5537988554691',
  'email', 'admin@gimarry.com.br',
  'instagram', 'https://instagram.com/confeitosgimarry',
  'facebook', '',
  'address', 'Rua Nossa Senhora das Graças, 361 — Bairro Manoel Valinhas',
  'hours', 'Seg a Sáb · consulte horário no Instagram'
)) ON DUPLICATE KEY UPDATE payload = VALUES(payload);

INSERT INTO categories (id, name, slug) VALUES
('cat-bolos', 'Bolos', 'bolos'),
('cat-pronta', 'Pronta entrega', 'pronta'),
('cat-bento', 'Bento Cake', 'bento'),
('cat-destaques', 'Destaques', 'destaques')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO products (id, name, description, price, category_id, image, featured, from_price) VALUES
('p1', 'Bolo de Casamento', 'Elegante para casamentos, com acabamento limpo e flores.', 270.00, 'cat-bolos', 'fotos_bolos/bolos_amostra/WhatsApp Image 2026-07-08 at 13.08.11.jpeg', 1, 1),
('p2', 'Bolo de Chocolate', 'Camadas de chocolate com cobertura cremosa.', 95.00, 'cat-bolos', 'fotos_bolos/bolos_amostra/WhatsApp Image 2026-07-08 at 13.08.12.jpeg', 1, 1),
('p9', 'Bolo do Dia — Chocolate', 'Pronta entrega · retire hoje.', 65.00, 'cat-pronta', 'fotos_bolos/pronto_entrega/WhatsApp Image 2026-07-08 at 08.58.36.jpeg', 1, 0),
('p13', 'Bento Cake Frase', 'Mini bolo com frase personalizada.', 40.00, 'cat-bento', 'fotos_bolos/bolos_bentocake/WhatsApp Image 2026-07-08 at 13.05.27.jpeg', 1, 0),
('p17', 'Destaque — Rosa Elegante', 'Um dos mais pedidos da casa.', 160.00, 'cat-destaques', 'fotos_bolos/bolos_destaques/WhatsApp Image 2026-07-08 at 12.56.55.jpeg', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO reviews (id, name, text, rating, avatar) VALUES
('r1', 'Juliana Ferreira', 'O bolo ficou lindo e o sabor impecável!', 5, 'JF'),
('r2', 'Roberto Almeida', 'Encomendei e ficou perfeito.', 5, 'RA'),
('r3', 'Camila Santos', 'Doces deliciosos e atendimento ótimo.', 5, 'CS')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO faq (id, question, answer) VALUES
('f1', 'Como faço meu pedido?', 'Escolha no cardápio, monte o pedido e finalize no site.'),
('f2', 'Tem retirada e entrega?', 'Sim. Retirada no local ou entrega — consulte a taxa.'),
('f3', 'Quais formas de pagamento?', 'PIX, cartão e dinheiro — confirmamos no atendimento.')
ON DUPLICATE KEY UPDATE question = VALUES(question);
