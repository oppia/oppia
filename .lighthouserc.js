module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        "http://localhost:8181/splash"
      ],
      settings: {
        chromeFlags: ["--proxy-server=http://localhost:9999"],
      }
    }
  }
}