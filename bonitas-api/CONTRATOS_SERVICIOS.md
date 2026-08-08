# Documentación de Contratos de Servicios Web (REST API SOA)

Esta documentación define formalmente los contratos públicos expuestos por cada uno de los 4 microservicios autónomos que integran el sistema **Bonitas Fashions**.

---

## 1. Servicio de Autenticación (`Auth Service`)
* **Puerto Predeterminado:** `5001`
* **Base URL:** `/api/auth`
* **Dominio:** Registro, inicio de sesión y gestión de credenciales.

### Endpoints:

#### `POST /api/auth/register`
* **Descripción:** Registra un nuevo usuario cliente.
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
  * `201 Created`: Usuario registrado exitosamente.
    ```json
    {
      "id_usuario": 12,
      "nombre": "Mariana",
      "apellido_p": "García",
      "apellido_m": "López",
      "correo": "mariana@gmail.com",
      "telefono": "6181234567",
      "rol": "cliente"
    }
    ```
  * `400 Bad Request`: Faltan datos requeridos o el correo ya existe.
  * `500 Internal Server Error`: Fallo interno del servidor de autenticación.

#### `POST /api/auth/login`
* **Descripción:** Autentica a un usuario y retorna su perfil de sesión.
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "correo": "mariana@gmail.com",
    "password": "miPassword123"
  }
  ```
* **Respuestas:**
  * `200 OK`: Credenciales válidas.
  * `401 Unauthorized`: Credenciales inválidas.

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
