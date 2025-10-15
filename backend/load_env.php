<?php
declare(strict_types=1);

// Simple .env loader to support environment configuration without external dependencies.
// It loads variables from project root `.env` or `backend/.env` if present.

if (!defined('DELIBERATION_ENV_LOADED')) {
    define('DELIBERATION_ENV_LOADED', true);

    /**
     * Load .env variables into environment without overriding existing ones.
     */
    (function () {
        $candidates = [
            dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env',
            __DIR__ . DIRECTORY_SEPARATOR . '.env',
        ];

        $envPath = null;
        foreach ($candidates as $path) {
            if (is_readable($path)) { $envPath = $path; break; }
        }
        if ($envPath === null) { return; }

        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) { return; }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || str_starts_with($line, ';')) { continue; }

            // Strip leading `export ` if present
            if (str_starts_with($line, 'export ')) { $line = substr($line, 7); }

            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) { continue; }
            $key = trim($parts[0]);
            $value = trim($parts[1]);

            // Remove surrounding quotes
            if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                $value = substr($value, 1, -1);
            }

            // Do not override existing environment variables
            $existing = getenv($key);
            if ($existing !== false && $existing !== '') { continue; }

            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
            if (!isset($_SERVER[$key])) { $_SERVER[$key] = $value; }
        }
    })();
}