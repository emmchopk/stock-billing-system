export type DateRangeParams = {
  from?: string;
  to?: string;
};

export function getDateRange(params?: DateRangeParams) {
  const from = params?.from ? new Date(`${params.from}T00:00:00`) : undefined;
  const to = params?.to ? new Date(`${params.to}T23:59:59`) : undefined;

  if (from && to) {
    return {
      gte: from,
      lte: to,
    };
  }

  if (from) {
    return {
      gte: from,
    };
  }

  if (to) {
    return {
      lte: to,
    };
  }

  return undefined;
}

export function formatThaiDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value || 0);
}