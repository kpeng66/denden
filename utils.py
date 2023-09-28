from django.contrib.auth.models import User
from api.serializers import UserSerializer

def get_users_in_room(room_code):
    users_in_room = User.objects.filter(userprofile__current_room__code=room_code)
    data = UserSerializer(users_in_room, many=True).data
    return data