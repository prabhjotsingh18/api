<?php declare(strict_types=1);

/**
 * Simple Redis-Based link shortener
 */
class Net_LinkShortener
{
    protected static function GetRedisInstance(): Redis {
        $redis = new Redis();
        $redis->connect(HV_REDIS_HOST,HV_REDIS_PORT);
        $db = defined('HV_SHORTENER_REDIS_DB') ? HV_SHORTENER_REDIS_DB : 20;
        $redis->select($db);
        return $redis;
    }

    protected static function GenerateShortString(): string {
        return bin2hex(random_bytes(8));
    }

    public static function Get(string $shortLink): ?string {
        $redis = self::GetRedisInstance();
        $value = $redis->get($shortLink);
        if ($value === false) {
            return null;
        } else {
            return $value;
        }
    }

    public static function Create(string $longUrl): string {
        $redis = self::GetRedisInstance();
        while($key = self::GenerateShortString()) {
            if ($redis->get($key) === false) {
                $redis->set($key, $longUrl);
                return $key;
            }
        };
    }
}