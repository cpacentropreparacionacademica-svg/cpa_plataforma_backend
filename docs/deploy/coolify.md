# Despliegue en Coolify

Guía operativa. Los dos repositorios se despliegan como recursos **Docker Compose**
independientes: primero el backend, después el frontend (que necesita el dominio
del backend en tiempo de build).

## 1. Elegir el archivo correcto

Cada repositorio tiene dos composiciones y **Coolify toma la equivocada por defecto**:

| Archivo | Para qué sirve |
|---|---|
| `docker-compose.yml` | Desarrollo local. Publica puertos y usa el `.env` del desarrollador. |
| `docker-compose.dev.yml` | **Despliegue.** Trae su base, declara el dominio público y no publica puertos. |

En el recurso, campo **Docker Compose Location**, escribe `docker-compose.dev.yml`.

Desplegar con `docker-compose.yml` deja el servicio sin dominio: arranca, pero no
hay nada que abrir desde la interfaz.

## 2. Backend

### Variables obligatorias

| Variable | Valor | Nota |
|---|---|---|
| `PGPASSWORD` | la que elijas | La usa el Postgres del propio stack. |
| `CORS_ORIGINS` | `https://front.tudominio.com` | Sin barra final, con esquema. |

Todo lo demás tiene un valor por defecto razonable.

### La trampa de CORS_ORIGINS

La validación es estricta y **aborta el arranque** si el valor no es un origen
exacto. Con el contenedor reiniciándose en bucle, el log dice cuál es el valor
ofensor:

```
https://front.tudominio.com      correcto
https://front.tudominio.com/     barra final     -> aborta
front.tudominio.com              sin esquema     -> aborta
https://*.tudominio.com          comodín         -> aborta
https://a.test,https://b.test    varios: coma    correcto
```

### Usar una base gestionada en vez de la del stack

Sobreescribe y el servicio `postgres` deja de usarse:

```
PGHOST=<host gestionado>
PGSSLMODE=require
DATABASE_URL=postgresql://usuario:clave@host:5432/base?sslmode=require
```

### Orden de arranque

El stack lo resuelve solo: `postgres` → `migrations` → `api`. La API no arranca
hasta que las migraciones terminan bien, así que nunca atiende peticiones contra
un esquema a medias.

El servicio `migrations` aparece como **exited (0)** cuando fue bien. Eso es lo
esperado, no un fallo.

## 3. Frontend

Requiere el dominio del backend, así que se despliega después.

| Variable | Valor |
|---|---|
| `VITE_API_BASE_URL` | `https://api.tudominio.com` — sin `/api` al final |
| `VITE_CLOUDINARY_CLOUD_NAME` | tu cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | un preset **unsigned** |

**Estas variables se congelan dentro del bundle durante el build.** Cambiarlas
exige **reconstruir la imagen**; reiniciar el contenedor no sirve de nada.

Sin las dos de Cloudinary la aplicación funciona, pero el grid del cajero muestra
un marcador de posición en lugar de las fotos y la subida de imágenes falla.

## 4. Después del primer despliegue

1. Comprueba `https://api.tudominio.com/api/health/live` → `{"success":true,...}`
2. Entra al frontend y verifica que la pantalla carga con datos.
3. Para el punto de venta hace falta que exista **una tienda activa** en
   Infraestructura > Tienda. Si hay varias, el frontend debe enviar `id_tienda`.
4. Marca los productos que se venden en caja: en Inventario > Bien, activa
   **Se vende en tienda**, pon **Precio de venta** y súbeles imagen.

## 5. Diagnóstico

El síntoma más común es `Exited · Restart limit reached`: significa que el proceso
lanza una excepción antes de escuchar y Coolify lo reinicia hasta agotar el
límite. La última línea del log nombra la causa:

| Mensaje | Qué corregir |
|---|---|
| `PGPASSWORD is required.` | La variable no llegó al contenedor. |
| `CORS origin must be an exact HTTP(S) origin: X` | El valor `X` de `CORS_ORIGINS`. |
| `CORS_ORIGINS is required in production.` | Está vacío. |
| `SESSION_COOKIE_SECURE must be true in production.` | Lo pusiste en `false`. |
| `Unable to connect to the database. Retrying (9)...` | La base no responde: revisa `PGHOST` y credenciales. |
| `env file .env not found` | Estás desplegando `docker-compose.yml` en vez del `.dev.yml`. |

Si el frontend carga pero sin datos, casi siempre es una de dos: `VITE_API_BASE_URL`
quedó vacía o apunta a otro sitio (hay que **reconstruir**, no reiniciar), o el
dominio del frontend no está en el `CORS_ORIGINS` del backend.
