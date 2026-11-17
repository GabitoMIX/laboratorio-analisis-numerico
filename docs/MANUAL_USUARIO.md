# Manual de Usuario

## Laboratorio Interactivo de Análisis Numérico

Este manual explica cómo utilizar la aplicación desde el punto de vista del estudiante o docente que desea explorar los métodos numéricos incluidos en el laboratorio.

---

## 1. Requisitos para usar la aplicación

La aplicación funciona en navegadores modernos como:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

No requiere instalación de base de datos, servidor backend ni dependencias adicionales. Solo es necesario abrir `index.html` o acceder al enlace publicado en GitHub Pages.

---

## 2. Pantalla principal

Al abrir el proyecto se muestra una pantalla de bienvenida con:

- Nombre del laboratorio.
- Descripción general del recurso.
- Fórmula representativa.
- Menú superior de navegación.
- Tarjetas de acceso a cada módulo.

El usuario puede ingresar a cada tema usando el menú superior o las tarjetas del inicio.

---

## 3. Navegación por módulos

La aplicación está organizada en vistas independientes. Para cambiar de módulo:

1. Ubica el menú superior.
2. Selecciona el tema deseado.
3. La página mostrará únicamente el módulo seleccionado.
4. Para regresar al inicio, usa el botón **Volver al menú**.

Módulos disponibles:

1. Lagrange
2. Lineal
3. Falsa posición
4. Mínimos cuadrados
5. Regresión
6. Acerca de

---

## 4. Uso del módulo de Interpolación de Lagrange

Este módulo permite construir un polinomio interpolador a partir de varios puntos.

### Formato de entrada

Los puntos se escriben uno por línea usando el formato:

```text
x;y
```

Ejemplo:

```text
0;1
1;3
2;0
```

También se puede ingresar un valor de `x` para evaluar el polinomio.

### Resultado esperado

El sistema muestra:

- Tabla de puntos ingresados.
- Fórmula general.
- Bases de Lagrange.
- Polinomio final.
- Evaluación opcional.
- Gráfica del polinomio.

---

## 5. Uso del módulo de Interpolación Lineal

Este módulo estima un valor intermedio entre dos puntos conocidos.

### Datos requeridos

- `x0`
- `f(x0)`
- `x1`
- `f(x1)`
- `x` a estimar
- Valor real opcional

### Resultado esperado

El sistema muestra:

- Sustitución de la fórmula.
- Pendiente de la recta.
- Valor estimado.
- Error porcentual, si se ingresó valor real.
- Gráfica de la recta.

---

## 6. Uso del módulo de Falsa Posición

Este módulo aproxima raíces de una función usando un intervalo `[a,b]`.

### Datos requeridos

- Función `f(x)`.
- Extremo inferior `a`.
- Extremo superior `b`.
- Número máximo de iteraciones.
- Tolerancia de error opcional.

### Funciones permitidas

Se pueden usar expresiones como:

```text
x^3 - x - 2
exp(-x) - x
sin(x)
cos(x)
log(x)
sqrt(x)
```

### Resultado esperado

El sistema muestra:

- Verificación de cambio de signo.
- Tabla de iteraciones.
- Raíz aproximada.
- Error aproximado.
- Gráfica de la función.

---

## 7. Uso del módulo de Mínimos Cuadrados

Este módulo ajusta un polinomio a un conjunto de puntos experimentales.

### Datos requeridos

- Puntos en formato `x;y`.
- Grado del polinomio.

Ejemplo:

```text
1;1.5
2;3.2
3;6.8
4;12.1
```

### Resultado esperado

El sistema muestra:

- Matriz de Vandermonde.
- Sistema normal.
- Coeficientes del polinomio.
- Error cuadrático global.
- Tabla de residuos.
- Gráfica del ajuste.

---

## 8. Uso del módulo de Regresión Lineal

Este módulo calcula un modelo lineal de la forma:

```text
y = ax + b
```

### Datos requeridos

Puntos en formato `x;y`, uno por línea.

### Resultado esperado

El sistema muestra:

- Tabla de sumatorias.
- Pendiente.
- Intercepto.
- Coeficiente de correlación `r`.
- Coeficiente de determinación `R²`.
- Gráfica de la recta de regresión.

---

## 9. Mensajes de error comunes

| Mensaje | Causa probable | Solución |
|---|---|---|
| Ingresa mínimo 2 puntos | Faltan datos suficientes | Agrega más puntos. |
| Dato inválido | Se escribió texto no numérico | Revisa el formato `x;y`. |
| No hay cambio de signo | El intervalo no encierra raíz | Cambia los valores de `a` y `b`. |
| x0 y x1 no pueden ser iguales | La interpolación lineal requiere dos puntos distintos | Modifica uno de los valores de x. |
| Grado inválido | El grado no es adecuado para los puntos | Usa un grado menor que la cantidad de puntos. |

---

## 10. Recomendaciones de uso

- Verifica que los datos estén escritos con punto y coma `;`.
- Usa punto decimal o coma decimal; ambos son aceptados.
- Revisa el procedimiento antes de copiar el resultado final.
- Compara los resultados con cálculos manuales cuando sea necesario.
- Usa los ejemplos cargados para explicar rápidamente cada módulo en una exposición.
