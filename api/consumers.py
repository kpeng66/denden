import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from api.serializers import UserSerializer
from asgiref.sync import async_to_sync
import time, datetime
import asyncio

class MathGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("MathGameConsumer", "Connected")

        self.user_id = self.scope['user'].id

        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'game_{self.room_code}'

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

        if message_type == 'start_game':
            print("Start_game message received by MathGame Consumer")
            await self.start_countdown()
        elif message_type == 'trigger_game_start':
            print("Trigger_game_start message received by MathGame Consumer")
            await self.start_countdown()
    
    async def start_countdown(self):
        print(f"Start_countdown function started by MathGame Consumer at {datetime.datetime.now()}")

        game_prepare_time = 3
        for i in range(game_prepare_time, 0, -1):
            await self.send(text_data=json.dumps({
                'type': 'game.countdown',
                'countdown_time': i
            }))
            await asyncio.sleep(1)
        
        print("Pregame Countdown finished")

    async def start_game(self):
        game_time = 10

        print("Consumers", "Game timer started")

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game.start',
            }
        )

        for i in range(game_time, 0, -1):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game.timer',
                    'timer': i
                }
            )
            print("Consumers", f"Game Timer: {i}")
            await asyncio.sleep(1)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game.end',
            }
        )

    async def game_timer(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game.timer',
            'timer': event['timer']
        }))

    async def game_end(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game.end'
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

        print(f"Websocket successfully connected in Room {self.room_code}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        print(f"Room Websocket successfuly disconnected")

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'game.redirect':
            await self.redirect_game()
        elif message_type == 'trigger_game_start':
            print("Trigger_game_start message received by Room Consumer")
            # await self.start_game()
            await self.close()
    
    async def start_game(self):
        print("Start game function started by Room Consumer")

        await self.channel_layer.group_send(
            f'game_{self.room_code}',
            {
                'type': 'start_game',
                'room_code': self.room_code,
            }
        )
        print("Game start triggered from Room Consumer")

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