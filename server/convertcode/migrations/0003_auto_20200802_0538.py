# Generated by Django 3.0.8 on 2020-08-02 05:38

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('convertcode', '0002_auto_20200802_0532'),
    ]

    operations = [
        migrations.RenameField(
            model_name='convertcode',
            old_name='body',
            new_name='arrows',
        ),
        migrations.RenameField(
            model_name='convertcode',
            old_name='title',
            new_name='shapes',
        ),
    ]
