from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'product_count']


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'slug', 'name', 'subtitle', 'description', 'category', 'category_name',
            'price', 'compare_at_price', 'unit', 'rating', 'review_count', 'badge',
            'image_tone', 'pack_type', 'stock', 'featured',
        ]
