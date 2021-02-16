from django.urls import path, include
from . import views

app_name = 'runCode'
urlpatterns = [
    path('', views.RunCodeView.as_view()),#User에 관한 API를 처리하는 view로 Request를 넘김
]