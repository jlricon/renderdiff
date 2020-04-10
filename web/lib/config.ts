const env = process.env.NODE_ENV || "development";
interface Config {
  baseUrl: string;
}

const configs: Config = {
  development: {
    baseUrl: "http://localhost:3000",
  },
  test: {
    baseUrl: "http://localhost:3000",
  },
  production: {
    baseUrl: "https://commitment.now.sh",
  },
}[env];

export default configs;
