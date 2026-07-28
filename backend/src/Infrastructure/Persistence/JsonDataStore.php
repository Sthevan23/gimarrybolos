<?php
declare(strict_types=1);

namespace Gimarry\Infrastructure\Persistence;

final class JsonDataStore
{
    public function __construct(private readonly string $filePath)
    {
        $dir = dirname($this->filePath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        if (!is_file($this->filePath)) {
            $this->write($this->defaultData());
        }
    }

    public function read(): array
    {
        $raw = file_get_contents($this->filePath);
        $data = json_decode($raw ?: '{}', true);
        return is_array($data) ? $data : $this->defaultData();
    }

    public function write(array $data): void
    {
        file_put_contents(
            $this->filePath,
            json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT),
            LOCK_EX
        );
    }

    public function update(callable $mutator): array
    {
        $data = $this->read();
        $data = $mutator($data);
        $this->write($data);
        return $data;
    }

    private function defaultData(): array
    {
        $base = [
            'settings' => [
                'name' => 'Gimarry Bolos',
                'tagline' => 'Encomenda ou pronta entrega — escolha o bolo no cardápio e finalize seu pedido em minutos.',
                'whatsapp' => '5537988554691',
                'email' => 'admin@gimarry.com.br',
                'instagram' => 'https://instagram.com/confeitosgimarry',
                'facebook' => '',
                'address' => 'Rua Nossa Senhora das Graças, 361 — Bairro Manoel Valinhas',
                'hours' => 'Seg a Sáb · consulte horário no Instagram',
                'heroBadge' => 'Pronta entrega hoje · Retire em 40 min',
                'sobreText2' => 'Peça pelo cardápio, retire no balcão e monte massa, recheio e tamanho do seu jeito.',
            ],
            'auth' => [
                'email' => 'admin@sthevandev.com.br',
                'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
            ],
            'categories' => [],
            'products' => [],
            'clients' => [],
            'orders' => [],
            'reviews' => [],
            'faq' => [],
            'gallery' => [],
        ];

        $seedFile = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'seed-catalog.json';
        if (is_file($seedFile)) {
            $seed = json_decode((string) file_get_contents($seedFile), true);
            if (is_array($seed)) {
                foreach (['categories', 'products', 'reviews', 'faq', 'gallery'] as $key) {
                    if (!empty($seed[$key]) && is_array($seed[$key])) {
                        $base[$key] = $seed[$key];
                    }
                }
            }
        }

        return $base;
    }
}
