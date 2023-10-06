from django.urls import path
from .views import RoomView, CreateRoomView, GetRoom, JoinRoom, UserInRoom, LeaveRoom, UpdateRoom, UsersInRoom, CurrentUser, StartGame, get_new_equation, check_answer

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
    path('get-new-equation', get_new_equation, name='get_new_equation'),
    path('check-answer', check_answer, name='check_answer')
]