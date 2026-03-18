# Despliegue en Ubuntu Server

## Objetivo

Levantar `Sistema de Ticket V2` en un servidor Ubuntu con:

- Node.js 20
- PostgreSQL 16
- Redis 7
- Nginx
- systemd

## Opcion recomendada

Para una primera prueba productiva controlada, usar:

- API Node.js con `systemd`
- frontend compilado estatico servido por Nginx
- PostgreSQL y Redis instalados en el servidor

## 1. Preparar el servidor

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx redis-server unzip build-essential
```

Instalar Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

Instalar PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

## 2. Crear base y usuario

```bash
sudo -u postgres psql
```

Dentro de `psql`:

```sql
CREATE USER ticket_v2 WITH PASSWORD 'ticket_v2';
CREATE DATABASE ticket_v2 OWNER ticket_v2;
\q
```

## 3. Copiar el proyecto

```bash
sudo mkdir -p /var/www/ticket_v2
sudo chown -R $USER:$USER /var/www/ticket_v2
cd /var/www/ticket_v2
git clone <TU_REPO_O_COPIA> .
```

## 4. Configurar entorno

```bash
cp .env.example .env
nano .env
```

Contenido sugerido:

```env
APP_NAME=Sistema de Ticket V2
PORT=4010
DATABASE_URL=postgresql://ticket_v2:ticket_v2@127.0.0.1:5432/ticket_v2?schema=public
REDIS_URL=redis://127.0.0.1:6379
VITE_API_BASE_URL=https://tickets.midominio.com/api
```

## 5. Instalar dependencias

```bash
cd /var/www/ticket_v2
npm install
```

## 6. Compilar backend y frontend

```bash
npm run build
```

El frontend compilado quedara en `apps/web/dist`.

## 7. Publicar frontend

```bash
sudo mkdir -p /var/www/ticket_v2/web
sudo rsync -av --delete /var/www/ticket_v2/apps/web/dist/ /var/www/ticket_v2/web/
sudo chown -R www-data:www-data /var/www/ticket_v2/web
```

## 8. Configurar systemd para la API

```bash
sudo cp deploy/systemd/ticket_v2-api.service /etc/systemd/system/ticket_v2-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now ticket-v2-api
sudo systemctl status ticket-v2-api
```

Logs en vivo:

```bash
journalctl -u ticket-v2-api -f
```

## 9. Configurar Nginx

Editar el archivo de ejemplo:

```bash
sudo cp deploy/nginx/ticket_v2.conf /etc/nginx/sites-available/ticket_v2.conf
sudo nano /etc/nginx/sites-available/ticket_v2.conf
```

Cambiar `tickets.midominio.com` por tu dominio o IP.

Activar el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/ticket_v2.conf /etc/nginx/sites-enabled/ticket_v2.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 10. SSL con Let's Encrypt

Si ya tenes dominio apuntando al servidor:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tickets.midominio.com
```

## 11. Validaciones iniciales

Probar API:

```bash
curl http://127.0.0.1:4010/health
curl http://127.0.0.1:4010/audio/profiles
curl http://127.0.0.1:4010/panel
```

Probar sitio:

- abrir `https://tickets.midominio.com`
- cambiar idioma `ES / EN / PT`
- abrir vista de panel publico
- reproducir anuncio

## 12. Testing funcional recomendado

### Backend

- `GET /health`
- `GET /catalog/services`
- `GET /audio/profiles`
- `GET /audio/current-calls`
- `POST /audio/preview`
- `POST /audio/call`
- `GET /panel`
- `GET /settings/summary`

### Frontend

- dashboard carga correctamente
- triage cambia de idioma en caliente
- panel designer reproduce audio
- panel publico muestra llamado actual
- navegacion funciona sin recarga
- estilos responden bien en desktop y mobile

### Audio

- probar Chrome en Ubuntu o Windows
- confirmar disponibilidad de `speechSynthesis`
- validar voz en espanol, ingles y portugues
- revisar que el navegador permita reproducir audio tras interaccion del usuario

## 13. Problemas comunes

### La API no levanta

- revisar `journalctl -u ticket-v2-api -f`
- confirmar `node -v`
- confirmar que existe `apps/api/dist/main.js`

### Nginx devuelve 502

- verificar que la API responda en `127.0.0.1:4010`
- revisar `sudo nginx -t`
- revisar firewall

### El frontend carga pero no actualiza

- recompilar con `npm run build`
- sincronizar de nuevo `apps/web/dist` a `/var/www/ticket_v2/web`
- limpiar cache del navegador

### El audio no se escucha

- el navegador necesita interaccion del usuario
- probar con Chrome o Edge
- revisar volumen del sistema
- algunas voces dependen del sistema operativo instalado

## 14. Alternativa con Docker

Tambien podes probar con:

```bash
cd /var/www/ticket_v2/deploy
sudo docker compose -f docker-compose.prod.yml up -d --build
```

En ese caso el frontend quedara expuesto por `http://IP_DEL_SERVIDOR:8080`.
