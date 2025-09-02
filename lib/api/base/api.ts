import axios from 'axios';

// TODO: Replace with env variable
export const API_BASE_URL = 'http://localhost:8080/api'

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 1000,
});
