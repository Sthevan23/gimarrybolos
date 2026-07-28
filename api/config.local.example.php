<?php
/**
 * Credenciais MySQL Hostinger — Gimarry Bolos / gimarrybolos.com.br
 * Banco: u586160337_gimarrybolos
 *
 * No SERVIDOR: host = localhost
 * No PC (Remote MySQL): cole o hostname do hPanel em $remoteHost
 *
 * Copie para config.local.php e coloque a senha do hPanel.
 */
$httpHost = $_SERVER['HTTP_HOST'] ?? 'cli';
$isLocalDev = (bool) preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/i', $httpHost);

$remoteHost = 'COLOQUE_O_HOSTNAME_REMOTE_MYSQL_AQUI';

return [
  'host' => $isLocalDev ? $remoteHost : 'localhost',
  'port' => 3306,
  'name' => 'u586160337_gimarrybolos',
  'user' => 'u586160337_gimarrybolos',
  'pass' => 'COLOQUE_A_SENHA_DO_HPANEL_AQUI',
  'charset' => 'utf8mb4',
];
