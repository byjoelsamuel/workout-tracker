// Trimmed responses in the shape Open Food Facts returns, for tests that
// can't (and shouldn't) call the real database.
export const nutellaProduct = {
  code: "3017624010701",
  product_name: "Nutella",
  brands: "Ferrero, Nutella",
  serving_size: "15 g",
  serving_quantity: 15,
  nutriments: {
    "energy-kcal_100g": 539,
    energy_100g: 2252,
    proteins_100g: 6.3,
    carbohydrates_100g: 57.5,
    fat_100g: 30.9,
  },
};

export const barcodeResponse = { code: "3017624010701", status: 1, product: nutellaProduct };
export const notFoundResponse = { code: "0000000000000", status: 0, status_verbose: "product not found" };

export const searchResponse = {
  count: 4,
  page: 1,
  products: [
    nutellaProduct,
    // kJ only, and a comma decimal in a string.
    { code: "111", product_name: "Hazelnut spread", brands: "Store", nutriments: { energy_100g: "2200", proteins_100g: "5,5" } },
    // No energy at all: skipped.
    { code: "222", product_name: "Mystery jar", nutriments: {} },
    // No name: skipped.
    { code: "333", nutriments: { "energy-kcal_100g": 100 } },
  ],
};
