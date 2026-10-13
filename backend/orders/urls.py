from django.urls import path
from .views import CartCreateView, CartDetailView, CartItemCollectionView, CartItemDetailView, CheckoutView

urlpatterns = [
    path('carts/', CartCreateView.as_view(), name='cart-create'),
    path('carts/<uuid:cart_id>/', CartDetailView.as_view(), name='cart-detail'),
    path('carts/<uuid:cart_id>/items/', CartItemCollectionView.as_view(), name='cart-item-list-create'),
    path('carts/<uuid:cart_id>/items/<int:item_id>/', CartItemDetailView.as_view(), name='cart-item-detail'),
    path('orders/checkout/', CheckoutView.as_view(), name='order-checkout'),
]
