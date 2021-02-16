from django.db import models

# Create your models here.

class CompileFlowchart(models.Model):
    shapes = models.CharField(max_length=100)
    arrows = models.TextField()