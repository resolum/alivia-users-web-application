/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEV_API_PROXY_TARGET?: string;
  readonly VITE_LANDING_URL?: string;
  readonly VITE_IAM_SIGN_IN_ENDPOINT_PATH?: string;
  readonly VITE_IAM_SIGN_UP_ENDPOINT_PATH?: string;
  readonly VITE_IAM_REFRESH_ENDPOINT_PATH?: string;
  readonly VITE_IAM_FORGOT_PASSWORD_ENDPOINT_PATH?: string;
  readonly VITE_IAM_RESET_PASSWORD_ENDPOINT_PATH?: string;
  readonly VITE_IAM_MOCK?: string;
  readonly VITE_IAM_MOCK_FAIL?: string;
  readonly VITE_DEV_ROLE?: string;
}
