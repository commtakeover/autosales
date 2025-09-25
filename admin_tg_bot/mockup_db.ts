import { Link } from "../db/entities/link.entity"
import { LinkRepository } from "../db/repositories/LinkRepository"
import { LinkPlaceRepository } from "../db/repositories/LinkPlaceRepository"
import { LinkCategoryRepository } from "../db/repositories/LinkCategoryRepository"
import { LinkSubplaceRepository } from "../db/repositories/LinkSubplaceRepository"
import { InventoryRestockRepository } from "../db/repositories/InventoryRestockRepository"

export async function createRestock(): Promise<{
    name: string,
    restockId: number,
    category: string,
    place: string,
    subplace: string,
    manufacturer: string,
    deliverer: string,
    quantity: number,
    unitOfMeasure: string,
    price: number,
    links: string[],
}> {
    const MockCategories = [ "🥩 Мясо", "🐟 Рыба", "🥬 Овощи", "🍎 Фрукты", "🍺 Напитки", "🍰 Кондитерские изделия", "🧼 Бытовая химия", "🏠 Товары для дома", "🐶 Товары для животных", "👶 Товары для детей", "👨‍👩‍👧‍👦 Товары для взрослых", "👵 Товары для пожилых", "🤰 Товары для беременных", ]
    const MockManufacturers = [ "🏭 Производитель 1", "🏭 Производитель 2", "🏭 Производитель 3", "🏭 Производитель 4", "🏭 Производитель 5", "🏭 Производитель 6", "🏭 Производитель 7", "🏭 Производитель 8", "🏭 Производитель 9", "🏭 Производитель 10", ]
    const MockDeliverers = [ "🚚 Доставщик 1", "🚚 Доставщик 2", "🚚 Доставщик 3", "🚚 Доставщик 4", "🚚 Доставщик 5", "🚚 Доставщик 6", "🚚 Доставщик 7", "🚚 Доставщик 8", "🚚 Доставщик 9", "🚚 Доставщик 10", ]
    const MockPlaces = [ "🏙 Город 1", "🏙 Город 2", "🏙 Город 3", "🏙 Город 4", "🏙 Город 5", "🏙 Город 6", "🏙 Город 7" ];
    const MockSubplaces = [ "🏙 Район 1", "🏙 Район 2", "🏙 Район 3", "🏙 Район 4", "🏙 Район 5", "🏙 Район 6", "🏙 Район 7" ];
    const MockPrices = [ 21, 38, 55, 72, 175, 220]
    const MockQuantities = [ 1, 2, 5, 10, 20, 30, 40, 50, 60, 70, ]
    const MockUnitsOfMeasure = [ "гр", "шт", ]
    const MockNames = [ "🍎 Товар 1", "🍎 Товар 2", "🍎 Товар 3", "🍎 Товар 4", "🍎 Товар 5", "🍎 Товар 6", "🍎 Товар 7", "🍎 Товар 8", "🍎 Товар 9", "🍎 Товар 10", ]

    const restockId = await InventoryRestockRepository.countRestocks()

    // create categories, places, subplaces, inventory_restoke
    const categoryText = MockCategories[Math.floor(Math.random() * MockCategories.length)]!
    const placeText = MockPlaces[Math.floor(Math.random() * MockPlaces.length)]!
    const subplaceText = MockSubplaces[Math.floor(Math.random() * MockSubplaces.length)]!
    const manufacturerText = MockManufacturers[Math.floor(Math.random() * MockManufacturers.length)]!
    const delivererText = MockDeliverers[Math.floor(Math.random() * MockDeliverers.length)]!
    const quantityText = MockQuantities[Math.floor(Math.random() * MockQuantities.length)]!
    const unitOfMeasureText = MockUnitsOfMeasure[Math.floor(Math.random() * MockUnitsOfMeasure.length)]!
    const priceText = MockPrices[Math.floor(Math.random() * MockPrices.length)]!
    const nameText = MockNames[Math.floor(Math.random() * MockNames.length)]!

    let category = await LinkCategoryRepository.findByName(categoryText);
    if (!category) {
        category = await LinkCategoryRepository.createCategory(categoryText);
    }

    let place = await LinkPlaceRepository.findByName(placeText);
    if (!place) {
        place = await LinkPlaceRepository.createPlace(placeText);
    }

    let subplace = await LinkSubplaceRepository.findByName(subplaceText);
    if (!subplace) {
        subplace = await LinkSubplaceRepository.createSubplace(subplaceText, place);
    }

    const linksTexts = []
    // choose amount of links between [5, 10, 15, 25]
    // const amountOfLinks = [5, 10, 15, 25][Math.floor(Math.random() * 4)]!
    const amountOfLinks = 5
    for (let i = 0; i < amountOfLinks; i++) {
        // remove whitespaces from categoryText
        const categoryTextWithoutWhitespaces = categoryText.replace(/\s/g, '')
        linksTexts.push(`${categoryTextWithoutWhitespaces}-${restockId + 1}.com`)
    }

    let links: Partial<Link>[] = [];
    for (const linkText of linksTexts) {
        links.push({
            name: nameText,
            price_usd: priceText,
            category,
            place,
            subplace,
            quantity: quantityText,
            unit_of_measure: unitOfMeasureText,
            manufacturer: manufacturerText,
            deliverer: delivererText,
            link: linkText,
        } as unknown as Partial<Link>)
    }

    // create inventory restock
    const inventoryRestock = await InventoryRestockRepository.createRestock({ quantity: links.length });

    for (const link of links) {
        link.inventory_restock = inventoryRestock;
        const createdLink = await LinkRepository.createLink(link as unknown as Link);
        link.id = createdLink.id;
    }

    await InventoryRestockRepository.updateRestock(inventoryRestock.id, {
        links: links.map(link => link as unknown as Link)
    });

    return {
        name: nameText,
        restockId: inventoryRestock.id,
        category: categoryText,
        place: placeText,
        subplace: subplaceText,
        manufacturer: manufacturerText,
        deliverer: delivererText,
        quantity: quantityText,
        unitOfMeasure: unitOfMeasureText,
        price: priceText,
        links: links.map(link => link.link as string),
    }

    
}

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

async function getMockData(status: string, amount: number) {
    const mockData = [
        {
            id: 1,
            link_status: status,
            inventory_restoke: {
                id: 1,
                quantity: 8,
            },
            url: "https://example.com/link1",
            created_at: new Date("2024-01-01"),
            updated_at: new Date("2024-01-01"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_1",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 1",
            subplace: "Subplace 1-1",
            manufacturer: "Manufacturer 1",
            deliverer: "Deliverer 1"
        },
        {
            id: 2,
            link_status: status,
            inventory_restoke: {
                id: 1,
                quantity: 8,
            },
            url: "https://example.com/link2",
            created_at: new Date("2024-01-02"),
            updated_at: new Date("2024-01-02"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_1",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 2",
            subplace: "Subplace 2-1",
            manufacturer: "Manufacturer 1",
            deliverer: "Deliverer 1"
        },
        {
            id: 3,
            link_status: status,
            inventory_restoke: {
                id: 1,
                quantity: 8,
            },
            url: "https://example.com/link3", 
            created_at: new Date("2024-01-03"),
            updated_at: new Date("2024-01-03"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_1",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 3",
            subplace: "Subplace 3-1",
            manufacturer: "Manufacturer 1",
            deliverer: "Deliverer 1"
        },
        {
            id: 4,
            link_status: status,
            inventory_restoke: {
                id: 1,
                quantity: 8,
            },
            url: "https://example.com/link4",
            created_at: new Date("2024-01-04"), 
            updated_at: new Date("2024-01-04"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_1",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 4",
            subplace: "Subplace 4-1",
            manufacturer: "Manufacturer 1",
            deliverer: "Deliverer 1"
        },
        {
            id: 5,
            link_status: status,
            inventory_restoke: {
                id: 1,
                quantity: 8,
            },
            url: "https://example.com/link5",
            created_at: new Date("2024-01-05"),
            updated_at: new Date("2024-01-05"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_1",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 1",
            subplace: "Subplace 1-1",
            manufacturer: "Manufacturer 1",
            deliverer: "Deliverer 1"
        },
        {
            id: 6,
            link_status: status,
            inventory_restoke: {
                id: 1,
                quantity: 8,
            },
            url: "https://example.com/link6",
            created_at: new Date("2024-01-06"),
            updated_at: new Date("2024-01-06"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_1",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 2",
            subplace: "Subplace 2-1",
            manufacturer: "Manufacturer 1",
            deliverer: "Deliverer 1"
        },
        {
            id: 7,
            link_status: status,
            inventory_restoke: {
                id: 1,
                quantity: 8,
            },
            url: "https://example.com/link7",
            created_at: new Date("2024-01-07"), 
            updated_at: new Date("2024-01-07"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_1", 
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 3",
            subplace: "Subplace 3-1",
            manufacturer: "Manufacturer 1", 
            deliverer: "Deliverer 1"
        },
        {
            id: 8,
            link_status: status,
            inventory_restoke: {
                id: 1,
                quantity: 8,
            },
            url: "https://example.com/link8",
            created_at: new Date("2024-01-08"),
            updated_at: new Date("2024-01-08"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_1",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 4",
            subplace: "Subplace 4-1",
            manufacturer: "Manufacturer 1",
            deliverer: "Deliverer 1"
        },
        {
            id: 9,
            link_status: status,
            inventory_restoke: {
                id: 2,
                quantity: 8,
            },
            url: "https://example.com/link9",
            created_at: new Date("2024-01-09"),
            updated_at: new Date("2024-01-09"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_2",
            price_usd: 72,
            quantity: 2,
            unit_of_measure: "g",
            place: "Place 1",
            subplace: "Subplace 1-2",
            manufacturer: "Manufacturer 2",
            deliverer: "Deliverer 2"
        },
        {
            id: 10,
            link_status: status,
            inventory_restoke: {
                id: 2, 
                quantity: 8,
            },
            url: "https://example.com/link10",
            created_at: new Date("2024-01-10"),
            updated_at: new Date("2024-01-10"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_2",
            price_usd: 72,
            quantity: 2,
            unit_of_measure: "g",
            place: "Place 2",
            subplace: "Subplace 2-2",
            manufacturer: "Manufacturer 2",
            deliverer: "Deliverer 2"
        },
        {
            id: 11,
            link_status: status,
            inventory_restoke: {
                id: 2,
                quantity: 8,
            },
            url: "https://example.com/link11",
            created_at: new Date("2024-01-11"),
            updated_at: new Date("2024-01-11"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_2",
            price_usd: 72,
            quantity: 2,
            unit_of_measure: "g",
            place: "Place 3",
            subplace: "Subplace 3-2",
            manufacturer: "Manufacturer 2",
            deliverer: "Deliverer 2"
        },
        {
            id: 12,
            link_status: status,
            inventory_restoke: {
                id: 2,
                quantity: 8,
            },
            url: "https://example.com/link12",
            created_at: new Date("2024-01-12"),
            updated_at: new Date("2024-01-12"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_2",
            price_usd: 72,
            quantity: 2,
            unit_of_measure: "g",
            place: "Place 4",
            subplace: "Subplace 4-2",
            manufacturer: "Manufacturer 2",
            deliverer: "Deliverer 2"
        },
        {
            id: 13,
            link_status: status,
            inventory_restoke: {
                id: 2,
                quantity: 8,
            },
            url: "https://example.com/link13",
            created_at: new Date("2024-01-13"),
            updated_at: new Date("2024-01-13"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_2",
            price_usd: 72,
            quantity: 2,
            unit_of_measure: "g",
            place: "Place 1",
            subplace: "Subplace 1-2",
            manufacturer: "Manufacturer 2",
            deliverer: "Deliverer 2"
        },
        {
            id: 14,
            link_status: status,
            inventory_restoke: {
                id: 2,
                quantity: 8,
            },
            url: "https://example.com/link14",
            created_at: new Date("2024-01-14"),
            updated_at: new Date("2024-01-14"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_2",
            price_usd: 72,
            quantity: 2,
            unit_of_measure: "g",
            place: "Place 2",
            subplace: "Subplace 2-2",
            manufacturer: "Manufacturer 2",
            deliverer: "Deliverer 2"
        },
        {
            id: 15,
            link_status: status,
            inventory_restoke: {
                id: 2,
                quantity: 8,
            },
            url: "https://example.com/link15",
            created_at: new Date("2024-01-15"),
            updated_at: new Date("2024-01-15"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_2",
            price_usd: 72,
            quantity: 2,
            unit_of_measure: "g",
            place: "Place 3",
            subplace: "Subplace 3-2",
            manufacturer: "Manufacturer 2",
            deliverer: "Deliverer 2"
        },
        {
            id: 16,
            link_status: status,
            inventory_restoke: {
                id: 2,
                quantity: 8,
            },
            url: "https://example.com/link16",
            created_at: new Date("2024-01-16"),
            updated_at: new Date("2024-01-16"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_2",
            price_usd: 72,
            quantity: 2,
            unit_of_measure: "g",
            place: "Place 4",
            subplace: "Subplace 4-2",
            manufacturer: "Manufacturer 2",
            deliverer: "Deliverer 2"
        },
        {
            id: 17,
            link_status: status,
            inventory_restoke: {
                id: 3,
                quantity: 4,
            },
            url: "https://example.com/link17",
            created_at: new Date("2024-01-17"),
            updated_at: new Date("2024-01-17"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_3",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 1",
            subplace: "Subplace 1-3",
            manufacturer: "Manufacturer 17",
            deliverer: "Deliverer 17"
        },
        {
            id: 18,
            link_status: status,
            inventory_restoke: {
                id: 3,
                quantity: 4,
            },
            url: "https://example.com/link18",
            created_at: new Date("2024-01-18"),
            updated_at: new Date("2024-01-18"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_3",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 2",
            subplace: "Subplace 2-3",
            manufacturer: "Manufacturer 3",
            deliverer: "Deliverer 3"
        },
        {
            id: 19,
            link_status: status,
            inventory_restoke: {
                id: 3,
                quantity: 4,
            },
            url: "https://example.com/link19",
            created_at: new Date("2024-01-19"),
            updated_at: new Date("2024-01-19"),
            category: {
                id: 1,
                name: "Category 1"
            },
            name: "Good_name_3",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 3",
            subplace: "Subplace 3-3",
            manufacturer: "Manufacturer 3",
            deliverer: "Deliverer 3"
        },
        {
            id: 20,
            link_status: status,
            inventory_restoke: {
                id: 3,
                quantity: 4,
            },
            url: "https://example.com/link20",
            created_at: new Date("2024-01-20"),
            updated_at: new Date("2024-01-20"),
            category: {
                id: 2,
                name: "Category 2"
            },
            name: "Good_name_3",
            price_usd: 38,
            quantity: 1,
            unit_of_measure: "g",
            place: "Place 4",
            subplace: "Subplace 4-3",
            manufacturer: "Manufacturer 3",
            deliverer: "Deliverer 3"
        }
    ];
    return mockData;
}

export async function getCategories(status: string, amount: number): Promise<any[]> {
    const categories = await generateMockData(status, amount)
    const categories_unique = categories.map(category => category.category).filter((value, index, self) => self.indexOf(value) === index);
    return categories_unique;
}

export async function findAllLinksWithStatus_mock(status: string, amount: number): Promise<any[]> {
    // if (amount > 20) throw new Error("Amount cannot be greater than 20");
    const mockData = await getMockData(status, amount);
    return mockData.slice(0, amount);
}