from rest_framework.generics import RetrieveUpdateAPIView

from .models import AppSettings
from .permissions import ReadOnlyForTailleur
from .serializers import AppSettingsSerializer


class AppSettingsView(RetrieveUpdateAPIView):
    serializer_class = AppSettingsSerializer
    # Everyone reads it (WhatsApp messages need the shop name/phone); only non-tailleurs edit.
    permission_classes = [ReadOnlyForTailleur]

    def get_object(self) -> AppSettings:
        return AppSettings.load()
