# Pulga 2: La Gran Plaga

Juego para celular: eres una pulga que pica, pone huevos, esquiva uñas, peines y champú, y salta de cabeza en cabeza hasta infestar la ciudad.

**Jugar:** https://luislara1612.github.io/pulga-2/

## Cómo jugar

En la pantalla de inicio eliges el modo:

- **Casa** (principal): una familia de cinco personas y su mascota vive día tras día. Tu colonia empieza con una pulga en el niño. Ganas cuando las cinco personas tienen al menos 3 pulgas adultas al mismo tiempo.
- **Clásico**: los seis niveles del mapa de la ciudad, con mejoras y gotas.

### Controles

- Arrastra el dedo para moverte y suéltalo para picar.
- Toca **Huevo** para sumar pulgas a tu colonia.
- Cuando se abre una zona amarilla, ve ahí y toca **Saltar** para pasar a otra cabeza.
- En el modo Casa: pasa sobre la comida para recogerla, toca **Casa** para ver a la familia y **Habilidad** para usar las habilidades del joven.

En computadora: flechas para moverte, `E` para poner un huevo, espacio para saltar, `P` para pausar y `1`, `2`, `3` para las habilidades.

### Modo Casa en breve

- 1 hora del juego dura 10 segundos: un día dura 4 minutos.
- Cada persona se baña cada 23 horas y pierde hasta 90 % de la colonia. Después viene el peinado y no hay reproducción durante 30 minutos.
- Las pulgas en mechones o detrás de las orejas sobreviven más al baño.
- La mascota sirve de ancla para volver a infectar a la familia, pero cada 30 días va al veterinario (con aviso un día antes) y pierde toda su colonia.
- En la cabeza del joven se desbloquean la coraza, el salto doble y el camuflaje en gel (con 3, 6 y 9 pulgas adultas).

## Estructura del proyecto

```
pulga-2/
├── index.html        Página del juego (pantallas y botones)
├── css/estilos.css   Colores, letras y acomodo
├── js/casa-sim.js    Reglas del modo Casa (sin pantalla; se prueban con Node)
├── js/juego.js       Motor de cabeza y modo Clásico
├── js/casa.js        Vista de la casa y conexión del modo Casa con el motor
├── pruebas/          Pruebas de las reglas del modo Casa
├── docs/             Propuestas y diseño
└── .vscode/          Configuración recomendada de VS Code
```

## Trabajar en VS Code

1. Abre la carpeta `pulga-2` en VS Code.
2. Instala la extensión recomendada **Live Server** (VS Code te la sugiere al abrir la carpeta).
3. Clic derecho en `index.html` → **Open with Live Server**. El juego se abre en el navegador y se recarga cada vez que guardas.

## Pruebas

Desde la carpeta `pulga-2`:

```bash
node --test
```

Para probar el modo Casa más rápido, abre el juego con `?vel=N` al final de la dirección (por ejemplo `index.html?vel=20`): el reloj de la casa corre N veces más rápido. Solo sirve para pruebas y no se guarda.

## Subir cambios a GitHub

```bash
git add .
git commit -m "Describe aquí tu cambio"
git push
```

GitHub Pages publica automáticamente lo que esté en la rama `main`.
