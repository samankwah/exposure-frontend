# Exposure Frontend

Next.js 15 dashboard for exploring nitrogen dioxide exposure across West Africa.

## Local Development

```bash
cmd /c npm install
cmd /c npm run dev
```

Open `http://localhost:3000`.

## Boundary Data

The Africa contour shapefile is stored in `data/shapefiles/africa-contour-map`.
The browser map imports `src/data/africaContourMap.json`, generated from that shapefile:

```bash
cmd /c npm run build:africa-contour
```

## Verification

```bash
cmd /c npm run build
cmd /c npm run test
cmd /c npm run smoke
```
