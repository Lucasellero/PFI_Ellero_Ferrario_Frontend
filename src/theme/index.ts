/**
 * Punto de entrada del tema: paletas, medidas y tipografía (paletas.ts) + tema activo y hooks
 * (TemaProvider.tsx). Ver src/theme/README.md.
 */
export * from './paletas';
export { TemaProvider, useEstilos, useTema, type PreferenciaTema, type Tema } from './TemaProvider';
