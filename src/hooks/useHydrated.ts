import { useState, useEffect } from "react";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

export function formatDateSafe(date: string | Date, locale = "de-DE") {
  return new Date(date).toLocaleDateString(locale);
}

export function formatDateTimeSafe(
  date: string | Date,
  locale = "de-DE",
  options?: Intl.DateTimeFormatOptions
) {
  return new Date(date).toLocaleString(locale, options);
}
