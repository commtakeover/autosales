export async function generateMockData(status: string, amount: number, config?: {
    numCategories?: number,
    numManufacturers?: number,
    numDeliverers?: number,
    numPlaces?: number,
    numSubplaces?: number,
    numRestokes?: number,
    priceValues?: number[],
    quantityValues?: number[],
    startDate?: Date
}): Promise<any[]> {
    // Set defaults
    const cfg = {
        numCategories: 20,
        numManufacturers: 20,
        numDeliverers: 80,
        numPlaces: 16,
        numSubplaces: 80,
        numRestokes: 400,
        priceValues: [38, 72, 175],
        quantityValues: [1, 2, 5],
        startDate: new Date("2024-01-01"),
        ...config
    };

    // Generate base data
    const categories = Array.from({length: cfg.numCategories}, (_, i) => ({
        id: i + 1,
        name: `Category ${i + 1}`
    }));

    const manufacturers = Array.from({length: cfg.numManufacturers}, (_, i) => `Manufacturer ${i + 1}`);
    const deliverers = Array.from({length: cfg.numDeliverers}, (_, i) => `Deliverer ${i + 1}`);
    const places = Array.from({length: cfg.numPlaces}, (_, i) => `Place ${i + 1}`);

    // Generate mockData array
    const mockData = Array.from({length: amount}, (_, i) => {
        const restokeId = Math.floor(i / (amount / cfg.numRestokes)) + 1;
        const date = new Date(cfg.startDate);
        date.setDate(date.getDate() + i);
        const valueIndex = Math.floor(i / 8) % cfg.priceValues.length;

        return {
            id: i + 1,
            link_status: status,
            inventory_restoke: {
                id: restokeId,
                quantity: 4 + restokeId * 4,
            },
            url: `https://example.com/link${i + 1}`,
            created_at: date,
            updated_at: date,
            category: categories[i % categories.length],
            name: `Good_name_${Math.floor(i / 8) + 1}`,
            price_usd: cfg.priceValues[valueIndex],
            quantity: cfg.quantityValues[valueIndex],
            unit_of_measure: "g",
            place: places[i % places.length],
            subplace: `Subplace ${i % places.length + 1}-${Math.floor(i / places.length) % cfg.numSubplaces + 1}`,
            manufacturer: manufacturers[Math.floor(i / 8) % manufacturers.length],
            deliverer: deliverers[Math.floor(i / 8) % deliverers.length]
        };
    });

    return mockData;
}

export async function getCategories(status: string, amount: number): Promise<any[]> {
    const categories = await generateMockData(status, amount)
    const categories_unique = categories.map(category => category.category).filter((value, index, self) => self.indexOf(value) === index);
    return categories_unique;
}