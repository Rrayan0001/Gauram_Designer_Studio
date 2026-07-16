/** Category → HSN mapping for boutique garments. */

export const CATEGORIES = [
  "Women's Wear",
  "Men's Wear",
  "Kids Wear",
  "Rental",
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_HSN: Record<Category, string> = {
  "Women's Wear": "HSN 6204",
  "Men's Wear": "HSN 6203",
  "Kids Wear": "HSN 6209",
  "Rental": "HSN 9988",
}

export function hsnForCategory(category: string): string {
  if (category in CATEGORY_HSN) {
    return CATEGORY_HSN[category as Category]
  }
  return CATEGORY_HSN["Women's Wear"]
}

/** Quick-fill item templates for the bill form. */
export const ITEM_TEMPLATES: Array<{
  label: string
  description: string
  category: Category
  defaultRate?: number
}> = [
  { label: 'Bridal Lehenga', description: 'Bridal Lehenga – custom fitting', category: "Women's Wear" },
  { label: 'Blouse Stitching', description: 'Blouse stitching & fitting', category: "Women's Wear" },
  { label: "Men's Suit", description: "Men's suit stitching", category: "Men's Wear" },
  { label: 'Kids Ethnic', description: 'Kids ethnic wear', category: "Kids Wear" },
  { label: 'Rental Outfit', description: 'Rental outfit (deposit terms apply)', category: 'Rental' },
]
