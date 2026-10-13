from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'sort_order')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('sort_order', 'name')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'featured', 'is_active')
    list_filter = ('category', 'featured', 'is_active')
    list_editable = ('price', 'stock', 'featured', 'is_active')
    search_fields = ('name', 'subtitle', 'description', 'slug')
    prepopulated_fields = {'slug': ('name',)}
