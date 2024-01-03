from django.db import models
import string
import random
from django.contrib.auth.models import User  # Import the default user model
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
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
    players = models.ManyToManyField(User, related_name='rooms')

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="userprofile")
    current_room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, related_name="members")

class Game(models.Model):
    name = models.CharField(max_length=100)
    room = models.ForeignKey('Room', on_delete=models.CASCADE)
    game_status = models.CharField(max_length=15, choices=[('WAITING', 'Waiting'), ('IN_PROGRESS', 'In Progress'), ('FINISHED', 'Finished')], default='WAITING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

class MathGame(Game):
    def __str__(self):
        return f"MathGame in Room: {self.room.code} (Status: {self.game_status})"

class GameScore(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    game = GenericForeignKey('content_type', 'object_id')
    score = models.IntegerField(default=0)

class GameSession(models.Model):
    games = GenericRelation('GameSessionGame')
    created_at = models.DateTimeField(auto_now_add=True)

class GameSessionGame(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    game = GenericForeignKey('content_type', 'object_id')

class Leaderboard(models.Model):
    game_session = models.ForeignKey(GameSession, on_delete=models.CASCADE)
    scores = models.JSONField()
    


