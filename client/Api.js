const { default: Axios } = require('axios');

import axios from 'axios';

axios.defaults.baseURL = 'http://15.165.19.102:8000';
// axios.defaults.baseURL = 'http://192.168.0.2:8000';
// axios.defaults.baseURL = 'http://13.125.108.192:8000';
axios.defaults.withCredentials = true;

export default {
  async sendShapes(sendData) {
    let data = '';
    await axios
      .post('/', sendData)
      .then((res) => {
        data = res.data.Result;
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        console.log('finally');
      });
    return data;
  },
  async compile(sendData) {
    let data = '';
    await axios
      .post('/compile/', sendData)
      .then((res) => {
        data = res;
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        console.log('finally compile');
      });
    return data;
  },

  async runPython(pythonCode) {
    let result = '';
    await axios
      .post('/code/', { code: pythonCode })
      .then((res) => {
        result = res.data.Result;
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {});
    return result;
  },
};
