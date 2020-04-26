module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        "http://127.0.0.1:8181/splash"
      ],
      settings: {
        chromeFlags: ["--proxy-server=http://127.0.0.1:9999", "--allow-insecure-localhost"],
      }
    }
  }
}