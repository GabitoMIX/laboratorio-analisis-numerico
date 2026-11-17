# Guía de mantenimiento en GitHub

Repositorio: <https://github.com/GabitoMIX/laboratorio-analisis-numerico>  
Rama de trabajo: `main`.

## Ejecutar localmente

```bash
git clone https://github.com/GabitoMIX/laboratorio-analisis-numerico.git
cd laboratorio-analisis-numerico
python -m http.server 8000
```

Abre `http://localhost:8000` o directamente el archivo `index.html`.

## Comprobar cambios

```bash
node --check app.js
node --check edo-core.js
node --check edo-ui.js
node --test tests/edo.test.js
```

## Publicar una mejora

```bash
git add .
git commit -m "Documentar mejora validada"
git push origin main
```

La visibilidad actual del repositorio es **pública**. GitHub Pages se puede configurar desde *Settings → Pages* si se necesita alojar una demostración. Verifica los permisos de uso de la identidad visual institucional antes de promover el sitio como material oficial; este laboratorio es independiente.
