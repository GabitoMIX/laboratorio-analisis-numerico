# Laboratorio Virtual de Análisis Numérico

**Sitio público:** https://gabitomix.github.io/laboratorio-analisis-numerico/

**Objeto virtual de aprendizaje (OVA)** para la asignatura de Análisis Numérico, programa de Ingeniería de Sistemas de la **Universidad Simón Bolívar, sede Cúcuta**. Proyecto académico estudiantil no oficial.

**Estudiante que presenta el proyecto:** Gabriel Argenis Medina Carrero.  
**Docente:** Anderson Smith Florez Fuentes.

El laboratorio permite introducir datos, calcular aproximaciones, visualizar tablas y gráficas e interpretar resultados de distintos métodos numéricos.

## Métodos disponibles

| Área | Herramientas |
| --- | --- |
| Interpolación | Lagrange e interpolación lineal |
| Búsqueda de raíces | Método de falsa posición |
| Ajuste de datos | Mínimos cuadrados polinomiales y regresión lineal |
| Problemas de valor inicial | Modelos `y'=f(x,y)` y condición inicial `y(x0)=y0` |
| Ecuaciones diferenciales | Euler, punto medio, Heun y Runge-Kutta de cuarto orden |
| Convergencia y estabilidad | Comparación de tamaños de paso y estabilidad local aproximada |
| Sistemas de EDO | Dos ecuaciones acopladas con Euler, Heun y RK4 |
| Visualización | Tablas de iteraciones, gráficas y exportación CSV en los módulos de EDO |

**Nota didáctica:** algunos textos llaman «Euler mejorado» al método de Heun. Este laboratorio utiliza «Euler mejorado» para el método del punto medio y mantiene Heun como método trapezoidal explícito.

## Cómo ejecutar

1. Descarga o clona el repositorio.
2. Abre `index.html` en un navegador moderno. Para servirlo localmente también puedes ejecutar:

   ```bash
   python -m http.server 8000
   ```

3. En ese caso, abre `http://localhost:8000`.

No requiere backend, cuentas ni base de datos. MathJax se carga por Internet para mostrar las fórmulas en LaTeX; el logotipo institucional se distribuye localmente en `assets/unisimon-logo.png` para evitar que desaparezca por problemas de carga externa.

## Verificación técnica

Se necesita Node.js para ejecutar las pruebas:

```bash
node --check app.js
node --check edo-core.js
node --check edo-ui.js
node --test tests/edo.test.js
```

Las pruebas automáticas cubren el analizador de expresiones, Euler, punto medio, Heun, RK4, convergencia, estabilidad, sistemas de ecuaciones y validaciones de datos.

## Organización del proyecto

```text
index.html                 Interfaz y navegación
styles.css                 Diseño general
edo.css                    Estilos de los módulos de ecuaciones diferenciales
app.js                     Interpolación, raíces, ajuste y navegación
edo-core.js                Implementación numérica de EDO y sistemas
edo-ui.js                  Controladores, tablas y visualizaciones de EDO
tests/edo.test.js          Pruebas automatizadas
assets/unisimon-logo.png   Logosímbolo institucional en la interfaz
docs/                      Manuales y guías para exposición y mantenimiento
```

## Material de consulta

- [Manual del usuario](docs/MANUAL_USUARIO.md)
- [Manual técnico](docs/MANUAL_TECNICO.md)
- [Guía de los métodos de EDO](docs/GUIA_METODOS_EDO.md)
- [Guía de sustentación](docs/GUIA_PRESENTACION.md)
- [Guía de mantenimiento en GitHub](docs/GUIA_GITHUB.md)
- [Lista de revisión](docs/REVISION_FINAL.md)

## Alcance y precisiones

Las soluciones obtenidas son aproximaciones numéricas. El método RK4 refinado empleado para comparar convergencia **no equivale a una solución analítica exacta**. El indicador de estabilidad utiliza una linealización local, por lo que no garantiza la estabilidad global de sistemas no lineales. El límite general del motor es de 1.000 pasos por ejecución.

El proyecto es una herramienta educativa y **no un producto oficial de la Universidad Simón Bolívar**. El uso de su imagen institucional está sujeto a las autorizaciones correspondientes. No se incluye licencia de software publicada.
## Presentación visual

Todos los módulos comparten una paleta verde y tipografía uniforme. El proyecto utiliza MathJax para representar fórmulas LaTeX en las vistas y resultados de los métodos. El logosímbolo se presenta únicamente como identificación de contexto académico: la aplicación no representa un sitio oficial de la universidad.
