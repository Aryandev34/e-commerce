from decimal import Decimal
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from catalog.models import Product
from config.api_errors import InventoryConflict
from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    AddCartItemSerializer,
    CartSerializer,
    CheckoutRequestSerializer,
    CreateCartSerializer,
    OrderSerializer,
    UpdateCartItemSerializer,
)


class CartCreateView(APIView):
    """Create an anonymous cart, or resume one by passing its UUID as cart_id."""

    def post(self, request):
        input_serializer = CreateCartSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        supplied_id = input_serializer.validated_data.get('cart_id')
        cart = None
        if supplied_id:
            cart = Cart.objects.filter(pk=supplied_id, status=Cart.Status.OPEN).first()
        if cart is None:
            cart = Cart.objects.create()
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)


class CartDetailView(APIView):
    def get(self, request, cart_id):
        cart = get_object_or_404(Cart.objects.prefetch_related('items__product__category'), pk=cart_id)
        return Response(CartSerializer(cart).data)


class CartItemCollectionView(APIView):
    @transaction.atomic
    def post(self, request, cart_id):
        input_serializer = AddCartItemSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        cart = get_object_or_404(Cart.objects.select_for_update(), pk=cart_id)
        if cart.status != Cart.Status.OPEN:
            raise ValidationError({'cart': 'This cart has already been checked out.'})

        try:
            product = Product.objects.select_for_update().select_related('category').get(
                pk=input_serializer.validated_data['product_id'], is_active=True
            )
        except Product.DoesNotExist:
            raise NotFound('This product is no longer available.')

        requested_quantity = input_serializer.validated_data['quantity']
        cart_line = CartItem.objects.select_for_update().filter(cart=cart, product=product).first()
        new_quantity = requested_quantity + (cart_line.quantity if cart_line else 0)
        if new_quantity > product.stock:
            raise InventoryConflict(f'Only {product.stock} unit(s) of {product.name} are currently available.')
        if cart_line:
            cart_line.quantity = new_quantity
            cart_line.save(update_fields=['quantity', 'updated_at'])
        else:
            CartItem.objects.create(cart=cart, product=product, quantity=new_quantity)
        cart.save(update_fields=['updated_at'])
        cart = Cart.objects.prefetch_related('items__product__category').get(pk=cart.pk)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemDetailView(APIView):
    @transaction.atomic
    def patch(self, request, cart_id, item_id):
        input_serializer = UpdateCartItemSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        cart = get_object_or_404(Cart.objects.select_for_update(), pk=cart_id)
        if cart.status != Cart.Status.OPEN:
            raise ValidationError({'cart': 'This cart has already been checked out.'})
        line = get_object_or_404(
            CartItem.objects.select_for_update().select_related('product'),
            pk=item_id,
            cart=cart,
        )
        product = Product.objects.select_for_update().get(pk=line.product_id)
        quantity = input_serializer.validated_data['quantity']
        if quantity > product.stock or not product.is_active:
            raise InventoryConflict(f'Only {product.stock} unit(s) of {product.name} are currently available.')
        line.quantity = quantity
        line.save(update_fields=['quantity', 'updated_at'])
        cart.save(update_fields=['updated_at'])
        cart = Cart.objects.prefetch_related('items__product__category').get(pk=cart.pk)
        return Response(CartSerializer(cart).data)

    @transaction.atomic
    def delete(self, request, cart_id, item_id):
        cart = get_object_or_404(Cart.objects.select_for_update(), pk=cart_id)
        if cart.status != Cart.Status.OPEN:
            raise ValidationError({'cart': 'This cart has already been checked out.'})
        line = get_object_or_404(CartItem.objects.select_for_update(), pk=item_id, cart=cart)
        line.delete()
        cart.save(update_fields=['updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CheckoutView(APIView):
    @transaction.atomic
    def post(self, request):
        input_serializer = CheckoutRequestSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        values = input_serializer.validated_data
        cart = get_object_or_404(Cart.objects.select_for_update(), pk=values['cart_id'])
        if cart.status != Cart.Status.OPEN:
            raise ValidationError({'cart': 'This cart has already been checked out.'})

        lines = list(cart.items.select_related('product').order_by('product_id'))
        if not lines:
            raise ValidationError({'cart': 'Your cart is empty.'})

        product_ids = [line.product_id for line in lines]
        # Lock in a stable order so checkouts for overlapping products do not deadlock.
        products = {
            product.pk: product
            for product in Product.objects.select_for_update().filter(pk__in=product_ids).order_by('pk')
        }
        for line in lines:
            product = products.get(line.product_id)
            if product is None or not product.is_active:
                raise InventoryConflict(f'{line.product.name} is no longer available.')
            if line.quantity > product.stock:
                raise InventoryConflict(f'Only {product.stock} unit(s) of {product.name} are currently available.')

        subtotal = sum((products[line.product_id].price * line.quantity for line in lines), start=Decimal('0.00'))
        shipping = Decimal('0.00') if subtotal >= Decimal('50.00') else Decimal('5.95')
        order = Order.objects.create(
            cart=cart,
            full_name=values['full_name'],
            email=values['email'],
            shipping_address=values['shipping_address'],
            subtotal=subtotal,
            shipping=shipping,
            total=subtotal + shipping,
        )
        for line in lines:
            product = products[line.product_id]
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                unit_price=product.price,
                quantity=line.quantity,
            )
            product.stock -= line.quantity
            product.save(update_fields=['stock', 'updated_at'])

        cart.status = Cart.Status.CHECKED_OUT
        cart.save(update_fields=['status', 'updated_at'])
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
