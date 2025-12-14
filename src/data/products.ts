export type Product = {
  id: string;
  name: string;
  slug: string;
  status: "sold_out" | "coming_soon" | "available";
  category: "tee" | "bag" | "hoodie" | string;
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
    media: ["/product1_1.png", "/AI-generated/A valuable Shirt.png", "/product1_2.png", "/AI-generated/Valuable whote t shirt.png"],
    variants: [
      { id: "raffle-blk", color: "Black", media: ["/product1_1.png", "/AI-generated/A valuable Shirt.png"] },
      { id: "raffle-wht", color: "White", media: ["/product1_2.png", "/AI-generated/Valuable whote t shirt.png"] },
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
    media: ["/MV Members only hoodie-b.png", "/MV Members only hoodie-w.jpeg", "/MV Members only hoodie-g.png", "/AI-generated/Member Hoodie.png"],
    variants: [
      { id: "mv-hoodie-blk", color: "Black", media: ["/MV Members only hoodie-b.png", "/MV Members only hoodie-w.jpeg", "/MV Members only hoodie-g.png"] },
      { id: "mv-hoodie-wht", color: "White", media: ["/MV Members only hoodie-w.jpeg", "/MV Members only hoodie-b.png", "/MV Members only hoodie-g.png"] },
      { id: "mv-hoodie-gry", color: "Gray", media: ["/MV Members only hoodie-g.png", "/AI-generated/Member Hoodie.png", "/MV Members only hoodie-b.png", "/MV Members only hoodie-w.jpeg"] },
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
    "media": ["/Hoodie.png", "/AI-generated/MV Black Hoodie.png"]
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
  {
    "id": "box-logo-zipper",
    "name": "Box Logo Zipper",
    "slug": "box-logo-zipper",
    "status": "available",
    "category": "hoodie",
    "price": "$85",
    "description": "Premium Box Logo Zipper crafted for style and comfort. Comes with 1g of gold.",
    "media": [
      "/socoldblooded-attachments new/1CA3CA6E-ECD9-4964-BB92-4D283B53D7E5.png",
      "/socoldblooded-attachments new/36B22280-9267-4655-BA02-654B83A8DD88.png",
      "/socoldblooded-attachments new/D0905387-2F1C-427F-9F5F-56766D302B5D.jpeg"
    ]
  },
  {
    "id": "box-logo-beanie",
    "name": "Box Logo Beanie",
    "slug": "box-logo-beanie",
    "status": "available",
    "category": "beanie",
    "price": "$85",
    "description": "Premium Box Logo Beanie crafted for warmth and style. Perfect for any season.",
    "media": [
      "/socoldblooded-attachments new/943D9B6B-AB4D-419C-B34F-65B739EB9A23.png",
      "/socoldblooded-attachments new/C0600980-49DF-4C5C-9BAC-3277BE8E643F.png",
      "/socoldblooded-attachments new/ECA390CB-4D27-4CAA-A523-7E100E3F9C90.png",
      "/socoldblooded-attachments new/FFC5BE59-CCA5-4C94-983E-E5C10216AA01.png"
    ]
  },
  // Coming Soon Products
  {
    "id": "cs1",
    "name": "MV Track Pants",
    "slug": "mv-track-pants",
    "status": "coming_soon",
    "category": "pants",
    "media": ["/Coming Soon/0F20297A-5779-4056-8133-DAAB1DBF3582.jpeg"]
  },
  {
    "id": "cs2",
    "name": "A Valuable Pillow",
    "slug": "a-valuable-pillow",
    "status": "coming_soon",
    "category": "home",
    "media": ["/Coming Soon/524427C4-666D-47BB-933D-A8F3B52A4CD1.png"]
  },
  {
    "id": "cs3",
    "name": "Valuable Glasses",
    "slug": "valuable-glasses",
    "status": "coming_soon",
    "category": "accessories",
    "media": ["/Coming Soon/60FDA3FE-A017-4C7A-91E7-17D1CB040313.jpeg"]
  },
  {
    "id": "cs4",
    "name": "A Valuable Beanbag",
    "slug": "a-valuable-beanbag",
    "status": "coming_soon",
    "category": "home",
    "media": ["/Coming Soon/705FF280-F144-486E-BB41-671B313F606A.jpeg"]
  },
  {
    "id": "cs5",
    "name": "MV Track Pants",
    "slug": "mv-track-pants-2",
    "status": "coming_soon",
    "category": "pants",
    "media": ["/Coming Soon/CF2BAE50-F485-43C3-8AE4-D638F71275F6.jpeg"]
  },
  {
    "id": "cs6",
    "name": "A Valuable Jacket",
    "slug": "a-valuable-jacket",
    "status": "coming_soon",
    "category": "jacket",
    "media": ["/Coming Soon/D6437BC8-D0C1-4CBC-8651-366AB706D6C8.png"]
  },
  // Sold Out Products
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
];
