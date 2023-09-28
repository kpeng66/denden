# Generated by Django 4.2.5 on 2023-09-20 03:29

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0003_remove_room_users_userprofile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='room',
            name='host',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='hostuser', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='user',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='userprofile', to=settings.AUTH_USER_MODEL),
        ),
    ]
