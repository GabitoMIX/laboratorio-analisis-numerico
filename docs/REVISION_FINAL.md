# Revisión Final antes de Entregar

Usa esta lista para verificar el proyecto antes de subirlo a GitHub o enviarlo al docente.

## Archivos principales

- [ ] Existe `index.html`.
- [ ] Existe `styles.css`.
- [ ] Existe `app.js`.
- [ ] Existe `README.md`.
- [ ] Existe carpeta `docs/` con manuales.
- [ ] Existen `edo-core.js`, `edo-ui.js`, `edo.css` y `tests/edo.test.js`.

## Interfaz

- [ ] Carga la pantalla principal.
- [ ] El menú superior se ve correctamente.
- [ ] Los botones cambian de módulo.
- [ ] La vista Acerca de muestra docente, estudiante y datos institucionales.
- [ ] El diseño se adapta en pantalla pequeña.

## Módulos

- [ ] Lagrange calcula y grafica correctamente.
- [ ] Interpolación lineal calcula estimación y error.
- [ ] Falsa posición genera tabla de iteraciones.
- [ ] Mínimos cuadrados genera matriz, polinomio y residuos.
- [ ] Regresión lineal genera sumatorias, modelo, `r` y `R²`.
- [ ] Euler, Heun, punto medio y RK4 generan pasos coherentes.
- [ ] Convergencia compara resultados con paso refinado.
- [ ] Sistemas de EDO grafica las dos variables.

## Documentación

- [ ] README explica el proyecto.
- [ ] Manual de usuario está completo.
- [ ] Manual técnico está completo.
- [ ] Guía de GitHub está incluida.
- [ ] Guía de presentación está incluida.

## Validación técnica

Ejecutar:

```bash
node --check app.js
node --check edo-core.js
node --check edo-ui.js
node --test tests/edo.test.js
```

Probar localmente:

```bash
python -m http.server 8000
```

Abrir:

```text
http://localhost:8000
```

## Entrega

- [ ] Comprobar los archivos publicados en GitHub.
- [ ] Subir todos los archivos.
- [ ] Activar GitHub Pages si se requiere enlace público.
- [ ] Compartir enlace del repositorio y/o enlace publicado.
