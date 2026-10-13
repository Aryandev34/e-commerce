from decimal import Decimal
from django.core.management.base import BaseCommand
from catalog.models import Category, Product


CATEGORIES = [
    {'name': 'Crop protection', 'slug': 'crop-protection', 'description': 'Thoughtful essentials for protecting your crops.', 'sort_order': 1},
    {'name': 'Animal health', 'slug': 'animal-health', 'description': 'Everyday health and care for the animals in your care.', 'sort_order': 2},
    {'name': 'Plant nutrition', 'slug': 'plant-nutrition', 'description': 'Useful nutrition for healthier plants and soil.', 'sort_order': 3},
    {'name': 'Farm supplies', 'slug': 'farm-supplies', 'description': 'Practical essentials for the work around your farm.', 'sort_order': 4},
]

PRODUCTS = [
    {'slug': 'neem-shield-botanical-spray', 'name': 'Neem Shield', 'subtitle': 'Botanical crop spray', 'description': 'A plant-derived crop care concentrate from a trusted, label-first supplier. Always read and follow the product label.', 'category': 'crop-protection', 'price': '18.90', 'compare_at_price': '22.00', 'unit': '500 ml', 'rating': '4.9', 'review_count': 128, 'badge': 'Bestseller', 'image_tone': 'sage', 'pack_type': 'bottle', 'stock': 42, 'featured': True},
    {'slug': 'orchard-guard-concentrate', 'name': 'Orchard Guard', 'subtitle': 'Concentrated crop care', 'description': 'A dependable orchard-care formula made for growers who want a considered approach to crop protection.', 'category': 'crop-protection', 'price': '26.50', 'compare_at_price': None, 'unit': '1 L', 'rating': '4.8', 'review_count': 86, 'badge': 'Grower pick', 'image_tone': 'clay', 'pack_type': 'bottle', 'stock': 27, 'featured': True},
    {'slug': 'calm-co-wound-care', 'name': 'Calm & Co. Care', 'subtitle': 'Livestock wound care', 'description': 'A farm-ready animal care essential from a quality-checked range. Consult your veterinarian when needed.', 'category': 'animal-health', 'price': '14.75', 'compare_at_price': None, 'unit': '250 ml', 'rating': '4.9', 'review_count': 64, 'badge': 'Farm favorite', 'image_tone': 'blue', 'pack_type': 'bottle', 'stock': 35, 'featured': True},
    {'slug': 'root-and-row-mineral-mix', 'name': 'Root & Row Mix', 'subtitle': 'Balanced plant nutrition', 'description': 'An easy-to-store plant nutrition blend designed to support healthy roots through the growing season.', 'category': 'plant-nutrition', 'price': '21.00', 'compare_at_price': '24.00', 'unit': '2 kg', 'rating': '4.7', 'review_count': 92, 'badge': 'Good growing', 'image_tone': 'butter', 'pack_type': 'pouch', 'stock': 51, 'featured': True},
    {'slug': 'pasture-first-electrolyte', 'name': 'Pasture First', 'subtitle': 'Livestock hydration blend', 'description': 'A convenient farm-side hydration support blend. Use as directed and seek veterinary advice for unwell animals.', 'category': 'animal-health', 'price': '16.25', 'compare_at_price': None, 'unit': '1 kg', 'rating': '4.8', 'review_count': 53, 'badge': '', 'image_tone': 'peach', 'pack_type': 'pouch', 'stock': 19, 'featured': False},
    {'slug': 'leafwell-protective-care', 'name': 'Leafwell Care', 'subtitle': 'Protective plant treatment', 'description': 'A carefully sourced plant care treatment for the home garden and smallholding. Check local rules before use.', 'category': 'crop-protection', 'price': '19.40', 'compare_at_price': None, 'unit': '750 ml', 'rating': '4.6', 'review_count': 39, 'badge': '', 'image_tone': 'sage', 'pack_type': 'spray', 'stock': 0, 'featured': False},
    {'slug': 'field-notes-tool-kit', 'name': 'Field Notes Kit', 'subtitle': 'Everyday farm essentials', 'description': 'A useful little kit for keeping the daily checks, treatments and field notes together in one place.', 'category': 'farm-supplies', 'price': '12.00', 'compare_at_price': None, 'unit': '1 kit', 'rating': '4.8', 'review_count': 47, 'badge': 'New', 'image_tone': 'blue', 'pack_type': 'box', 'stock': 61, 'featured': True},
    {'slug': 'good-earth-soil-booster', 'name': 'Good Earth Booster', 'subtitle': 'Organic soil amendment', 'description': 'A slow-and-steady soil amendment for growers building healthier ground season after season.', 'category': 'plant-nutrition', 'price': '23.80', 'compare_at_price': None, 'unit': '3 kg', 'rating': '4.9', 'review_count': 113, 'badge': '', 'image_tone': 'butter', 'pack_type': 'pouch', 'stock': 31, 'featured': False},
]


class Command(BaseCommand):
    help = 'Create or update the Fieldwell demo categories and products.'

    def handle(self, *args, **options):
        for values in CATEGORIES:
            Category.objects.update_or_create(slug=values['slug'], defaults=values)
        categories = {category.slug: category for category in Category.objects.all()}
        for values in PRODUCTS:
            product_values = {key: value for key, value in values.items() if key != 'category'}
            product_values['category'] = categories[values['category']]
            product_values['price'] = Decimal(product_values['price'])
            if product_values['compare_at_price'] is not None:
                product_values['compare_at_price'] = Decimal(product_values['compare_at_price'])
            Product.objects.update_or_create(slug=values['slug'], defaults=product_values)
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(CATEGORIES)} categories and {len(PRODUCTS)} products.'))
