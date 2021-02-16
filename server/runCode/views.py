from rest_framework import viewsets, status
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import RunCode
from .serializer import RunCodeSerializer
import os
import subprocess
import sys

# Create your views here.

class RunCodeView(APIView):
    queryset = RunCode.objects.all()
    serializer_class = RunCodeSerializer
    
    def get(self, request):
        return Response(data="ok", status=status.HTTP_200_OK) 

    def post(self, request):
        print(request.data['code'])
        request.data['code'] = request.data['code'].replace('‘', '\'')
        request.data['code'] = request.data['code'].replace('’', '\'')
        request.data['code'] = request.data['code'].replace('“', '\"')
        request.data['code'] = request.data['code'].replace('”', '\"')
        file_split = request.data['code'].split('\\n')
        removeTabString = request.data['code'].replace('\\t','').split('\\n')
        generated_file = open("runCode.py", "w", encoding='utf-8')
        for i, line in enumerate(file_split):
            for line in range(line.count('\\t')):
                generated_file.write('\t')
            generated_file.write(removeTabString[i] + '\n')
        generated_file.close()
        outputData = subprocess.check_output("python runCode.py", shell = True)

        # os.remove('./runCode.py') #파일 삭제

        return Response(data={"Result": outputData}, status=status.HTTP_200_OK)