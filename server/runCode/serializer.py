from .models import RunCode
from rest_framework import serializers

class RunCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RunCode
        fields = '__all__' 
        # 모든 필드를 사용할 경우 '__all__' 사용 가능