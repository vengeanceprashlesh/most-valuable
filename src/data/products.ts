export type Product = {
  id: string;
  name: string;
  slug: string;
  status: "sold_out" | "coming_soon" | "available";
  category: "tee" | "bag" | "hoodie" | "slides" | string;
  price?: string;
  description?: string;
  variants?: Array<{ id: string; color: string; media: string[] }>;
  media?: string[];
};

// NOTE: Media paths intentionally match the client spec exactly.
// A resolver in the UI maps these to real public paths.
export const products: Product[] = [
  // Buyable raffle product (converted to direct purchase)
  {
    id: "raffle",
    name: "A Valuable Shirt",
    slug: "1-of-1-raffle-tee",
    status: "available",
    category: "tee",
    price: "$100",
    description: "A Valuable Shirt - Direct Purchase. This shirt is now available for direct purchase for $100. No raffle, no tickets, just a premium shirt.",
    media: ["/product1_1.png", "/product1_2.png"],
    variants: [
      { id: "raffle-blk", color: "Black", media: ["/product1_1.png"] },
      { id: "raffle-wht", color: "White", media: ["/product1_2.png"] },
    ],
  },
  // MV Members Only Hoodie - Direct Purchase Product
  {
    id: "mv-hoodie",
    name: "MV Members Only Hoodie",
    slug: "mv-members-only-hoodie",
    status: "available",
    category: "hoodie",
    price: "$1,700",
    description: "Premium Members Only Hoodie crafted for exclusivity and comfort. 7g of gold included.",
    media: ["/MV Members only hoodie-b.png", "/MV Members only hoodie-w.jpeg", "/MV Members only hoodie-g.png"],
    variants: [
      { id: "mv-hoodie-blk", color: "Black", media: ["/MV Members only hoodie-b.png", "/MV Members only hoodie-w.jpeg", "/MV Members only hoodie-g.png"] },
      { id: "mv-hoodie-wht", color: "White", media: ["/MV Members only hoodie-w.jpeg", "/MV Members only hoodie-b.png", "/MV Members only hoodie-g.png"] },
      { id: "mv-hoodie-gry", color: "Gray", media: ["/MV Members only hoodie-g.png", "/MV Members only hoodie-b.png", "/MV Members only hoodie-w.jpeg"] },
    ],
  },
  // Members Only Tee - Direct Purchase Product (Position 3)
  {
    id: "mv-tee",
    name: "Members Only Tee",
    slug: "mv-members-only-tee",
    status: "available",
    category: "tee",
    price: "$350",
    description: "Exclusive Members Only Tee crafted for comfort and style. Quality 8oz shirt. 1g of gold included.",
    media: ["/media/3A Valuable Shirt-memb1.jpeg", "/media/3A Valuable Shirt-memw1.jpeg"],
    variants: [
      { id: "mv-tee-blk", color: "Black", media: ["/media/3A Valuable Shirt-memb1.jpeg", "/media/3A Valuable Shirt-memw1.jpeg"] },
      { id: "mv-tee-wht", color: "White", media: ["/media/3A Valuable Shirt-memw1.jpeg", "/media/3A Valuable Shirt-memb1.jpeg"] },
    ],
  },
  // Available for direct purchase products
  {
    "id": "p6",
    "name": "Most Valuable Box Logo Hoodie",
    "slug": "most-valuable-box-logo-hoodie",
    "status": "available",
    "category": "hoodie",
    "price": "$1,700",
    "description": "Premium Box Logo Hoodie crafted for exclusivity and comfort. 7g of gold included.",
    "media": ["/media/6Most Valuable box Logo Hoodie1.jpeg"]
  },
  {
    "id": "p7",
    "name": "MV Traditional Hoodie",
    "slug": "mv-traditional-hoodie",
    "status": "available",
    "category": "hoodie",
    "price": "$1,700",
    "description": "Classic MV Traditional Hoodie with premium quality and timeless design. 7g of gold included.",
    "media": ["/Hoodie.png"]
  },
  {
    "id": "p1b",
    "name": "Box Logo Tee - Black",
    "slug": "box-logo-tee-black",
    "status": "available",
    "category": "tee",
    "price": "$350",
    "description": "Iconic Box Logo Tee in premium black. 1g of gold included.",
    "media": ["/media/1A Valuable Shirt-b1.png", "/media/2A Valuable Shirt-b2.png"]
  },
  {
    "id": "p1w",
    "name": "Box Logo Tee - White",
    "slug": "box-logo-tee-white",
    "status": "available",
    "category": "tee",
    "price": "$350",
    "description": "Iconic Box Logo Tee in classic white. 1g of gold included.",
    "media": ["/media/1A Valuable Shirt-w1.png", "/media/2A Valuable Shirt2.png"]
  },
  // Rest of the products
  {
    "id": "p4",
    "name": "MV Camo Backpack",
    "slug": "mv-camo-backpack",
    "status": "sold_out",
    "category": "bag",
    "price": "$300",
    "media": ["/media/4MV camo backpack1.png", "/media/4MV camo backpack2.jpeg"]
  },
  {
    "id": "p5",
    "name": "MV Camo Duffel",
    "slug": "mv-camo-duffel",
    "status": "sold_out",
    "category": "bag",
    "price": "$1200",
    "media": ["/media/5MV camo Duffel.jpeg"]
  },
  {
    "id": "p8",
    "name": "MV Camo Slides",
    "slug": "mv-camo-slides",
    "status": "sold_out",
    "category": "slides",
    "price": "$1,700",
    "media": ["/media/8MV camo slides.MOV"]
  },
  {
    "id": "p9",
    "name": "MV Reversible Shorts",
    "slug": "mv-reversible-shorts",
    "status": "sold_out",
    "category": "shorts",
    "price": "$1,700",
    "media": ["/MV Reversible Shorts-f.png", "/MV Reversible Shorts-b.png"]
  }
];
