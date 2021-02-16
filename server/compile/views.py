from rest_framework import viewsets, status
from .models import CompileFlowchart
from .serializer import CompileFlowchartSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
import os
import sys
import re
import subprocess

start_arr = ["START"]
end_arr   = ["END"]
print_arr = ["PRINT", "PUT"]
input_arr = ["INPUT"]
true_arr = ["TRUE"]
false_arr = ["FALSE"]
datatype_arr = ["INT", "DOUBLE", "FLOAT", "STRING", "CHAR"]
int_arr = ["INT", "INTEGER"]

line_num = 1

class Shape:  # Shape가 노드
    def __init__(self, kind, text, x, y, index, linked=None, types=0, repeat=False, depth=0):
        self.kind = kind  # 도형의 종류
        self.text = text  # 도형의 텍스트
        self.x = x  # 도형의 x좌표
        self.y = y  # 도형의 y좌표
        self.types = types  # 도형의 타입(if/elif/else, for/while/do-while)
        self.repeat = repeat  # 도형의 반복(선택구조/반복구조)
        self.depth = depth
        self.linked = []  # 연결된 도형들
        self.line = []
        self.index = index

        # [0,1,2,3 ,,,] # 배열의 순서대로 전위순회

class Arrow:
    def __init__(self, start_shape, end_shape):
        self.start_shape = start_shape
        self.end_shape = end_shape

class CompileView(APIView):
    queryset = CompileFlowchart.objects.all()
    serializer_class = CompileFlowchartSerializer

    def get(self, request):
        return Response(request.data, status=200)

    def post(self, request):
        global line_num
        line_num = 1
        [shapes, arrows, is_input] = getShapeAndArrow(request)
        arrageLinked(shapes)
        setDepth(shapes, arrows)
        tree = getTree(shapes)
        addLineTree = writePythonFile(tree)
        printShapes(addLineTree)
        outputData = excute(addLineTree, is_input)

        #os.remove('./generated.py') #파일 삭제
        return Response(data=outputData, status=status.HTTP_200_OK) #테스트용 Response

def arrageLinked(shapes):
    for shape in shapes:
        if(len(shape.linked)==2):
            leftShape = shapes[shape.linked[0]]
            rightShape = shapes[shape.linked[1]]
            if(leftShape.x > rightShape.x): shape.linked[0], shape.linked[1] = shape.linked[1], shape.linked[0]

def addLine(shape):
    global line_num
    shape.line.append(line_num)
    line_num = line_num + 1

def writePythonFile(recvData):
    #file 열기
    global line_num
    generated_file = open("generated.py", "w", encoding='utf16')

    for index, shape in enumerate(recvData, start=1):
        if(shape.kind=="start/end"):
            start_end_shape(shape.text, index, len(recvData), shape.depth, generated_file, shape)
            if(not generated_file.closed):
                generated_file.write("\n")
                line_num = line_num + 1
        elif(shape.kind=="square"):
            process_shape(shape.text, shape.depth, shape.types, generated_file, shape)
            generated_file.write("\n")
            line_num = line_num + 1
        elif(shape.kind=="decision"):
            decision_shape(shape.text, shape.repeat, shape.depth, shape.types, generated_file, shape)
            generated_file.write("\n")
        elif(shape.kind=="data"):
            data_shape(shape.text, shape.depth, generated_file, shape)
            generated_file.write("\n")
            line_num = line_num + 1
        else:
            pass
    
    return recvData

    #file 닫기
    generated_file.close()

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

def printShapes(shapes):
    for shape in shapes:
        print('[kind :', shape.kind,', type :',shape.types, ', depth :', shape.depth, ', repeat :', shape.repeat, ']', ', line :', shape.line)

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
    [shapes, arrows, is_input] = [[], [], False]
        
    for idx, data in enumerate(request.data['shapes']):
        data[1] = data[1].replace('‘', '\'')
        data[1] = data[1].replace('’', '\'')
        data[1] = data[1].replace('“', '\"')
        data[1] = data[1].replace('”', '\"')
        pattern = re.compile('(i|I)(n|N)(p|P)(u|U)(t|T)')
        if re.match(pattern, data[1])!=None:
            is_input = True
        shapes.append(Shape(data[0], data[1], data[2], data[3], idx))
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

    return [shapes, arrows, is_input]

def preOrder(tree, nodeIdx):
    result = []
    result.append(nodeIdx)
    if(len(tree[nodeIdx])!=0):
        for i in tree[nodeIdx]:
            result += preOrder(tree, i)
    
    return result

def process_shape(text, depth, types, generated_file, shape):
    etc = text.split(' ')

    # Print
    if etc[0].upper() in print_arr:
        # 깊이에 따른 변동 예정
        if(types=='elif'):
            generated_file.write("elif:\n")
            addLine(shape)
        elif(types=='else'):
            dep = depth -1
            while(dep != 0):
                generated_file.write('\t')
                dep = dep - 1
            generated_file.write("else:\n")
            addLine(shape)
        else:
            pass
        print_text = ""
        for j in range(1, etc.__len__()):
            print_text += etc[j]
            print_text += " "
        while(depth != 0):
            generated_file.write('\t')
            depth = depth - 1
        generated_file.write("print(" + print_text + ")")
        addLine(shape)
    else :
        if(types=='elif'):
            generated_file.write("elif:\n")
            addLine(shape)
        elif(types=='else'):
            dep = depth - 1
            while(dep != 0):
                generated_file.write('\t')
                dep = dep - 1
            generated_file.write("else:\n")
            addLine(shape)
        else:
            pass
        while(depth != 0):
            generated_file.write('\t')
            depth = depth - 1
        generated_file.write(text)
        addLine(shape)

def start_end_shape(text, index, recvLength, depth, generated_file, shape):
    if text.upper() in start_arr:
        #import data 확인해서 넣을 필요 있음
        pass  
    else:
        if(index==recvLength):
            generated_file.close()

def decision_shape(text, repeat, depth, types, generated_file, shape):

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
        addLine(shape)
    # 반복
    else:
        generated_file.write("while(" + text + "):")
        addLine(shape)
        # 반복문 형식에 따른 구분 필요
    

def data_shape(text, depth, generated_file, shape):
    etc = text.split(' ')

    # Input
    if etc[0].upper() in input_arr: # INPUT TEXT
        if etc[1].upper() in datatype_arr: # DATA TYPE
            if(len(etc)>3): # 입력 변수가 둘 이상이라면
                for i in range(2, len(etc)): 
                    generated_file.write(etc[i].replace(',', '') + " = " + etc[1].lower() + "(input())\n")
                    addLine(shape)
            else:
                generated_file.write(etc[2] + " = " + etc[1].lower() + "(input())")
                addLine(shape)
        else:
            generated_file.write(etc[1] + " = input()")
            addLine(shape)
    else :
        if '{' not in text and '[' not in text: # 배열이 아니면
            variable_text = text.split(',')

            for i in variable_text:
                while(depth != 0):
                    generated_file.write('\t')
                    depth = depth - 1
                generated_file.write(i.strip()) # 앞뒤 공백 제거
                generated_file.write('\n')
                addLine(shape)
        else :
            text = text.replace('{','[')
            text = text.replace('}',']')
            generated_file.write(text)
            addLine(shape)

def excute(shapes, is_input):
    outputData = {"Result" : -1, "Message": "OK"}
    pattern = re.compile('line \d|name \'\w+\'')

    #file 실행
    f = open('generated.py', encoding='utf-16')
    try:
        if is_input: return outputData
        else: exec(f.read())
    except Exception as ex: #에러 검출
        print("Error는 다음과 같습니다 :", ex)
        outputData['Result'] = 0
        outputData['Message'] = str(ex)
        
        errText = pattern.findall(str(ex))[0].split(' ')[1].replace('\'', '')
        if(errText.isdigit()):
            outputData['Result'] = findIndex(shapes, int(errText))
        else:
            outputData['Result'] = findName(shapes, errText)
    f.close()
    return outputData

def findIndex(shapes, target):
    for idx, shape in enumerate(shapes):
        for idx in shape.line:
            if(idx==target):
                return shape.index
    return -1

def findName(shapes, target):
    pattern = re.compile(target)
    
    for idx, shape in enumerate(shapes):
        result = pattern.search(shape.text)
        if result != None:
            return shape.index
    return -1