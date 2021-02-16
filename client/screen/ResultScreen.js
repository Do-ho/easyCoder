import React, { Component } from 'react';
import Native, {
  StyleSheet,
  View,
  PanResponder,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableHighlight,
  StatusBar,
  ScrollView,
} from 'react-native';
import Svg, { Path, Rect, Ellipse, G, Text } from 'react-native-svg';
import api from '../Api';
import axios from 'axios';

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      smallShapes: [],
      pythonCode: 'Loading...',
      result: '실행결과',
      isLoading: true,
      modalOpen: false,
      inputTexts: [],
    };
    this.data = {
      shapeWidth: 0,
      shapeHeight: 0,
      svgWidth: 0,
      svgHeight: 0,
      numInputs: 0,
      widthR: 0,
      heightR: 0,
    };
  }

  componentWillMount() {
    this.setState({
      smallShapes: this.props.shapes,
    });
    this.getCode();
  }

  getSmallShapes = (widthR, heightR) => {
    const shapes = this.props.shapes;
    const smallShapes = [];
    for (let i = 0; i < shapes.length; i++) {
      let shape = {};
      switch (shapes[i].type) {
        case 'square':
          shape['type'] = shapes[i].type;
          shape['x'] = shapes[i].x * widthR;
          shape['y'] = shapes[i].y * heightR;
          shape['cx'] = shapes[i].cx * widthR;
          shape['cy'] = shapes[i].cy * heightR;
          shape['text'] = shapes[i].text;
          break;
        case 'start/end':
          shape['type'] = shapes[i].type;
          shape['cx'] = shapes[i].cx * widthR;
          shape['cy'] = shapes[i].cy * heightR;
          shape['text'] = shapes[i].text;
          break;
        case 'decision':
          shape['type'] = shapes[i].type;
          shape['cx'] = shapes[i].cx * widthR;
          shape['cy'] = shapes[i].cy * heightR;
          shape['text'] = shapes[i].text;
          break;
        case 'data':
          shape['type'] = shapes[i].type;
          shape['x'] = shapes[i].x * widthR;
          shape['y'] = shapes[i].y * heightR;
          shape['cx'] = shapes[i].cx * widthR;
          shape['cy'] = shapes[i].cy * heightR;
          shape['text'] = shapes[i].text;
          break;
        default:
          break;
      }
      smallShapes.push(shape);
    }
    this.setState({
      smallShapes: smallShapes,
    });
  };

  drawShape = (shape, i) => {
    let color = 'black';
    let text = shape.text;
    if (text.length > 7) {
      text = text.slice(0, 8) + '...';
    }
    if (shape.type == 'square') {
      return (
        <G>
          <Rect
            width={this.data.shapeWidth}
            height={this.data.shapeHeight}
            x={shape.x}
            y={shape.y}
            stroke={color}
            strokeWidth='3'
          />
          <Text
            x={shape.cx}
            y={shape.cy + 7}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'12'}
            fill='black'
          >
            {text}
          </Text>
        </G>
      );
    } else if (shape.type == 'start/end') {
      return (
        <G>
          <Ellipse
            cx={shape.cx}
            cy={shape.cy}
            rx={this.data.shapeWidth / 2}
            ry={this.data.shapeHeight / 2}
            stroke={color}
            strokeWidth='3'
          />
          <Text
            x={shape.cx}
            y={shape.cy + 4}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'12'}
            fill='black'
          >
            {text}
          </Text>
        </G>
      );
    } else if (shape.type == 'data') {
      const x = shape.x;
      const y = shape.y;
      const width = this.data.shapeWidth;
      const height = this.data.shapeHeight;
      const path = `M${x} ${y} L${x + width} ${y} L${x + width + width / 2} ${
        y - height
      } L${x + width / 2} ${y - height} L${x} ${y}`;
      return (
        <G>
          <Path d={path} stroke={color} strokeWidth='3' />
          <Text
            x={shape.cx}
            y={shape.cy}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'12'}
            fill='black'
          >
            {text}
          </Text>
        </G>
      );
    } else if (shape.type == 'decision') {
      const cx = shape.cx;
      const cy = shape.cy;
      const rx = this.data.shapeWidth / 2;
      const ry = this.data.shapeHeight / 2;
      const path = `M${cx} ${cy - ry}
       L${cx + rx} ${cy}
        L${cx} ${cy + ry}
         L${cx - rx} ${cy} 
         L${cx} ${cy - ry}`;
      return (
        <G>
          <Path d={path} stroke={color} strokeWidth='3' />
          <Text
            x={shape.cx}
            y={shape.cy + 2.5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'12'}
            fill='black'
          >
            {text}
          </Text>
        </G>
      );
    }
  };

  getCode = async () => {
    const sendData = { 'shapes': [], 'arrows': [] };
    const shapes = this.props.shapes;
    const arrows = this.props.arrows;

    for (let i = 0; i < shapes.length; i++) {
      let shape = [shapes[i].type, shapes[i].text, shapes[i].cx, shapes[i].cy];
      sendData.shapes.push(shape);
    }
    for (let i = 0; i < arrows.length; i++) {
      let arrow = [arrows[i].from, arrows[i].to];
      sendData.arrows.push(arrow);
    }
    let data = await api.sendShapes(sendData);
    const pythonCode = '\n' + data;

    this.checkInput(pythonCode);

    this.setState({
      pythonCode: pythonCode,
      result: '실행결과',
      isLoading: false,
    });
  };

  checkInput = (pythonCode) => {
    let count = 0;
    const codes = pythonCode.split('\n');
    const inputTexts = this.state.inputTexts;
    for (let i = 0; i < codes.length; i++) {
      if (codes[i].indexOf('input') > -1) {
        count++;
        inputTexts.push('');
      }
    }
    this.data.numInputs = count;
    this.setState({
      inputTexts: inputTexts,
    });
  };

  run = async () => {
    const pythonCode = this.state.pythonCode;

    if (this.data.numInputs == 0) {
      const result = '실행결과\n\n' + (await api.runPython(pythonCode));
      this.setState({
        result: result,
      });
    } else {
      const inputs = [];
      for (let i = 0; i < this.data.numInputs; i++) {
        inputs.push('');
      }
      this.setState({ inputTexts: inputs, modalOpen: true });
    }
  };

  toFlowChart = () => {
    this.props.handler(2);
  };

  getPoints = (p1, p2) => {
    const len = 36;
    let d0 = 0;
    if (p1.x - p2.x == 0) {
      d0 = 500;
    } else {
      d0 = (p1.y - p2.y) / (p1.x - p2.x);
      if (d0 == 1) {
        d0 = 1.00000001;
      } else if (d0 == -1) {
        d0 = -1.000000001;
      }
    }
    const m1 = -(d0 + 1) / (d0 - 1);
    const m2 = (d0 - 1) / (d0 + 1);
    const k1 = p2.y - m1 * p2.x;
    const k2 = p2.y - m2 * p2.x;
    let x =
      (p2.x +
        p2.y * m1 -
        k1 * m1 -
        Math.sqrt(
          len -
            Math.pow(p2.y, 2) +
            2 * p2.y * k1 -
            Math.pow(k1, 2) +
            2 * p2.x * p2.y * m1 -
            2 * p2.x * k1 * m1 +
            len * Math.pow(m1, 2) -
            Math.pow(p2.x, 2) * Math.pow(m1, 2)
        )) /
      (1 + Math.pow(m1, 2));
    const newP1_1 = { x: x, y: m1 * x + k1 };
    x =
      (p2.x +
        p2.y * m1 -
        k1 * m1 +
        Math.sqrt(
          len -
            Math.pow(p2.y, 2) +
            2 * p2.y * k1 -
            Math.pow(k1, 2) +
            2 * p2.x * p2.y * m1 -
            2 * p2.x * k1 * m1 +
            len * Math.pow(m1, 2) -
            Math.pow(p2.x, 2) * Math.pow(m1, 2)
        )) /
      (1 + Math.pow(m1, 2));
    const newP1_2 = { x: x, y: m1 * x + k1 };
    x =
      (p2.x +
        p2.y * m2 -
        k2 * m2 -
        Math.sqrt(
          len -
            Math.pow(p2.y, 2) +
            2 * p2.y * k2 -
            Math.pow(k2, 2) +
            2 * p2.x * p2.y * m2 -
            2 * p2.x * k2 * m2 +
            len * Math.pow(m2, 2) -
            Math.pow(p2.x, 2) * Math.pow(m2, 2)
        )) /
      (1 + Math.pow(m2, 2));
    const newP2_1 = { x: x, y: m2 * x + k2 };
    x =
      (p2.x +
        p2.y * m2 -
        k2 * m2 +
        Math.sqrt(
          len -
            Math.pow(p2.y, 2) +
            2 * p2.y * k2 -
            Math.pow(k2, 2) +
            2 * p2.x * p2.y * m2 -
            2 * p2.x * k2 * m2 +
            len * Math.pow(m2, 2) -
            Math.pow(p2.x, 2) * Math.pow(m2, 2)
        )) /
      (1 + Math.pow(m2, 2));
    const newP2_2 = { x: x, y: m2 * x + k2 };
    const newP1 =
      this.distancePoints(p1, newP1_1) < this.distancePoints(p1, newP1_2)
        ? newP1_1
        : newP1_2;
    const newP2 =
      this.distancePoints(p1, newP2_1) < this.distancePoints(p1, newP2_2)
        ? newP2_1
        : newP2_2;
    return { p1: newP1, p2: newP2 };
  };
  distancePoints = (p1, p2) => {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  };

  drawSmallArrow = (arrow, i) => {
    var from = arrow.from;
    var to = arrow.to;
    var shapes = this.state.smallShapes;
    var fromShape = shapes[from];
    var toShape = shapes[to];
    var path;
    // 같은 y선상에 있을때
    if (
      Math.abs(fromShape.cy - toShape.cy) <
        this.data.shapeHeight + 30 * this.data.heightR &&
      Math.abs(fromShape.cx - toShape.cx) >
        this.data.shapeWidth + 30 * this.data.widthR
    ) {
      if (fromShape.cx < toShape.cx) {
        const p1 = {
          x: fromShape.cx + this.data.shapeWidth / 2 + 10 * this.data.widthR,
          y: fromShape.cy,
        };
        const p2 = {
          x: toShape.cx - this.data.shapeWidth / 2 - 10 * this.data.widthR,
          y: toShape.cy,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
        L${arrowHead.p1.x}, ${arrowHead.p1.y}
        L${p2.x}, ${p2.y}
        L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
      } else {
        const p1 = {
          x: fromShape.cx - this.data.shapeWidth / 2 - 10 * this.data.widthR,
          y: fromShape.cy,
        };
        const p2 = {
          x: toShape.cx + this.data.shapeWidth / 2 + 10 * this.data.widthR,
          y: toShape.cy,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
        L${arrowHead.p1.x}, ${arrowHead.p1.y}
        L${p2.x}, ${p2.y}
        L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
      }
      // fromShape가 위에있을 때
    } else if (
      fromShape.cy <
      toShape.cy - this.data.shapeHeight - 30 * this.data.heightR
    ) {
      if (toShape.cx - fromShape.cx > this.data.shapeWidth) {
        const p1 = {
          x: fromShape.cx,
          y: fromShape.cy + this.data.shapeHeight / 2 + 10 * this.data.heightR,
        };
        const p2 = {
          x: toShape.cx - this.data.shapeWidth / 2 - 10 * this.data.widthR,
          y: toShape.cy - this.data.shapeHeight / 2 - 10 * this.data.heightR,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
          L${arrowHead.p1.x}, ${arrowHead.p1.y}
          L${p2.x}, ${p2.y}
          L${arrowHead.p2.x}, ${arrowHead.p2.y}
          `;
      } else if (fromShape.cx - toShape.cx > this.data.shapeWidth) {
        const p1 = {
          x: fromShape.cx,
          y: fromShape.cy + this.data.shapeHeight / 2 + 10 * this.data.heightR,
        };
        const p2 = {
          x: toShape.cx + this.data.shapeWidth / 2 + 10 * this.data.widthR,
          y: toShape.cy - this.data.shapeHeight / 2 - 10 * this.data.heightR,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
          L${arrowHead.p1.x}, ${arrowHead.p1.y}
          L${p2.x}, ${p2.y}
          L${arrowHead.p2.x}, ${arrowHead.p2.y}
          `;
      } else {
        const p1 = {
          x: fromShape.cx,
          y: fromShape.cy + this.data.shapeHeight / 2 + 10 * this.data.heightR,
        };
        const p2 = {
          x: toShape.cx,
          y: toShape.cy - this.data.shapeHeight / 2 - 10 * this.data.heightR,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
          L${arrowHead.p1.x}, ${arrowHead.p1.y}
          L${p2.x}, ${p2.y}
          L${arrowHead.p2.x}, ${arrowHead.p2.y}
          `;
      }
    }
    // toShape가 위에있을 때
    else if (
      toShape.cy <
      fromShape.cy - this.data.shapeHeight - 30 * this.data.heightR
    ) {
      if (toShape.cx - fromShape.cx > this.data.shapeWidth) {
        const p1 = {
          x: fromShape.cx,
          y: toShape.cy,
        };
        const p2 = {
          x: toShape.cx - this.data.shapeWidth / 2 - 10 * this.data.widthR,
          y: toShape.cy,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${fromShape.cx}, ${
          fromShape.cy - this.data.shapeHeight / 2 - 10 * this.data.heightR
        }
          L${fromShape.cx}, ${toShape.cy}
          M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
          L${arrowHead.p1.x}, ${arrowHead.p1.y}
          L${p2.x}, ${p2.y}
          L${arrowHead.p2.x}, ${arrowHead.p2.y}`;
      } else if (fromShape.cx - toShape.cx > this.data.shapeWidth) {
        const p1 = {
          x: fromShape.cx,
          y: toShape.cy,
        };
        const p2 = {
          x: toShape.cx + this.data.shapeWidth / 2 + 10 * this.data.widthR,
          y: toShape.cy,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${fromShape.cx}, ${
          fromShape.cy - this.data.shapeHeight / 2 - 10 * this.data.heightR
        }
          L${fromShape.cx}, ${toShape.cy}
          M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
          L${arrowHead.p1.x}, ${arrowHead.p1.y}
          L${p2.x}, ${p2.y}
          L${arrowHead.p2.x}, ${arrowHead.p2.y}
          `;
      } else {
        if (fromShape.cx > toShape.cx) {
          const p1 = {
            x: fromShape.cx + this.data.shapeWidth / 2 + 40 * this.data.widthR,
            y: toShape.cy,
          };
          const p2 = {
            x: toShape.cx + this.data.shapeWidth / 2 + 10 * this.data.widthR,
            y: toShape.cy,
          };
          const arrowHead = this.getPoints(p1, p2);
          path = `M${
            fromShape.cx + this.data.shapeWidth / 2 + 10 * this.data.widthR
          }, ${fromShape.cy}
            L${
              fromShape.cx + this.data.shapeWidth / 2 + 40 * this.data.widthR
            }, ${fromShape.cy}
            L${
              fromShape.cx + this.data.shapeWidth / 2 + 40 * this.data.widthR
            }, ${toShape.cy}
            M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
            L${arrowHead.p1.x}, ${arrowHead.p1.y}
            L${p2.x}, ${p2.y}
            L${arrowHead.p2.x}, ${arrowHead.p2.y}
            `;
        } else {
          const p1 = {
            x: fromShape.cx - this.data.shapeWidth / 2 - 40 * this.data.widthR,
            y: toShape.cy,
          };
          const p2 = {
            x: toShape.cx - this.data.shapeWidth / 2 - 10 * this.data.widthR,
            y: toShape.cy,
          };
          const arrowHead = this.getPoints(p1, p2);
          path = `M${
            fromShape.cx - this.data.shapeWidth / 2 - 10 * this.data.widthR
          }, ${fromShape.cy}
            L${
              fromShape.cx - this.data.shapeWidth / 2 - 40 * this.data.widthR
            }, ${fromShape.cy}
            L${
              fromShape.cx - this.data.shapeWidth / 2 - 40 * this.data.widthR
            }, ${toShape.cy}
            M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
            L${arrowHead.p1.x}, ${arrowHead.p1.y}
            L${p2.x}, ${p2.y}
            L${arrowHead.p2.x}, ${arrowHead.p2.y}
            `;
        }
      }
    }
    return <Path d={path} stroke='black' strokeWidth='2' />;
  };

  onChangeText = (text, i) => {
    const inputs = this.state.inputTexts;
    inputs[i] = text;
    this.setState({
      inputTexts: inputs,
    });
    console.log(this.state.inputTexts);
  };

  setInputs = async () => {
    const inputs = this.state.inputTexts;
    const pythonCode = this.state.pythonCode;
    const codes = pythonCode.split('\n');
    let index = 0;
    for (let i = 0; i < codes.length; i++) {
      if (codes[i].indexOf('input') > 0) {
        const end = codes[i].indexOf('input');
        if (isNaN(inputs[index])) {
          codes[i] = codes[i].slice(0, end) + '"' + inputs[index] + '"';
        } else {
          codes[i] = codes[i].slice(0, end) + inputs[index];
        }
        index++;
      }
    }
    const resultCode = codes.join('\n');
    const result = '실행결과\n\n' + (await api.runPython(resultCode));

    this.setState({
      result: result,
      modalOpen: false,
    });
  };

  render() {
    const inputList = this.state.inputTexts.map((text, index) => {
      return (
        <TextInput
          autoFocus={index == 0 ? true : false}
          style={styles.modalTextInput}
          onChangeText={(text) => this.onChangeText(text, index)}
          value={this.state.inputTexts[index]}
        />
      );
    });

    return (
      <SafeAreaView style={styles.androidSafeArea}>
        {/* 인풋 입력창 */}
        <Modal
          animationType='slide'
          transparent={true}
          visible={this.state.modalOpen}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Native.Text style={{ ...styles.textStyle, marginBottom: 30 }}>
                값을 입력하세요
              </Native.Text>
              {inputList}
              <View style={styles.modalButtonView}>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.setInputs();
                  }}
                >
                  <Native.Text style={styles.textStyle}>입력</Native.Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.setState({
                      modalOpen: false,
                    });
                  }}
                >
                  <Native.Text style={styles.textStyle}>취소</Native.Text>
                </TouchableHighlight>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.leftView}>
          <View style={styles.codeView}>
            <ScrollView>
              <TextInput
                style={styles.code}
                multiline={true}
                onChangeText={(text) => this.setState({ pythonCode: text })}
                value={this.state.pythonCode}
              ></TextInput>
            </ScrollView>
          </View>
          <View style={styles.buttonView}>
            <TouchableOpacity style={styles.button} onPress={this.run}>
              <Native.Text style={styles.buttonText}>RUN</Native.Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={this.toFlowChart}>
              <Native.Text style={styles.buttonText}>순서도 수정</Native.Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rightView}>
          <View style={styles.flowChart}>
            <Svg
              onLayout={(event) => {
                var { x, y, width, height } = event.nativeEvent.layout;
                const newWidth = width * 0.2;

                const widthR = width / this.props.width;
                const heightR = height / this.props.height;
                const newHeight = this.props.shapeHeight * heightR;

                this.data.widthR = widthR;
                this.data.heightR = heightR;
                this.getSmallShapes(widthR, heightR);

                this.data.shapeWidth = newWidth;
                this.data.shapeHeight = newHeight;
                this.data.svgWidth = width;
                this.data.svgHeight = height;
                this.setState({});
              }}
            >
              {this.state.smallShapes.map((shape, i) => {
                return this.drawShape(shape, i);
              })}
              {this.props.arrows.map((arrow, i) => {
                return this.drawSmallArrow(arrow, i);
              })}
            </Svg>
          </View>
          <View style={styles.resultView}>
            <ScrollView>
              <Native.Text style={styles.result}>
                {this.state.result}
              </Native.Text>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  androidSafeArea: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#bb945d',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftView: {
    flex: 1,
    padding: 10,
  },
  rightView: {
    flex: 1,
    padding: 10,
  },
  codeView: {
    flex: 5,
    backgroundColor: '#e9e1c9',
    borderRadius: 60,
    overflow: 'hidden',
    paddingLeft: 15,
  },
  code: {
    fontSize: 24,
    fontFamily: 'font-300',
  },
  buttonView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ccb996',
    width: '40%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'font-600',
  },
  flowChart: {
    flex: 1,
    backgroundColor: '#e9e1c9',
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 10,
  },
  resultView: {
    flex: 1,
    padding: 10,
    backgroundColor: '#e9e1c9',
    borderRadius: 60,
    overflow: 'hidden',
    padding: 20,
  },
  result: {
    fontSize: 20,
    fontFamily: 'font-300',
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: 300,
    height: 'auto',
    backgroundColor: '#eee',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalButton: {
    backgroundColor: '#ccb996',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: 80,
    alignItems: 'center',
  },
  textStyle: {
    textAlign: 'center',
    fontFamily: 'font-300',
  },

  modalTextInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: 260,
    marginBottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },
  modalButtonView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 260,
  },
});
