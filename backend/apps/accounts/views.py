from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.core.permissions import IsNotTailleur

from .models import User
from .serializers import PhoneTokenObtainPairSerializer, UserManageSerializer, UserSerializer


class PhoneTokenObtainPairView(TokenObtainPairView):
    serializer_class = PhoneTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    """Owner-only screen to create/manage logins for staff (tailleurs, etc.)."""

    queryset = User.objects.all()
    serializer_class = UserManageSerializer
    permission_classes = [IsNotTailleur]
