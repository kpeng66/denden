from django.contrib import admin
from .models import Room, UserProfile, GameScore, MathGame, Leaderboard, GameSession, GameSessionGame

admin.site.register(Room)
admin.site.register(UserProfile)
admin.site.register(GameScore)
admin.site.register(MathGame)
admin.site.register(Leaderboard)
admin.site.register(GameSession)
admin.site.register(GameSessionGame)

