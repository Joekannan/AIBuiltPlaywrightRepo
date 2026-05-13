export const ENV = {
  BASE_URL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
  API_BASE_URL: process.env.API_BASE_URL ?? 'https://www.saucedemo.com',
  STANDARD_USER: process.env.STANDARD_USER ?? 'standard_user',
  STANDARD_PASSWORD: process.env.STANDARD_PASSWORD ?? 'secret_sauce',
} as const;
