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
  Alert,
} from 'react-native';
import Svg, { Path, Rect, Ellipse, G, Text } from 'react-native-svg';
import AsyncStorage from '@react-native-community/async-storage';
import api from '../Api';

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      shapes: [],
      arrows: [],
      arrowMode: false,
      modalOpen: false,
      saveModalOpen: false,
      text: '',
      undoStack: [],
      redoStack: [],
      errorIndex: -1,
      buttonEnable: false,
    };
    this.data = {
      shapeWidth: 0,
      shapeHeight: 0,
      buttonWidth: 0,
      buttonHeight: 0,
      clickedIndex: 0,
      offsetX: 0,
      offsetY: 0,
      offsetCx: 0,
      offsetCy: 0,
      svgWidth: 0,
      svgHeight: 0,
      clickedTime: 0,
      arrowFrom: -1,
      arrowTo: -1,
      smallShapes: [],
      isMoving: false,
    };
  }

  arrowMode = () => {
    const arrowMode = this.state.arrowMode;
    if (arrowMode) {
      const shapes = this.state.shapes;
      if (this.data.arrowFrom != -1) {
        shapes[this.data.arrowFrom]['arrowSelected'] = false;
      }
      this.data.arrowFrom = -1;
      this.data.arrowTo = -1;
    }
    this.setState({
      arrowMode: !arrowMode,
    });
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

  makeArrow = (from, to) => {
    const shapes = this.state.shapes;
    let isDelete = false;
    shapes[from]['arrowSelected'] = false;
    shapes[to]['arrowSelected'] = false;
    this.data.arrowFrom = -1;
    this.data.arrowTo = -1;
    this.setState({
      shapes: shapes,
      arrowMode: false,
    });

    const newArrow = { from: from, to: to };
    const newArrows = this.state.arrows;
    const nowShapes = JSON.parse(JSON.stringify(shapes));
    const nowArrows = JSON.parse(JSON.stringify(newArrows));

    const undoStack = this.state.undoStack;
    for (var i = 0; i < newArrows.length; i++) {
      if (
        newArrows[i].from == newArrow.from &&
        newArrows[i].to == newArrow.to
      ) {
        isDelete = true;
        break;
      }
    }
    isDelete ? newArrows.splice(i, 1) : newArrows.push(newArrow);
    undoStack.push({ shapes: nowShapes, arrows: nowArrows });
    this.setState({
      arrows: newArrows,
      undoStack: undoStack,
      redoStack: [],
    });
  };

  drawArrow = (arrow, i) => {
    var from = arrow.from;
    var to = arrow.to;
    var shapes = this.state.shapes;
    var fromShape = shapes[from];
    var toShape = shapes[to];
    var path;
    // 같은 y선상에 있을때
    if (
      Math.abs(fromShape.cy - toShape.cy) < this.data.shapeHeight + 30 &&
      Math.abs(fromShape.cx - toShape.cx) > this.data.shapeWidth + 30
    ) {
      if (fromShape.cx < toShape.cx) {
        const p1 = {
          x: fromShape.cx + this.data.shapeWidth / 2 + 10,
          y: fromShape.cy,
        };
        const p2 = {
          x: toShape.cx - this.data.shapeWidth / 2 - 10,
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
          x: fromShape.cx - this.data.shapeWidth / 2 - 10,
          y: fromShape.cy,
        };
        const p2 = {
          x: toShape.cx + this.data.shapeWidth / 2 + 10,
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
    } else if (fromShape.cy < toShape.cy - this.data.shapeHeight - 30) {
      if (toShape.cx - fromShape.cx > this.data.shapeWidth) {
        const p1 = {
          x: fromShape.cx,
          y: fromShape.cy + this.data.shapeHeight / 2 + 10,
        };
        const p2 = {
          x: toShape.cx - this.data.shapeWidth / 2 - 10,
          y: toShape.cy - this.data.shapeHeight / 2 - 10,
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
          y: fromShape.cy + this.data.shapeHeight / 2 + 10,
        };
        const p2 = {
          x: toShape.cx + this.data.shapeWidth / 2 + 10,
          y: toShape.cy - this.data.shapeHeight / 2 - 10,
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
          y: fromShape.cy + this.data.shapeHeight / 2 + 10,
        };
        const p2 = {
          x: toShape.cx,
          y: toShape.cy - this.data.shapeHeight / 2 - 10,
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
    else if (toShape.cy < fromShape.cy - this.data.shapeHeight - 30) {
      if (toShape.cx - fromShape.cx > this.data.shapeWidth) {
        const p1 = {
          x: fromShape.cx,
          y: toShape.cy,
        };
        const p2 = {
          x: toShape.cx - this.data.shapeWidth / 2 - 10,
          y: toShape.cy,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${fromShape.cx}, ${
          fromShape.cy - this.data.shapeHeight / 2 - 10
        }
        L${fromShape.cx}, ${toShape.cy}
        M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
        L${arrowHead.p1.x}, ${arrowHead.p1.y}
        L${p2.x}, ${p2.y}
        L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
      } else if (fromShape.cx - toShape.cx > this.data.shapeWidth) {
        const p1 = {
          x: fromShape.cx,
          y: toShape.cy,
        };
        const p2 = {
          x: toShape.cx + this.data.shapeWidth / 2 + 10,
          y: toShape.cy,
        };
        const arrowHead = this.getPoints(p1, p2);
        path = `M${fromShape.cx}, ${
          fromShape.cy - this.data.shapeHeight / 2 - 10
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
            x: fromShape.cx + this.data.shapeWidth / 2 + 40,
            y: toShape.cy,
          };
          const p2 = {
            x: toShape.cx + this.data.shapeWidth / 2 + 10,
            y: toShape.cy,
          };
          const arrowHead = this.getPoints(p1, p2);

          path = `M${fromShape.cx + this.data.shapeWidth / 2 + 10}, ${
            fromShape.cy
          }
          L${fromShape.cx + this.data.shapeWidth / 2 + 40}, ${fromShape.cy}
          L${fromShape.cx + this.data.shapeWidth / 2 + 40}, ${toShape.cy}
          M${p1.x}, ${p1.y} L${p2.x}, ${p2.y}
          L${arrowHead.p1.x}, ${arrowHead.p1.y}
          L${p2.x}, ${p2.y}
          L${arrowHead.p2.x}, ${arrowHead.p2.y}
        `;
        } else {
          const p1 = {
            x: fromShape.cx - this.data.shapeWidth / 2 - 40,
            y: toShape.cy,
          };
          const p2 = {
            x: toShape.cx - this.data.shapeWidth / 2 - 10,
            y: toShape.cy,
          };
          const arrowHead = this.getPoints(p1, p2);
          path = `M${fromShape.cx - this.data.shapeWidth / 2 - 10}, ${
            fromShape.cy
          }
          L${fromShape.cx - this.data.shapeWidth / 2 - 40}, ${fromShape.cy}
          L${fromShape.cx - this.data.shapeWidth / 2 - 40}, ${toShape.cy}
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

  makeShape = (type) => {
    var newShape = { type: type };
    switch (type) {
      case 'square':
        newShape['x'] = 100;
        newShape['y'] = 100;
        newShape['cx'] = 100 + this.data.shapeWidth / 2;
        newShape['cy'] = 100 + this.data.shapeHeight / 2;
        newShape['arrowSelected'] = false;
        newShape['text'] = '';
        break;
      case 'start/end':
        newShape['cx'] = 100 + this.data.shapeWidth / 2;
        newShape['cy'] = 100 + this.data.shapeHeight / 2;
        newShape['arrowSelected'] = false;
        newShape['text'] = '';

        break;
      case 'data':
        newShape['x'] = 100;
        newShape['y'] = 100 + this.data.shapeHeight;
        newShape['cx'] = 100 + (this.data.shapeWidth * 3) / 4;
        newShape['cy'] = 100 + this.data.shapeHeight / 2;
        newShape['arrowSelected'] = false;
        newShape['text'] = '';

        break;
      case 'decision':
        newShape['cx'] = 100 + this.data.shapeWidth / 2;
        newShape['cy'] = 100 + this.data.shapeHeight / 2;
        newShape['arrowSelected'] = false;
        newShape['text'] = '';
        break;
      default:
        break;
    }
    const newShapes = this.state.shapes;
    const newArrows = this.state.arrows;
    const nowShapes = JSON.parse(JSON.stringify(newShapes));
    const nowArrows = JSON.parse(JSON.stringify(newArrows));

    const undoStack = this.state.undoStack;
    newShapes.push(newShape);

    undoStack.push({ shapes: nowShapes, arrows: nowArrows });

    this.setState({
      shapes: newShapes,
      undoStack: undoStack,
      redoStack: [],
    });
  };

  drawShape = (shape, i) => {
    const arrowMode = this.state.arrowMode;
    let color = arrowMode ? 'blue' : 'black';
    let text = shape.text;
    if (text.length > 9) {
      text = text.slice(0, 9) + '...';
    }
    if (i == this.state.errorIndex) {
      color = 'red';
    }
    if (shape.arrowSelected) {
      color = 'black';
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
            y={shape.cy + 5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'16'}
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
            y={shape.cy + 5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'16'}
            fill='black'
          >
            {text}
          </Text>
        </G>
      );
    } else if (shape.type == 'data') {
      const x = shape.x * 1;
      const y = shape.y * 1;
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
            y={shape.cy + 5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'16'}
            fill='black'
          >
            {text}
          </Text>
        </G>
      );
    } else if (shape.type == 'decision') {
      const cx = shape.cx * 1;
      const cy = shape.cy * 1;
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
            y={shape.cy + 5}
            textAnchor='middle'
            fontWeight='bold'
            fontSize={'16'}
            fill='black'
          >
            {text}
          </Text>
        </G>
      );
    }
  };

  findClickedShape = (x, y) => {
    var shapes = this.state.shapes;
    if (shapes.length == 0) {
      return -1;
    }
    var nearestIndex = -1;
    var nearestValue = 10000000;
    for (var i = 0; i < shapes.length; i++) {
      var dx = x - shapes[i]['cx'];
      var dy = y - shapes[i]['cy'];
      var value = dx * dx + dy * dy;
      var maxValue =
        (this.data.shapeWidth / 2) * (this.data.shapeWidth / 2) +
        (this.data.shapeHeight / 2) * (this.data.shapeHeight / 2);
      if (value > maxValue) continue;
      if (nearestValue >= value) {
        nearestValue = value;
        nearestIndex = i;
      }
    }
    return nearestIndex;
  };

  setOffset = () => {
    var clickedIndex = this.data.clickedIndex;
    var shape = this.state.shapes[clickedIndex];
    var type = shape.type;
    if (type == 'square' || type == 'data') {
      this.data.offsetX = shape['x'];
      this.data.offsetY = shape['y'];
      this.data.offsetCx = shape['cx'];
      this.data.offsetCy = shape['cy'];
    } else if (type == 'decision' || type == 'start/end') {
      this.data.offsetCx = shape['cx'];
      this.data.offsetCy = shape['cy'];
    }
  };

  moveShape = (dx, dy) => {
    var clickedIndex = this.data.clickedIndex;
    var newShapes = this.state.shapes;
    if (
      this.data.offsetCx + dx < 0 + this.data.shapeWidth / 2 ||
      this.data.offsetCx + dx > this.data.svgWidth - this.data.shapeWidth / 2 ||
      this.data.offsetCy + dy < 0 + this.data.shapeHeight / 2 ||
      this.data.offsetCy + dy > this.data.svgHeight - this.data.shapeHeight / 2
    )
      return;
    var type = newShapes[clickedIndex].type;
    if (type == 'square' || type == 'data') {
      newShapes[clickedIndex]['x'] = this.data.offsetX + dx;
      newShapes[clickedIndex]['y'] = this.data.offsetY + dy;
      newShapes[clickedIndex]['cx'] = this.data.offsetCx + dx;
      newShapes[clickedIndex]['cy'] = this.data.offsetCy + dy;
    } else if (type == 'decision' || type == 'start/end') {
      newShapes[clickedIndex]['cx'] = this.data.offsetCx + dx;
      newShapes[clickedIndex]['cy'] = this.data.offsetCy + dy;
    }
    this.setState({
      shapes: newShapes,
    });
  };

  panResponder = {};
  componentWillMount() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderEnd,
    });
    this.setState({
      shapes: this.props.shapes,
      arrows: this.props.arrows,
      undoStack: this.props.undoStack,
    });
  }

  handleStartShouldSetPanResponder = (event, gestureState) => {
    var x = event.nativeEvent.locationX;
    var y = event.nativeEvent.locationY;
    var clickedIndex = this.findClickedShape(x, y);
    console.log('clickedIndex', clickedIndex);
    console.log(this.state.shapes);
    this.data.clickedIndex = clickedIndex;
    if (clickedIndex == -1) {
      console.log(this.state.arrows);
      return false;
    } else {
      this.setOffset();
      return true;
    }
  };

  handlePanResponderGrant = (event, gestureState) => {
    this.data.clickedTime = new Date();
  };

  handlePanResponderMove = (event, gestureState) => {
    if (!this.state.arrowMode) {
      if (!this.data.isMoving) {
        const shapes = this.state.shapes;
        const arrows = this.state.arrows;
        const undoStack = this.state.undoStack;

        const nowShapes = JSON.parse(JSON.stringify(shapes));
        const nowArrows = JSON.parse(JSON.stringify(arrows));

        undoStack.push({ shapes: nowShapes, arrows: nowArrows });
        this.data.isMoving = true;
        this.setState({
          undoStack: undoStack,
        });
      }
      var dx = gestureState.dx;
      var dy = gestureState.dy;
      this.moveShape(dx, dy);
    }
  };

  handlePanResponderEnd = (event, gestureState) => {
    var touchedTime = new Date().getTime() - this.data.clickedTime.getTime();
    if (touchedTime > 80) {
      this.data.isMoving = false;
      return;
    }

    if (this.state.arrowMode) {
      const shapes = this.state.shapes;
      if (this.data.arrowFrom == -1) {
        this.data.arrowFrom = this.data.clickedIndex;
        shapes[this.data.clickedIndex]['arrowSelected'] = true;
      } else {
        if (this.data.arrowTo == -1) {
          if (this.data.arrowFrom == this.data.clickedIndex) return;
          this.data.arrowTo = this.data.clickedIndex;
          shapes[this.data.clickedIndex]['arrowSelected'] = true;
          this.makeArrow(this.data.arrowFrom, this.data.arrowTo);
        }
      }
      this.setState({
        shapes: shapes,
      });
    } else {
      const text = this.state.shapes[this.data.clickedIndex].text;
      this.setState({
        modalOpen: true,
        text: text,
      });
    }
  };

  onChangeText = (text) => {
    this.setState({
      text: text,
    });
  };

  setInnerText = () => {
    const clickedIndex = this.data.clickedIndex;
    const text = this.state.text;
    const shapes = this.state.shapes;
    if (shapes[clickedIndex].text == text) {
      this.setState({
        modalOpen: false,
      });
    } else {
      const undoStack = this.state.undoStack;
      const shapes = this.state.shapes;
      const arrows = this.state.arrows;
      const nowShapes = JSON.parse(JSON.stringify(shapes));
      const nowArrows = JSON.parse(JSON.stringify(arrows));
      undoStack.push({ shapes: nowShapes, arrows: nowArrows });
      shapes[clickedIndex].text = text;
      this.setState({
        shapes: shapes,
        modalOpen: false,
      });
    }
  };

  clearAll = () => {
    const undoStack = this.state.undoStack;
    const shapes = this.state.shapes;
    const arrows = this.state.arrows;
    const nowShapes = JSON.parse(JSON.stringify(shapes));
    const nowArrows = JSON.parse(JSON.stringify(arrows));

    undoStack.push({
      shapes: nowShapes,
      arrows: nowArrows,
    });
    this.setState({
      shapes: [
        {
          'arrowSelected': false,
          'cx': 300,
          'cy': 100,
          'text': 'Start',
          'type': 'start/end',
        },
        {
          'arrowSelected': false,
          'cx': 300,
          'cy': 900,
          'text': 'End',
          'type': 'start/end',
        },
      ],
      arrows: [],
    });
  };

  changeToCode = () => {
    if (this.state.buttonEnable) {
      this.props.setShapes(this.state.shapes);
      this.props.setArrows(this.state.arrows);
      this.props.setUndoStack(this.state.undoStack);
      this.props.handler(3);
    } else {
      Alert.alert(
        '',
        '순서도 검사를 먼저 완료하세요.',
        [
          {
            text: 'OK',
          },
        ],
        { cancelable: false }
      );
    }
  };

  undo = () => {
    const undoStack = this.state.undoStack;
    const redoStack = this.state.redoStack;
    let shapes = this.state.shapes;
    let arrows = this.state.arrows;
    const undo = undoStack.pop();

    if (undo == undefined) return;

    const nowShapes = JSON.parse(JSON.stringify(shapes));
    const nowArrows = JSON.parse(JSON.stringify(arrows));
    redoStack.push({
      shapes: nowShapes,
      arrows: nowArrows,
    });
    shapes = undo.shapes;
    arrows = undo.arrows;

    this.setState({
      arrows: arrows,
      shapes: shapes,
      undoStack: undoStack,
      redoStack: redoStack,
    });
  };

  redo = () => {
    const undoStack = this.state.undoStack;
    const redoStack = this.state.redoStack;
    let shapes = this.state.shapes;
    let arrows = this.state.arrows;
    const redo = redoStack.pop();

    if (redo == undefined) return;
    const nowShapes = JSON.parse(JSON.stringify(shapes));
    const nowArrows = JSON.parse(JSON.stringify(arrows));
    undoStack.push({
      shapes: nowShapes,
      arrows: nowArrows,
    });
    shapes = redo.shapes;
    arrows = redo.arrows;

    this.setState({
      arrows: arrows,
      shapes: shapes,
      undoStack: undoStack,
      redoStack: redoStack,
    });
  };

  saveButtonClick = () => {
    this.setState({
      text: '',
      saveModalOpen: true,
    });
  };

  save = async () => {
    try {
      const shapes = this.state.shapes;
      const arrows = this.state.arrows;
      const undoStack = this.state.undoStack;
      const title = this.state.text;
      if (title == '') return;
      const data = {
        title: title,
        shapes: shapes,
        arrows: arrows,
        undoStack: undoStack,
      };
      const _data = await AsyncStorage.getItem('data');
      let saveData;
      if (_data == null) {
        saveData = { datas: [] };
      } else {
        saveData = JSON.parse(_data);
      }
      saveData.datas.push(data);
      await AsyncStorage.setItem('data', JSON.stringify(saveData));
      Alert.alert(
        '',
        '저장완료',
        [
          {
            text: 'OK',
            onPress: () => {
              this.setState({
                saveModalOpen: false,
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (e) {
      console.log(e);
    }
  };

  checkShapes = () => {
    const shapes = this.state.shapes;
    const arrows = this.state.arrows;
    const errorIndexes = [];
    let message = '';
  };

  compile = async () => {
    const sendData = { 'shapes': [], 'arrows': [] };
    const shapes = this.state.shapes;
    const arrows = this.state.arrows;

    this.checkShapes();

    for (let i = 0; i < shapes.length; i++) {
      let shape = [shapes[i].type, shapes[i].text, shapes[i].cx, shapes[i].cy];
      sendData.shapes.push(shape);
    }
    for (let i = 0; i < arrows.length; i++) {
      let arrow = [arrows[i].from, arrows[i].to];
      sendData.arrows.push(arrow);
    }

    const result = await api.compile(sendData);
    const message = result.data.Message;
    const index = result.data.Result;
    if (index == -1) {
      this.setState({
        buttonEnable: true,
        errorIndex: -1,
      });
    } else {
      this.setState({
        errorIndex: index,
      });
    }

    Alert.alert(
      '',
      message,
      [
        {
          text: 'OK',
          onPress: () => {},
        },
      ],
      { cancelable: false }
    );
  };

  deleteShape = () => {
    const shapes = this.state.shapes;
    const arrows = this.state.arrows;
    const undoStack = this.state.undoStack;
    const deleteArrows = [];

    const nowShapes = JSON.parse(JSON.stringify(shapes));
    const nowArrows = JSON.parse(JSON.stringify(arrows));

    undoStack.push({
      shapes: nowShapes,
      arrows: nowArrows,
    });

    for (let i = 0; i < arrows.length; i++) {
      if (
        arrows[i].from == this.data.clickedIndex ||
        arrows[i].to == this.data.clickedIndex
      ) {
        deleteArrows.push(i);
      }
      if (arrows[i].from > this.data.clickedIndex) {
        arrows[i].from--;
      }
      if (arrows[i].to > this.data.clickedIndex) {
        arrows[i].to--;
      }
    }

    shapes.splice(this.data.clickedIndex, 1);
    for (let i = deleteArrows.length - 1; i >= 0; i--) {
      arrows.splice(deleteArrows[i], 1);
    }

    this.setState({
      shapes: shapes,
      arrows: arrows,
      modalOpen: false,
      undoStack: undoStack,
    });
  };

  render() {
    return (
      <SafeAreaView style={styles.androidSafeArea}>
        <Modal
          animationType='slide'
          transparent={true}
          visible={this.state.modalOpen}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TextInput
                autoFocus
                style={styles.modalTextInput}
                onChangeText={(text) => this.onChangeText(text)}
                value={this.state.text}
              />
              <View style={styles.modalButtonView}>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.setInnerText();
                  }}
                >
                  <Native.Text style={styles.textStyle}>입력</Native.Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.deleteShape();
                  }}
                >
                  <Native.Text style={styles.textStyle}>삭제</Native.Text>
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

        {/* save modal */}
        <Modal
          animationType='slide'
          transparent={true}
          visible={this.state.saveModalOpen}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Native.Text style={{ ...styles.textStyle, marginBottom: 10 }}>
                제목을 입력하세요
              </Native.Text>
              <TextInput
                autoFocus
                style={styles.modalTextInput}
                onChangeText={(text) => this.onChangeText(text)}
                value={this.state.text}
              />
              <View style={styles.modalButtonView}>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.save();
                  }}
                >
                  <Native.Text style={styles.textStyle}>저장</Native.Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.modalButton}
                  onPress={() => {
                    this.setState({
                      saveModalOpen: false,
                    });
                  }}
                >
                  <Native.Text style={styles.textStyle}>취소</Native.Text>
                </TouchableHighlight>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.buttonContainer}>
          <View style={styles.topButtonContainer}>
            <ScrollView
              contentContainerStyle={{
                alignItems: 'center',
              }}
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <TouchableOpacity
                style={buttonStyles.square}
                onPress={() => this.makeShape('square')}
              ></TouchableOpacity>
              <TouchableOpacity
                style={buttonStyles.svgButton}
                onPress={() => this.makeShape('data')}
              >
                <Svg
                  onLayout={(event) => {
                    var { x, y, width, height } = event.nativeEvent.layout;

                    this.data.buttonWidth = width;
                    this.data.buttonHeight = height;
                    this.setState({});
                  }}
                >
                  <Path
                    d={`M20 0 L${this.data.buttonWidth} 0 M${
                      this.data.buttonWidth - 20
                    } ${this.data.buttonHeight} L0 ${this.data.buttonHeight}`}
                    stroke='black'
                    strokeWidth='4'
                  />
                  <Path
                    d={`M${this.data.buttonWidth} 0 L${
                      this.data.buttonWidth - 20
                    } ${this.data.buttonHeight} M0 ${
                      this.data.buttonHeight
                    } L20 0`}
                    stroke='black'
                    strokeWidth='2'
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity
                style={buttonStyles.svgButton}
                onPress={() => this.makeShape('decision')}
              >
                <Svg>
                  <Path
                    d={`M${this.data.buttonWidth / 2} 0 L${
                      this.data.buttonWidth
                    } ${this.data.buttonHeight / 2} L${
                      this.data.buttonWidth / 2
                    } ${this.data.buttonHeight} L0 ${
                      this.data.buttonHeight / 2
                    } L${this.data.buttonWidth / 2} 0`}
                    stroke='black'
                    strokeWidth='2'
                  />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity
                style={buttonStyles.oval}
                onPress={() => this.makeShape('start/end')}
              ></TouchableOpacity>
              <TouchableOpacity
                style={buttonStyles.svgButton}
                onPress={() => this.arrowMode()}
              >
                <Svg>
                  <Path
                    d={`M0 ${this.data.buttonHeight / 2} L${
                      this.data.buttonWidth
                    } ${this.data.buttonHeight / 2} L${
                      this.data.buttonWidth - 30
                    } 0 `}
                    stroke='black'
                    strokeWidth='2'
                  />
                  <Path
                    d={`M${this.data.buttonWidth} ${
                      this.data.buttonHeight / 2
                    } L${this.data.buttonWidth - 30} ${this.data.buttonHeight}`}
                    stroke='black'
                    strokeWidth='2'
                  />
                </Svg>
              </TouchableOpacity>
            </ScrollView>
          </View>
          <View style={styles.midButtonContainer}>
            <ScrollView
              contentContainerStyle={{
                alignItems: 'center',
              }}
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  this.clearAll();
                }}
              >
                <Native.Text style={styles.buttonText}>모두 지우기</Native.Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  this.undo();
                }}
              >
                <Native.Text style={styles.buttonText}>UNDO</Native.Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  this.redo();
                }}
              >
                <Native.Text style={styles.buttonText}>REDO</Native.Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          <View style={styles.bottomButtonContainer}>
            <ScrollView
              contentContainerStyle={{
                alignItems: 'center',
              }}
              style={{
                width: '100%',
                height: '100%',
              }}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  this.saveButtonClick();
                }}
              >
                <Native.Text style={styles.buttonText}>저장하기</Native.Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  // this.props.setShapes([]);
                  // this.props.setArrows([]);
                  // this.props.setUndoStack([]);
                  this.props.handler(1);
                }}
              >
                <Native.Text style={styles.buttonText}>불러오기</Native.Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={this.compile}>
                <Native.Text style={styles.buttonText}>순서도 검사</Native.Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  this.state.buttonEnable
                    ? styles.button
                    : styles.disabledButton
                }
                onPress={this.changeToCode}
              >
                <Native.Text style={styles.buttonText}>코드 변환</Native.Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        <View style={styles.svgContainer} {...this.panResponder.panHandlers}>
          <Svg
            style={styles.svg}
            onLayout={(event) => {
              var { x, y, width, height } = event.nativeEvent.layout;
              const newWidth = width * 0.2;
              const newHeight = newWidth * 0.6;

              this.props.setWidth(width);
              this.props.setHeight(height);
              this.props.setShapeHeight(newHeight);

              this.data.shapeWidth = newWidth;
              this.data.shapeHeight = newHeight;
              this.data.svgWidth = width;
              this.data.svgHeight = height;
              this.setState({});
            }}
          >
            {this.state.shapes.map((shape, i) => {
              return this.drawShape(shape, i);
            })}
            {this.state.arrows.map((arrow, i) => {
              return this.drawArrow(arrow, i);
            })}
          </Svg>
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
  buttonContainer: {
    flex: 2,
    padding: 10,
  },
  buttonText: {
    fontSize: 13,
    fontFamily: 'font-300',
  },
  topButtonContainer: {
    flex: 5,
    alignItems: 'center',

    backgroundColor: '#e9e1c9',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
  },
  midButtonContainer: {
    flex: 3,
    alignItems: 'center',

    backgroundColor: '#e9e1c9',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
  },
  bottomButtonContainer: {
    flex: 4,
    alignItems: 'center',
    backgroundColor: '#e9e1c9',
    borderRadius: 30,
    padding: 10,
    overflow: 'hidden',
  },
  svgContainer: {
    flex: 12,
    margin: 10,
  },

  svg: {
    flex: 1,
    backgroundColor: '#e9e1c9',
    borderRadius: 100,
    overflow: 'hidden',
  },

  button: {
    backgroundColor: '#ccb996',
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: 'white',
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
    borderRadius: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: 300,
    height: 200,
    backgroundColor: '#eee',
    borderRadius: 20,
    padding: 20,
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
    width: '100%',
  },
});

const buttonStyles = StyleSheet.create({
  square: {
    width: '90%',
    height: 50,
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'black',
  },
  svgButton: {
    width: '90%',
    height: 50,
    marginTop: 10,
    marginBottom: 15,
  },
  oval: {
    width: '90%',
    height: 50,
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 30,
  },
});
