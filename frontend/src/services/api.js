import axios from "axios";

const API = axios.create({
  baseURL: "http://100.72.182.10:5000",
});

export default API;