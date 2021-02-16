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

        # [0,1,2,3 ,,,] # 배열의 순서대로 전위순회

class Arrow:
    def __init__(self, start_shape, end_shape):
        self.start_shape = start_shape
        self.end_shape = end_shape