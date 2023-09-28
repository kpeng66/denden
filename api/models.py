from django.db import models
import string
import random
from django.contrib.auth.models import User  # Import the default user model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

def generate_unique_code():
    length = 6

    while True:
        code = ''.join(random.choices(string.ascii_uppercase, k=length))
        if Room.objects.filter(code=code).count() == 0:
            break

    return code

class Room(models.Model):
    code = models.CharField(max_length=8, default=generate_unique_code, unique=True)
    host = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True)
    object_id = models.PositiveIntegerField(null=True)
    current_game = GenericForeignKey('content_type', 'object_id')

class Game(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()

    class Meta:
        abstract = True

class MathGame(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.PositiveIntegerField(default=0)
    game_status = models.CharField(choices=[('WAITING', 'Waiting'), ('IN_PROGRESS', 'In Progress'), ('FINISHED', 'Finished')], default='WAITING', max_length=15)


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="userprofile")
    current_room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, related_name="members")
    


