# Pulga 2: La Familia (propuesta)

Documento original: https://claude.ai/artifact/L8VWM9v7pUz4g4eNstveAL

**Idea central:** el juego deja de ser una lista de niveles y pasa a ser una casa con familia, que vive día tras día. La colonia se mueve entre cabezas y mascotas mientras la familia se baña, se peina y lleva al perro al veterinario. Se gana cuando toda la familia está infestada al mismo tiempo.

**Reloj del juego:** 1 hora del juego ≈ 10 segundos reales (un día ≈ 4 minutos).

## 1. Huéspedes por edad

- **Niños de 5 a 13 años:** mayor contagio y dispersión de huevos y larvas. Mucha comida. Riesgo: revisiones de la escuela y peinado de mamá.
- **Jóvenes de 14 a 17 años:** menos contagio, pulgas más resistentes y habilidades especiales (coraza, salto doble, camuflaje en gel). Riesgo: gel, cera y secadora.
- **Adultos de 18 a 45 años:** contagio corto, más peligro por sus movimientos y menos comida. Sirven de puente al trabajo o a otra casa.
- **Bonus, mascotas (perro, gato, hurón, conejo):** se puede anclar una colonia para volver a infectar a la familia. Veterinario cada 30 días, con aviso un día antes.

## 2. Alimentos

- **Niños:** frituras (más crecimiento y reproducción), dulces (velocidad para esquivar peine, broches, cepillos y champú), piel seca (más dispersión de huevos y crías).
- **Jóvenes:** sudor del deporte (recarga la energía de las habilidades) y grasa del pelo (mucha sangre, pero resbalas).
- **Adultos:** comida escasa, solo en la nuca y detrás de las orejas.

## 3. Higiene

- **Baño diario cada 23 horas:** pierden movilidad y comida; pérdida de colonia de 85 % a 90 % como máximo.
- **Peinado y secado después del baño:** pérdida de huevos y crías; sin reproducción durante 30 minutos del juego.
- **Gel y cera:** movimiento difícil, pulgas amontonadas y la comida tarda en aparecer.

## 4. Modo primera persona

Modo aparte en 3D para recorrer una cabeza desde los ojos de la pulga: el pelo es un bosque, las uñas caen del cielo y el champú es una inundación. La vista desde arriba sigue siendo el modo de estrategia.

Implementado como modo **Primera persona**: eliges una cabeza de la familia y ganas si sobrevives 2 baños y juntas 10 pulgas adultas. Usa las mismas reglas del modo Casa para esa cabeza y no toca las partidas guardadas. No incluye mascotas, saltos entre cabezas ni habilidades.

## Estado

- Secciones 1 a 3: implementadas como modo **Casa** (el juego de niveles sigue disponible como modo **Clásico**).
- Sección 4: implementada como modo **Primera persona**.

Los planes completos están en OpenSpec, en la carpeta `openspec/changes/` que está junto a `pulga-2` (fuera de este repositorio): `casa-con-familia/` y `modo-primera-persona/`.
