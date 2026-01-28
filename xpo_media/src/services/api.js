import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080", // Spring Boot backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
