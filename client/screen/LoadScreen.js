import React, { Component } from 'react';
import Native, {
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  View,
  StatusBar,
  TouchableHighlight,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import Svg, { Path, Rect, Ellipse, G, Text } from 'react-native-svg';

const viewHeight = Dimensions.get('window').height;
const viewWidth = Dimensions.get('window').width;

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      datas: [],
      selectedData: { title: '', shapes: [], arrows: [], undoStack: [] },
      modalOpen: false,
    };
    this.data = {
      svgWidth: 0,
      svgHeight: 0,
      shapeWidth: 0,
      shapeHeight: 0,
    };
  }
  componentWillMount() {
    this.getData();
  }
  getData = async () => {
    try {
      const data = await AsyncStorage.getItem('data');
      const loadDatas = JSON.parse(data).datas;
      this.setState({
        datas: loadDatas,
      });
      // return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      // error reading value
    }
  };

  selectItem = (item) => {
    this.setState({ selectedData: item, modalOpen: true });
  };

  _renderItem = (item) => {
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => {
          this.selectItem(item);
        }}
      >
        <Native.Text style={styles.titleStyle}>{item.title}</Native.Text>
      </TouchableOpacity>
    );
  };

  drawShape = (shape, i) => {
    const color = 'black';
    const width_r = this.data.svgWidth / viewWidth;
    const height_r = this.data.svgHeight / viewHeight;
    if (shape.type == 'square') {
      return (
        <G>
          <Rect
            width={this.data.shapeWidth}
            height={this.data.shapeHeight}
            x={shape.x * width_r}
            y={shape.y * height_r}
            stroke={color}
            strokeWidth='3'
          />
          <Text
            x={shape.cx * width_r}
            y={shape.cy * height_r + 5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'16'}
            fill='black'
          >
            {shape.text}
          </Text>
        </G>
      );
    } else if (shape.type == 'start/end') {
      return (
        <G>
          <Ellipse
            cx={shape.cx * width_r}
            cy={shape.cy * height_r}
            rx={this.data.shapeWidth / 2}
            ry={this.data.shapeHeight / 2}
            stroke={color}
            strokeWidth='3'
          />
          <Text
            x={shape.cx * width_r}
            y={shape.cy * height_r + 5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'16'}
            fill='black'
          >
            {shape.text}
          </Text>
        </G>
      );
    } else if (shape.type == 'data') {
      const x = shape.x * 1 * width_r;
      const y = shape.y * 1 * height_r;
      const width = this.data.shapeWidth;
      const height = this.data.shapeHeight;
      const path = `M${x} ${y} L${x + width} ${y} L${x + width + width / 2} ${
        y - height
      } L${x + width / 2} ${y - height} L${x} ${y}`;
      return (
        <G>
          <Path d={path} stroke={color} strokeWidth='3' />
          <Text
            x={shape.cx * width_r - 5}
            y={shape.cy * height_r + 5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'16'}
            fill='black'
          >
            {shape.text}
          </Text>
        </G>
      );
    } else if (shape.type == 'decision') {
      const cx = shape.cx * 1 * width_r;
      const cy = shape.cy * 1 * height_r;
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
            x={shape.cx * width_r}
            y={shape.cy * height_r + 5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'16'}
            fill='black'
          >
            {shape.text}
          </Text>
        </G>
      );
    }
  };
  getPoints = (p1, p2) => {
    const len = 144;
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

  drawArrow = (arrow, i) => {
    var from = arrow.from;
    var to = arrow.to;
    var shapes = this.state.selectedData.shapes;
    var fromShape = shapes[from];
    var toShape = shapes[to];
    var path;
    const width_r = this.data.svgWidth / viewWidth;
    const height_r = this.data.svgHeight / viewHeight;
    // 같은 y선상에 있을때
    if (
      Math.abs(fromShape.cy * height_r - toShape.cy * height_r) <
        this.data.shapeHeight + 30 &&
      Math.abs(fromShape.cx * width_r - toShape.cx * width_r) >
        this.data.shapeWidth + 30
    ) {
      if (fromShape.cx * width_r < toShape.cx * width_r) {
        const p1 = {
          x: fromShape.cx * width_r + this.data.shapeWidth / 2 + 10,
          y: fromShape.cy * height_r,
        };
        const p2 = {
          x: toShape.cx * width_r - this.data.shapeWidth / 2 - 10,
          y: toShape.cy * height_r,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
        L${arrowHead.p1.x}, ${arrowHead.p1.y}
        L${p2.x}, ${p2.y}
        L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
      } else {
        const p1 = {
          x: fromShape.cx * width_r - this.data.shapeWidth / 2 - 10,
          y: fromShape.cy * height_r,
        };
        const p2 = {
          x: toShape.cx * width_r + this.data.shapeWidth / 2 + 10,
          y: toShape.cy * height_r,
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
      fromShape.cy * height_r <
      toShape.cy * height_r - this.data.shapeHeight - 20
    ) {
      if (
        toShape.cx * width_r - fromShape.cx * width_r >
        this.data.shapeWidth
      ) {
        const p1 = {
          x: fromShape.cx * width_r,
          y: fromShape.cy * height_r + this.data.shapeHeight / 2 + 10,
        };
        const p2 = {
          x: toShape.cx * width_r - this.data.shapeWidth / 2 - 10,
          y: toShape.cy * height_r - this.data.shapeHeight / 2 - 10,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
        L${arrowHead.p1.x}, ${arrowHead.p1.y}
        L${p2.x}, ${p2.y}
        L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
      } else if (
        fromShape.cx * width_r - toShape.cx * width_r >
        this.data.shapeWidth
      ) {
        const p1 = {
          x: fromShape.cx * width_r,
          y: fromShape.cy * height_r + this.data.shapeHeight / 2 + 10,
        };
        const p2 = {
          x: toShape.cx * width_r + this.data.shapeWidth / 2 + 10,
          y: toShape.cy * height_r - this.data.shapeHeight / 2 - 10,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
        L${arrowHead.p1.x}, ${arrowHead.p1.y}
        L${p2.x}, ${p2.y}
        L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
      } else {
        const p1 = {
          x: fromShape.cx * width_r,
          y: fromShape.cy * height_r + this.data.shapeHeight / 2 + 10,
        };
        const p2 = {
          x: toShape.cx * width_r,
          y: toShape.cy * height_r - this.data.shapeHeight / 2 - 10,
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
      toShape.cy * height_r <
      fromShape.cy * height_r - this.data.shapeHeight - 30
    ) {
      if (
        toShape.cx * width_r - fromShape.cx * width_r >
        this.data.shapeWidth
      ) {
        const p1 = {
          x: fromShape.cx * width_r,
          y: toShape.cy * height_r,
        };
        const p2 = {
          x: toShape.cx * width_r - this.data.shapeWidth / 2 - 10,
          y: toShape.cy * height_r,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${fromShape.cx * width_r}, ${
          fromShape.cy * height_r - this.data.shapeHeight / 2 - 10
        }
        L${fromShape.cx * width_r}, ${toShape.cy * height_r}
        M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
        L${arrowHead.p1.x}, ${arrowHead.p1.y}
        L${p2.x}, ${p2.y}
        L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
      } else if (
        fromShape.cx * width_r - toShape.cx * width_r >
        this.data.shapeWidth
      ) {
        const p1 = {
          x: fromShape.cx * width_r,
          y: toShape.cy * height_r,
        };
        const p2 = {
          x: toShape.cx * width_r + this.data.shapeWidth / 2 + 10,
          y: toShape.cy * height_r,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${fromShape.cx * width_r}, ${
          fromShape.cy * height_r - this.data.shapeHeight / 2 - 10
        }
        L${fromShape.cx * width_r}, ${toShape.cy * height_r}
        M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
        L${arrowHead.p1.x}, ${arrowHead.p1.y}
        L${p2.x}, ${p2.y}
        L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
      } else {
        if (fromShape.cx * width_r > toShape.cx * width_r) {
          const p1 = {
            x: fromShape.cx * width_r + this.data.shapeWidth / 2 + 40,
            y: toShape.cy * height_r,
          };
          const p2 = {
            x: toShape.cx * width_r + this.data.shapeWidth / 2 + 10,
            y: toShape.cy * height_r,
          };
          const arrowHead = this.getPoints(p1, p2);

          path = `M${fromShape.cx * width_r + this.data.shapeWidth / 2 + 10}, ${
            fromShape.cy * height_r
          }
          L${fromShape.cx * width_r + this.data.shapeWidth / 2 + 40}, ${
            fromShape.cy * height_r
          }
          L${fromShape.cx * width_r + this.data.shapeWidth / 2 + 40}, ${
            toShape.cy * height_r
          }
          M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
          L${arrowHead.p1.x}, ${arrowHead.p1.y}
          L${p2.x}, ${p2.y}
          L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
        } else {
          const p1 = {
            x: fromShape.cx * width_r - this.data.shapeWidth / 2 - 40,
            y: toShape.cy * height_r,
          };
          const p2 = {
            x: toShape.cx * width_r - this.data.shapeWidth / 2 - 10,
            y: toShape.cy * height_r,
          };
          const arrowHead = this.getPoints(p1, p2);
          path = `M${fromShape.cx * width_r - this.data.shapeWidth / 2 - 10}, ${
            fromShape.cy * height_r
          }
          L${fromShape.cx * width_r - this.data.shapeWidth / 2 - 40}, ${
            fromShape.cy * height_r
          }
          L${fromShape.cx * width_r - this.data.shapeWidth / 2 - 40}, ${
            toShape.cy * height_r
          }
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

  load = () => {
    const shapes = this.state.selectedData.shapes;
    const arrows = this.state.selectedData.arrows;
    const undoStack = this.state.selectedData.undoStack;

    this.props.setShapes(shapes);
    this.props.setArrows(arrows);
    this.props.setUndoStack(undoStack);
    this.props.handler(2);
  };

  delete = () => {
    const datas = this.state.datas;
    const selectedData = this.state.selectedData;
    const idx = datas.findIndex(function (item) {
      return item.title === selectedData.title;
    });
    datas.splice(idx, 1);
    const saveData = { datas: datas };
    AsyncStorage.setItem('data', JSON.stringify(saveData));
    this.setState({
      datas: datas,
      modalOpen: false,
    });
  };

  render() {
    return (
      <SafeAreaView style={styles.androidSafeArea}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              this.props.handler(2);
            }}
          >
            <Native.Text style={styles.textStyle}>돌아가기</Native.Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listView}>
          <ScrollView>
            {this.state.datas.map((item) => {
              return this._renderItem(item);
            })}
          </ScrollView>
        </View>

        <Modal
          animationType='slide'
          transparent={true}
          visible={this.state.modalOpen}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={styles.titleView}>
                <Native.Text style={styles.titleStyle}>
                  제목 : {this.state.selectedData.title}
                </Native.Text>
              </View>
              <View style={styles.svgView}>
                <Svg
                  style={styles.svg}
                  onLayout={(event) => {
                    var { x, y, width, height } = event.nativeEvent.layout;
                    const newWidth = width * 0.15;
                    const newHeight = newWidth * 0.6;
                    this.data.shapeWidth = newWidth;
                    this.data.shapeHeight = newHeight;
                    this.data.svgWidth = width;
                    this.data.svgHeight = height;
                    this.setState({});
                  }}
                >
                  {this.state.selectedData.shapes.map((shape, i) => {
                    return this.drawShape(shape, i);
                  })}
                  {this.state.selectedData.arrows.map((arrow, i) => {
                    return this.drawArrow(arrow, i);
                  })}
                </Svg>
              </View>
              <View style={styles.modalButtonView}>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.load();
                  }}
                >
                  <Native.Text style={styles.modalButtonText}>
                    불러오기
                  </Native.Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.delete();
                  }}
                >
                  <Native.Text style={styles.modalButtonText}>삭제</Native.Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.setState({
                      modalOpen: false,
                    });
                  }}
                >
                  <Native.Text style={styles.modalButtonText}>취소</Native.Text>
                </TouchableHighlight>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  androidSafeArea: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#bb945d',
    justifyContent: 'center',
  },
  listView: { flex: 9 },
  listItem: {
    justifyContent: 'center',
    height: viewHeight / 13,
    marginLeft: viewWidth / 20,
    marginRight: viewWidth / 20,
    paddingLeft: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'black',
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    height: '80%',
    backgroundColor: '#e9e1c9',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  titleView: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
  },
  titleStyle: {
    fontSize: 20,
    fontFamily: 'font-600',
  },
  svgView: {
    flex: 9,
  },
  modalButtonView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: '#ccb996',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    height: '70%',
    width: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
  },
  button: {
    backgroundColor: '#ccb996',
    height: '50%',
    width: '10%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  modalButtonText: {
    fontSize: viewWidth > 600 ? 20 : 12,
    fontFamily: 'font-600',
  },
  textStyle: {
    fontSize: 16,
    fontFamily: 'font-600',
  },
});
