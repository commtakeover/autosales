import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../auth/requireAuth';
import { LinkRepository } from '../../db/repositories/LinkRepository';
import { LinkCategoryRepository } from '../../db/repositories/LinkCategoryRepository';
import { LinkPlaceRepository } from '../../db/repositories/LinkPlaceRepository';
import { LinkSubplaceRepository } from '../../db/repositories/LinkSubplaceRepository';
import { LinkNameRepository } from '../../db/repositories/LinkNameRepository';
import { LinkPriceRepository } from '../../db/repositories/LinkPriceRepository';
import { LinkQuantityRepository } from '../../db/repositories/LinkQuantityRepository';
import { LinkMeasureUnitsRepository } from '../../db/repositories/LinkMeasureUnitsRepository';
import { InventoryRestockRepository } from '../../db/repositories/InventoryRestockRepository';
import { LinkSubcategory } from '../../db/entities/link-subcategory.entity';
import { LinkSubcategoryRepository } from '../../db/repositories/LinkSubcategoryRepository';
import { AppDataSource } from '../../db/data-source';
import { bot } from '../server';

const router = Router();

// GET /inventory - get all inventory links with pagination
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100); // Max 100 per request
    const offset = (page - 1) * limit;

    const [links, total] = await LinkRepository.findAndCount({
      relations: ['category', 'place', 'subplace', 'inventory_restock', 'linkName', 'linkPrice', 'linkQuantity', 'linkMeasureUnits'],
      skip: offset,
      take: limit,
      order: { created_at: 'DESC' }
    });

    // Map the links to include restock_id from the inventory_restock relation
    const mappedLinks = links.map(link => ({
      ...link,
      restock_id: link.inventory_restock?.id || null,
      // Map related entities to simple values for frontend compatibility
      category: link.category?.name || null,
      place: link.place?.name || null,
      subplace: link.subplace?.name || null
    }));

    res.json({
      data: mappedLinks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET /inventory/filters - get all existing filter options
router.get('/filters', requireAuth, async (req: Request, res: Response) => {
  try {
    const [
      categories,
      subcategories,
      places,
      subplaces,
      names,
      prices,
      quantities,
      measureUnits
    ] = await Promise.all([
      LinkCategoryRepository.findAllCategories(),
      LinkSubcategoryRepository.findAllSubcategories(),
      LinkPlaceRepository.findAll(),
      LinkSubplaceRepository.findAllSubplaces(),
      LinkNameRepository.findAllNames(),
      LinkPriceRepository.findAllPrices(),
      LinkQuantityRepository.findAllQuantities(),
      LinkMeasureUnitsRepository.findAllUnits()
    ]);

    res.json({
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      subcategories: subcategories.map(sc => ({ id: sc.id, name: sc.name, categoryId: sc.category?.id })),
      places: places.map(p => ({ id: p.id, name: p.name })),
      subplaces: subplaces.map(sp => ({ id: sp.id, name: sp.name, placeId: sp.place?.id })),
      names: names.map(n => ({ id: n.id, name: n.name })),
      prices: prices.map(p => ({ id: p.id, price_usd: p.price_usd })),
      quantities: quantities.map(q => ({ id: q.id, quantity: q.quantity })),
      measureUnits: measureUnits.map(mu => ({ id: mu.id, unit_of_measure: mu.unit_of_measure }))
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// POST /inventory/restock - create a new restock
router.post('/restock', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      name,
      category,
      price,
      quantity,
      unit_of_measure,
      place,
      subplace,
      links,
      supplier, // optional
      deliverer // optional
    } = req.body;

    // Validate required fields
    if (!name || category === undefined || !price || !quantity || !unit_of_measure || place === undefined || subplace === undefined || !links) {
      res.status(400).json({ 
        error: 'Missing required fields: name, category, price, quantity, unit_of_measure, place, subplace, links are required' 
      });
      return;
    }

    if (!Array.isArray(links) || links.length === 0) {
      res.status(400).json({ error: 'Links must be a non-empty array' });
      return;
    }

    // Create the restock first
    const restock = await InventoryRestockRepository.createRestock({
      quantity: parseInt(quantity)
    });

    // Handle category - can be ID (number) or name (string)
    let categoryEntity;
    if (typeof category === 'number' || !isNaN(parseInt(category))) {
      categoryEntity = await LinkCategoryRepository.findById(parseInt(category));
      if (!categoryEntity) {
        res.status(400).json({ error: 'Invalid category ID' });
        return;
      }
    } else {
      categoryEntity = await LinkCategoryRepository.findOrCreate(category);
    }

    // Handle place - can be ID (number) or name (string)
    let placeEntity;
    if (typeof place === 'number' || !isNaN(parseInt(place))) {
      placeEntity = await LinkPlaceRepository.findById(parseInt(place));
      if (!placeEntity) {
        res.status(400).json({ error: 'Invalid place ID' });
        return;
      }
    } else {
      placeEntity = await LinkPlaceRepository.findOrCreate(place);
    }

    // Handle subplace - can be ID (number) or name (string)
    let subplaceEntity;
    if (typeof subplace === 'number' || !isNaN(parseInt(subplace))) {
      subplaceEntity = await LinkSubplaceRepository.findById(parseInt(subplace));
      if (!subplaceEntity) {
        res.status(400).json({ error: 'Invalid subplace ID' });
        return;
      }
    } else {
      subplaceEntity = await LinkSubplaceRepository.findOrCreate(subplace, placeEntity.id);
    }

    // Find or create the normalized entities
    const [
      linkName,
      linkPrice,
      linkQuantity,
      linkMeasureUnits
    ] = await Promise.all([
      LinkNameRepository.findOrCreate(name),
      LinkPriceRepository.findOrCreate(parseFloat(price)),
      LinkQuantityRepository.findOrCreate(parseInt(quantity)),
      LinkMeasureUnitsRepository.findOrCreate(unit_of_measure)
    ]);

    // Create links
    const createdLinks = [];
    for (const linkUrl of links) {
      const link = await LinkRepository.createLink({
        name,
        price_usd: parseFloat(price),
        quantity: parseInt(quantity),
        unit_of_measure,
        link: linkUrl,
        manufacturer: supplier || null,
        deliverer: deliverer || null,
        category: categoryEntity,
        place: placeEntity,
        subplace: subplaceEntity,
        inventory_restock: restock,
        linkName: linkName,
        linkPrice: linkPrice,
        linkQuantity: linkQuantity,
        linkMeasureUnits: linkMeasureUnits
      });
      createdLinks.push(link);
    }

    // Update restock with the created links
    restock.links = createdLinks;
    await InventoryRestockRepository.save(restock);

    try {
      await bot.api.sendMessage(process.env.TG_NOTIFICATION_CHANNEL_ID!, `🆕 Новое пополнение создано через веб-панель!\n\n🆔 ID пополнения: ${restock.id}\n📦 Товар: ${name}\n🏷️ Категория: ${categoryEntity.name}\n💰 Цена: $${price}\n📊 Количество: ${quantity} ${unit_of_measure}\n📍 Место: ${placeEntity.name} → ${subplaceEntity.name}\n${supplier ? `🏭 Поставщик: ${supplier}` : ''}\n${deliverer ? `🚚 Доставщик: ${deliverer}` : ''}\n🔗 Ссылки: ${links.join('\n')}\n`)
    }
    catch (error) { console.error("[New restock web_dashboard] Error sending message:", error); }

    res.status(201).json({
      message: 'Restock created successfully',
      restock: {
        id: restock.id,
        quantity: restock.quantity,
        created_at: restock.created_at,
        links: createdLinks.map(link => ({
          id: link.id,
          name: link.name,
          price_usd: link.price_usd,
          quantity: link.quantity,
          unit_of_measure: link.unit_of_measure,
          link: link.link,
          manufacturer: link.manufacturer,
          deliverer: link.deliverer
        }))
      }
    });
  } catch (error) {
    console.error('Error creating restock:', error);
    res.status(500).json({ error: 'Failed to create restock' });
  }
});

export default router;
