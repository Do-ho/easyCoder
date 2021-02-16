import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';

const viewHeight = Dimensions.get('window').height;
const viewWidth = Dimensions.get('window').width;

export default class App extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <SafeAreaView style={styles.androidSafeArea}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>easy coder</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              this.props.handler(2);
            }}
          >
            <Text style={styles.buttonText}>새로 그리기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              this.props.handler(1);
            }}
          >
            <Text style={styles.buttonText}>불러오기</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => {
              console.log('순서도 예시');
            }}
          >
            <Text style={styles.buttonText}>순서도 예시</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              console.log('사용 방법');
            }}
          >
            <Text style={styles.buttonText}>사용 방법</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              console.log('앱 소개');
            }}
          >
            <Text style={styles.buttonText}>앱 소개</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => {
              console.log('FAQ');
            }}
          >
            <Text style={styles.buttonText}>FAQ</Text>
          </TouchableOpacity> */}
        </View>
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
  },

  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: viewWidth > 600 ? 120 : 60,
    fontFamily: 'font-600',
    color: '#e9e1c9',
  },
  button: {
    backgroundColor: '#ccb996',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    height: '10%',
    marginTop: 100,
    marginBottom: 100,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: viewWidth > 600 ? 20 : 14,
    fontFamily: 'font-600',
  },
});
