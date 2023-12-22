import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from api.models import GameScore
from api.serializers import UserSerializer
from asgiref.sync import async_to_sync
import time
import asyncio

class MathGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['user'].id

        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'room_{self.room_code}'

        # Add this channel to the group, facilitating broadcast messages
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
    
    async def disconnect(self, close_code):
        # Remove this channel from the group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        # Placeholder for handling received messages from WebSocket
        # You might handle player actions here
    
    async def start_game(self):
        game_prepare_time = 3
        
        # Notify all clients about the countdown and start
        for i in range(game_prepare_time, 0, -1):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game.countdown',
                    'countdown_time': i
                }
            )
            await asyncio.sleep(1)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game.start',
            }
        )
    
    async def game_countdown(self, event):
        # Send countdown to the specific user
        await self.send(text_data=json.dumps({
            'type': 'game.countdown',
            'countdown_time': event['countdown_time']
        }))

    async def game_start(self, event):
        # Send game start signal to the specific user
        await self.send(text_data=json.dumps({
            'type': 'game.start'
        }))

    async def broadcast_scores(self):
        scores = await self.get_scores()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game.scores',
                'scores': scores
            }
        )

    @database_sync_to_async
    def get_scores(self):
        scores = GameScore.objects.filter(room_code = self.room_code).values('user__username', 'score')
        return list(scores)
    
    async def game_scores(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game.scores',
            'scores': event['scores']
        }))


class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'room_{self.room_code}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'game.redirect':
            await self.redirect_game()

    async def user_update(self, event):
        users_in_room = await database_sync_to_async(lambda: list(User.objects.filter(userprofile__current_room__code=event['room_code'])))()
        
        serialized_users = UserSerializer(users_in_room, many=True).data
        
        await self.send(text_data=json.dumps({
            'type': 'user_update',
            'users': serialized_users
        }))
    
    async def room_closed(self, event):
        await self.send(text_data=json.dumps({
            'type': 'room_closed',
            'message': event['message']
        }))

    async def redirect_game(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game.redirect'
            }
        )
    
    async def game_redirect(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game.redirect'
        }))
    