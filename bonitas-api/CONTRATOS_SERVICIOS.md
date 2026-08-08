# Documentación de Contratos de Servicios Web (REST API SOA con Seguridad JWT)

Esta documentación define formalmente los contratos públicos expuestos por cada uno de los 4 microservicios autónomos que integran el sistema **Bonitas Fashions**, incluyendo el esquema de seguridad **Stateless con JWT (JSON Web Tokens)**.

---

## 🔐 Esquema de Seguridad y Mecanismos de Autenticación Inter-Servicios

1. **Tokens JWT (Stateless Auth):**
   * Al iniciar sesión o registrarse en el `Auth Service`, se emite un **JWT firmado electrónicamente** con vigencia de 8 horas.
   * Encabezado de Solicitud Estándar para Peticiones Autenticadas:
     ```http
     Authorization: Bearer <token_jwt>
     ```
2. **Manejo Explícito de Fallos de Seguridad (Cumplimiento de Rúbrica 10%):**
   * **`401 Unauthorized`**: Retornado cuando no se provee el encabezado `Authorization: Bearer` o el token JWT está expirado/manipulado.
   * **`403 Forbidden`**: Retornado cuando el token pertenece a un rol no autorizado (ej: un usuario con rol `cliente` intentando acceder a rutas administrativas reservadas para `vendedor`).

---

## 1. Servicio de Autenticación (`Auth Service`)
* **Puerto Predeterminado:** `5001`
* **Base URL:** `/api/auth`
* **Dominio:** Registro, inicio de sesión, generación de JWTs y verificación de credenciales.

### Endpoints:

#### `POST /api/auth/register`
* **Descripción:** Registra un nuevo usuario cliente y emite un token JWT.
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "nombre": "Mariana",
    "apellido_p": "García",
    "apellido_m": "López",
    "correo": "mariana@gmail.com",
    "password": "miPassword123",
    "telefono": "6181234567"
  }
  ```
* **Respuestas:**
  * `201 Created`: Usuario registrado exitosamente con token JWT.
    ```json
    {
      "id_usuario": 12,
      "nombre": "Mariana",
      "apellido_p": "García",
      "correo": "mariana@gmail.com",
      "rol": "cliente",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
    ```
  * `400 Bad Request`: Faltan datos requeridos o el correo ya existe.

#### `POST /api/auth/login`
* **Descripción:** Autentica a un usuario y emite un token JWT con la firma del perfil.
* **Request Body:**
  ```json
  {
    "correo": "mariana@gmail.com",
    "password": "miPassword123"
  }
  ```
* **Respuestas:**
  * `200 OK`: Credenciales válidas con token de sesión.
  * `401 Unauthorized`: Credenciales inválidas.

#### `GET /api/auth/verify`
* **Descripción:** Verifica la validez y estado de un token JWT.
* **Headers:** `Authorization: Bearer <token_jwt>`
* **Respuestas:**
  * `200 OK`: Token válido.
  * `401 Unauthorized`: Token no provisto, expirado o alterado.

---

## 2. Servicio de Productos e Inventario (`Productos Service`)
* **Puerto Predeterminado:** `5002`
* **Base URL:** `/api/productos`
* **Dominio:** Gestión de prendas, estados de prendas y catálogo público.

### Endpoints:

#### `GET /api/productos`
* **Descripción:** Retorna la lista de prendas con estado `1` (Disponible) para el catálogo de clientes.
* **Respuesta (`200 OK`):** Arreglo de prendas disponibles.

#### `GET /api/productos/admin`
* **Descripción:** Retorna todas las prendas con su nombre de estado para el panel de administración.
* **Respuesta (`200 OK`):** Arreglo de prendas con `estado_nombre`.

#### `POST /api/productos`
* **Headers:** `Content-Type: application/json`, `X-Service-API-Key: bonitas_internal_service_key_2026`
* **Request Body:**
  ```json
  {
    "nombre": "Blusa Floral",
    "descripcion": "Blusa fresca de verano",
    "precio": 350.00,
    "talla": "M",
    "marca": "Zara",
    "condicion": "Nuevo",
    "url_imagen": "https://...",
    "id_estado": 1
  }
  ```

---

## 3. Servicio de Apartados y Ventas (`Apartados Service`)
* **Puerto Predeterminado:** `5003`
* **Base URL:** `/api/apartados`
* **Dominio:** Reservaciones, control de fechas límite y cierre de ventas.

### Endpoints:

#### `POST /api/apartados`
* **Descripción:** Crea un apartado de prenda activo.
* **Request Body:**
  ```json
  {
    "id_usuario": 12,
    "id_producto": 5,
    "fecha_limite": "2026-08-15",
    "id_metodo_pago": 1,
    "id_tipo_entrega": 1
  }
  ```

#### `DELETE /api/apartados/:id`
* **Descripción:** Cancela un apartado activo y libera la prenda (`id_estado = 1`).

#### `POST /api/apartados/:id/completar`
* **Descripción:** Concreta la venta de un apartado y marca la prenda como vendida (`id_estado = 3`).

---

## 4. Servicio de Encuestas y Métricas (`Encuestas Service`)
* **Puerto Predeterminado:** `5004`
* **Base URL:** `/api/recoleccion`
* **Dominio:** Métricas de usabilidad ISO 9241-11 y cuestionarios Likert.
* **Base de Datos Exclusiva:** `SURVEY_DATABASE_URL`

### Endpoints:

#### `POST /api/recoleccion/participantes`
#### `POST /api/recoleccion/metricas`
#### `POST /api/recoleccion/respuestas`
