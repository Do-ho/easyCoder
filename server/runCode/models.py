from django.db import models

# Create your models here.

class RunCode(models.Model):
    code = models.CharField(max_length=100)