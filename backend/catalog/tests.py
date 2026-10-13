from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from .models import Category, Product


class CatalogApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.crop_care = Category.objects.create(name='Crop protection', slug='crop-protection', sort_order=1)
        self.animals = Category.objects.create(name='Animal health', slug='animal-health', sort_order=2)
        Product.objects.create(
            category=self.crop_care,
            slug='field-shield',
            name='Field Shield',
            subtitle='Botanical crop spray',
            description='A considered, label-first crop care product.',
            price=Decimal('18.90'),
            rating=Decimal('4.8'),
            stock=12,
            featured=True,
        )
        Product.objects.create(
            category=self.animals,
            slug='barn-care',
            name='Barn Care',
            subtitle='Everyday animal health',
            description='A useful farm care essential.',
            price=Decimal('14.00'),
            rating=Decimal('4.6'),
            stock=4,
        )

    def test_product_listing_search_and_category_filters(self):
        response = self.client.get('/api/products/', {'category': 'crop-protection', 'search': 'botanical'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['slug'], 'field-shield')
        self.assertEqual(response.data[0]['category_name'], 'Crop protection')

    def test_category_counts_only_active_products(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['slug'], 'crop-protection')
        self.assertEqual(response.data[0]['product_count'], 1)

    def test_product_detail_is_available_by_slug(self):
        response = self.client.get('/api/products/field-shield/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['name'], 'Field Shield')
        self.assertEqual(response.data['stock'], 12)
