from django.urls import path
from .views import RoomView, CreateRoomView, GetRoom, JoinRoom, UserInRoom, LeaveRoom, UpdateRoom, UsersInRoom, CurrentUser, StartGame

urlpatterns = [
    path('room', RoomView.as_view()),
    path('create-room', CreateRoomView.as_view()),
    path('get-room', GetRoom.as_view()),
    path('join-room', JoinRoom.as_view()),
    path('user-in-room', UserInRoom.as_view()),
    path('leave-room', LeaveRoom.as_view()),
    path('update-room',UpdateRoom.as_view()),
    path('list-users-in-room/<str:room_code>', UsersInRoom.as_view()),
    path('get-current-user', CurrentUser.as_view()),
    path('start-game/<str:room_code>', StartGame.as_view()),
]