# Lista de la compra local

Una aplicación web de lista de la compra que funciona completamente en el navegador y conserva los datos locales con IndexedDB. La app está diseñada para funcionamiento offline tras la primera carga y ofrece copia de seguridad mediante archivos JSON.

## Qué hace la aplicación

- Añadir productos con validación de texto.
- Marcar, desmarcar, eliminar y limpiar productos comprados.
- Persistencia local con IndexedDB y Dexie.
- Exportación e importación JSON con validación y prevención de duplicados por identificador.
- PWA con service worker para uso offline tras carga inicial.
- Resumen de productos pendientes y comprados.
- Diseño responsive y accesible.

## Arquitectura elegida

- React + TypeScript para la interfaz.
- Dexie para IndexedDB.
- Vite + vite-plugin-pwa para la compilación y el service worker.
- `useLiveQuery` para sincronizar la vista con la base de datos.
- Servicios separados para almacenamiento, serialización y copias de seguridad.

## Tecnologías utilizadas

- React 19
- TypeScript 5
- Vite 8
- Dexie y `dexie-react-hooks`
- Workbox vía `vite-plugin-pwa`
- Vitest + Testing Library
- ESLint

## Requisitos previos

- Node.js 20 o posterior
- npm 10 o posterior
- Un navegador moderno con soporte para IndexedDB y PWAs

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en el puerto 5173 de forma predeterminada.

## Pruebas

```bash
npm test
```

## Lint

```bash
npm run lint
```

## Generar producción

```bash
npm run build
```

La salida se genera en la carpeta `dist`.

## Despliegue en GitHub Pages

El flujo `.github/workflows/deploy.yml` compila y publica `dist` automáticamente al hacer push a `main` o `master` (también se puede ejecutar manualmente desde GitHub Actions).

1. Sube el proyecto a un repositorio llamado `shopping-list`.
2. En **Settings → Pages**, selecciona **GitHub Actions** como origen.
3. Espera a que termine el flujo **Deploy to GitHub Pages**. La aplicación estará en `https://<usuario>.github.io/shopping-list/`.

Si el repositorio tiene otro nombre, actualiza `base` en `vite.config.ts` para que coincida con la ruta pública, por ejemplo:

```ts
const base = '/nombre-del-repositorio/'
```

## Almacenamiento local

Los datos se guardan en IndexedDB mediante Dexie. No hay backend ni sincronización entre dispositivos. La app no usa localStorage como base principal.

## Modo offline

Tras la primera carga en un navegador compatible, la app puede abrirse sin conexión porque el service worker cachea los recursos principales. El contenido de la lista sigue guardándose en IndexedDB, no en la caché del navegador.

## Exportar e importar copias de seguridad

### Exportar

- Pulsa "Exportar JSON".
- Se descargará un archivo con el formato `lista-compra-YYYY-MM-DD.json`.
- El archivo incluye versión, fecha y lista de productos.

### Importar

- Pulsa "Importar y combinar" o "Reemplazar lista".
- Selecciona un archivo JSON válido.
- El sistema valida la estructura y la versión antes de modificar la base de datos.

## Limitaciones y consideraciones

- Los datos locales dependen del navegador y del dispositivo.
- Si el navegador borra datos de sitio o la persistencia local se pierde, la app puede perder la información.
- Las copias de seguridad son responsabilidad del usuario.
- La descarga inicial de la aplicación requiere conexión la primera vez.

## Recomendaciones de privacidad

- No se usa autenticación ni servicios remotos.
- La app no envía la lista a un backend.
- Los datos solo se guardan en el equipo del usuario.
