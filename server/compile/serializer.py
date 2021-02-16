from .models import CompileFlowchart
from rest_framework import serializers

class CompileFlowchartSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompileFlowchart
        fields = '__all__' 
        # 모든 필드를 사용할 경우 '__all__' 사용 가능