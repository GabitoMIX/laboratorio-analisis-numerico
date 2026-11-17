# Laboratorio Virtual de Análisis Numérico · Versión 2.0

**Objeto virtual de aprendizaje (OVA)** para Ingeniería de Sistemas, **Universidad Simón Bolívar — sede Cúcuta**. Es un **proyecto académico estudiantil**, no un producto oficial de la institución.

La versión 2.0 amplía el laboratorio web original con herramientas de modelación, problemas de valor inicial (PVI) y solución numérica de ecuaciones diferenciales ordinarias (EDO). Conserva los cinco módulos previos.

## Funcionalidades

| Área | Métodos y herramientas |
| --- | --- |
| Interpolación | Lagrange e interpolación lineal (módulos conservados) |
| Raíces | Falsa posición (módulo conservado) |
| Ajuste de datos | Mínimos cuadrados y regresión lineal (módulos conservados) |
| Modelación y PVI | Funciones `y'=f(x,y)`, condición inicial y paso `h` |
| Métodos para EDO | Euler explícito, Euler mejorado por punto medio, Heun y Runge-Kutta 4 |
| Ingeniería y leyes de conservación | Ejemplos de crecimiento, enfriamiento y balance de masa |
| Convergencia y estabilidad | Comparación con pasos `h`, `h/2`, `h/4`; error respecto a RK4 refinado; indicador de estabilidad absoluta de la linealización local |
| Sistemas de EDO | Dos ecuaciones acopladas `y'=f(x,y,z)` y `z'=g(x,y,z)`; Euler, Heun o RK4 |
| Visualización | Tablas, primeros pasos, gráficas `canvas` y exportación a CSV e impresión a PDF de los módulos nuevos |

**Nota didáctica:** algunos libros llaman «Euler mejorado» al método de Heun. Para ofrecer dos variantes distintas, este programa llama *Euler mejorado* al método del punto medio y *Heun* al método trapezoidal explícito. Confirma la convención de tu profesor antes de sustentar.

## Abrir en computador

1. Descomprime el proyecto.
2. Abre `index.html` con el navegador, o ejecuta un servidor local:

   ```bash
   python -m http.server 8000
   ```

3. Navega a `http://localhost:8000`.

**No necesita backend ni base de datos.** MathJax, utilizado por la versión original, se carga por CDN y requiere conexión a Internet para mostrar las fórmulas. El logo institucional se referencia desde la página oficial de la universidad y también requiere conectividad. Si no carga, los textos institucionales permanecen disponibles.

## Pruebas numéricas automáticas

Si tienes Node.js:

```bash
node --test tests/edo.test.js
```

Se comprueban el análisis seguro de expresiones, Euler, Heun, punto medio, RK4, ajuste del último paso, sistemas de EDO, convergencia, estabilidad y validaciones.

## Subir al repositorio vacío de GitHub

Crea el repositorio `GabitoMIX/laboratorio-analisis-numerico` sin README, sin licencia y sin `.gitignore` iniciales. Desde PowerShell o Git Bash dentro de la carpeta descomprimida:

```bash
git init
git add .
git commit -m "Versión 2.0: EDO, sistemas, convergencia e identidad visual"
git branch -M main
git remote add origin https://github.com/GabitoMIX/laboratorio-analisis-numerico.git
git push -u origin main
```

**Mantén el repositorio privado** hasta aclarar los permisos de reutilización, autoría y el uso del logotipo. Más pasos en `docs/GUIA_GITHUB.md`.

## Estructura

```
index.html           # Interfaz completa y navegación SPA
styles.css           # Estilos heredados
edo.css              # Paleta de universidad y estilos nuevos
app.js               # Módulos previos y navegación SPA
edo-core.js          # Métodos numéricos independientes del DOM
edo-ui.js            # Formularios, pasos, tablas, CSV y gráficas nuevas
tests/edo.test.js    # Pruebas matemáticas
docs/                # Manuales y documentación conservada
docs/                # Guías, manuales y alcance de la versión 2.0
```

## Créditos y derechos

- **Base anterior:** proyecto académico entregado a nombre de **Kevin Eduardo García Moreno**. Mantuvimos su atribución y estructura funcional. Se requiere aclarar la participación de los colaboradores y obtener el consentimiento correspondiente antes de distribuir públicamente la obra derivada.
- **Ampliación y rediseño v2.0:** nueva implementación preparada para el proyecto de **Gabriel Argenis Medina Carrero**, pendiente de revisión de responsables, pruebas de aceptación y definición final de autores antes de cualquier trámite de derechos de autor.
- **Universidad:** identidad visual de referencia de la Universidad Simón Bolívar. El manual de imagen prohíbe deformar o modificar el logosímbolo; usarlo en una publicación debe respetar las condiciones institucionales. Fuente: https://www.unisimon.edu.co/servicios/planeacion/servicios/471

**Este repositorio aún no incluye licencia de software.** No presumas que el código o los recursos de la versión original son de dominio público. Verifica autorizaciones antes de compartir el ZIP públicamente.

## Límites científicos del programa

- Las soluciones son **aproximaciones numéricas**, sensibles a h y al modelo.
- La «referencia» para errores de convergencia es **RK4 refinado**, no solución exacta; sirve para exploración didáctica.
- El criterio de estabilidad se calcula con **derivada local estimada** y no prueba estabilidad global en sistemas ni EDO no lineales.
- El motor soporta expresiones matemáticas elementales; no es un CAS simbólico. El límite normal es 1000 pasos por corrida.
- Los modelos prediseñados son ilustrativos y no reemplazan criterios de ingeniería.

## Archivos que no se incluyen en GitHub

Se han **excluido las fotografías personales, las ilustraciones de perfil y los PDF antiguos** de `resource/`, porque el sitio puede funcionar sin ellos. Se conservan los créditos en texto. El paquete ZIP anterior sirve como respaldo local de esos recursos mientras se aclaran las autorizaciones de distribución.
