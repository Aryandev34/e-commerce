from rest_framework import serializers
from catalog.serializers import ProductSerializer
from .models import Cart, CartItem, Order, OrderItem


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'line_total']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'status', 'items', 'subtotal', 'item_count', 'created_at', 'updated_at']

    def get_subtotal(self, cart):
        return sum((line.product.price * line.quantity for line in cart.items.all()), start=0)

    def get_item_count(self, cart):
        return sum(line.quantity for line in cart.items.all())


class CreateCartSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField(required=False)


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=999, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class CheckoutRequestSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()
    full_name = serializers.CharField(max_length=120, trim_whitespace=True)
    email = serializers.EmailField()
    shipping_address = serializers.CharField(max_length=600, trim_whitespace=True)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['product_name', 'unit_price', 'quantity', 'line_total']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'status', 'full_name', 'email', 'shipping_address', 'items', 'subtotal', 'shipping', 'total', 'created_at']
