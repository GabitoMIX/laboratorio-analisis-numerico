# Guía de Presentación del Proyecto

## 1. Introducción sugerida

Buenos días. El proyecto presentado corresponde a un laboratorio interactivo de Análisis Numérico desarrollado como recurso educativo web para apoyar el aprendizaje de métodos numéricos dentro del programa de Ingeniería de Sistemas de la Universidad Simón Bolívar, sede Cúcuta.

El objetivo principal fue convertir los procedimientos vistos en clase en actividades interactivas, donde el usuario pueda ingresar datos, ejecutar cálculos, observar el paso a paso y analizar los resultados con apoyo visual.

---

## 2. Explicación de la interfaz

La aplicación está organizada por módulos. En el menú superior se encuentran los temas principales:

- Interpolación de Lagrange.
- Interpolación lineal.
- Falsa posición.
- Mínimos cuadrados.
- Regresión lineal.
- Euler, punto medio, Heun y RK4.
- Convergencia y estabilidad.
- Sistemas de ecuaciones diferenciales.
- Acerca de.

Cada módulo funciona de manera independiente y presenta una estructura similar: entrada de datos, botón de cálculo, procedimiento matemático, tablas, resultado final y gráfica.

---

## 3. Módulo recomendado para demostrar primero

Se recomienda iniciar con **Interpolación de Lagrange**, porque muestra claramente:

1. Puntos de entrada.
2. Construcción de bases.
3. Polinomio final.
4. Evaluación de un valor.
5. Gráfica del polinomio.

Frase sugerida:

> En este módulo se ingresan puntos conocidos y el sistema construye automáticamente el polinomio interpolador, mostrando cómo se forma cada base de Lagrange y cómo se suman los aportes para obtener el resultado final.

---

## 4. Demostración de falsa posición

Frase sugerida:

> En el método de falsa posición se parte de un intervalo donde la función cambia de signo. La aplicación calcula cada aproximación, actualiza el intervalo y muestra una tabla con las iteraciones y el error aproximado.

---

## 5. Demostración de mínimos cuadrados

Frase sugerida:

> A diferencia de la interpolación, mínimos cuadrados no busca pasar exactamente por todos los puntos, sino encontrar el polinomio que mejor se ajusta minimizando el error cuadrático global.

---

## 6. Demostración de regresión lineal

Frase sugerida:

> En regresión lineal se calcula una recta de ajuste, junto con la pendiente, el intercepto, el coeficiente de correlación y el coeficiente de determinación. Esto permite interpretar qué tan bien la recta representa el comportamiento de los datos.

---

## Demostración de ecuaciones diferenciales

Usa el problema `y'=y`, con `y(0)=1`, paso `h=0.1` y extremo `x=1`. Explica el concepto de condición inicial y compara Euler con RK4. Después ingresa a **Convergencia** para mostrar cómo varían las aproximaciones cuando disminuye el paso. Recuerda que las referencias numéricas no son siempre soluciones exactas.

Para la sección **Sistemas**, presenta `y'=z`, `z'=-y`, con `y(0)=1` y `z(0)=0`, y explica que se estiman dos funciones simultáneamente.

---

## 7. Cierre sugerido

Como conclusión, este laboratorio permite reforzar el aprendizaje de Análisis Numérico mediante una herramienta práctica, visual y organizada. Además, al estar desarrollado con tecnologías web básicas, puede abrirse desde cualquier navegador, subirse a GitHub Pages y mantenerse fácilmente para futuras mejoras.
