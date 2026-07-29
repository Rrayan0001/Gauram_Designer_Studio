/** Boutique garment categories and item templates. */

export const STANDARD_CATEGORIES = [
  "Women's Wear",
  "Men's Wear",
  "Kids Wear",
  "Rental",
] as const

export const CATEGORIES = [...STANDARD_CATEGORIES]

export type Category = string

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
