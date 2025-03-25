# catalogo_web_excel# Catálogo de Productos con Excel Local y Carrito en JavaScript

Este repositorio contiene una aplicación web que:

- **Lee datos** de un archivo Excel local (por ejemplo, `productos.xlsx`) usando la librería [SheetJS (xlsx)](https://github.com/SheetJS/sheetjs).
- **Renderiza** un catálogo filtrable y buscable.
- **Muestra** un modal con detalles de cada producto (imágenes, descripción, etc.).
- **Administra** un carrito de compras, con la opción de enviar el pedido por WhatsApp.
- **Permite** configurar el “hero” (imagen principal), colores de la marca y más, también mediante pestañas o archivos de configuración en Excel.

## Características

1. **Carga de Excel local**  
   Mediante la librería SheetJS (`xlsx`), se parsea el archivo `productos.xlsx` (u otros, como `configuracion.xlsx`, `hero.xlsx`, etc.) para obtener los datos de la aplicación.

2. **Filtrado por categorías y búsqueda**  
   Los usuarios pueden filtrar los productos por categoría o hacer búsquedas en el nombre/descripción.

3. **Modal de detalle**  
   Al hacer clic en un producto, se abre un modal con un carrusel de imágenes, la descripción y opciones de variantes (si aplica).

4. **Carrito de compras**  
   - Permite agregar productos con distinta cantidad y variantes.
   - Muestra el total y permite modificar o eliminar ítems.
   - Envía el pedido por WhatsApp, generando un enlace con el texto formateado.

5. **Configuración dinámica**  
   - El hero (imagen, texto), la marca, los colores principales y otros ajustes pueden venir de otras hojas en el mismo Excel (o en archivos separados) para mayor flexibilidad.

## Requisitos

- **Servidor local** para servir los archivos HTML, JS y CSS (p. ej., `http-server`, `live-server`, `python -m http.server`, etc.).
- **Archivo(s) Excel local**: `productos.xlsx`, `configuracion.xlsx`, etc.
- **Librería SheetJS** (`xlsx.min.js` o similar) incluida en tu proyecto para poder leer el archivo Excel.

> Nota: Si usas otra librería para parsear Excel, ajusta este README en consecuencia.

## Instrucciones de Uso


1. **Clonar el repositorio**:
   git clone https://github.com/tu-usuario/catalogo-excel-local.git
   cd catalogo-excel-local

Colocar tu(s) archivo(s) Excel en la carpeta raíz o en la carpeta que hayas configurado en tu script.js.
Por ejemplo:

catalogo-excel-local/
├─ index.html
├─ script.js
├─ styles.css
├─ productos.xlsx
└─ ...
Incluir la librería SheetJS

Descarga xlsx.full.min.js (o xlsx.mini.min.js) desde SheetJS y colócala en tu proyecto.

Añade un <script src="xlsx.full.min.js"></script> en tu index.html antes de script.js.

Configurar el script

En script.js, revisa la función que lee el Excel local (por ejemplo, usando XLSX.read(...)).

Asegúrate de que la ruta y el nombre del archivo Excel coincidan (p. ej., 'productos.xlsx').

Iniciar el servidor local
Por ejemplo, usando http-server:

npx http-server
O cualquier otro método (Live Server, Python http.server, etc.).

Abrir la app en tu navegador:

http://localhost:8080
(o el puerto que defina tu servidor).

Personalización
Colores: Modifica las variables CSS en styles.css o en la hoja de Excel (si tu script lee colores desde allí).

Hero: Ajusta la URL o el color de fondo para el hero en el Excel o directamente en el script.js.

Placeholder de búsqueda: Cambia la cadena de texto en el Excel (si se lee de ahí) o en el HTML/JS.

Estructura de Archivos (Ejemplo)

catalogo-excel-local/
├─ index.html           # Página principal
├─ styles.css           # Estilos de la aplicación
├─ script.js            # Lógica principal: lectura del Excel, render, carrito
├─ xlsx.full.min.js     # Librería SheetJS para parsear Excel
├─ productos.xlsx       # Archivo Excel local con tus productos
├─ manifest.json        # Para configuración PWA (opcional)
├─ service-worker.js    # Para funcionalidades offline (opcional)
└─ ...


Contribuciones
¡Las contribuciones son bienvenidas! Puedes:

Crear un Issue para reportar bugs o proponer mejoras.

Hacer un fork del proyecto y enviar un Pull Request con tus cambios.

Licencia
Este proyecto se distribuye bajo la Licencia MIT. Puedes usarlo, modificarlo y distribuirlo libremente, manteniendo los avisos de copyright.

Autor
Excel-ente
Desarrollador(a) / Kevin Turkienich