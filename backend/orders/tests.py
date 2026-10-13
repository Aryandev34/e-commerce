from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from catalog.models import Category, Product
from .models import Cart, CartItem, Order


class CartAndOrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Crop protection', slug='crop-protection')
        self.product = Product.objects.create(
            category=self.category,
            slug='test-product',
            name='Test Product',
            subtitle='Farm care',
            description='A demo product.',
            price=Decimal('20.00'),
            stock=5,
        )

    def create_cart(self):
        response = self.client.post('/api/carts/', {}, format='json')
        self.assertEqual(response.status_code, 201)
        return response.data['id']

    def add_to_cart(self, cart_id, quantity=1):
        return self.client.post(
            f'/api/carts/{cart_id}/items/',
            {'product_id': self.product.id, 'quantity': quantity},
            format='json',
        )

    def test_add_and_update_cart_item(self):
        cart_id = self.create_cart()
        added = self.add_to_cart(cart_id, 2)
        self.assertEqual(added.status_code, 200)
        self.assertEqual(added.data['item_count'], 2)
        self.assertEqual(Decimal(added.data['subtotal']), Decimal('40.00'))
        line_id = added.data['items'][0]['id']
        updated = self.client.patch(
            f'/api/carts/{cart_id}/items/{line_id}/', {'quantity': 3}, format='json'
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data['items'][0]['quantity'], 3)

    def test_cart_can_be_resumed_and_invalid_uuid_is_rejected(self):
        cart_id = self.create_cart()
        resumed = self.client.post('/api/carts/', {'cart_id': cart_id}, format='json')
        self.assertEqual(resumed.status_code, 201)
        self.assertEqual(resumed.data['id'], cart_id)
        invalid = self.client.post('/api/carts/', {'cart_id': 'not-a-uuid'}, format='json')
        self.assertEqual(invalid.status_code, 400)

    def test_addition_cannot_exceed_stock(self):
        cart_id = self.create_cart()
        response = self.add_to_cart(cart_id, 6)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(CartItem.objects.count(), 0)

    def test_checkout_creates_order_and_decrements_inventory(self):
        cart_id = self.create_cart()
        self.assertEqual(self.add_to_cart(cart_id, 2).status_code, 200)
        response = self.client.post('/api/orders/checkout/', {
            'cart_id': cart_id,
            'full_name': 'Sam Grower',
            'email': 'sam@example.com',
            'shipping_address': '12 Orchard Lane, Green City',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['order_number'].startswith('FW-'))
        self.assertEqual(response.data['subtotal'], '40.00')
        self.assertEqual(response.data['shipping'], '5.95')
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
        self.assertEqual(Cart.objects.get(pk=cart_id).status, Cart.Status.CHECKED_OUT)
        self.assertEqual(Order.objects.count(), 1)

    def test_checkout_rechecks_stock_inside_transaction(self):
        cart_id = self.create_cart()
        cart = Cart.objects.get(pk=cart_id)
        CartItem.objects.create(cart=cart, product=self.product, quantity=6)
        response = self.client.post('/api/orders/checkout/', {
            'cart_id': cart_id,
            'full_name': 'Sam Grower',
            'email': 'sam@example.com',
            'shipping_address': '12 Orchard Lane, Green City',
        }, format='json')
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Order.objects.count(), 0)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

    def test_cannot_checkout_same_cart_twice(self):
        cart_id = self.create_cart()
        self.add_to_cart(cart_id)
        payload = {
            'cart_id': cart_id,
            'full_name': 'Sam Grower',
            'email': 'sam@example.com',
            'shipping_address': '12 Orchard Lane, Green City',
        }
        self.assertEqual(self.client.post('/api/orders/checkout/', payload, format='json').status_code, 201)
        self.assertEqual(self.client.post('/api/orders/checkout/', payload, format='json').status_code, 400)
        self.assertEqual(Order.objects.count(), 1)

    def test_competing_carts_recheck_shared_inventory_at_checkout(self):
        first_cart = self.create_cart()
        second_cart = self.create_cart()
        self.assertEqual(self.add_to_cart(first_cart, 4).status_code, 200)
        self.assertEqual(self.add_to_cart(second_cart, 4).status_code, 200)
        details = {
            'full_name': 'Sam Grower',
            'email': 'sam@example.com',
            'shipping_address': '12 Orchard Lane, Green City',
        }
        first_checkout = self.client.post('/api/orders/checkout/', {'cart_id': first_cart, **details}, format='json')
        second_checkout = self.client.post('/api/orders/checkout/', {'cart_id': second_cart, **details}, format='json')
        self.assertEqual(first_checkout.status_code, 201)
        self.assertEqual(second_checkout.status_code, 409)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 1)
        self.assertEqual(Order.objects.count(), 1)
