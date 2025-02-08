import type {AxiosError, InternalAxiosRequestConfig} from 'axios';
import axios from 'axios';
import {showNotify} from 'vant';
import {STORAGE_TOKEN_KEY} from '@/stores/mutation-type';

// This is used to set the Token KEY to be used when requesting the backend.
// This can be modified to suit your needs, common ones are Access-Token, Authorization, and so on.
// It is important to note that you should try to ensure that you use `-` as a separator to // avoid being dropped by load balancers like nginx.
// Avoid having your custom request headers discarded by load balancers like nginx.
export const REQUEST_TOKEN_KEY = 'Access-Token';

// Create an axios instance
const request = axios.create({
  // Default prefix for API requests
  baseURL: import.meta.env.VITE_APP_API_BASE_URL,
  timeout: 6000, // Request timeout
});

export type RequestError = AxiosError<{
  message?: string;
  result?: any;
  errorMessage?: string;
}>;

// Exception Intercept Handler
function errorHandler(error: RequestError): Promise<any> {
  if (error.response) {
    const {data = {}, status, statusText} = error.response;
    // 403 no entitlement
    if (status === 403) {
      showNotify({
        type: 'danger',
        message: (data && data.message) || statusText,
      });
    }
    // 401 Not logged in/not authorized
    if (status === 401 && data.result && data.result.isLogin) {
      showNotify({
        type: 'danger',
        message: 'Authorization verification failed',
      });
      // If you need to jump directly to the login page
      // location.replace(loginRoutePath)
    }
  }
  return Promise.reject(error);
}

// request interceptor
function requestHandler(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> {
  const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
  // If the token exists
  // Make each request carry a custom token, please modify as appropriate.
  if (savedToken) config.headers[REQUEST_TOKEN_KEY] = savedToken;

  return config;
}

// Add a request interceptor
request.interceptors.request.use(requestHandler, errorHandler);

// Response Interceptor
function responseHandler(response: {data: any}) {
  return response.data;
}

// Add a response interceptor
request.interceptors.response.use(responseHandler, errorHandler);

export default request;
