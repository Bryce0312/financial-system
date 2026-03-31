import { Decimal } from "@prisma/client/runtime/library";

export function decimalToNumber(value: Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  return Number(value.toString());
}

export function optionalDecimalToNumber(value: Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  return decimalToNumber(value);
}


