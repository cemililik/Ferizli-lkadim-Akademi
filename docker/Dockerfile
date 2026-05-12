# ============================================================
# PHP-Apache image — proje klasörü mount edilir (volume),
# kod değişiklikleri anında yansır (rebuild gerekmez).
# ============================================================
FROM php:8.2-apache

# --- Sistem paketleri (GD için gerekli görsel kütüphaneler) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libwebp-dev \
        unzip \
    && rm -rf /var/lib/apt/lists/*

# --- PHP extension'ları ---
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) pdo_mysql gd

# --- Apache yapılandırması ---
RUN a2enmod rewrite headers expires \
    && sed -ri -e 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf

# --- PHP ayar dosyaları (dev & prod) ---
# Entrypoint, PHP_ENV değişkenine göre uygun olanı kopyalar.
COPY php.dev.ini  /etc/php-conf/php.dev.ini
COPY php.prod.ini /etc/php-conf/php.prod.ini

# --- Entrypoint shim ---
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# --- Health endpoint (opsiyonel) ---
EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
