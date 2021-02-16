from django.urls import path, include
from . import views

app_name = 'compile'
urlpatterns = [
    path('', views.CompileView.as_view()),
]