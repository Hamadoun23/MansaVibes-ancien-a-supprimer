from django.urls import path

from .views import assistant_status, assistant_view, execute_view, transcribe_view

urlpatterns = [
    path("", assistant_view, name="assistant"),
    path("status/", assistant_status, name="assistant-status"),
    path("transcribe/", transcribe_view, name="assistant-transcribe"),
    path("execute/", execute_view, name="assistant-execute"),
]
