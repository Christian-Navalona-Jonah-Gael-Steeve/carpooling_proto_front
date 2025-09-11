import axios from 'axios';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 1000,
});