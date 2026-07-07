# Mapa de rutas de la maqueta

Este archivo resume qué pantallas ya existen en la maqueta estática y cuáles faltan generar para cerrar el flujo principal.

## Ya existen

- `index.html`
- `busqueda.html`
- `admin-demo.html`
- `login.html`
- `galeria.html`
- `detallearticulo.html`
- `carrito.html`
- `404.html`

## Flujo principal ya generado y pendientes

### 1. `detallearticulo.html`

Prioridad: alta
Estado: ya creada.

Motivo:

- En el home y en la búsqueda, los productos apuntan a `/DetalleArticulo/...`.
- Hoy esas rutas no tienen una página estática propia.

Qué debería cubrir:

- Nombre del producto
- Galería de imágenes
- Precio público y precio logueado
- Cantidad y agregado al carrito
- Productos relacionados
- Enlace de regreso a `busqueda.html`

### 2. `galeria.html`

Prioridad: alta
Estado: ya creada.

Motivo:

- Los banners y accesos del home apuntan a `/Galeria/...`.
- Esa navegación representa el ingreso a campañas, categorías y marcas.

Qué debería cubrir:

- Título de la galería o campaña
- Filtros básicos
- Grilla de productos
- Navegación de vuelta a `busqueda.html`

### 3. `seguridad-login.html`

Prioridad: media
Estado: cubierto por `login.html`.

Motivo:

- El login existe embebido dentro de `index.html` y `busqueda.html`, pero no como página dedicada.
- Ayuda a cerrar el flujo de acceso si querés compartir una URL directa.

Qué debería cubrir:

- Formulario de ingreso
- Recuperación de acceso
- Enlace a registro
- Enlace de regreso al home

### 4. `seguridad-register.html`

Prioridad: media

Motivo:

- En el home hay un acceso a `/Seguridad/Register`.
- No hay una pantalla estática equivalente.

Qué debería cubrir:

- Alta de usuario
- Datos básicos de cuenta
- Aceptación de términos
- Enlace al login

### 5. `carrito.html`

Prioridad: media
Estado: ya creada.

Motivo:

- La maqueta tiene lógica de carrito en JS, pero no una vista de pedido completa.
- En esta demo el flujo termina en un pedido local descargable en PDF, sin checkout ni pago.

Qué debería cubrir:

- Resumen de productos
- Cantidades
- Pedido descargable en PDF
- Volver a seguir comprando

### 6. `checkout.html`

Prioridad: media

Motivo:

- Existen URLs de checkout en el JS, pero en esta maqueta se reemplazaron por pedido local.

Qué debería cubrir:

- No aplica para esta demo

### 7. `faq.html` o bloque `#Faq`

Prioridad: baja

Motivo:

- El home y el buscador linkean a `#Faq`, pero hoy no encontré un bloque real con ese `id`.

Qué debería cubrir:

- Preguntas frecuentes
- Envíos
- Medios de pago
- Cambios y devoluciones

## Orden recomendado

1. `detallearticulo.html`
2. `galeria.html`
3. `carrito.html`
4. `checkout.html`
5. `seguridad-login.html`
6. `seguridad-register.html`
7. `faq.html` o bloque `#Faq`

## Regla práctica para esta maqueta

- Si una ruta forma parte del recorrido comercial visible, conviene generar una página estática.
- Si una ruta es solo backend de Ajax o proceso interno, conviene dejarla simulada o protegida por la lógica del frontend.
