# Exposure Frontend

Next.js 15 dashboard for exploring nitrogen dioxide exposure across West Africa.

## Local Development

```bash
cmd /c npm install
cmd /c npm run dev
```

Open `http://localhost:3000`.

If the dev server crashes, OneDrive syncs generated files mid-run, or multiple dev servers were started from this checkout, restart with a clean Next cache:

```bash
cmd /c npm run dev:clean
```

Run only one `next dev` process per checkout because all instances share `.next`.

## Boundary Data

The Africa contour shapefile is stored in `data/shapefiles/africa-contour-map`.
The browser map imports `src/data/africaContourMap.json`, generated from that shapefile:

```bash
cmd /c npm run build:africa-contour
```

The West Africa country boundary is generated from Natural Earth Admin 0 Countries 1:50m.
The downloaded shapefile is stored in `data/shapefiles/natural-earth-admin0-50m`, and the browser maps import `src/data/westAfricaBoundary.json`:

```bash
cmd /c npm run build:west-africa-boundary
```

## Verification

```bash
cmd /c npm run build
cmd /c npm run test
cmd /c npm run smoke
```
