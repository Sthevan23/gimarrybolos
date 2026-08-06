<?php
/**
 * API de dados compartilhados — Gimarry
 * Todos os celulares leem/gravam o mesmo arquivo no servidor Hostinger.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$file = __DIR__ . '/data.json';

// Se o site estiver OFF, não gasta processo com JSON/banco
$siteOff = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'SITE_OFF';
if (is_file($siteOff)) {
  http_response_code(503);
  header('Content-Type: application/json; charset=utf-8');
  header('Retry-After: 3600');
  echo '{"ok":false,"offline":true}';
  exit;
}

function read_data($file) {
  if (!file_exists($file)) {
    return null;
  }
  $raw = file_get_contents($file);
  $data = json_decode($raw, true);
  return is_array($data) ? $data : null;
}

function write_public_catalog($data) {
  $payload = public_payload($data);
  $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    return false;
  }
  $publicFile = __DIR__ . '/catalog.json';
  return file_put_contents($publicFile, $json, LOCK_EX) !== false;
}

function write_data($file, $data) {
  $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    return false;
  }
  $ok = file_put_contents($file, $json, LOCK_EX) !== false;
  if ($ok) {
    write_public_catalog($data);
  }
  return $ok;
}

function public_payload($data) {
  $gallery = $data['gallery'] ?? [];
  if (!is_array($gallery)) {
    $gallery = [];
  }
  // Galeria curta no público (evita 129 paths duplicando os produtos)
  if (count($gallery) > 24) {
    $gallery = array_slice($gallery, 0, 24);
  }

  return [
    'ok' => true,
    'version' => $data['version'] ?? 1,
    'settings' => $data['settings'] ?? new stdClass(),
    'categories' => $data['categories'] ?? [],
    'products' => $data['products'] ?? [],
    'reviews' => $data['reviews'] ?? [],
    'faq' => $data['faq'] ?? [],
    'gallery' => array_values($gallery),
  ];
}

function get_password() {
  $header = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
  if ($header !== '') {
    return $header;
  }
  $input = json_decode(file_get_contents('php://input'), true);
  if (is_array($input) && !empty($input['password'])) {
    return (string) $input['password'];
  }
  return '';
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && isset($_GET['ping'])) {
  header('Cache-Control: no-store');
  echo json_encode([
    'ok' => true,
    'ready' => file_exists($file),
    'time' => time(),
  ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

if ($method === 'GET') {
  $password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
  $wantFull = isset($_GET['full']) || $action === 'full';

  // Público: serve arquivo estático (quase zero CPU)
  if (!$wantFull) {
    $catalogFile = __DIR__ . '/catalog.json';
    if (is_file($catalogFile)) {
      $mtime = filemtime($catalogFile) ?: time();
      $etag = '"' . md5_file($catalogFile) . '"';
      header('ETag: ' . $etag);
      header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
      header('Cache-Control: public, max-age=600');
      $ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
      if ($ifNoneMatch !== '' && trim($ifNoneMatch) === $etag) {
        http_response_code(304);
        exit;
      }
      readfile($catalogFile);
      exit;
    }
  }

  $data = read_data($file);

  if ($data === null) {
    header('Cache-Control: no-store');
    echo json_encode(['empty' => true, 'ok' => false]);
    exit;
  }

  if ($wantFull) {
    header('Cache-Control: no-store');
    $ok = isset($data['auth']['password']) && hash_equals((string) $data['auth']['password'], (string) $password);
    if (!$ok) {
      http_response_code(401);
      echo json_encode(['error' => 'Senha inválida']);
      exit;
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
  }

  // Fallback se catalog.json ainda não existir
  write_public_catalog($data);
  $payload = public_payload($data);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  $body = json_decode($raw, true);

  if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido']);
    exit;
  }

  $password = get_password();
  $stored = read_data($file);

  // Login: valida e devolve todos os dados
  if (($body['action'] ?? '') === 'login') {
    $email = trim((string) ($body['email'] ?? ''));
    $pass = (string) ($body['password'] ?? '');

    if ($stored === null) {
      http_response_code(404);
      echo json_encode(['error' => 'Sem dados no servidor. Faça o primeiro salvamento pelo admin.']);
      exit;
    }

    $authEmail = strtolower(trim((string) ($stored['auth']['email'] ?? '')));
    $authPass = (string) ($stored['auth']['password'] ?? '');
    $emailNorm = strtolower(trim($email));

    if (!hash_equals($authEmail, $emailNorm) || !hash_equals($authPass, $pass)) {
      http_response_code(401);
      echo json_encode(['error' => 'E-mail ou senha incorretos.']);
      exit;
    }

    echo json_encode(['ok' => true, 'data' => $stored], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
  }

  // Pedido público do site (sem senha de admin)
  if (($body['action'] ?? '') === 'create_order') {
    if ($stored === null) {
      http_response_code(503);
      echo json_encode(['error' => 'Sistema ainda não inicializado. Entre no admin uma vez para sincronizar.']);
      exit;
    }

    $order = $body['order'] ?? null;
    $client = $body['client'] ?? null;

    if (!is_array($order) || empty($order['clientName']) || empty($order['clientWhatsapp']) || empty($order['items'])) {
      http_response_code(400);
      echo json_encode(['error' => 'Pedido incompleto']);
      exit;
    }

    if (!isset($stored['orders']) || !is_array($stored['orders'])) {
      $stored['orders'] = [];
    }
    if (!isset($stored['clients']) || !is_array($stored['clients'])) {
      $stored['clients'] = [];
    }

    if (is_array($client) && !empty($client['phone'])) {
      $found = false;
      foreach ($stored['clients'] as $i => $c) {
        if (($c['phone'] ?? '') === ($client['phone'] ?? '') || ($c['id'] ?? '') === ($client['id'] ?? '')) {
          $stored['clients'][$i] = array_merge($c, $client);
          $found = true;
          break;
        }
      }
      if (!$found) {
        $stored['clients'][] = $client;
      }
    }

    $stored['orders'][] = $order;

    if (!write_data($file, $stored)) {
      http_response_code(500);
      echo json_encode(['error' => 'Falha ao gravar pedido']);
      exit;
    }

    echo json_encode(['ok' => true, 'orderNumber' => $order['number'] ?? '']);
    exit;
  }

  // Salvamento completo
  $payload = $body['data'] ?? $body;
  if (!is_array($payload) || !isset($payload['settings'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos']);
    exit;
  }

  if ($stored === null) {
    // Primeiro salvamento: cria o arquivo (bootstrap)
    if ($password === '' && !empty($payload['auth']['password'])) {
      $password = (string) $payload['auth']['password'];
    }
    if ($password === '') {
      http_response_code(401);
      echo json_encode(['error' => 'Informe a senha do admin para criar os dados']);
      exit;
    }
    if (empty($payload['auth']['password'])) {
      $payload['auth'] = [
        'email' => $payload['auth']['email'] ?? 'admin@sthevandev.com.br',
        'password' => $password,
      ];
    }
  } else {
    $authPass = (string) ($stored['auth']['password'] ?? '');
    if ($password === '' || !hash_equals($authPass, $password)) {
      http_response_code(401);
      echo json_encode(['error' => 'Senha inválida para salvar']);
      exit;
    }
    // Mantém auth se o payload não trouxe
    if (empty($payload['auth'])) {
      $payload['auth'] = $stored['auth'];
    }
  }

  if (!write_data($file, $payload)) {
    http_response_code(500);
    echo json_encode(['error' => 'Falha ao gravar no servidor']);
    exit;
  }

  echo json_encode(['ok' => true]);
  exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método não permitido']);
