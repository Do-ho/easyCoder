# Generated by Django 3.0.8 on 2020-08-02 05:32

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('convertcode', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Post',
            new_name='ConvertCode',
        ),
    ]