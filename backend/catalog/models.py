from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True)
    description = models.CharField(max_length=220, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    PACK_TYPES = [('bottle', 'Bottle'), ('spray', 'Spray bottle'), ('pouch', 'Pouch'), ('box', 'Box')]
    IMAGE_TONES = [('sage', 'Sage'), ('clay', 'Clay'), ('blue', 'Blue'), ('butter', 'Butter'), ('peach', 'Peach')]

    category = models.ForeignKey(Category, related_name='products', on_delete=models.PROTECT)
    slug = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=140)
    subtitle = models.CharField(max_length=180, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=50, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0, validators=[MinValueValidator(0)])
    review_count = models.PositiveIntegerField(default=0)
    badge = models.CharField(max_length=40, blank=True)
    image_tone = models.CharField(max_length=20, choices=IMAGE_TONES, default='sage')
    pack_type = models.CharField(max_length=20, choices=PACK_TYPES, default='bottle')
    stock = models.PositiveIntegerField(default=0)
    featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-featured', 'id']
        indexes = [
            models.Index(fields=['is_active', 'featured']),
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.name

    @property
    def available(self):
        return self.is_active and self.stock > 0

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
