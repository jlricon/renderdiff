const env = process.env.NODE_ENV || "development";
interface Config {
  baseUrl: string;
  worker: string;
}

const configs: Config = {
  development: {
    baseUrl: "http://localhost:3000",
    worker: "https://diff_text.jlricon.workers.dev/",
  },
  test: {
    baseUrl: "http://localhost:3000",
    worker: "https://diff_text.jlricon.workers.dev/",
  },
  production: {
    baseUrl: "https://commitment.now.sh",
    worker: "https://diff_text.jlricon.workers.dev/",
  },
}[env];

export default configs;
