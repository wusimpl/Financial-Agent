import type { ChartRange, SocialLanguage, SocialMinFaves, SocialSort } from "../api/backendTypes";

export type ThemePreference = "dark" | "light";
export type MovingAverageKey = "ma20" | "ma50" | "ma200";
export type MovingAverageVisibility = Record<MovingAverageKey, boolean>;

const storageKeys = {
  theme: "financial-agent:theme",
  activeStock: "financial-agent:active-stock",
  chartRange: "financial-agent:chart-range",
  socialSort: "financial-agent:social-sort",
  socialLanguage: "financial-agent:social-language",
  socialMinFaves: "financial-agent:social-min-faves",
  movingAverages: "financial-agent:moving-averages",
};

const chartRanges: ChartRange[] = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"];
const socialSorts: SocialSort[] = ["hot", "latest"];
const socialLanguages: SocialLanguage[] = ["zh", "en"];
const socialMinFavesOptions: SocialMinFaves[] = [1, 5, 10, 30, 50, 100, 500, 1000];

export const movingAverageKeys: MovingAverageKey[] = ["ma20", "ma50", "ma200"];

export const defaultMovingAverageVisibility: MovingAverageVisibility = {
  ma20: true,
  ma50: true,
  ma200: true,
};

function storage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readValue(key: string) {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeValue(key: string, value: string) {
  try {
    storage()?.setItem(key, value);
  } catch {
    return;
  }
}

function readOption<T extends string>(key: string, options: readonly T[], fallback: T) {
  const value = readValue(key);
  return value && options.includes(value as T) ? (value as T) : fallback;
}

export function readThemePreference() {
  return readOption<ThemePreference>(storageKeys.theme, ["dark", "light"], "dark");
}

export function saveThemePreference(theme: ThemePreference) {
  writeValue(storageKeys.theme, theme);
}

export function readActiveStockPreference() {
  const value = readValue(storageKeys.activeStock)?.trim().toUpperCase();
  return value && /^[A-Z0-9.-]{1,12}$/.test(value) ? value : "AAPL";
}

export function saveActiveStockPreference(ticker: string) {
  writeValue(storageKeys.activeStock, ticker.trim().toUpperCase());
}

export function readChartRangePreference() {
  return readOption<ChartRange>(storageKeys.chartRange, chartRanges, "1Y");
}

export function saveChartRangePreference(range: ChartRange) {
  writeValue(storageKeys.chartRange, range);
}

export function readSocialSortPreference() {
  return readOption<SocialSort>(storageKeys.socialSort, socialSorts, "hot");
}

export function saveSocialSortPreference(sort: SocialSort) {
  writeValue(storageKeys.socialSort, sort);
}

export function readSocialLanguagePreference() {
  return readOption<SocialLanguage>(storageKeys.socialLanguage, socialLanguages, "zh");
}

export function saveSocialLanguagePreference(language: SocialLanguage) {
  writeValue(storageKeys.socialLanguage, language);
}

export function readSocialMinFavesPreference() {
  const value = Number(readValue(storageKeys.socialMinFaves));
  return socialMinFavesOptions.includes(value as SocialMinFaves) ? (value as SocialMinFaves) : 30;
}

export function saveSocialMinFavesPreference(minFaves: SocialMinFaves) {
  writeValue(storageKeys.socialMinFaves, String(minFaves));
}

export function readMovingAverageVisibilityPreference() {
  const saved = readValue(storageKeys.movingAverages);
  if (!saved) return defaultMovingAverageVisibility;

  try {
    const value = JSON.parse(saved) as Partial<MovingAverageVisibility>;
    return movingAverageKeys.reduce<MovingAverageVisibility>(
      (visibility, key) => ({
        ...visibility,
        [key]: typeof value[key] === "boolean" ? value[key] : defaultMovingAverageVisibility[key],
      }),
      { ...defaultMovingAverageVisibility },
    );
  } catch {
    return defaultMovingAverageVisibility;
  }
}

export function saveMovingAverageVisibilityPreference(visibility: MovingAverageVisibility) {
  writeValue(storageKeys.movingAverages, JSON.stringify(visibility));
}
