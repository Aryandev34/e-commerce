from decimal import Decimal, InvalidOperation
from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({'status': 'ok', 'service': 'fieldwell-api'})


class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.annotate(
            product_count=Count('products', filter=Q(products__is_active=True))
        ).order_by('sort_order', 'name')


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related('category').filter(is_active=True)
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        if category and category.lower() != 'all':
            queryset = queryset.filter(category__slug=category)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(subtitle__icontains=search)
                | Q(description__icontains=search)
                | Q(category__name__icontains=search)
            )
        featured = self.request.query_params.get('featured')
        if featured is not None:
            if featured.lower() in {'true', '1', 'yes'}:
                queryset = queryset.filter(featured=True)
            elif featured.lower() in {'false', '0', 'no'}:
                queryset = queryset.filter(featured=False)
            else:
                raise ValidationError({'featured': 'Use true or false.'})
        for parameter, lookup in [('min_price', 'price__gte'), ('max_price', 'price__lte')]:
            value = self.request.query_params.get(parameter)
            if value is not None:
                try:
                    parsed_value = Decimal(value)
                    if parsed_value < 0:
                        raise InvalidOperation
                except (InvalidOperation, TypeError):
                    raise ValidationError({parameter: 'Enter a non-negative price.'})
                queryset = queryset.filter(**{lookup: parsed_value})
        ordering = self.request.query_params.get('ordering')
        allowed_orderings = {'price', '-price', 'rating', '-rating', 'name', '-name', 'id', '-id'}
        if ordering:
            if ordering not in allowed_orderings:
                raise ValidationError({'ordering': f'Choose one of: {", ".join(sorted(allowed_orderings))}.'})
            queryset = queryset.order_by(ordering)
        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.select_related('category').filter(is_active=True)
    serializer_class = ProductSerializer
    lookup_field = 'slug'
