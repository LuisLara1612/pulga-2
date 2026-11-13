# Pulga 2: La Gran Plaga

Juego para celular: eres una pulga que pica, pone huevos, esquiva uñas, peines y champú, y salta de cabeza en cabeza hasta infestar la ciudad.

**Jugar:** https://luislara1612.github.io/pulga-2/

## Cómo jugar

- Arrastra el dedo para moverte y suéltalo para picar.
- Toca **Huevo** para sumar pulgas a tu colonia.
- Cuando la colonia esté completa, ve a la zona amarilla y toca **Saltar**.

En computadora: flechas para moverte, `E` para poner un huevo, espacio para saltar y `P` para pausar.

## Estructura del proyecto

```
pulga-2/
├── index.html        Página del juego (pantallas y botones)
├── css/estilos.css   Colores, letras y acomodo
├── js/juego.js       Toda la lógica del juego
├── docs/             Propuestas y diseño
└── .vscode/          Configuración recomendada de VS Code
```

## Trabajar en VS Code

1. Abre la carpeta `pulga-2` en VS Code.
2. Instala la extensión recomendada **Live Server** (VS Code te la sugiere al abrir la carpeta).
3. Clic derecho en `index.html` → **Open with Live Server**. El juego se abre en el navegador y se recarga cada vez que guardas.

## Subir cambios a GitHub

```bash
git add .
git commit -m "Describe aquí tu cambio"
git push
```

GitHub Pages publica automáticamente lo que esté en la rama `main`.
