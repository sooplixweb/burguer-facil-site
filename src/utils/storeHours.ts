// src/utils/storeHours.ts
export const STORE_HOURS = { open: 8, close: 10 };

export function isOpenNowByHour(h: number) {
  return h >= STORE_HOURS.open || h < STORE_HOURS.close;
}

export function getStoreStatusNow() {
  const now = new Date();
  const h = now.getHours();
  const openNow = isOpenNowByHour(h);

  let hoursToOpen = 0;

  if (!openNow) {
    if (h < STORE_HOURS.open) hoursToOpen = STORE_HOURS.open - h;
    else hoursToOpen = 24 - h + STORE_HOURS.open;
  }

  return {
    openNow,
    openHour: STORE_HOURS.open,
    closeHour: STORE_HOURS.close,
    hoursToOpen,
  };
}
