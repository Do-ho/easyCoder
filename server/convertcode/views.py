from rest_framework import viewsets, status
from .models import ConvertCode
from .serializer import ConvertCodeSerializer
from rest_framework.views import APIView	
from rest_framework.response import Response
import os
import sys

start_arr = ["START"]
end_arr   = ["END"]
print_arr = ["PRINT", "PUT"]
input_arr = ["INPUT"]
true_arr = ["TRUE"]
false_arr = ["FALSE"]
datatype_arr = ["INT", "DOUBLE", "FLOAT", "STRING", "CHAR"]
int_arr = ["INT", "INTEGER"]

class Shape:  # Shape가 노드
    def __init__(self, kind, text, x, y, linked=None, types=0, repeat=False, depth=0):
        self.kind = kind  # 도형의 종류
        self.text = text  # 도형의 텍스트
        self.x = x  # 도형의 x좌표
        self.y = y  # 도형의 y좌표
        self.types = types  # 도형의 타입(if/elif/else, for/while/do-while)
        self.repeat = repeat  # 도형의 반복(선택구조/반복구조)
        self.depth = depth
        self.linked = []  # 연결된 도형들

class Arrow:
    def __init__(self, start_shape, end_shape):
        self.start_shape = start_shape
        self.end_shape = end_shape

class ConvertCodeView(APIView):
    queryset = ConvertCode.objects.all()
    serializer_class = ConvertCodeSerializer

    def get(self, request):
        return Response(request.data, status=200)

    def post(self, request):
        printRequestData(request)
        [shapes, arrows] = getShapeAndArrow(request)
        arrageLinked(shapes)
        setDepth(shapes, arrows)
        printShapes(shapes)
        tree = getTree(shapes)
        makeFile(tree)
        outputData = makeOutputData()
        os.remove('./generated.py') #파일 삭제
        return Response(data={"Result": outputData}, status=status.HTTP_200_OK)

def arrageLinked(shapes):
    for shape in shapes:
        if(len(shape.linked)==2):
            leftShape = shapes[shape.linked[0]]
            rightShape = shapes[shape.linked[1]]
            if(leftShape.x > rightShape.x): shape.linked[0], shape.linked[1] = shape.linked[1], shape.linked[0]

def makeOutputData():
    outputData = ""
    f = open('generated.py', encoding='utf-16')

    try:
        f.seek(0) # 파일 포인터 초기화
        lines = f.readlines()
        for line in lines:
            outputData+=line
    except Exception as ex: #에러 검출
        print("Error는 다음과 같습니다 :", ex)
        outputData = str(ex)
        
    f.close()
    return outputData

def printRequestData(request):
    print("request Data[shapes] : ", request.data['shapes'])
    print("request Data[arrows] : ", request.data['arrows'])

def printShapes(shapes):
    for shape in shapes:
        print('[kind :', shape.kind, ', text :',shape.text, ', type :',shape.types, ', depth :', shape.depth, ', repeat :', shape.repeat, ']')

def setDepthChild(shapes, idx):
    shapes[idx].depth += 1
    for link in shapes[idx].linked:
        setDepthChild(shapes, link)

def setDepth(shapes, arrows):
    for shape in shapes:
        if(shape.kind == 'decision'):
            if shape.repeat: # 반복 구조
                setDepthChild(shapes, shape.linked[0])
            else: # 선택 구조
                setDepthChild(shapes, shape.linked[0])
                if shapes[shape.linked[1]].kind!='decision':
                    setDepthChild(shapes, shape.linked[1])

def getShapeAndArrow(request):
    [shapes, arrows] = [[], []]
        
    for data in request.data['shapes']:
        data[1] = data[1].replace('‘', '\'')
        data[1] = data[1].replace('’', '\'')
        data[1] = data[1].replace('“', '\"')
        data[1] = data[1].replace('”', '\"')
        shapes.append(Shape(data[0], data[1], data[2], data[3]))
    for data in request.data['arrows']:
        arrows.append(Arrow(data[0], data[1]))
    
    ##### type 설정 ######
    for arrow in arrows:
        start_shape = shapes[arrow.start_shape]
        end_shape = shapes[arrow.end_shape]

        # 화살표가 아래로 내려가는 경우, 연결 도형을 추가
        if (start_shape.y < end_shape.y):
            start_shape.linked.append(arrow.end_shape)
            if(start_shape.kind == 'decision' and start_shape.types==0):
                start_shape.types = 'if'

        # 화살표가 올라가는 경우 연결도형 추가
        if (start_shape.y > end_shape.y):
            end_shape.repeat = True

            # while문 판정 (square에서 decision으로 가는 경우)
            if (start_shape.kind == 'square' and end_shape.kind == 'decision'):
                end_shape.types = 'while'
                for linkShape in end_shape.linked:
                    if(end_shape.x < shapes[linkShape].x and shapes[linkShape].kind=='square'):
                        shapes[linkShape].types=0
                
            # do-while문 판정 (decision에서 square로 가는 경우)
            elif (start_shape.kind == 'decision' and end_shape.kind == 'square'):  
                start_shape.types = 'do while'

        # elif문 판정 (decision에서 decision으로 가는 경우)
        if (start_shape.kind == 'decision' and end_shape.kind == 'decision'):
            if (start_shape.x < end_shape.x): end_shape.types = 'elif'
            else: end_shape.types = 'if'

        # else 판정 (decision에서 square로 가는 경우)
        if (start_shape.kind == 'decision' and end_shape.kind == 'square'):
            # if에서 square로 가고 화살표가 오른쪽으로 꺾이면 else
            if (start_shape.types =='if' and end_shape.kind == 'square' and start_shape.x < end_shape.x):
                end_shape.types = 'else'
            
            # elif에서 square로 가고 화살표가 오른쪽으로 꺾이면 else
            elif (start_shape.types == 'elif' and end_shape.kind == 'square' and start_shape.x < end_shape.x): 
                end_shape.types = 'else'

    return [shapes, arrows]

def preOrder(tree, nodeIdx):
    result = []
    result.append(nodeIdx)
    if(len(tree[nodeIdx])!=0):
        for i in tree[nodeIdx]:
            result += preOrder(tree, i)
    
    return result

def getTree(shapes):
    tree = []
    test = {}
    for i in range(len(shapes)):
        test[i] = shapes[i].linked
    root_node = 0
    preOrderList = preOrder(test, root_node)
    print(preOrderList)
    
    for data in preOrderList:
        tree.append(shapes[data])

    return tree

################################ 코드 변환 함수 ######################################

def process_shape(text, depth, types, generated_file):
    etc = text.split(' ')

    # Print
    if etc[0].upper() in print_arr:
        # 깊이에 따른 변동 예정
        if(types=='elif'):
            generated_file.write("elif:\n")
        elif(types=='else'):
            dep = depth -1
            while(dep != 0):
                generated_file.write('\t')
                dep = dep - 1
            generated_file.write("else:\n")
        else: pass

        print_text = ""
        for j in range(1, etc.__len__()):
            print_text += etc[j]
            print_text += " "
        while(depth != 0):
            generated_file.write('\t')
            depth = depth - 1
        generated_file.write("print(" + print_text.strip() + ")")
    else :
        if(types=='elif'):
            generated_file.write("elif:\n")
        elif(types=='else'):
            dep = depth - 1
            while(dep != 0):
                generated_file.write('\t')
                dep = dep - 1
            generated_file.write("else:\n")
        else: pass

        while(depth != 0):
            generated_file.write('\t')
            depth = depth - 1
        generated_file.write(text)

def start_end_shape(text, index, recvLength, depth, generated_file):
    if text.upper() in start_arr:
        #import data 확인해서 넣을 필요 있음
        pass  
    else:
        if(index==recvLength):
            generated_file.close()

def decision_shape(text, repeat, depth, types, generated_file):

    # 깊이
    while(depth != 0):
        generated_file.write('\t')
        depth = depth - 1

    # a=b일 경우 a==b로 변환
    for i in range(1, len(text)-1):
        if(text[i]=='=' and text[i-1]!='=' and text[i-1]!='>' and text[i-1]!='<' and text[i-1]!='!' and text[i+1]!='='):
            text = text[:i] + '=' + text[i:]
    
    # 조건
    if(not repeat):
        if(types=='if'): #if
            generated_file.write("if(" + text + "):")
        elif(types=='elif'): #if
            generated_file.write("elif(" + text + "):")
        else : #else
            generated_file.write("else:")
    # 반복
    else:
        generated_file.write("while(" + text + "):")
        # 반복문 형식에 따른 구분 필요
    

def data_shape(text, depth, generated_file):
    etc = text.split(' ')
    # Input
    if etc[0].upper() in input_arr: # INPUT TEXT
        if etc[1].upper() in datatype_arr: # DATA TYPE
            if(len(etc)>3): # 입력 변수가 둘 이상이라면
                for i in range(2, len(etc)): 
                    generated_file.write(etc[i].replace(',', '') + " = " + etc[1].lower() + "(input())\n")
            else:
                generated_file.write(etc[2] + " = " + etc[1].lower() + "(input())")
        else:
            generated_file.write(etc[1] + " = input()")
    else :
        if '{' not in text and '[' not in text: # 배열이 아니면
            variable_text = text.split(',')
            for i in variable_text:
                while(depth != 0):
                    generated_file.write('\t')
                    depth = depth - 1
                generated_file.write(i.strip()) # 앞뒤 공백 제거
                generated_file.write('\n')
        else :
            text = text.replace('{','[')
            text = text.replace('}',']')
            generated_file.write(text)

def makeFile(tree):
    generated_file = open("generated.py", "w", encoding='utf16')

    treeLength = len(tree)
    depth = 0 #탭의 깊이

    for index, shape in enumerate(tree, start=1):
        if(shape.kind=="start/end"):
            start_end_shape(shape.text, index, treeLength, shape.depth, generated_file)
            if(not generated_file.closed):
                generated_file.write("\n")
        elif(shape.kind=="square"):
            process_shape(shape.text, shape.depth, shape.types, generated_file)
            generated_file.write("\n")
        elif(shape.kind=="decision"):
            decision_shape(shape.text, shape.repeat, shape.depth, shape.types, generated_file)
            generated_file.write("\n")
        elif(shape.kind=="data"):
            data_shape(shape.text, shape.depth, generated_file)
            generated_file.write("\n")
        else: pass

    #file 닫기
    generated_file.close()