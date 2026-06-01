## 1. Introducción

POS Engine es un sistema de gestión y ventas omnicanal diseñado para administrar operaciones comerciales desde un único entorno digital. La plataforma integra la venta en punto de venta físico, la administración interna de inventario y sucursales, y la experiencia de compra en línea para clientes.

El sistema permite controlar productos, variantes, existencias por sucursal, usuarios internos, ventas, reportes operativos y pedidos generados desde el catálogo web. Su objetivo principal es centralizar la operación comercial para reducir errores manuales, agilizar el flujo de venta y ofrecer visibilidad sobre el desempeño de cada sucursal.

POS Engine se divide en cuatro áreas funcionales:

- **Administración:** Gestión de inventario, sucursales, usuarios internos y reportes.
    
- **Terminal POS:** Flujo de venta presencial mediante carrito, cobro y ticket.
    
- **Tienda en línea:** Catálogo, carrito web, checkout e historial de pedidos.
    
- **Autenticación:** Acceso diferenciado para staff y clientes mediante tokens JWT independientes.
    

## 2. Guía de Acceso

El acceso al sistema se realiza desde la pantalla de inicio de sesión. El sistema identifica automáticamente si las credenciales corresponden a un usuario interno o a un cliente.

| **Tipo de usuario** | **Usuario de prueba**                | **Contraseña**   | **Ruta inicial** | **Alcance principal**     |
| ------------------- | ------------------------------------ | ---------------- | ---------------- | ------------------------- |
| **Cliente**         | `test.customer@gmail.com`            | `password123`    | `/`              | Catálogo, carrito, cuenta |
| **Administrador**   | `admin@bentenison.mx`                | `XZNRXNJTESGAQA` | `/dashboard`     | Acceso total              |
| **Gerente**         | `gerente.centroxalapa@bentenison.mx` | `XZNRXNJTESGAQA` | `/dashboard`     | Gestión sucursal          |
| **Cajero**          | `cajero1.centroxalapa@bentenison.mx` | `XZNRXNJTESGAQA` | `/terminal`      | Ventas físicas            |

## 3. Inicio Rápido (Onboarding)

Para que un usuario nuevo realice su primera venta en la terminal POS, se recomienda seguir este flujo inicial:

1. **Acceder a la terminal:** Iniciar sesión con una cuenta de cajero y entrar a `/terminal`. El sistema mostrará el catálogo de productos disponible para la sucursal operativa.
    
2. **Construir el carrito:** Buscar el producto, seleccionar la variante correspondiente, confirmar la talla disponible y agregar el artículo al carrito de venta.
    
3. **Cobrar y emitir ticket:** Revisar subtotal, IVA, descuentos y total; abrir el modal de pago, seleccionar el método de cobro y confirmar la venta para generar el ticket de cierre.

## 4. Manual de Operación para Staff

_(Insertar aquí: Captura de pantalla del Dashboard principal)_

### 4.1 Panel de Control (Dashboard)

Los perfiles de administrador y gerente acceden al panel central desde `/dashboard`. Este panel actúa como el centro de mando del sistema, diseñado para proporcionar una vista panorámica de la salud operativa del negocio en tiempo real.

#### 4.1.1 Indicadores clave (KPIs)

El Dashboard centraliza los siguientes indicadores estratégicos para la toma de decisiones:

- **Ventas del día:** Monto total acumulado en la jornada actual.
    
- **Transacciones de hoy:** Conteo total de operaciones realizadas.
    
- **Ventas semanales:** Comparativa de rendimiento en los últimos 7 días.
    
- **Sucursales:** Cantidad total de puntos de venta activos en el sistema.
    
- **Top de productos:** Ranking de los artículos más vendidos, facilitando la identificación de productos estrella.
    

#### 4.1.2 Gestión proactiva mediante el Dashboard

El panel facilita la gestión mediante secciones interactivas que conectan directamente con los módulos operativos:

- **Alertas de Stock:** Se muestra un desglose de productos con niveles críticos (bajo stock o agotados). Incluye un botón de acceso directo a `/inventory` para realizar la gestión detallada de cada producto.
    
- **Ventas Recientes:** Presenta un historial de los movimientos más recientes del sistema. Incluye un botón de acceso directo a `/reports`, donde el usuario puede profundizar en el análisis de datos históricos (hasta 60 días de antigüedad).

#### 4.1.3 Gestión de inventario y alertas

El módulo de inventario se encuentra en `/inventory`. Esta sección permite la consulta detallada de existencias, permitiendo filtrar por producto, talla y sucursal. Es la herramienta principal para el control de stock operativo.

**Monitoreo desde el Dashboard:** Para facilitar la toma de decisiones, el sistema centraliza la visibilidad de productos críticos directamente en el **Dashboard (`/dashboard`)**. El sistema analiza automáticamente las existencias y notifica al administrador / gerente  mediante alertas de texto cuando un producto requiere atención, sin necesidad de navegar por todo el catálogo de inventario.

El sistema identifica dos estados críticos:

- **Stock Bajo:** El producto cuenta con 5 unidades o menos, indicando la necesidad de reabastecimiento próximo.
    
- **Sin Stock:** El producto tiene 0 unidades, lo que impide la venta del mismo en terminal o tienda online.
    

**Flujo recomendado de inventario:**

1. **Revisión de Alertas:** Iniciar sesión y observar las alertas de texto en el **Dashboard** para identificar productos con stock bajo o agotados.
    
2. **Consulta Detallada:** Ingresar a `/inventory` para verificar la disponibilidad específica por sucursal y variante (talla/color).
    
3. **Acciones de Gestión:** Ajustar existencias de forma controlada o gestionar la recepción de nueva mercancía para actualizar el estado del producto en el sistema.

### 4.2 Cajero

El cajero opera desde la terminal de ventas en `/terminal`. Esta interfaz está optimizada para agilizar el registro de transacciones en piso de venta.

#### 4.2.1 Flujo de Venta

El proceso de venta sigue una secuencia lógica diseñada para el control total de la operación:

1. **Selección de Productos:** El cajero dispone de un **buscador en tiempo real** para localizar productos por nombre, así como un **selector de categorías** para filtrar el catálogo rápidamente.
    
2. **Configuración de Variante:** Antes de añadir al carrito, es obligatorio seleccionar la **talla deseada**. Una vez seleccionada, el producto se añade al carrito activo.
    
3. **Gestión de Carrito:** La interfaz muestra el desglose financiero del pedido, calculando automáticamente:
    
    - **Subtotal:** Valor bruto de los artículos.
        
    - **IVA:** Impuesto calculado según normativa.
        
    - **Descuentos:** Aplicables por porcentaje o monto fijo.
        
    - **Total:** El monto final a cobrar al cliente.
        
4. **Método de Pago:** Se abre el modal `PaymentModal` para elegir el método de pago (**Simulado**): Efectivo, Tarjeta o Transferencia.
    
5. **Ticket y Cierre de Venta:** Tras confirmar el pago, se despliega `TicketPreview`. Al seleccionar la opción de imprimir (que activa el diálogo del sistema "Guardar como PDF" o impresión física), se realiza la **finalización de la venta**:
    
    - Se registra la transacción vinculada a la sucursal activa.
        
    - Se descuenta automáticamente el inventario del producto.
        
    - La venta queda reflejada instantáneamente en el Dashboard y en el módulo de Reportes.

## 5. Manual de Compras para Clientes

_(Insertar aquí: Captura de pantalla del Catálogo Web)_

Los clientes gestionan sus pedidos desde el catálogo (`/catalog`), el carrito (`/cart`) y finalizan en el checkout (`/checkout`). El historial de compras está disponible en `/orders/history` donde pueden consultar el estado actual de su pedido.

## 6. Matriz de Pruebas Funcionales

|**ID**|**Módulo**|**Escenario**|**Resultado Esperado**|**Estado**|
|---|---|---|---|---|
|TP-01|Auth|Login Admin|Redirección a `/dashboard`|**PASSED**|
|TP-02|Inventario|Alertas (Semáforo)|Indicador visual activo|**PASSED**|
|TP-03|POS|Venta en terminal|Ticket generado con folio|**PASSED**|
|TP-04|Shop|Compra autenticada|Registro en `/orders/history`|**PASSED**|
|TP-05|Seguridad|Acceso no autorizado|Redirección a `/login`|**PASSED**|

## 7. Solución de Problemas (Troubleshooting)

Esta sección concentra incidencias comunes detectadas durante la implementación, carga inicial de datos y despliegue de POS Engine. Su objetivo es facilitar el diagnóstico técnico antes de escalar un incidente.

| **Incidente** | **Síntoma observable** | **Causa probable** | **Acción recomendada** |
|---|---|---|---|
| Seed lento | La carga inicial de datos tarda demasiado o parece detenerse | Inserciones secuenciales de ventas, inventario o variantes | Mantener la estrategia de inserción por lotes y ejecución controlada con `Promise.all`. Si el entorno es limitado, reducir temporalmente el volumen de ventas de prueba. |
| Inventario negativo | Una venta o pedido deja existencias por debajo de cero | Validación insuficiente antes de descontar stock | Validar disponibilidad antes de confirmar la venta y conservar el control de stock en memoria antes de persistir cambios en base de datos. |
| Variables de entorno faltantes | Fallos de conexión, sesiones inválidas o errores durante build/runtime | `DATABASE_URL`, `JWT_SECRET` o `JWT_CUSTOMER_SECRET` no configuradas | Verificar el archivo local de entorno y la configuración de variables en Vercel. En producción, confirmar que las variables existan en el ambiente correcto. |
| Error de conexión a PostgreSQL | Prisma no logra conectarse a la base de datos | URL inválida, credenciales incorrectas o base de datos no disponible | Revisar `DATABASE_URL`, usuario, contraseña, host, puerto y nombre de base. Confirmar que la instancia PostgreSQL acepte conexiones desde el entorno de despliegue. |
| Build fallido en Vercel | El despliegue no completa la compilación | Cliente Prisma no generado, dependencias faltantes o secretos incompletos | Confirmar que el proceso de build genere Prisma antes de compilar Next.js. Verificar dependencias como `bcryptjs`, `jose`, `@prisma/client` y las variables requeridas. |
| Sesión inválida o redirección constante a login | El usuario inicia sesión pero vuelve a `/login` | Token firmado con secreto distinto o cookie antigua | Confirmar que `JWT_SECRET` y `JWT_CUSTOMER_SECRET` sean estables. Si se cambiaron secretos, limpiar cookies del navegador y volver a iniciar sesión. |
| Fechas incorrectas en reportes | Las ventas aparecen en un día distinto al esperado | Diferencias entre UTC y zona horaria local | Usar las utilidades de fecha del proyecto para normalizar cálculos a horario de México y evitar comparaciones directas sin conversión. |
| Error al registrar pedidos del catálogo | El checkout no finaliza o no descuenta inventario | Método de entrega incompleto, sucursal no seleccionada o cliente no autenticado | Revisar que el cliente tenga sesión activa, que exista información de entrega y que el carrito conserve sucursal o dirección antes de confirmar el pedido. |

### 7.1 Preguntas frecuentes técnicas

**¿Qué revisar primero si la aplicación no inicia localmente?**  
Verificar que las dependencias estén instaladas, que exista una versión compatible de Node.js, que `DATABASE_URL` apunte a PostgreSQL y que el esquema de Prisma esté sincronizado.

**¿Qué hacer si Prisma marca error de cliente no generado?**  
Ejecutar nuevamente la generación del cliente Prisma mediante los scripts del proyecto o reinstalar dependencias para activar el proceso de postinstalación.

**¿Por qué separar `JWT_SECRET` y `JWT_CUSTOMER_SECRET`?**  
Porque el sistema maneja dos contextos de sesión: staff y clientes. Separar secretos reduce el impacto de una filtración y evita mezclar permisos entre módulos internos y tienda online.

**¿Qué información debe incluirse al reportar un incidente?**  
Debe incluirse rol del usuario, correo de prueba utilizado, ruta afectada, fecha y hora, pasos para reproducir el fallo, mensaje de error visible y captura de pantalla si está disponible.

## 8. Sección Técnica e Instalación

### 8.1 Requisitos Previos Técnicos

POS Engine requiere un entorno compatible con aplicaciones modernas de Next.js y una base de datos PostgreSQL disponible. Los requisitos se derivan de las dependencias definidas en el `package.json` del proyecto.

| **Componente** | **Requisito recomendado** | **Uso dentro del sistema** |
|---|---|---|
| Node.js | Node.js 20 LTS o superior | Entorno de ejecución para Next.js, scripts de Prisma y herramientas de desarrollo |
| Next.js | Next.js 15+; el proyecto declara `next` `^16.2.6` | Framework principal con App Router, rutas agrupadas y renderizado de la aplicación |
| React | React `19.2.4` y React DOM `19.2.4` | Construcción de interfaces interactivas para dashboard, POS, catálogo, carrito y modales |
| TypeScript | TypeScript `^5.9.3` | Tipado estático del frontend, rutas, acciones y utilidades compartidas |
| Prisma | Prisma CLI `^5.22.0` y `@prisma/client` `^5.22.0` | ORM para modelado de datos, consultas y sincronización con PostgreSQL |
| PostgreSQL | Instancia local o remota accesible mediante `DATABASE_URL` | Persistencia de usuarios, clientes, productos, inventario, ventas y pedidos |
| `pg` y adaptador Prisma | `pg` `^8.20.0` y `@prisma/adapter-pg` `^7.6.0` | Conectividad entre la aplicación, Prisma y PostgreSQL |
| `bcryptjs` | `^3.0.3` | Hash y verificación de contraseñas de usuarios internos y clientes |
| `jose` / `jsonwebtoken` | `jose` `^6.2.3` y `jsonwebtoken` `^9.0.3` | Firma, validación y manejo de tokens JWT |
| Zod | `^3.22.4` | Validación de datos y estructuras de entrada cuando aplica |
| Tailwind CSS | Tailwind CSS `^4` | Estilos utilitarios y composición visual de la interfaz |

Además, el proyecto utiliza librerías auxiliares como `decimal.js` para precisión numérica, `clsx` y `tailwind-merge` para composición de clases, ESLint para revisión estática, y `ts-node` para ejecutar procesos TypeScript como la carga inicial de datos.

### 8.2 Arquitectura general

Arquitectura: Next.js 15+, Prisma ORM, PostgreSQL, JWT.

### 8.3 Variables de entorno principales:

| **Variable**          | **Descripción**             | **Importancia / Uso**                                                                   |
| --------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Conexión a PostgreSQL       | URL por Prisma ORM para conectar el servidor con la base de datos                       |
| `JWT_SECRET`          | Secreto para empleados      | Llave criptográfica para firmar y validar tokens de administradores, gerentes y cajeros |
| `JWT_CUSTOMER_SECRET` | Secreto para clientes       | Llave independiente para aislar la seguridad de las sesiones de Clientes                |
| `SEED_PASSWORD`       | Contraseña inicial del Staff | Permite definir la contraseña base para el seed sin dejarla escrita en el código fuente |

![[Attachments/Pasted image 20260601011404.png]]

## 9. Glosario

| **Término** | **Definición** |
|---|---|
| POS | Siglas de Point of Sale o punto de venta. En POS Engine se refiere a la terminal utilizada por cajeros para registrar ventas físicas. |
| JWT | JSON Web Token. Formato de token firmado que permite validar sesiones de usuarios internos y clientes sin almacenar sesión en servidor tradicional. |
| Prisma | Herramienta de acceso a datos utilizada para definir el modelo de base de datos y ejecutar consultas contra PostgreSQL. |
| ORM | Object-Relational Mapping. Técnica que permite interactuar con una base de datos relacional mediante modelos y objetos de aplicación. |
| App Router | Sistema de enrutamiento moderno de Next.js basado en la carpeta `app`, usado para organizar rutas, layouts y grupos funcionales. |
| Vercel | Plataforma de despliegue cloud utilizada para publicar la aplicación Next.js y administrar variables de entorno de producción. |
| PostgreSQL | Sistema de base de datos relacional donde se almacenan productos, inventario, ventas, pedidos, usuarios y clientes. |
| Seed | Proceso de carga inicial de datos de prueba o datos base, como usuarios, sucursales, productos e inventario. |

## 10. Contacto

El responsable técnico y operativo del sistema es el **Equipo de Desarrollo ITSX**.

Los reportes de incidentes, solicitudes de soporte o requerimientos de mejora deben canalizarse a través del medio institucional definido por el proyecto. Para agilizar la atención, cada reporte debe incluir:

- Nombre o rol del usuario afectado.
    
- Ruta o módulo donde ocurrió el incidente.
    
- Descripción breve del problema.
    
- Pasos para reproducirlo.
    
- Fecha y hora aproximada.
    
- Evidencia visual, cuando sea posible.

El Equipo de Desarrollo ITSX será responsable de clasificar el incidente, validar su severidad, reproducir el escenario y proponer la corrección o mejora correspondiente.

## 11. Conclusiones y Mejoras Futuras

### 11.1 Conclusiones

POS Engine centraliza con éxito la operación comercial de un negocio con múltiples canales de venta. La integración entre la terminal física, el catálogo web, el control de inventario en tiempo real, los reportes analíticos y la autenticación basada en roles, permite una gestión operativa ordenada, trazable y eficiente. El sistema elimina la dispersión de información y fortalece la toma de decisiones basada en datos, facilitando el control administrativo desde cualquier ubicación mediante su despliegue en la nube.

### 11.2 Mejoras Futuras y Evolución del Sistema

Con el fin de consolidar a POS Engine como una solución integral de gestión comercial, se han identificado las siguientes áreas de evolución prioritaria:

- **Gestión Logística Integral:** Implementación de un módulo avanzado para el ciclo de vida del pedido, incluyendo:
    
    - **Seguimiento de Envíos:** Gestión de estados en tiempo real (pendiente, preparado, en tránsito, entregado).
        
    - **Recolección en Tienda (Click & Collect):** Flujo optimizado para el apartado de mercancía y validación de entrega mediante código QR.
        
    - **Gestión de Pagos:** Integración con pasarelas de pago externas y validación automatizada de transacciones.
        
- **Sistema de Apartados:** Funcionalidad para gestionar reservas de productos con abonos parciales, integrando el control de saldos pendientes en el historial de cuenta del cliente.
    
- **Auditoría y Trazabilidad:** Implementación de un módulo de logs detallado para registrar todas las modificaciones realizadas en inventarios y movimientos críticos de usuarios.
    
- **Analítica Avanzada:** Desarrollo de un panel de analítica estratégica con comparativas de rendimiento entre sucursales y predicción de demanda de productos.
    
- **Herramientas de Exportación:** Funcionalidad para la exportación de reportes operativos en formatos estándar (CSV, PDF) para auditorías externas y contabilidad.

## 12. Referencias (APA 7)

1. Next.js. (2026). _App Router Documentation_. Recuperado de [https://nextjs.org/docs](https://nextjs.org/docs)
    
2. Prisma. (2026). _Prisma ORM: Documentation_. Recuperado de [https://www.prisma.io/docs](https://www.prisma.io/docs)
    
3. Vercel. (2026). _Deployment and Hosting Documentation_. Recuperado de [https://vercel.com/docs](https://vercel.com/docs)
    
4. OpenJS Foundation. (2026). _Node.js API Reference_. Recuperado de [https://nodejs.org/docs](https://www.google.com/search?q=https://nodejs.org/docs)
    
5. PostgreSQL Global Development Group. (2026). _PostgreSQL Documentation_. Recuperado de [https://www.postgresql.org/docs](https://gemini.google.com/app/94c723303b323aae)
