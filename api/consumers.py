import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from api.serializers import UserSerializer

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
        pass

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
    
