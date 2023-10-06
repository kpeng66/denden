from django.shortcuts import render
from rest_framework import generics, status
from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer, UserProfileSerializer, UserSerializer
from .models import Room, UserProfile
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from utils import get_users_in_room

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from .models import Room, MathGame
import random, json

class CurrentUser(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_data = {
            'id': request.user.id,
            'username': request.user.username,
        }
        
        return Response(user_data)
    
class RoomView(generics.ListAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

class GetRoom(APIView):
    serializer_class = RoomSerializer
    lookup_url_kwarg = 'code'

    def get(self, request, format=None):
        code = request.GET.get(self.lookup_url_kwarg)
        if code != None:
            room = Room.objects.filter(code=code)
            if len(room) > 0:
                data = RoomSerializer(room[0]).data
                data['is_host'] = self.request.session.session_key == room[0].host
                return Response(data, status=status.HTTP_200_OK)
            else:
                return Response({'Room Not Found': "Invalid Room Code"}, status=status.HTTP_404_NOT_FOUND)
        return Response({'Bad Request': 'Code Parameter Not Found in Request'}, status=status.HTTP_400_BAD_REQUEST)
    
class JoinRoom(APIView):
    def post(self, request, format=None):
        code = request.data.get('room_code')
        if code != None:
            room_result = Room.objects.filter(code=code)
            if len(room_result) > 0:
                room = room_result[0]
                profile = request.user.userprofile
                profile.current_room = room
                profile.save()

                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'room_{code}',
                    {
                        'type': 'user_update',
                        'room_code': code,
                        'message': 'A new user has joined the room!'
                    }
                )

                return Response({'message': 'Room Joined!'}, status=status.HTTP_200_OK)
            return Response({'Bad Request': 'Invalid Room Code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'Bad Request': 'Invalid post data, did not find a code key'}, status=status.HTTP_400_BAD_REQUEST)


class CreateRoomView(APIView):
    serializer_class = CreateRoomSerializer

    def post(self, request, format=None):
        print("create-room HIT!")
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            print(self.request.data)
            host_id = self.request.data['host']['id']
            host_user = User.objects.get(id=host_id)
            queryset = Room.objects.filter(host=host_user)
            if queryset.exists():
                room = queryset[0]
                return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
            else:
                room = Room(host=host_user)
                room.save()
                user_profile = UserProfile.objects.get(user=host_user)
                user_profile.current_room = room
                user_profile.save()
                return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)
        return Response(RoomSerializer(room).data, status=status.HTTP_400_BAD_REQUEST)
    
class UserInRoom(APIView):
    def get(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = {
            'code': self.request.session.get('room_code')
        }
        return JsonResponse(data, status=status.HTTP_200_OK)
    
class LeaveRoom(APIView):
    permissionClasses = [IsAuthenticated]
    def post(self, request, format=None):
        user = request.user
        code = request.data.get('room_code', None)
        if not code:
            return Response({'Error': 'Room code is required'}, status=status.HTTP_400_BAD_REQUEST)
        user_profile = user.userprofile

        if user_profile.current_room:
            if user_profile.current_room.host == user:
                room = user_profile.current_room
                room.delete()
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'room_{code}',
                    {
                        'type': 'room_closed',
                        'message': 'The host has left and the room has been closed.'
                    }
                )
            else:
                user_profile.current_room = None
                user_profile.save()
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'room_{code}',
                    {
                        'type': 'user_update',
                        'room_code': code,
                        'message': 'A user has left the room!'
                    }
                )

        return Response({'Message': 'Success'}, status=status.HTTP_200_OK)
    
class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer

    def patch(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            code = serializer.data.get('code')

            queryset = Room.objects.filter(code=code)

            if not queryset.exists():
                return Response({'msg': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            room = queryset[0]
            user_id = self.request.session.session_key

            if room.host != user_id:
                return Response({'msg': 'You are not the host of this room.'}, status=status.HTTP_403_FORBIDDEN)
        
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        return Response({'Bad Request': 'Invalid Data...'}, status=status.HTTP_400_BAD_REQUEST)
    
class UsersInRoom(APIView):
    def get(self, request, room_code, format=None):
        data = get_users_in_room(room_code)
        return Response(data, status=status.HTTP_200_OK)

class StartGame(APIView): 
    def post(self, request, room_code):
        try:
            room = Room.objects.get(code=room_code)
            if not room:
                return JsonResponse({"error": "Room not found"}, status=404)

            game = MathGame(user=request.user)
            game.save()

            # Link the game to the room
            room.current_game = game
            room.save()

            return JsonResponse({"message": "Game started"}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)



def get_new_equation(request):
    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
        
    return JsonResponse({
        'equation': f'{num1} + {num2}',
        'answer': num1 + num2
    })

def check_answer(self, request):
    data = json.loads(request.body)
    user_answer = data.get('answer')

    if user_answer == True:
        return JsonResponse({'correct': True})
    else:
        return JsonResponse({'correct': False})

