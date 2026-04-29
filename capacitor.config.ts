import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mongdevuong.app',
  appName: 'Remix: Mong De Vuong',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // CHÚ Ý DÀNH CHO APK: 
      // Để đăng nhập được trên App APK bằng Firebase, bạn MẮT BUỘC phải thay 'YOUR_WEB_CLIENT_ID_HERE...' 
      // bằng 'Mã ứng dụng khách trên web' (Web Client ID) có đuôi apps.googleusercontent.com
      // Lấy từ: Firebase Console -> Authentication -> Sign In Method -> Google -> Web SDK configuration.
      serverClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
