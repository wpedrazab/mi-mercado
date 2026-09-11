# Contexto del proyecto: App de control de compras de mercado

> Este archivo resume todo lo definido en la planeación (hecha en Cowork) para que Claude Code arranque el desarrollo con el contexto completo, sin tener que repetir la conversación. Puedes pegarlo como `CLAUDE.md` en la raíz del proyecto, o dárselo como primer mensaje a Claude Code.

## Mockups de referencia
Canvas de diseño con las 11 pantallas, ya con la paleta definitiva aplicada:
https://claude.ai/code/artifact/e80842c8-cf0e-469c-988b-98cfcf9e5952

## Paleta de color y tipografía (definitiva — "Fresco y natural")

```
Fondo de página        #F3F7F0
Superficie / tarjetas  #FFFFFF
Fondo sutil / chips    #E9F0E9
Texto principal        #22302A
Texto de etiquetas     #4A5850
Texto secundario       #748577
Texto tenue / iconos   #9DAF9F
Bordes                 #DCE7DD

Acento (botones, énfasis)      #3F7A5B   (texto blanco encima: contraste 5,1:1)
Acento oscuro (enlaces, texto) #3B6E54
Acento hover                   #2E5741
Borde/fondo de estado pendiente #A9CBB4 / #F7FBF4

Barra oscura (totales)     fondo #1F2E27
  texto tenue sobre oscuro #AEC2B4
  cifra en USD             #9FD6B4
  pista de la barra        #3A4A41

Alerta / sobre presupuesto  #D1495B (barra) · #F0A2AC (texto sobre oscuro)
```

Colores de las etiquetas de categoría (independientes del tema, texto/fondo):
```
Granos y cereales  #9C7233 / #F6E9D3
Lácteos y huevos   #4C6E96 / #E4EBF3
Carnes             #A84656 / #F5E2E4
Despensa           #8A7250 / #F3ECE1
Aseo del hogar     #4F7256 / #E7EFE8
Limpieza           #6E5590 / #ECE6F2
```

Tipografía: **Fredoka** (500/600/700) para títulos, cifras grandes y botones; **Nunito** (400/600/700/800) para el resto. Ambas desde Google Fonts. Radios generosos: 12 px en campos, 16-20 px en tarjetas y botones. Área táctil mínima de 44 px en todo lo que se toca.

## Objetivo
PWA para armar la lista de mercado antes de ir a comprar, y llevar el control en vivo del carrito (precios, cantidades, totales) mientras se hace la compra en el supermercado. Multi-familia desde el inicio: pensada para uso propio y, si funciona, para que otras familias también la usen (alcance inicial: 4-5 familias, 5-7 usuarios).

## Flujo principal
1. **Antes de ir al mercado** (pantalla "Lista de mercado"): se arma la lista — categoría primero (obligatoria, catálogo desplegable que crece con el uso), luego producto (filtrado según la categoría elegida, también de un catálogo desplegable), cantidad y unidad de medida (kg, litros, unidades, etc.). Se pueden agregar categorías y productos nuevos directamente desde esta pantalla. No hay control de inventario ni de consumo en casa; la lista se arma manualmente cada vez.
2. **Al llegar al súper** (pantalla "Iniciar compra"): se indica el supermercado (desplegable de mercados usados antes, o nuevo), la fecha de la compra (por defecto hoy, editable — para cargar una compra pasada con la factura en mano), la moneda en que se van a ingresar los precios (Bs, USD o COP), la **tasa de cambio** correspondiente a la fecha de la compra (manual, no API), y opcionalmente un presupuesto.
3. **Durante la compra** (pantalla "Compra en vivo" + modal "Confirmar precio"):
   - Se puede cargar el precio de dos formas, ambas de primera clase: **foto de la etiqueta con OCR local** (Tesseract.js, sin internet y sin costo) o **carga manual del producto y el precio**. La carga manual siempre está disponible y no es un plan B: en mercados pequeños de Bogotá los precios suelen estar escritos a mano y el OCR simplemente no va a servir ahí.
   - Al agregar el producto se confirma cuántas unidades/kg se compraron; se muestra el desglose precio unitario × cantidad = subtotal (ej. Bs 145,50 c/u × 2 = Bs 291,00).
   - Se puede corregir precio o cantidad manualmente en cualquier momento.
   - Se pueden agregar productos que no estaban en la lista original (quedan marcados como "no estaba en la lista").
   - Total acumulado visible en tiempo real.
   - Si hay presupuesto, se muestran presupuesto vs. acumulado a la vez. Si se supera, solo se advierte visualmente — nunca se bloquea la compra.
4. **Al terminar** (pantalla "Advertencia al terminar" + "Cuenta final"): si quedaron productos de la lista original sin comprar, se avisa con el detalle antes de cerrar (opción de seguir comprando o terminar igual). La cuenta final muestra lo comprado y lo pendiente.

## Reglas de presentación de moneda
- Siempre se muestra el monto en la **moneda seleccionada para la compra** (tamaño principal) y debajo, en letra más pequeña, su **equivalente en USD**.
- Si la moneda seleccionada es USD, no se repite el valor — se muestra una sola cifra.

## Foto de la factura (opcional)
- Se puede adjuntar una foto de la factura o ticket como respaldo.
- **No está atada al momento del cierre**: se puede subir al cerrar la compra, o después — incluso otro día — entrando a esa compra desde el historial.
- Cada compra en el historial muestra si ya tiene factura adjunta o permite agregarla.

## Catálogos (por grupo familiar, con plantillas semilla)
Supermercados, categorías, productos y precios llevan todos `family_id` — **nada se comparte entre familias**.

Al crear una familia se le **copian** automáticamente unas plantillas semilla: las categorías base (Granos y cereales, Lácteos y huevos, Carnes, Despensa, Aseo del hogar, Limpieza) y una lista corta de productos comunes, para que nadie arranque con la pantalla vacía. Copiadas, no compartidas por referencia: desde ese momento son filas propias de esa familia y las puede renombrar o borrar sin afectar a nadie.

La comparación de precios *entre* familias queda descartada por ahora.

## Funciones post-compra (pantalla "Historial y tendencias")
- Historial de compras (fecha, supermercado, total, factura adjunta).
- Comparación de precios por producto entre supermercados y en el tiempo (dentro de la misma familia).
- Tendencias de gasto (mensual, por categoría), normalizadas en USD.

## Multi-usuario y grupos familiares

### Roles y permisos
- **Administrador** (nivel plataforma): crea grupos familiares y da de alta al usuario principal de cada uno. Puede gestionar usuarios de **cualquier** familia (crear, editar perfiles, cambiar roles). Tiene visibilidad completa de los datos de **todas** las familias y puede acceder/actuar como el usuario principal de cualquier familia para dar soporte.
- **Usuario principal**: puede invitar y quitar miembros de su familia, y puede **traspasar su rol de principal** a otro miembro. Mismo acceso a los datos que cualquier miembro.
- **Miembro**: mismo nivel de acceso a los datos que el usuario principal — todos ven y editan por igual listas, compras, presupuesto y catálogos de su familia. La única diferencia del "principal" es la gestión de membresía, no el acceso a los datos.

El rol es un campo independiente de la pertenencia a familia, y el `family_id` puede quedar vacío. **El administrador de la plataforma usa una cuenta de correo aparte, sin familia asociada**, para no mezclar responsabilidades: el correo personal del dueño se usa como usuario principal de su propia familia.

### Reglas de datos
- Un correo pertenece **a una sola familia a la vez** (el administrador puede no pertenecer a ninguna).
- Los datos pertenecen a la familia, no al usuario que los creó — si un miembro sale de la familia, sus registros permanecen intactos ahí.
- **Una familia nunca puede quedarse sin usuario principal**: antes de que el principal salga o sea desactivado, el rol debe traspasarse a otro miembro. La app valida esto; el administrador también puede reasignarlo como respaldo.
- Aislamiento de datos: cada tabla lleva `family_id`, reforzado con Row Level Security (RLS) de Postgres/Supabase (con excepción de acceso amplio para el rol administrador).

### Baja de familias y usuarios
- **Dar de baja una familia**: se marca la familia como `inactiva` y el RLS lo verifica — ningún miembro de esa familia entra, ni el principal ni los demás. Los datos quedan intactos y el administrador puede reactivarla.
- **Dar de baja un usuario**: campo propio de activo/inactivo en el perfil, sin tocar la familia.

### Caso de uso real a soportar (cambio de familia)
El dueño es usuario principal de su familia en Venezuela. Al mudarse a Bogotá creará otra familia allá: traspasa el rol de principal a su esposa, sale de la familia de Venezuela, y el administrador lo da de alta como principal de la nueva familia en Bogotá. Consecuencia esperada y aceptada: **el historial de Venezuela se queda con esa familia** y no viaja con él; desde su cuenta personal en Bogotá arranca con catálogo semilla nuevo. Sigue pudiendo consultar el historial de la familia en Venezuela, pero entrando con la cuenta de administrador.

### Acceso
Correo + contraseña vía Supabase Auth, con recuperación de contraseña desde el inicio. No hay registro abierto — el administrador crea al usuario principal de cada familia por invitación; el usuario principal invita a los demás miembros de la misma forma. Si se invita un correo que ya pertenece a otra familia, la app devuelve un error claro.

## Funcionalidades confirmadas (roadmap, no todas para el MVP inicial)
- Historial de precios por producto y supermercado.
- Presupuesto con alerta al superar el límite (sin bloquear).
- Historial de gasto mensual / por categoría.
- Lista compartida en tiempo real entre miembros de la familia.
- Sugerencias de reemplazo con IA si un producto no está o subió de precio.
- Resumen/insight con IA al cierre de la compra.
- Compartir el ticket final por WhatsApp o como PDF.
- Entrada por voz para anotar productos.
- Comparar total estimado (presupuesto) vs. total real.
- Modo offline (crítico).
- Selección de moneda de entrada (Bs / USD / COP).
- Foto de la factura como respaldo, adjuntable después.

## Descartado / pospuesto
- Control de inventario o consumo en casa.
- Lectura de código de barras (por ahora).
- Tasa de cambio automática vía API (siempre manual).
- Registro abierto de usuarios (siempre por invitación).
- Permisos diferenciados dentro de una familia (todos los miembros son iguales).
- Comparación de precios entre familias distintas.

## Decisiones técnicas
- **Tipo de app**: PWA (Progressive Web App) — responsive, instalable, con Service Worker para funcionar offline.
- **OCR de precios**: Tesseract.js local en el dispositivo, sin internet ni costo. Configurarlo para reconocer solo dígitos, coma, punto y símbolos de moneda (mejora bastante la precisión en etiquetas). Los archivos de idioma (~10-15 MB) se cachean con el Service Worker. **La carga manual de producto y precio es un camino de primera clase, siempre disponible** — no se depende del OCR.
- **Moneda**: cada precio guarda la moneda de ingreso, el número tal como se tecleó, la tasa de cambio usada y el equivalente en USD ya calculado. El USD es la moneda de normalización para historial, comparaciones y tendencias. El equivalente en USD se guarda calculado (no se recalcula después), para que cada compra conserve la tasa que realmente aplicó ese día.
- **Base de datos y autenticación**: Supabase (Postgres). Supabase Auth maneja login, recuperación de contraseña e invitaciones. RLS aplica el aislamiento por `family_id` y verifica que la familia esté activa.
- **Arquitectura de datos local-first (decisión de arranque, no una capa que se agrega al final)**: las pantallas nunca leen ni escriben directo contra Supabase; siempre pasan por una capa local (Dexie/IndexedDB) y un servicio de sincronización que empuja a Supabase cuando hay señal. Esto aplica al **flujo de compra** (listas, compras, ítems y catálogos). La administración y gestión de familia queda online-only — nunca se crean usuarios desde el pasillo del supermercado. Conflictos en el MVP: gana la última escritura.
- **Almacenamiento de facturas**: Supabase Storage, bucket privado, organizado por familia y compra, con política de acceso limitada a la familia dueña. La imagen se comprime en el celular antes de subir (ancho máx. ~1200 px, calidad ~70%, típicamente <200 KB). El registro de la compra guarda solo la referencia al archivo; si no hay señal, la subida queda en cola.
- **Hosting**: Vercel.
- **Escala esperada**: 4-5 familias, 5-7 usuarios — cómodo dentro del tier gratuito de Supabase y Vercel.

## Modelo de datos (borrador de campos clave)
```
families        id, nombre, estado (activa|inactiva), created_at
profiles        id (= auth.users.id), email, nombre, rol (admin|principal|miembro),
                family_id (nullable), activo, created_at
categories      id, family_id, nombre
products        id, family_id, category_id, nombre, unidad_default
stores          id, family_id, nombre
shopping_lists  id, family_id, fecha, estado
list_items      id, list_id, product_id, cantidad, unidad
purchases       id, family_id, store_id, fecha_compra, moneda (VES|USD|COP),
                tasa_cambio, presupuesto_usd (nullable), estado (en_curso|cerrada),
                creada_por, factura_path (nullable), created_at
purchase_items  id, purchase_id, product_id, cantidad, unidad,
                precio_unitario, precio_unitario_usd, subtotal, subtotal_usd,
                fuera_de_lista (bool)
```
Notas: se permiten **varias compras `en_curso` a la vez dentro de una misma familia** (dos miembros comprando en tiendas distintas el mismo día), y al abrir la app se muestran las compras en curso para retomarlas donde iban.

## Sugerencia de orden de desarrollo del MVP
1. Setup del proyecto (Vite + React/PWA, repo git, Vercel conectado).
2. Modelo de datos en Supabase + políticas RLS + **decisión de la capa local-first de acceso a datos** (Dexie/IndexedDB y servicio de sincronización), antes de construir pantallas.
3. Autenticación: login, recuperación de contraseña, rutas protegidas, rol admin vs. miembro, verificación de familia activa.
4. Panel de administrador (crear familia + usuario principal, plantillas semilla) y gestión de familia (invitar/quitar miembros, traspasar rol de principal).
5. Flujo core: lista de mercado → iniciar compra (mercado, fecha, moneda, tasa, presupuesto) → compra en vivo (carga manual + OCR) → confirmar precio/cantidad → advertencia de faltantes → cuenta final.
6. Sincronización offline afinada (resolución de conflictos, cola de subidas).
7. Historial y tendencias, con adjuntar factura a compras pasadas.
8. Pulido de diseño contra los mockups (la paleta ya está definida arriba) y despliegue a Vercel.
