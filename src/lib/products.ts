import { catalogGroups } from "./catalog-data";

const countries = ["Nigeria", "France", "Nigeria", "United Arab Emirates", "Nigeria", "Italy", "Nigeria", "United Kingdom", "Nigeria", "United States", "Nigeria", "France", "Nigeria", "Japan", "Nigeria"];
const colors = ["Blush", "Amber", "Ivory", "Burgundy", "Stone"];
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const seedProducts = catalogGroups.flatMap(group => group.names.split("|").map((name, index) => ({
  id: slug(name),
  name,
  category: group.category,
  price: (group.base + group.step * index) * 100,
  color: colors[index % colors.length],
  image: `/products/${slug(name)}.svg`,
  tag: index === 0 ? "Featured" : index === 1 ? "New" : "",
  description: group.description,
  originCountry: countries[index],
})));

export const categoryOrder = catalogGroups.map(group => group.category);

export type Product = typeof seedProducts[number];
export const FREE_SHIPPING_THRESHOLD = 15000000;
export const STANDARD_SHIPPING = 500000;
export const money = (minorUnits: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(minorUnits / 100);
