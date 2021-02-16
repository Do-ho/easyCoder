import React, { useState } from 'react';
import HomeScreen from './screen/HomeScreen';
import LoadScreen from './screen/LoadScreen';
import DrawScreen from './screen/DrawScreen';
import ResultScreen from './screen/ResultScreen';
import { View, Text, YellowBox } from 'react-native';
import { AppLoading } from 'expo';
import { useFonts } from 'expo-font';

export default () => {
  const [screenNumber, setScreenNumber] = useState(2);
  const [shapes, setShapes] = useState([
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
  ]);
  const [arrows, setArrows] = useState([]);
  const [undoStack, setUndoStack] = useState([]);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [shapeHeight, setShapeHeight] = useState(0);

  console.disableYellowBox = true;
  let [fontsLoaded] = useFonts({
    'font-300': require('./assets/fonts/font300.ttf'),
    'font-600': require('./assets/fonts/font600.ttf'),
  });

  handler = (number) => {
    setScreenNumber(number);
  };

  if (!fontsLoaded) {
    return <AppLoading />;
  } else {
    switch (screenNumber) {
      case 0:
        return <HomeScreen handler={setScreenNumber} />;
      case 1:
        return (
          <LoadScreen
            handler={setScreenNumber}
            setShapes={setShapes}
            setArrows={setArrows}
            setUndoStack={setUndoStack}
          />
        );
      case 2:
        return (
          <DrawScreen
            handler={setScreenNumber}
            setShapes={setShapes}
            setArrows={setArrows}
            setUndoStack={setUndoStack}
            shapes={shapes}
            arrows={arrows}
            undoStack={undoStack}
            setWidth={setWidth}
            setHeight={setHeight}
            setShapeHeight={setShapeHeight}
          />
        );
      case 3:
        return (
          <ResultScreen
            handler={setScreenNumber}
            shapes={shapes}
            arrows={arrows}
            width={width}
            height={height}
            shapeHeight={shapeHeight}
          />
        );

      default:
        return <HomeScreen />;
    }
  }
};
