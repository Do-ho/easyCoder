from .models import ConvertCode
from rest_framework import serializers

class ConvertCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConvertCode
        fields = '__all__' 
        # 모든 필드를 사용할 경우 '__all__' 사용 가능