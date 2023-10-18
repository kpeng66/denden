from django.urls import path
from .views import RoomView, CreateRoomView, GetRoom, JoinRoom, LeaveRoom, UpdateRoom, UsersInRoom, CurrentUser, StartGame, HandleAnswer, UserInARoom, GenerateEquation

urlpatterns = [
    path('room', RoomView.as_view()),
    path('create-room', CreateRoomView.as_view()),
    path('get-room', GetRoom.as_view()),
    path('join-room', JoinRoom.as_view()),
    path('leave-room', LeaveRoom.as_view()),
    path('update-room',UpdateRoom.as_view()),
    path('list-users-in-room/<str:room_code>', UsersInRoom.as_view()),
    path('get-current-user', CurrentUser.as_view()),
    path('start-game/<str:room_code>', StartGame.as_view()),
    path('get-new-equation', GenerateEquation.as_view()),
    path('check-answer', HandleAnswer.as_view()),
    path('check-user-in-room', UserInARoom.as_view())
]