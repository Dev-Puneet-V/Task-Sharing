import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // This is important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to handle errors
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       // Handle unauthorized access
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   }
// );

export default api;
