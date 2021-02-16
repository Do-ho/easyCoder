from django.urls import path, include
from . import views

app_name = 'convertcode'
urlpatterns = [
    path('', views.ConvertCodeView.as_view()),#User에 관한 API를 처리하는 view로 Request를 넘김
]