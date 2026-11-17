# Manual Técnico

## Laboratorio Interactivo de Análisis Numérico

Este documento describe la estructura técnica del proyecto, el funcionamiento de sus archivos principales y la lógica implementada en JavaScript.

---

## 1. Descripción general

El proyecto es una aplicación web estática desarrollada con:

- HTML5
- CSS3
- JavaScript puro
- MathJax mediante CDN
- Canvas API del navegador

No utiliza frameworks, backend, base de datos ni sistema de autenticación. Toda la lógica se ejecuta en el navegador del usuario.

---

## 2. Archivos principales

### `index.html`

Contiene la estructura de la aplicación:

- Encabezado principal.
- Menú superior.
- Vista de inicio.
- Módulos interactivos.
- Sección Acerca de.
- Referencia a MathJax.
- Referencia a `styles.css` y `app.js`.

Cada módulo está representado por una etiqueta `section` con un `id` único:

```html
<section id="lagrange" class="lab-section view">
```

La clase `view` permite que JavaScript controle qué sección se muestra y cuál permanece oculta.

---

### `styles.css`

Define la presentación visual:

- Variables globales de color.
- Diseño responsive.
- Tarjetas y paneles.
- Botones.
- Formularios.
- Tablas.
- Canvas para gráficas.
- Navegación modular.
- Estilos del módulo Acerca de.

La visibilidad modular se controla con:

```css
.view { display: none; }
.view.is-active { display: block; }
```

---

### `app.js`

Contiene la lógica completa del proyecto:

- Funciones auxiliares de formato numérico.
- Lectura y validación de puntos.
- Operaciones con polinomios.
- Cálculo de métodos numéricos.
- Resolución de sistemas lineales.
- Generación dinámica de resultados.
- Renderizado de fórmulas con MathJax.
- Dibujo de gráficas con Canvas.
- Navegación entre vistas.

---

## 3. Navegación modular

Cada botón del menú tiene un atributo `data-view`:

```html
<button data-view="lagrange">Lagrange</button>
```

JavaScript lee ese atributo y muestra la vista correspondiente:

```javascript
showView(trigger.dataset.view);
```

La función `showView()`:

1. Busca la sección con el `id` solicitado.
2. Oculta todas las vistas.
3. Activa solo la vista seleccionada.
4. Actualiza el botón activo.
5. Actualiza el hash de la URL.
6. Ejecuta el cálculo inicial del módulo, si aplica.

---

## 4. Representación de polinomios

Los polinomios se representan como arreglos de coeficientes en orden ascendente:

```javascript
[a0, a1, a2]
```

Esto representa:

```text
a0 + a1x + a2x²
```

Funciones relacionadas:

- `polyAdd(a, b)` suma polinomios.
- `polyMul(a, b)` multiplica polinomios.
- `polyScale(a, s)` multiplica por escalar.
- `polyEval(coeff, x)` evalúa el polinomio.
- `polyLatex(coeff)` convierte a formato LaTeX.

---

## 5. Módulo Lagrange

Función principal:

```javascript
runLagrange()
```

Flujo:

1. Lee los puntos desde el textarea.
2. Valida que no existan valores `x` repetidos.
3. Construye cada base `L_i(x)`.
4. Suma los aportes `y_i L_i(x)`.
5. Genera el polinomio final.
6. Evalúa el polinomio si se ingresó un valor.
7. Renderiza procedimiento, tabla y gráfica.

---

## 6. Módulo Interpolación Lineal

Función principal:

```javascript
runLinearInterpolation()
```

Flujo:

1. Lee dos puntos y el valor a estimar.
2. Calcula la pendiente.
3. Evalúa la recta.
4. Calcula error porcentual si existe valor real.
5. Genera resultado y gráfica.

---

## 7. Módulo Falsa Posición

Función principal:

```javascript
runFalsePosition()
```

Flujo:

1. Lee la función y el intervalo.
2. Convierte la expresión escrita por el usuario en función evaluable.
3. Verifica cambio de signo.
4. Calcula `xr` en cada iteración.
5. Actualiza el intervalo.
6. Detiene por tolerancia o número máximo de iteraciones.
7. Genera tabla y gráfica.

---

## 8. Módulo Mínimos Cuadrados

Función principal:

```javascript
runLeastSquares()
```

Flujo:

1. Lee puntos y grado del polinomio.
2. Construye la matriz de Vandermonde.
3. Calcula `AᵀA` y `Aᵀy`.
4. Resuelve el sistema normal.
5. Calcula residuos y error cuadrático global.
6. Genera matrices, tabla y gráfica.

---

## 9. Módulo Regresión Lineal

Función principal:

```javascript
runRegression()
```

Flujo:

1. Lee puntos.
2. Calcula sumatorias.
3. Calcula pendiente e intercepto.
4. Calcula `r` y `R²`.
5. Genera tabla, modelo e interpretación.
6. Dibuja la recta de regresión.

---

## 10. Gráficas

Las gráficas se generan con la función:

```javascript
plotFunction(canvasId, points, fn, title)
```

Esta función:

- Obtiene el canvas.
- Calcula rangos de x e y.
- Toma muestras de la función.
- Dibuja la cuadrícula.
- Dibuja ejes.
- Dibuja la curva.
- Dibuja los puntos originales.

---

## 11. Renderizado matemático

MathJax se configura en `index.html` y se actualiza desde JavaScript mediante:

```javascript
renderMath()
```

Cada vez que se generan fórmulas nuevas dentro del DOM, se llama esta función para que las expresiones LaTeX se vean correctamente.

---

## 12. Consideraciones de seguridad

El módulo de falsa posición convierte expresiones del usuario a funciones JavaScript. Para reducir riesgos, el código valida caracteres permitidos y solo expone funciones matemáticas específicas.

Aun así, en un entorno de producción más robusto se recomienda usar un parser matemático especializado en lugar de `new Function()`.

---

## 13. Cómo agregar un nuevo módulo

1. Crear una nueva sección en `index.html` con clase `view`.
2. Agregar un botón con `data-view="nuevoModulo"`.
3. Crear una función `runNuevoModulo()` en `app.js`.
4. Registrar la función en `moduleRunners`.
5. Crear los estilos necesarios en `styles.css`.
6. Probar la navegación y los cálculos.

---

## 14. Validación técnica recomendada

Antes de entregar o publicar:

```bash
node --check app.js
```

También se recomienda abrir el proyecto con:

```bash
python -m http.server 8000
```

Y verificar cada módulo desde el navegador.
