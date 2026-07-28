<?php
declare(strict_types=1);

namespace Gimarry\Infrastructure\Auth;

use Gimarry\Domain\Repositories\AuthRepositoryInterface;
use Gimarry\Infrastructure\Persistence\JsonDataStore;

final class JsonAuthRepository implements AuthRepositoryInterface
{
    public function __construct(private readonly JsonDataStore $store) {}

    public function verify(string $email, string $password): bool
    {
        $auth = $this->store->read()['auth'] ?? [];
        if (($auth['email'] ?? '') !== $email) {
            return false;
        }
        $hash = $auth['password_hash'] ?? '';
        if ($hash !== '' && password_verify($password, $hash)) {
            return true;
        }
        // compat legado texto puro
        return isset($auth['password']) && hash_equals((string) $auth['password'], $password);
    }

    public function updatePassword(string $email, string $currentPassword, string $newPassword): bool
    {
        if (!$this->verify($email, $currentPassword)) {
            return false;
        }
        $this->store->update(static function (array $data) use ($newPassword) {
            $data['auth']['password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
            unset($data['auth']['password']);
            return $data;
        });
        return true;
    }

    public function getEmail(): string
    {
        return (string) (($this->store->read()['auth']['email'] ?? 'admin@sthevandev.com.br'));
    }
}
