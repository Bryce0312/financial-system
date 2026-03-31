export function currency(value: number | null | undefined) {
  const amount = value ?? 0;
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2
  }).format(amount);
}

export function shortDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  return value.slice(0, 10);
}

