import puliyogre from "@/assets/puliyogre.jpeg";
import chutneyPowder from "@/assets/chutneyPowder.jpeg";
import peanutPowder from "@/assets/peanutPowder.jpeg";
import bisibelebathPowder from "@/assets/bisibeleBathPowder.jpeg";
import vangiBathPowder from "@/assets/vangibathPowder.jpeg";
import rasamPowder from "@/assets/rasamPowder.jpeg";
import sambharPwoder from "@/assets/sambharPowder.jpeg";
import dryFruitsLaddoo from "@/assets/dryFruitsLaddoo.jpeg";
import kodbale from "@/assets/kodbale.jpeg";
import maddurVade from "@/assets/maddurVade.jpeg";
import { Product } from "@/components/ProductCard";

export const products: Product[] = [
  {
    id: "1",
    name: "Puliyogre Gojju (1Kg)",
    price: 500,
    image: puliyogre,
    category: "Gojju",
  },
  {
    id: "2",
    name: "Chutney Powder (1kg)",
    price: 600,
    image: chutneyPowder,
    category: "Powders",
  },
  {
    id: "3",
    name: "Peanut Chutney Powder (1Kg)",
    price: 700,
    image: peanutPowder,
    category: "Powders",
  },
  {
    id: "4",
    name: "Bisibele bath Powder",
    price: 199,
    image: bisibelebathPowder,
    category: "Powders",
  },
  {
    id: "5",
    name: "Vangibath Powder (1Kg)",
    price: 600,
    image: vangiBathPowder,
    category: "Powders",
  },
  {
    id: "6",
    name: "Rasam Powder (1Kg)",
    price: 800,
    image: rasamPowder,
    category: "Powders",
  },
  {
    id: "7",
    name: "Sambhar Powder (1Kg)",
    price: 800,
    image: sambharPwoder,
    category: "Powders",
  },
  {
    id: "8",
    name: "Dry Fruits Laddoo (1Kg)",
    price: 1200,
    image: dryFruitsLaddoo,
    category: "Sweets",
  },
  {
    id: "9",
    name: "Kodbale (1Kg)",
    price: 400,
    image: kodbale,
    category: "Snacks",
  },
  {
    id: "10",
    name: "Maddur Vade (1Pcs)",
    price: 20,
    image: maddurVade,
    category: "Snacks",
  },
];
