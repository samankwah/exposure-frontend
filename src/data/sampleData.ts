import type {
  AnnualMetric,
  City,
  Country,
  Filters,
  FireActivityPoint,
  Hotspot,
  InterpolatedNo2Cell,
  MapCityRankingRow,
  MapMetricMode,
  MonthlyMetric,
  RankingRow,
  Season,
  SummaryMetric,
  TrendPoint
} from "@/types/exposure";
import { NO2_COLUMN_UNIT, NO2_COLUMN_UNIT_LABEL } from "@/data/webData";
import westAfricaBoundary from "./westAfricaBoundary.json";

export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
export { NO2_COLUMN_UNIT, NO2_COLUMN_UNIT_LABEL };

export const REGIONS = [
  { id: "west-africa", label: "West Africa", countryIds: [] },
  { id: "gulf-of-guinea", label: "Gulf of Guinea", countryIds: ["gha", "nga", "ben", "tgo", "civ"] },
  { id: "sahel", label: "Sahel", countryIds: ["sen", "bfa", "mli", "ner"] },
  { id: "mano-river", label: "Mano River", countryIds: ["gin", "lbr", "sle", "civ"] }
] as const;

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

export const DEFAULT_FILTERS: Filters = {
  regionId: "west-africa",
  countryId: "all",
  cityId: "all",
  year: 2025,
  startYear: 2020,
  endYear: 2025,
  month: "all",
  season: "all"
};

export const COUNTRIES: Country[] = [
  {
    id: "gha",
    iso3: "GHA",
    name: "Ghana",
    region: "Gulf of Guinea",
    population: 34120000,
    centroid: [-1.02, 7.95],
    baselineNo2: 18.4,
    polygon: [[-3.35, 4.75], [1.24, 4.75], [1.24, 11.2], [-3.35, 11.2], [-3.35, 4.75]]
  },
  {
    id: "nga",
    iso3: "NGA",
    name: "Nigeria",
    region: "Gulf of Guinea",
    population: 229200000,
    centroid: [8.67, 9.08],
    baselineNo2: 24.7,
    polygon: [[2.68, 4.1], [14.7, 4.1], [14.7, 13.9], [2.68, 13.9], [2.68, 4.1]]
  },
  {
    id: "sen",
    iso3: "SEN",
    name: "Senegal",
    region: "Sahel Atlantic",
    population: 18130000,
    centroid: [-14.45, 14.5],
    baselineNo2: 14.8,
    polygon: [[-17.55, 12.2], [-11.35, 12.2], [-11.35, 16.7], [-17.55, 16.7], [-17.55, 12.2]]
  },
  {
    id: "civ",
    iso3: "CIV",
    name: "Cote d'Ivoire",
    region: "Mano-Gulf",
    population: 31200000,
    centroid: [-5.55, 7.54],
    baselineNo2: 16.6,
    polygon: [[-8.6, 4.35], [-2.5, 4.35], [-2.5, 10.75], [-8.6, 10.75], [-8.6, 4.35]]
  },
  {
    id: "ben",
    iso3: "BEN",
    name: "Benin",
    region: "Gulf of Guinea",
    population: 14110000,
    centroid: [2.3, 9.33],
    baselineNo2: 15.7,
    polygon: [[0.78, 6.2], [3.85, 6.2], [3.85, 12.42], [0.78, 12.42], [0.78, 6.2]]
  },
  {
    id: "tgo",
    iso3: "TGO",
    name: "Togo",
    region: "Gulf of Guinea",
    population: 9300000,
    centroid: [0.82, 8.62],
    baselineNo2: 13.9,
    polygon: [[-0.15, 6.1], [1.81, 6.1], [1.81, 11.15], [-0.15, 11.15], [-0.15, 6.1]]
  },
  {
    id: "bfa",
    iso3: "BFA",
    name: "Burkina Faso",
    region: "Sahel",
    population: 23830000,
    centroid: [-1.56, 12.24],
    baselineNo2: 12.8,
    polygon: [[-5.55, 9.4], [2.4, 9.4], [2.4, 15.15], [-5.55, 15.15], [-5.55, 9.4]]
  },
  {
    id: "mli",
    iso3: "MLI",
    name: "Mali",
    region: "Sahel",
    population: 24480000,
    centroid: [-3.99, 17.57],
    baselineNo2: 11.9,
    polygon: [[-12.25, 10.15], [4.25, 10.15], [4.25, 25.0], [-12.25, 25.0], [-12.25, 10.15]]
  },
  {
    id: "ner",
    iso3: "NER",
    name: "Niger",
    region: "Sahel",
    population: 27300000,
    centroid: [8.08, 17.61],
    baselineNo2: 12.3,
    polygon: [[0.15, 11.7], [15.95, 11.7], [15.95, 23.55], [0.15, 23.55], [0.15, 11.7]]
  },
  {
    id: "gin",
    iso3: "GIN",
    name: "Guinea",
    region: "Mano River",
    population: 14750000,
    centroid: [-10.94, 10.44],
    baselineNo2: 10.7,
    polygon: [[-15.1, 7.2], [-7.65, 7.2], [-7.65, 12.75], [-15.1, 12.75], [-15.1, 7.2]]
  },
  {
    id: "lbr",
    iso3: "LBR",
    name: "Liberia",
    region: "Mano River",
    population: 5600000,
    centroid: [-9.43, 6.43],
    baselineNo2: 9.6,
    polygon: [[-11.55, 4.25], [-7.35, 4.25], [-7.35, 8.55], [-11.55, 8.55], [-11.55, 4.25]]
  },
  {
    id: "sle",
    iso3: "SLE",
    name: "Sierra Leone",
    region: "Mano River",
    population: 8900000,
    centroid: [-11.78, 8.46],
    baselineNo2: 10.1,
    polygon: [[-13.3, 6.9], [-10.25, 6.9], [-10.25, 10.05], [-13.3, 10.05], [-13.3, 6.9]]
  }
];

export const CITIES: City[] = [
  { id: "accra", name: "Accra", countryId: "gha", population: 2560000, coordinates: [-0.19, 5.56] },
  { id: "kumasi", name: "Kumasi", countryId: "gha", population: 3490000, coordinates: [-1.62, 6.69] },
  { id: "lagos", name: "Lagos", countryId: "nga", population: 16600000, coordinates: [3.38, 6.52] },
  { id: "abuja", name: "Abuja", countryId: "nga", population: 3770000, coordinates: [7.49, 9.07] },
  { id: "kano", name: "Kano", countryId: "nga", population: 4670000, coordinates: [8.52, 12.0] },
  { id: "dakar", name: "Dakar", countryId: "sen", population: 3930000, coordinates: [-17.45, 14.69] },
  { id: "abidjan", name: "Abidjan", countryId: "civ", population: 5680000, coordinates: [-4.02, 5.36] },
  { id: "cotonou", name: "Cotonou", countryId: "ben", population: 780000, coordinates: [2.43, 6.37] },
  { id: "lome", name: "Lome", countryId: "tgo", population: 2100000, coordinates: [1.22, 6.13] },
  { id: "ouaga", name: "Ouagadougou", countryId: "bfa", population: 2920000, coordinates: [-1.52, 12.37] },
  { id: "bamako", name: "Bamako", countryId: "mli", population: 2920000, coordinates: [-8.0, 12.64] },
  { id: "niamey", name: "Niamey", countryId: "ner", population: 1390000, coordinates: [2.11, 13.51] },
  { id: "conakry", name: "Conakry", countryId: "gin", population: 2050000, coordinates: [-13.68, 9.64] },
  { id: "monrovia", name: "Monrovia", countryId: "lbr", population: 1670000, coordinates: [-10.8, 6.31] },
  { id: "freetown", name: "Freetown", countryId: "sle", population: 1210000, coordinates: [-13.23, 8.48] }
];

const round = (value: number, digits = 1) => Number(value.toFixed(digits));

const seasonForMonth = (month: number): Exclude<Season, "all"> =>
  month <= 4 || month >= 11 ? "dry" : "wet";

const annualNo2 = (country: Country, year: number) => {
  const countryIndex = COUNTRIES.findIndex((item) => item.id === country.id);
  const yearIndex = YEARS.indexOf(year);
  const recovery = year === 2020 ? -1.9 : yearIndex * 0.55;
  const industrial = country.id === "nga" ? 1.8 : country.id === "gha" || country.id === "civ" ? 0.9 : 0;
  const sahelDust = country.region === "Sahel" ? 0.7 : 0;
  const wave = Math.sin((countryIndex + 1) * 0.9 + yearIndex * 0.7) * 0.85;
  return round(country.baselineNo2 + recovery + industrial + sahelDust + wave);
};

export const ANNUAL_METRICS: AnnualMetric[] = COUNTRIES.flatMap((country) =>
  YEARS.map((year) => {
    const no2 = annualNo2(country, year);
    const dryNo2 = round(no2 + (country.region === "Sahel" ? 3.4 : 2.2));
    const wetNo2 = round(no2 - (country.region === "Sahel" ? 1.8 : 1.2));
    const fireCount = Math.round((country.region === "Sahel" ? 920 : 410) + no2 * 17 + (year - 2019) * 38);
    const populationExposure = round((no2 * country.population) / 1_000_000, 0);

    return {
      countryId: country.id,
      year,
      no2,
      dryNo2,
      wetNo2,
      populationExposure,
      fireCount
    };
  })
);

export const MONTHLY_METRICS: MonthlyMetric[] = COUNTRIES.flatMap((country) =>
  YEARS.flatMap((year) => {
    const annual = ANNUAL_METRICS.find((metric) => metric.countryId === country.id && metric.year === year);
    if (!annual) return [];

    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const season = seasonForMonth(month);
      const dryBoost = season === "dry" ? 2.4 : -1.0;
      const harmattan = country.region === "Sahel" && season === "dry" ? 1.3 : 0;
      const cycle = Math.cos((month - 1) / 12 * Math.PI * 2) * 1.2;
      const no2 = round(annual.no2 + dryBoost + harmattan + cycle);
      const fireCount = Math.max(35, Math.round(annual.fireCount / 12 + (season === "dry" ? 130 : -55) + cycle * 24));

      return {
        countryId: country.id,
        year,
        month,
        season,
        no2,
        fireCount,
        populationExposure: round((no2 * country.population) / 1_000_000, 0)
      };
    });
  })
);

const GENERATED_HOTSPOTS: Hotspot[] = CITIES.map((city, index) => {
  const country = COUNTRIES.find((item) => item.id === city.countryId)!;
  const no2 = round(country.baselineNo2 + Math.log10(city.population) * 2.1 + (index % 3) * 1.4);
  const fireIntensity = Math.round((country.region === "Sahel" ? 76 : 42) + (index % 5) * 9);
  const category: Hotspot["category"] =
    index % 4 === 0 ? "transport" : index % 4 === 1 ? "urban" : index % 4 === 2 ? "industrial" : "fire";

  return {
    id: `hotspot-${city.id}`,
    countryId: city.countryId,
    cityId: city.id,
    label: city.name,
    coordinates: city.coordinates,
    no2,
    fireIntensity,
    populationExposure: round((no2 * city.population) / 100_000, 0),
    category
  };
});

export const HOTSPOTS: Hotspot[] = GENERATED_HOTSPOTS.concat([
  {
    id: "hotspot-volta-fire",
    countryId: "gha",
    label: "Volta dry season plume",
    coordinates: [0.5, 7.2],
    no2: 26.1,
    fireIntensity: 91,
    populationExposure: 330,
    category: "fire"
  },
  {
    id: "hotspot-kaduna-corridor",
    countryId: "nga",
    label: "Kaduna transport corridor",
    coordinates: [7.44, 10.52],
    no2: 34.7,
    fireIntensity: 67,
    populationExposure: 1180,
    category: "transport"
  },
  {
    id: "hotspot-dakar-industrial",
    countryId: "sen",
    label: "Dakar industrial zone",
    coordinates: [-17.33, 14.75],
    no2: 27.6,
    fireIntensity: 39,
    populationExposure: 610,
    category: "industrial"
  }
]);

const CITY_HOTSPOTS = HOTSPOTS.filter(
  (hotspot): hotspot is Hotspot & { cityId: string } => Boolean(hotspot.cityId)
);

const NPWEI_COMPONENT_MAXES = {
  fireIntensity: Math.max(1, ...CITY_HOTSPOTS.map((hotspot) => hotspot.fireIntensity)),
  no2: Math.max(1, ...CITY_HOTSPOTS.map((hotspot) => hotspot.no2)),
  populationExposure: Math.max(1, ...CITY_HOTSPOTS.map((hotspot) => hotspot.populationExposure))
};

export const FIRE_ACTIVITY_POINTS: FireActivityPoint[] = COUNTRIES.flatMap((country, countryIndex) => {
  const longitudes = country.polygon.map(([longitude]) => longitude);
  const latitudes = country.polygon.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const count = country.region === "Sahel" ? 42 : country.id === "nga" || country.id === "gha" || country.id === "civ" ? 34 : 24;
  const dryMonths = [1, 2, 3, 4, 11, 12];
  const wetMonths = [5, 6, 7, 8, 9, 10];

  return Array.from({ length: count }, (_, index) => {
    const seed = (countryIndex + 1) * 97 + index * 31;
    const longitudeFactor = (Math.sin(seed * 12.9898) + 1) / 2;
    const latitudeFactor = (Math.sin(seed * 78.233) + 1) / 2;
    const month = index % 4 === 0 ? wetMonths[(index + countryIndex) % wetMonths.length] : dryMonths[(index + countryIndex) % dryMonths.length];
    const sahelBoost = country.region === "Sahel" ? 38 : 0;
    const gulfBoost = country.region.includes("Gulf") || country.id === "nga" ? 16 : 0;

    return {
      id: `fire-${country.id}-${index}`,
      countryId: country.id,
      label: `${country.name} fire pixel ${index + 1}`,
      coordinates: [
        round(minLongitude + longitudeFactor * (maxLongitude - minLongitude), 3),
        round(minLatitude + latitudeFactor * (maxLatitude - minLatitude), 3)
      ],
      frp: round(18 + sahelBoost + gulfBoost + Math.abs(Math.sin(seed * 0.41)) * 116, 1),
      month,
      season: seasonForMonth(month)
    };
  });
});

const OVERVIEW_TREND: Record<number, number> = {
  2020: 2.08,
  2021: 2.21,
  2022: 2.32,
  2023: 2.39,
  2024: 2.45,
  2025: 2.51
};

const MEAN_COLUMN_SCALE = 2.45 / 17.7;
const COUNTRY_COLUMN_SCALE = 4.72 / 28.6;
const HOTSPOT_COLUMN_SCALE = 8.61 / 42.7;
export const INTERPOLATION_RESOLUTION_KM = 27;
export const INTERPOLATION_CELL_DEGREES = INTERPOLATION_RESOLUTION_KM / 111.32;
export const WEST_AFRICA_INTERPOLATION_BOUNDS = [-17.8, 4.0, 16.2, 27.4] as const;

const REGIONAL_NO2_ANCHORS = [
  { label: "Mauritania", coordinates: [-10.2, 20.4], value: 1.11, weight: 0.95 },
  { label: "Mali", coordinates: [-3.8, 17.4], value: 1.82, weight: 1.1 },
  { label: "Niger", coordinates: [8.2, 17.5], value: 1.52, weight: 1.1 },
  { label: "Senegal", coordinates: [-14.4, 14.5], value: 2.53, weight: 1.15 },
  { label: "The Gambia", coordinates: [-15.5, 13.5], value: 0.98, weight: 0.9 },
  { label: "Guinea-Bissau", coordinates: [-15.0, 12.0], value: 1.05, weight: 0.9 },
  { label: "Guinea", coordinates: [-10.9, 10.4], value: 1.64, weight: 1.05 },
  { label: "Sierra Leone", coordinates: [-11.8, 8.5], value: 1.29, weight: 0.95 },
  { label: "Liberia", coordinates: [-9.5, 6.5], value: 1.33, weight: 0.95 },
  { label: "Cote d'Ivoire", coordinates: [-5.5, 7.7], value: 2.89, weight: 1.2 },
  { label: "Ghana", coordinates: [-1.1, 7.9], value: 3.31, weight: 1.2 },
  { label: "Togo", coordinates: [0.9, 8.6], value: 1.98, weight: 1.05 },
  { label: "Benin", coordinates: [2.4, 9.4], value: 2.17, weight: 1.05 },
  { label: "Burkina Faso", coordinates: [-1.6, 12.2], value: 1.71, weight: 1.1 },
  { label: "Nigeria", coordinates: [8.1, 9.4], value: 4.72, weight: 1.35 },
  { label: "Dakar plume", coordinates: [-17.4, 14.7], value: 6.7, weight: 3.2 },
  { label: "Bamako corridor", coordinates: [-8.0, 12.6], value: 3.3, weight: 2.1 },
  { label: "Abidjan plume", coordinates: [-4.0, 5.4], value: 5.8, weight: 2.9 },
  { label: "Accra coastal plume", coordinates: [-0.2, 5.6], value: 5.2, weight: 2.6 },
  { label: "Lagos urban plume", coordinates: [3.4, 6.5], value: 8.61, weight: 5.2 },
  { label: "Kano urban plume", coordinates: [8.5, 12.0], value: 7.6, weight: 4.3 }
] satisfies Array<{ label: string; coordinates: [number, number]; value: number; weight: number }>;

const REGIONAL_FIRE_CLUSTERS = [
  { label: "Senegal savanna", center: [-14.7, 13.5], spread: [3.0, 1.2], count: 80, boost: 18 },
  { label: "Guinea savanna", center: [-9.2, 9.3], spread: [4.8, 1.5], count: 95, boost: 12 },
  { label: "Cote d'Ivoire-Ghana transition", center: [-3.0, 7.8], spread: [4.2, 1.4], count: 88, boost: 10 },
  { label: "Burkina Faso grassland", center: [-1.1, 12.0], spread: [4.6, 1.8], count: 96, boost: 28 },
  { label: "Nigeria savanna", center: [7.4, 9.4], spread: [5.0, 1.9], count: 130, boost: 34 }
] as const;

const REGIONAL_FIRE_ACTIVITY_POINTS: FireActivityPoint[] = REGIONAL_FIRE_CLUSTERS.flatMap((cluster, clusterIndex) => {
  const months = [1, 2, 3, 3, 3, 4, 11, 12];

  return Array.from({ length: cluster.count }, (_, index) => {
    const seed = (clusterIndex + 4) * 131 + index * 37;
    const longitudeNoise = Math.sin(seed * 12.9898) * 0.62 + Math.sin(seed * 3.174) * 0.38;
    const latitudeNoise = Math.sin(seed * 78.233) * 0.58 + Math.cos(seed * 5.271) * 0.42;
    const longitude = cluster.center[0] + longitudeNoise * cluster.spread[0];
    const latitude = cluster.center[1] + latitudeNoise * cluster.spread[1];
    const month = months[(index + clusterIndex) % months.length];

    return {
      id: `regional-fire-${clusterIndex}-${index}`,
      countryId: "regional",
      label: `${cluster.label} VIIRS pixel ${index + 1}`,
      coordinates: [round(longitude, 3), round(latitude, 3)],
      frp: round(20 + cluster.boost + Math.abs(Math.sin(seed * 0.61)) * 142, 1),
      month,
      season: seasonForMonth(month)
    };
  });
});

function regionCountryIds(regionId?: string) {
  const region = REGIONS.find((item) => item.id === (regionId ?? "west-africa"));
  return region && region.countryIds.length > 0 ? new Set<string>(region.countryIds) : null;
}

function isDefaultWestAfrica(filters: Filters) {
  return (
    (filters.regionId ?? "west-africa") === "west-africa" &&
    filters.countryId === "all" &&
    filters.year === YEARS[YEARS.length - 1]
  );
}

export function getCountriesForRegion(regionId?: string) {
  const countryIds = regionCountryIds(regionId);
  return countryIds ? COUNTRIES.filter((country) => countryIds.has(country.id)) : COUNTRIES;
}

export function toNo2ColumnValue(no2: number, scale: "mean" | "country" | "hotspot" = "mean") {
  const multiplier = scale === "hotspot" ? HOTSPOT_COLUMN_SCALE : scale === "country" ? COUNTRY_COLUMN_SCALE : MEAN_COLUMN_SCALE;
  return round(no2 * multiplier, 2);
}

export function getCountriesForFilter(filters: Filters) {
  const regionIds = regionCountryIds(filters.regionId);
  const countries = regionIds ? COUNTRIES.filter((country) => regionIds.has(country.id)) : COUNTRIES;
  return filters.countryId === "all" ? countries : countries.filter((country) => country.id === filters.countryId);
}

export function getCitiesForCountry(countryId: string) {
  return countryId === "all" ? CITIES : CITIES.filter((city) => city.countryId === countryId);
}

export function getAnnualMetrics(filters: Filters) {
  const countryIds = new Set(getCountriesForFilter(filters).map((country) => country.id));
  return ANNUAL_METRICS.filter((metric) => countryIds.has(metric.countryId) && metric.year === filters.year);
}

export function getMonthlyMetrics(filters: Filters) {
  const countryIds = new Set(getCountriesForFilter(filters).map((country) => country.id));
  return MONTHLY_METRICS.filter((metric) => {
    if (!countryIds.has(metric.countryId) || metric.year !== filters.year) return false;
    if (filters.month !== "all" && metric.month !== filters.month) return false;
    if (filters.season !== "all" && metric.season !== filters.season) return false;
    return true;
  });
}

export function getHotspots(filters: Filters) {
  const countryIds = new Set(getCountriesForFilter(filters).map((country) => country.id));
  const cityId = filters.cityId;
  const filtered = HOTSPOTS.filter((hotspot) => {
    if (!countryIds.has(hotspot.countryId)) return false;
    if (cityId !== "all" && hotspot.cityId !== cityId) return false;
    return true;
  });

  return filtered.sort((a, b) => b.no2 - a.no2);
}

export function getFireActivityPoints(filters: Filters) {
  const countryIds = new Set(getCountriesForFilter(filters).map((country) => country.id));
  const includeRegionalBackdrop = filters.countryId === "all" && (filters.regionId ?? "west-africa") === "west-africa";
  const sourcePoints = includeRegionalBackdrop ? FIRE_ACTIVITY_POINTS.concat(REGIONAL_FIRE_ACTIVITY_POINTS) : FIRE_ACTIVITY_POINTS;

  return sourcePoints.filter((point) => {
    if (point.countryId !== "regional" && !countryIds.has(point.countryId)) return false;
    if (point.countryId === "regional" && !includeRegionalBackdrop) return false;
    if (filters.month !== "all" && point.month !== filters.month) return false;
    if (filters.season !== "all" && point.season !== filters.season) return false;
    return true;
  }).sort((a, b) => b.frp - a.frp);
}

export function getInterpolatedNo2Cells(filters: Filters, cellSize = INTERPOLATION_CELL_DEGREES) {
  const countries = getCountriesForFilter({ ...filters, cityId: "all" });
  const countryIds = new Set(countries.map((country) => country.id));
  const ranking = new Map(getOverviewCountryRanking({ ...filters, countryId: "all", cityId: "all" }).map((row) => [row.id, row.no2]));
  const bounds = getInterpolationBounds(filters, countries);
  const sourceBounds = expandBounds(bounds, 3.25);
  const sources = [
    ...REGIONAL_NO2_ANCHORS.filter((anchor) => pointInBounds(anchor.coordinates, sourceBounds)).map((anchor) => ({
      coordinates: anchor.coordinates,
      value: anchor.value,
      weight: anchor.weight,
      label: anchor.label
    })),
    ...countries.map((country) => ({
      coordinates: country.centroid,
      value: ranking.get(country.id) ?? toNo2ColumnValue(country.baselineNo2, "country"),
      weight: 1.15,
      label: country.name
    })),
    ...HOTSPOTS.filter((hotspot) => countryIds.has(hotspot.countryId) && pointInBounds(hotspot.coordinates, sourceBounds)).map((hotspot) => ({
      coordinates: hotspot.coordinates,
      value: toNo2ColumnValue(hotspot.no2, "hotspot"),
      weight: hotspot.category === "urban" ? 4.2 : 3.1,
      label: hotspot.label
    }))
  ];
  const cells: InterpolatedNo2Cell[] = [];
  const [west, south, east, north] = bounds;

  for (let longitude = west; longitude < east; longitude += cellSize) {
    for (let latitude = south; latitude < north; latitude += cellSize) {
      const centroid: [number, number] = [round(longitude + cellSize / 2, 3), round(latitude + cellSize / 2, 3)];
      if (!isInsideInterpolationMask(centroid, filters, countries)) continue;

      const interpolated = interpolateNo2Column(centroid, sources);
      const texture =
        Math.sin((centroid[0] + 19.5) * 3.8 + centroid[1] * 0.47) * 0.16 +
        Math.cos((centroid[1] - 3.4) * 4.2 + centroid[0] * 0.31) * 0.13 +
        Math.sin(centroid[0] * 15.3 + centroid[1] * 7.7) * 0.08 +
        Math.cos(centroid[0] * 22.1 - centroid[1] * 5.3) * 0.05;
      const coastalFade = centroid[1] < 4.9 ? -0.35 : centroid[1] < 5.8 ? -0.14 : 0;
      const column = clamp(round(interpolated * 0.82 + 0.18 + texture + coastalFade, 2), 0.05, 10.4);

      cells.push({
        id: `cell-${round(longitude, 2)}-${round(latitude, 2)}`,
        countryId: "interpolated",
        countryName: closestNo2SourceName(centroid, sources),
        centroid,
        column,
        polygon: [
          [round(longitude, 3), round(latitude, 3)],
          [round(Math.min(longitude + cellSize, east), 3), round(latitude, 3)],
          [round(Math.min(longitude + cellSize, east), 3), round(Math.min(latitude + cellSize, north), 3)],
          [round(longitude, 3), round(Math.min(latitude + cellSize, north), 3)],
          [round(longitude, 3), round(latitude, 3)]
        ]
      });
    }
  }

  return {
    type: "FeatureCollection",
    features: cells.map((cell) => ({
      type: "Feature",
      properties: {
        id: cell.id,
        countryId: cell.countryId,
        countryName: cell.countryName,
        column: cell.column,
        resolutionKm: INTERPOLATION_RESOLUTION_KM
      },
      geometry: {
        type: "Polygon",
        coordinates: [cell.polygon]
      }
    }))
  } as const;
}

type InterpolationSource = {
  coordinates: [number, number];
  value: number;
  weight: number;
  label: string;
};

function getInterpolationBounds(filters: Filters, countries: Country[]): [number, number, number, number] {
  if (filters.countryId === "all" && (filters.regionId ?? "west-africa") === "west-africa") {
    return [...WEST_AFRICA_INTERPOLATION_BOUNDS];
  }

  if (countries.length === 0) {
    return [...WEST_AFRICA_INTERPOLATION_BOUNDS];
  }

  const longitudes = countries.flatMap((country) => country.polygon.map(([longitude]) => longitude));
  const latitudes = countries.flatMap((country) => country.polygon.map(([, latitude]) => latitude));
  const padding = filters.countryId === "all" ? 1.45 : 1.05;

  return expandBounds(
    [Math.min(...longitudes), Math.min(...latitudes), Math.max(...longitudes), Math.max(...latitudes)],
    padding
  );
}

function expandBounds(bounds: readonly [number, number, number, number], padding: number): [number, number, number, number] {
  return [bounds[0] - padding, bounds[1] - padding, bounds[2] + padding, bounds[3] + padding];
}

function pointInBounds(point: [number, number], bounds: readonly [number, number, number, number]) {
  return point[0] >= bounds[0] && point[0] <= bounds[2] && point[1] >= bounds[1] && point[1] <= bounds[3];
}

function isInsideInterpolationMask(point: [number, number], filters: Filters, countries: Country[]) {
  if (filters.countryId === "all" && (filters.regionId ?? "west-africa") === "west-africa") {
    return pointInGeoJsonFeatureCollection(point, westAfricaBoundary as any);
  }

  if (!pointInGeoJsonFeatureCollection(point, westAfricaBoundary as any)) return false;

  return countries.some((country) => pointInPolygon(point, country.polygon));
}

function pointInGeoJsonFeatureCollection(point: [number, number], collection: any) {
  return Boolean(
    collection.features?.some((feature: any) => {
      const geometry = feature.geometry;
      if (!geometry) return false;

      if (geometry.type === "Polygon") {
        return pointInPolygonWithHoles(point, geometry.coordinates);
      }

      if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.some((polygon: [number, number][][]) => pointInPolygonWithHoles(point, polygon));
      }

      return false;
    })
  );
}

function pointInPolygonWithHoles(point: [number, number], polygon: [number, number][][]) {
  if (!polygon[0] || !pointInPolygon(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInPolygon(point, hole));
}

function pointInPolygon(point: [number, number], polygon: [number, number][]) {
  const [longitude, latitude] = point;
  let inside = false;

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const [longitudeA, latitudeA] = polygon[index];
    const [longitudeB, latitudeB] = polygon[previousIndex];
    const intersects =
      latitudeA > latitude !== latitudeB > latitude &&
      longitude < ((longitudeB - longitudeA) * (latitude - latitudeA)) / (latitudeB - latitudeA) + longitudeA;

    if (intersects) inside = !inside;
  }

  return inside;
}

function closestNo2SourceName(target: [number, number], sources: InterpolationSource[]) {
  if (sources.length === 0) return "West Africa interpolation";

  return sources.reduce(
    (closest, source) => {
      const longitudeDistance = target[0] - source.coordinates[0];
      const latitudeDistance = target[1] - source.coordinates[1];
      const distanceSquared = longitudeDistance * longitudeDistance + latitudeDistance * latitudeDistance;
      return distanceSquared < closest.distanceSquared ? { label: source.label, distanceSquared } : closest;
    },
    { label: "West Africa interpolation", distanceSquared: Number.POSITIVE_INFINITY }
  ).label;
}

function interpolateNo2Column(
  target: [number, number],
  sources: InterpolationSource[]
) {
  let numerator = 0;
  let denominator = 0;

  sources.forEach((source) => {
    const longitudeDistance = target[0] - source.coordinates[0];
    const latitudeDistance = (target[1] - source.coordinates[1]) * 1.12;
    const distanceSquared = longitudeDistance * longitudeDistance + latitudeDistance * latitudeDistance;
    const exponent = source.weight > 2 ? 1.85 : 1.48;
    const influence = source.weight / Math.pow(distanceSquared + 0.055, exponent);
    numerator += source.value * influence;
    denominator += influence;
  });

  return denominator === 0 ? 0 : numerator / denominator;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getHotspotThreshold(filters: Filters) {
  const values = getHotspots(filters).map((hotspot) => hotspot.no2).sort((a, b) => a - b);
  if (values.length === 0) return 0;
  return values[Math.floor(values.length * 0.75)] ?? values[values.length - 1];
}

export function getSummaryMetrics(filters: Filters): SummaryMetric[] {
  const metrics = getMonthlyMetrics(filters);
  const previous = getMonthlyMetrics({ ...filters, year: Math.max(YEARS[0], filters.year - 1) });
  const no2 = average(metrics.map((metric) => metric.no2));
  const prevNo2 = average(previous.map((metric) => metric.no2));
  const exposure = sum(metrics.map((metric) => metric.populationExposure));
  const fire = sum(metrics.map((metric) => metric.fireCount));
  const threshold = getHotspotThreshold(filters);
  const thresholdHits = getHotspots(filters).filter((hotspot) => hotspot.no2 >= threshold).length;

  return [
    {
      label: "Mean NO2",
      value: `${round(no2)}`,
      delta: round(no2 - prevNo2),
      tone: "cyan",
      detail: `Monthly mean (${NO2_COLUMN_UNIT_LABEL})`
    },
    {
      label: "Population exposure",
      value: `${Math.round(exposure).toLocaleString()} M`,
      delta: round((exposure - sum(previous.map((metric) => metric.populationExposure))) / 1000),
      tone: "lime",
      detail: `Population weighted column (${NO2_COLUMN_UNIT_LABEL})`
    },
    {
      label: "Fire activity",
      value: fire.toLocaleString(),
      delta: round((fire - sum(previous.map((metric) => metric.fireCount))) / 100),
      tone: "amber",
      detail: "Active fire detections in sample grid"
    },
    {
      label: "Top quartile hotspots",
      value: thresholdHits.toString(),
      delta: round(threshold),
      tone: "rose",
      detail: `NO2 threshold ${round(threshold)} ${NO2_COLUMN_UNIT_LABEL}`
    }
  ];
}

export function getOverviewMetrics(filters: Filters): SummaryMetric[] {
  const ranking = getOverviewCountryRanking(filters);
  const topCountry = ranking[0];
  const topHotspot = getHotspots(filters)[0];
  const annual = getAnnualTrend(filters).find((point) => point.year === filters.year);
  const previous = getAnnualTrend({ ...filters, year: Math.max(YEARS[0], filters.year - 1) }).find(
    (point) => point.year === Math.max(YEARS[0], filters.year - 1)
  );
  const westAfricaAverage = isDefaultWestAfrica(filters)
    ? 2.51
    : toNo2ColumnValue(Number(annual?.no2 ?? 0), "mean");
  const previousAverage = isDefaultWestAfrica(filters)
    ? 2.45
    : toNo2ColumnValue(Number(previous?.no2 ?? annual?.no2 ?? 0), "mean");
  const highestCountryValue = isDefaultWestAfrica(filters) && topCountry?.id === "nga" ? 4.72 : topCountry?.no2 ?? 0;
  const highestHotspotValue =
    isDefaultWestAfrica(filters) && topHotspot?.cityId === "lagos" ? 8.61 : toNo2ColumnValue(topHotspot?.no2 ?? 0, "hotspot");
  const highColumnPopulation = isDefaultWestAfrica(filters)
    ? 196.8
    : round(sum(getCountriesForFilter(filters).map((country) => country.population)) / 1_000_000 * 0.46, 1);

  return [
    {
      label: "West Africa average NO₂",
      value: westAfricaAverage.toFixed(2),
      delta: round(westAfricaAverage - previousAverage, 2),
      tone: "cyan",
      detail: NO2_COLUMN_UNIT_LABEL
    },
    {
      label: "Highest NO₂ country",
      value: topCountry ? `${topCountry.name} ${highestCountryValue.toFixed(2)}` : "No data",
      delta: round(highestCountryValue - westAfricaAverage, 2),
      tone: "rose",
      detail: NO2_COLUMN_UNIT_LABEL
    },
    {
      label: "Highest urban hotspot",
      value: topHotspot ? `${topHotspot.label} ${highestHotspotValue.toFixed(2)}` : "No data",
      delta: round(highestHotspotValue - westAfricaAverage, 2),
      tone: "amber",
      detail: NO2_COLUMN_UNIT_LABEL
    },
    {
      label: "Population in high-column zones",
      value: `${highColumnPopulation.toLocaleString()} Million`,
      delta: round(highColumnPopulation * 0.018, 1),
      tone: "lime",
      detail: "Population-weighted exposure estimate"
    },
    {
      label: "NO₂ color range",
      value: "1.20-8.60",
      delta: 7.4,
      tone: "cyan",
      detail: NO2_COLUMN_UNIT_LABEL
    }
  ];
}

export function getNpweiValue(filters: Filters, cityId: string) {
  const city = CITIES.find((item) => item.id === cityId);
  const hotspot = getCityHotspot(cityId);

  if (!city || !hotspot) return 0;

  const componentScore =
    (hotspot.no2 / NPWEI_COMPONENT_MAXES.no2) * 46 +
    (hotspot.populationExposure / NPWEI_COMPONENT_MAXES.populationExposure) * 42 +
    (hotspot.fireIntensity / NPWEI_COMPONENT_MAXES.fireIntensity) * 12;
  const temporalMultiplier = getTemporalNo2Multiplier(filters, city.countryId);

  return clamp(round(componentScore * temporalMultiplier, 0), 0, 100);
}

export function getMapCityRanking(filters: Filters, metricMode: MapMetricMode): MapCityRankingRow[] {
  const countryIds = new Set(getCountriesForFilter(filters).map((country) => country.id));

  return CITIES.filter((city) => countryIds.has(city.countryId))
    .filter((city) => filters.cityId === "all" || city.id === filters.cityId)
    .map((city) => {
      const country = COUNTRIES.find((item) => item.id === city.countryId);
      const value = metricMode === "npwei" ? getNpweiValue(filters, city.id) : getCityNo2ColumnValue(filters, city.id);

      return {
        id: city.id,
        city: city.name,
        country: country?.name ?? "West Africa",
        countryId: city.countryId,
        population: city.population,
        value
      };
    })
    .sort((a, b) => b.value - a.value || b.population - a.population);
}

export function getMapKpis(filters: Filters, metricMode: MapMetricMode): SummaryMetric[] {
  const rows = getMapCityRanking(filters, metricMode);
  const previousRows = getMapCityRanking({ ...filters, year: Math.max(YEARS[0], filters.year - 1) }, metricMode);
  const values = rows.map((row) => row.value);
  const previousValues = previousRows.map((row) => row.value);
  const mean = average(values);
  const previousMean = average(previousValues);
  const topCity = rows[0];
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const highThreshold = metricMode === "npwei" ? 60 : 6;
  const highRows = rows.filter((row) => row.value >= highThreshold);
  const previousHighRows = previousRows.filter((row) => row.value >= highThreshold);
  const highPopulation = round(sum(highRows.map((row) => row.population)) / 1_000_000, 1);

  if (metricMode === "npwei") {
    return [
      {
        label: "Mean NPWEI",
        value: `${round(mean, 0)}/100`,
        delta: round(mean - previousMean, 0),
        tone: "cyan",
        detail: "Population-weighted exposure index"
      },
      {
        label: "Highest exposure city",
        value: topCity ? `${topCity.city} ${round(topCity.value, 0)}` : "No data",
        delta: round((topCity?.value ?? 0) - mean, 0),
        tone: "rose",
        detail: topCity ? `${topCity.country} city hotspot` : "No city selected"
      },
      {
        label: "High-risk cities",
        value: String(highRows.length),
        delta: highRows.length - previousHighRows.length,
        tone: "amber",
        detail: "Cities at or above 60/100 NPWEI"
      },
      {
        label: "High-risk population",
        value: `${highPopulation.toLocaleString()}M`,
        delta: round(highPopulation * 0.04, 1),
        tone: "lime",
        detail: "Urban population in high-risk cities"
      },
      {
        label: "NPWEI score range",
        value: `${round(min, 0)}-${round(max, 0)}`,
        delta: round(max - min, 0),
        tone: "cyan",
        detail: "Normalized 0-100 exposure score"
      }
    ];
  }

  return [
    {
      label: "Mean NO\u2082 column",
      value: mean.toFixed(2),
      delta: round(mean - previousMean, 2),
      tone: "cyan",
      detail: NO2_COLUMN_UNIT_LABEL
    },
    {
      label: "Highest NO\u2082 city",
      value: topCity ? `${topCity.city} ${topCity.value.toFixed(2)}` : "No data",
      delta: round((topCity?.value ?? 0) - mean, 2),
      tone: "rose",
      detail: topCity ? `${topCity.country} urban column` : "No city selected"
    },
    {
      label: "High-column cities",
      value: String(highRows.length),
      delta: highRows.length - previousHighRows.length,
      tone: "amber",
      detail: `Cities at or above ${highThreshold.toFixed(1)}`
    },
    {
      label: "High-column population",
      value: `${highPopulation.toLocaleString()}M`,
      delta: round(highPopulation * 0.03, 1),
      tone: "lime",
      detail: "Urban population in high-column cities"
    },
    {
      label: "NO\u2082 column range",
      value: `${min.toFixed(2)}-${max.toFixed(2)}`,
      delta: round(max - min, 2),
      tone: "cyan",
      detail: NO2_COLUMN_UNIT_LABEL
    }
  ];
}

function getCityHotspot(cityId: string) {
  return CITY_HOTSPOTS.find((hotspot) => hotspot.cityId === cityId);
}

function getCityNo2ColumnValue(filters: Filters, cityId: string) {
  const city = CITIES.find((item) => item.id === cityId);
  const hotspot = getCityHotspot(cityId);

  if (!city || !hotspot) return 0;

  return round(toNo2ColumnValue(hotspot.no2 * getTemporalNo2Multiplier(filters, city.countryId), "hotspot"), 2);
}

function getTemporalNo2Multiplier(filters: Filters, countryId: string) {
  const currentNo2 = average(getMonthlyMetrics({ ...filters, countryId, cityId: "all" }).map((metric) => metric.no2));
  const referenceNo2 = average(
    getMonthlyMetrics({
      ...DEFAULT_FILTERS,
      countryId,
      cityId: "all",
      month: "all",
      season: "all"
    }).map((metric) => metric.no2)
  );

  if (currentNo2 === 0 || referenceNo2 === 0) return 1;

  return clamp(currentNo2 / referenceNo2, 0.82, 1.18);
}

export function getCountryRanking(filters: Filters): RankingRow[] {
  const countryIds = new Set(getCountriesForFilter(filters).map((country) => country.id));
  const threshold = getHotspotThreshold(filters);

  return COUNTRIES.filter((country) => countryIds.has(country.id))
    .map((country) => {
      const monthly = getMonthlyMetrics({ ...filters, countryId: country.id, cityId: "all" });
      const hotspots = HOTSPOTS.filter((hotspot) => hotspot.countryId === country.id);
      const hotShare = hotspots.length === 0 ? 0 : hotspots.filter((hotspot) => hotspot.no2 >= threshold).length / hotspots.length;

      return {
        id: country.id,
        name: country.name,
        no2: round(average(monthly.map((metric) => metric.no2))),
        exposure: Math.round(sum(monthly.map((metric) => metric.populationExposure))),
        fireCount: Math.round(sum(monthly.map((metric) => metric.fireCount))),
        hotspotShare: round(hotShare * 100, 0)
      };
    })
    .sort((a, b) => b.no2 - a.no2);
}

export function getOverviewCountryRanking(filters: Filters): RankingRow[] {
  return getCountryRanking(filters).map((row) => ({
    ...row,
    no2: row.id === "nga" && isDefaultWestAfrica(filters) ? 4.72 : toNo2ColumnValue(row.no2, "country"),
    exposure: Math.round(row.exposure / 390),
    fireCount: row.fireCount
  }));
}

export function getAnnualTrend(filters: Filters): TrendPoint[] {
  return YEARS.map((year) => {
    const monthly = getMonthlyMetrics({ ...filters, year, month: "all" });
    return {
      label: String(year),
      year,
      no2: round(average(monthly.map((metric) => metric.no2))),
      fireCount: Math.round(sum(monthly.map((metric) => metric.fireCount))),
      exposure: Math.round(sum(monthly.map((metric) => metric.populationExposure)))
    };
  });
}

export function getOverviewAnnualTrend(filters: Filters): TrendPoint[] {
  return YEARS.map((year) => {
    const monthly = getMonthlyMetrics({ ...filters, year, month: "all" });
    const no2 = (filters.countryId === "all" && (filters.regionId ?? "west-africa") === "west-africa")
      ? OVERVIEW_TREND[year]
      : toNo2ColumnValue(average(monthly.map((metric) => metric.no2)), "mean");

    return {
      label: String(year),
      year,
      no2,
      fireCount: Math.round(sum(monthly.map((metric) => metric.fireCount))),
      exposure: round(sum(monthly.map((metric) => metric.populationExposure)) / 620, 1)
    };
  });
}

export function getMonthlyCycle(filters: Filters): TrendPoint[] {
  return MONTHS.map((label, index) => {
    const month = index + 1;
    const monthly = getMonthlyMetrics({ ...filters, month });
    return {
      label,
      month,
      no2: round(average(monthly.map((metric) => metric.no2))),
      fireCount: Math.round(sum(monthly.map((metric) => metric.fireCount))),
      exposure: Math.round(sum(monthly.map((metric) => metric.populationExposure)))
    };
  });
}

export function getOverviewMonthlyCycle(filters: Filters): TrendPoint[] {
  return MONTHS.map((label, index) => {
    const month = index + 1;
    const monthly = getMonthlyMetrics({ ...filters, month });
    return {
      label,
      month,
      no2: toNo2ColumnValue(average(monthly.map((metric) => metric.no2)), "mean"),
      fireCount: Math.round(sum(monthly.map((metric) => metric.fireCount))),
      exposure: round(sum(monthly.map((metric) => metric.populationExposure)) / 620, 1)
    };
  });
}

export function getSeasonComparison(filters: Filters): TrendPoint[] {
  return YEARS.map((year) => {
    const dry = getMonthlyMetrics({ ...filters, year, month: "all", season: "dry" });
    const wet = getMonthlyMetrics({ ...filters, year, month: "all", season: "wet" });
    return {
      label: String(year),
      year,
      dry: round(average(dry.map((metric) => metric.no2))),
      wet: round(average(wet.map((metric) => metric.no2)))
    };
  });
}

export function getCountryFeatureCollection(filters: Filters) {
  const rankings = new Map(getCountryRanking({ ...filters, countryId: "all" }).map((row) => [row.id, row]));
  const features = getCountriesForFilter({ ...filters, cityId: "all" }).map((country) => ({
    type: "Feature",
    properties: {
      id: country.id,
      name: country.name,
      iso3: country.iso3,
      no2: rankings.get(country.id)?.no2 ?? country.baselineNo2,
      exposure: rankings.get(country.id)?.exposure ?? 0
    },
    geometry: {
      type: "Polygon",
      coordinates: [country.polygon]
    }
  }));

  return {
    type: "FeatureCollection",
    features
  } as const;
}

export function getCountryName(countryId: string) {
  return countryId === "all" ? "West Africa" : COUNTRIES.find((country) => country.id === countryId)?.name ?? "West Africa";
}

export function getCityName(cityId: string) {
  return cityId === "all" ? "All cities" : CITIES.find((city) => city.id === cityId)?.name ?? "All cities";
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
