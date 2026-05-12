#!/bin/sh
# ============================================================
# Apache + PHP entrypoint
# PHP_ENV=dev|prod  → uygun php.ini'yi /usr/local/etc/php/conf.d/zz-ilkadim.ini
# olarak kopyalar.
# ============================================================
set -e

PHP_ENV_VALUE="${PHP_ENV:-dev}"

case "$PHP_ENV_VALUE" in
  prod)
    cp /etc/php-conf/php.prod.ini /usr/local/etc/php/conf.d/zz-ilkadim.ini
    echo "[entrypoint] PHP_ENV=prod  →  php.prod.ini etkin"
    ;;
  *)
    cp /etc/php-conf/php.dev.ini /usr/local/etc/php/conf.d/zz-ilkadim.ini
    echo "[entrypoint] PHP_ENV=dev   →  php.dev.ini etkin"
    ;;
esac

exec apache2-foreground
