# Manual de Usuario y Operación de POS Engine

## 1. Introducción

POS Engine es un sistema de gestión y ventas omnicanal diseñado para administrar operaciones comerciales desde un único entorno digital. La plataforma integra la venta en punto de venta físico, la administración interna de inventario y sucursales, y la experiencia de compra en línea para clientes.

El sistema permite controlar productos, variantes, existencias por sucursal, usuarios internos, ventas, reportes operativos y pedidos generados desde el catálogo web. Su objetivo principal es centralizar la operación comercial para reducir errores manuales, agilizar el flujo de venta y ofrecer visibilidad sobre el desempeño de cada sucursal.

POS Engine se divide en cuatro áreas funcionales:

- **Administración:** gestión de inventario, sucursales, usuarios internos y reportes.
- **Terminal POS:** flujo de venta presencial mediante carrito, cobro y ticket.
- **Tienda en línea:** catálogo, carrito web, checkout e historial de pedidos.
- **Autenticación:** acceso diferenciado para staff y clientes mediante tokens JWT independientes.

## 2. Guía de Acceso

El acceso al sistema se realiza desde la pantalla de inicio de sesión. El sistema identifica automáticamente si las credenciales corresponden a un usuario interno o a un cliente, y redirige al módulo correspondiente.

| Tipo de usuario | Usuario de prueba | Contraseña | Ruta inicial esperada | Alcance principal |
|---|---|---|---|---|
| Cliente | `test.customer@gmail.com` | `password123` | `/` | Catálogo, carrito, checkout, cuenta e historial de pedidos |
| Administrador | `admin@bentenison.mx` | `XZNRXNJTESGAQA` | `/dashboard` | Acceso completo a administración, reportes, inventario, sucursales y usuarios |
| Gerente | `gerente.centroxalapa@bentenison.mx` | `XZNRXNJTESGAQA` | `/dashboard` | Operación administrativa de la sucursal asignada y consulta de reportes |
| Cajero | `cajero1.centroxalapa@bentenison.mx` | `XZNRXNJTESGAQA` | `/terminal` | Terminal de ventas e inventario en modo permitido |

Nota: la contraseña de usuarios internos puede cambiar si durante la carga inicial de datos se define una variable `SEED_PASSWORD`. En ese caso, la contraseña válida será la configurada en dicha variable.

## 3. Manual de Operación para Staff

### 3.1 Administrador y Gerente

Los perfiles de administrador y gerente acceden al panel operativo desde `/dashboard`. Este panel concentra indicadores de ventas, comportamiento reciente, accesos rápidos y alertas de inventario. El administrador cuenta con permisos globales, mientras que el gerente opera principalmente sobre la información vinculada a su sucursal asignada.

#### 3.1.1 Consulta de reportes

El módulo de reportes se encuentra en `/reports` y permite analizar el desempeño de ventas mediante filtros de tiempo. El sistema ofrece vistas de:

- Hoy.
- Últimos 7 días.
- Mes actual.
- Últimos 60 días.

La vista de reportes presenta indicadores como total vendido, número de transacciones, ticket promedio, ventas por sucursal, productos más vendidos y tendencia diaria de ventas. La tendencia visual se apoya en el componente gráfico de ventas `SalesChart.tsx`, que facilita la lectura del comportamiento comercial en el periodo seleccionado.

Para consultar reportes:

1. Iniciar sesión como administrador o gerente.
2. Entrar a `/reports` desde el menú de navegación.
3. Seleccionar el rango de fechas deseado.
4. Revisar los indicadores principales y las tablas de detalle.
5. Usar la información para evaluar desempeño, rotación de productos y comportamiento por sucursal.

#### 3.1.2 Gestión de inventario

El módulo de inventario se encuentra en `/inventory`. Desde esta pantalla se visualiza el stock por producto, talla, variante y sucursal. El administrador puede cambiar de sucursal y modificar existencias; el gerente puede gestionar productos según el alcance de su operación.

El inventario utiliza un sistema de alertas visuales tipo semáforo para facilitar la toma de decisiones:

- **Verde:** stock suficiente o situación normal.
- **Amarillo:** stock bajo, normalmente entre 1 y 5 unidades.
- **Rojo:** stock crítico o producto sin existencias.

En el dashboard también se muestran alertas de stock para detectar rápidamente productos agotados o con pocas unidades. Esto permite priorizar reabastecimiento, revisar rotación y prevenir ventas no atendidas por falta de disponibilidad.

Flujo recomendado de inventario:

1. Ingresar a `/inventory`.
2. Seleccionar la sucursal correspondiente, si el perfil tiene permiso para hacerlo.
3. Revisar productos, tallas, colores y cantidades disponibles.
4. Identificar alertas de stock bajo o crítico.
5. Crear productos o variantes cuando sea necesario.
6. Ajustar existencias de forma controlada, de acuerdo con los permisos del rol.

#### 3.1.3 Configuración de sucursales

La administración de sucursales se realiza desde `/stores`. Este módulo permite registrar y editar datos básicos de cada punto de venta, como nombre y ubicación. Las sucursales se relacionan con usuarios internos, inventario, ventas y pedidos, por lo que su configuración debe realizarse cuidadosamente.

Flujo recomendado:

1. Iniciar sesión con un usuario administrador.
2. Ingresar a `/stores`.
3. Revisar el listado de sucursales registradas.
4. Crear una nueva sucursal cuando se habilite un nuevo punto operativo.
5. Editar nombre o ubicación cuando existan cambios administrativos.
6. Validar que los usuarios de tipo gerente o cajero estén asignados a la sucursal correcta.

### 3.2 Cajero

El cajero opera principalmente desde la terminal de ventas ubicada en `/terminal`. Al iniciar sesión, el sistema redirige automáticamente a esta ruta para mantener el flujo de venta enfocado y evitar accesos innecesarios a módulos administrativos.

#### 3.2.1 Flujo de venta en terminal

La terminal está compuesta por un listado de productos y un carrito de venta activo. El cajero puede buscar o seleccionar productos, elegir la talla disponible y agregarlos al carrito.

Flujo de operación:

1. Iniciar sesión con una cuenta de cajero.
2. Acceder a `/terminal`.
3. Seleccionar un producto desde el listado.
4. Elegir talla o variante disponible.
5. Agregar el producto al carrito.
6. Ajustar cantidades desde el carrito, si aplica.
7. Revisar subtotal, IVA, descuentos y total.
8. Presionar la opción de pago.

El carrito permite cancelar la venta activa, quitar productos individuales, aumentar o disminuir cantidades, y aplicar descuentos por porcentaje o monto fijo antes de procesar el pago.

#### 3.2.2 Modal de pago

Al presionar la opción de pago, el sistema abre un modal de cobro. En esta ventana se muestra el total a cobrar y se selecciona el método de pago.

Los métodos disponibles son:

- Efectivo.
- Tarjeta.
- Transferencia.

Después de seleccionar el método de pago, el cajero confirma la venta. El sistema genera la información de la operación y abre el ticket correspondiente.

#### 3.2.3 Generación de tickets

Al confirmar una venta, POS Engine muestra un ticket con los datos principales de la transacción: folio, productos vendidos, cantidades, subtotal, IVA, descuento, total, método de pago y sucursal operativa.

El ticket puede imprimirse desde el modal correspondiente. Una vez cerrado el ticket, el carrito se limpia y la terminal queda lista para registrar una nueva venta.

## 4. Manual de Compras para Clientes

### 4.1 Navegación del catálogo

Los clientes acceden al catálogo desde la página principal `/` o desde `/catalog`, según la configuración de navegación. En esta sección pueden revisar productos disponibles, consultar precios, filtrar resultados y seleccionar variantes como talla o sucursal con disponibilidad.

Flujo de navegación:

1. Entrar al catálogo web.
2. Buscar o filtrar productos.
3. Revisar los datos del producto y disponibilidad.
4. Seleccionar talla y sucursal, cuando aplique.
5. Agregar el producto al carrito.

### 4.2 Carrito de compras

El carrito web se encuentra en `/cart`. Desde esta pantalla el cliente puede revisar los productos seleccionados, modificar cantidades y elegir el método de entrega.

El sistema contempla dos modalidades operativas:

- **Recoger en sucursal:** el cliente selecciona la sucursal donde recogerá el pedido.
- **Entrega a domicilio:** el cliente proporciona la dirección requerida para el envío.

Antes de continuar, el cliente debe verificar productos, cantidades, sucursal o dirección, subtotal, IVA y total estimado.

### 4.3 Proceso de checkout

El checkout se realiza en `/checkout`. Para finalizar una compra, el cliente debe estar autenticado. Si intenta continuar sin sesión activa, el sistema lo redirige al inicio de sesión y posteriormente regresa al flujo de compra.

Flujo de checkout:

1. Confirmar productos en el carrito.
2. Seleccionar método de entrega.
3. Ingresar o confirmar datos personales.
4. Validar dirección o sucursal de recolección.
5. Seleccionar método de pago disponible.
6. Confirmar el pedido.
7. Esperar la confirmación y el folio de compra.

Al finalizar, el sistema registra el pedido, descuenta inventario de la sucursal correspondiente y redirige al cliente a la pantalla de confirmación.

### 4.4 Historial de pedidos

El historial de pedidos se consulta en `/orders/history`. Esta sección requiere sesión activa de cliente y muestra los pedidos realizados por la cuenta autenticada.

En el historial se puede revisar:

- Folio del pedido.
- Fecha de creación.
- Productos comprados.
- Cantidades.
- Total pagado.
- Estado del pedido.

Los estados permiten dar seguimiento básico al avance de la compra, por ejemplo: pendiente, pagado, enviado, entregado o cancelado.

## 5. Sección Técnica: Manual de Instalación

### 5.1 Arquitectura general

POS Engine está construido con una arquitectura web moderna basada en:

- **Next.js 15+ con App Router:** estructura por rutas funcionales para administración, POS, tienda y autenticación. En el proyecto actual se utiliza una versión superior de Next.js.
- **React:** construcción de interfaces interactivas para terminal, carrito, modales, reportes y paneles administrativos.
- **Prisma ORM:** capa de acceso a datos, definición de modelos y operaciones sobre la base de datos.
- **PostgreSQL:** base de datos relacional para usuarios, clientes, productos, variantes, inventario, ventas y pedidos.
- **JWT:** autenticación mediante tokens firmados para separar sesiones de empleados y clientes.
- **Vercel:** plataforma de despliegue para la aplicación web.

La estructura del sistema se organiza por grupos de rutas:

- `(admin)`: dashboard, inventario, sucursales, usuarios, productos, pedidos y reportes.
- `(pos)`: terminal de ventas y operación presencial.
- `(shop)`: catálogo online, carrito, checkout, cuenta e historial de pedidos.
- `(auth)`: inicio de sesión y registro de clientes.
- `lib/`: utilidades compartidas de autenticación, secretos, fechas, Prisma y funciones de apoyo.

### 5.2 Variables de entorno requeridas

Para ejecutar el sistema correctamente se requieren variables de entorno. Las principales son:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Cadena de conexión principal a PostgreSQL usada por Prisma y la aplicación |
| `JWT_SECRET` | Secreto para firmar y validar tokens de usuarios internos: administrador, gerente y cajero |
| `JWT_CUSTOMER_SECRET` | Secreto independiente para firmar y validar tokens de clientes |
| `SEED_PASSWORD` | Variable opcional para definir la contraseña inicial de usuarios internos en datos de prueba |
| `POSTGRES_USER` | Usuario de PostgreSQL en entorno local |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL en entorno local |
| `POSTGRES_DB` | Nombre de la base de datos en entorno local |

Se recomienda que `JWT_SECRET` y `JWT_CUSTOMER_SECRET` sean valores distintos, largos y privados. Esto refuerza la separación entre sesiones del personal interno y sesiones de clientes.

### 5.3 Instalación local resumida

Para una instalación local, el proceso general consiste en:

1. Clonar el repositorio del proyecto.
2. Instalar dependencias del entorno Node.js.
3. Configurar las variables de entorno en el archivo local correspondiente.
4. Preparar la base de datos PostgreSQL.
5. Sincronizar el esquema de Prisma con la base de datos.
6. Ejecutar la carga inicial de datos de prueba.
7. Levantar el servidor de desarrollo.
8. Acceder a la aplicación desde el navegador.

Durante la carga inicial se crean sucursales, productos, variantes, inventario, ventas de ejemplo, usuarios internos y el cliente de prueba.

### 5.4 Despliegue en Vercel

El despliegue se realizó en Vercel conectando el repositorio del proyecto a la plataforma. En la configuración del proyecto se registraron las variables de entorno necesarias, incluyendo la cadena de conexión a PostgreSQL y los secretos JWT.

El proceso de construcción genera el cliente de Prisma antes de compilar la aplicación Next.js, lo que permite que el entorno de producción tenga disponible la capa de acceso a datos. Una vez completado el build, Vercel publica la aplicación y gestiona el hosting, las rutas y la entrega del frontend.

URL de despliegue registrada:

`https://next-pos-engine-o60cdcj7j-axel-yahir-s-projects.vercel.app`

## 6. Conclusiones y Mejoras Futuras

POS Engine centraliza la operación comercial de una tienda con múltiples canales de venta. La integración entre terminal física, catálogo web, inventario por sucursal, reportes y autenticación por roles permite una operación más ordenada, trazable y eficiente.

El proyecto aporta valor al reducir la dispersión de información entre ventas, existencias y pedidos. Además, facilita la toma de decisiones mediante reportes de ventas, alertas de stock y control de usuarios internos.

Como mejoras futuras se proponen:

- Exportación de reportes a CSV para análisis externo.
- Filtros avanzados por producto, sucursal, vendedor y periodo personalizado.
- Gestión completa de devoluciones y cambios.
- Integración con pasarelas de pago en línea.
- Notificaciones automáticas de stock bajo.
- Módulo de auditoría para registrar cambios en inventario y usuarios.
- Panel de analítica con comparativas entre sucursales.

Con estas mejoras, POS Engine podría evolucionar hacia una plataforma más completa de administración comercial, capaz de cubrir tanto necesidades operativas diarias como análisis estratégico de ventas.
