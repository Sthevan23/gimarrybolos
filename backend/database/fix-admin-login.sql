-- Corrige login admin no MySQL (Hostinger)
-- E-mail: admin@sthevandev.com.br
-- Senha:  admin123

INSERT INTO admin_users (email, password_hash) VALUES
('admin@sthevandev.com.br', '$2y$10$S5Ob2w6E0s0Cb6UEfw6PBO86fI3ui7MKDt7jAw2GYJr6LE3dluw06')
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  password_hash = VALUES(password_hash);

-- Remove contas antigas com e-mail errado (opcional)
DELETE FROM admin_users
WHERE email IN ('admin@gimarry.com.br', 'admin@flordeacucar.com.br')
  AND email <> 'admin@sthevandev.com.br';
