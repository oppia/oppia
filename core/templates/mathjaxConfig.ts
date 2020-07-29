window.MathJax = {
  // There is a typescript error here because window.MathJax should be a MathJax
  // object instead of a MathJax config. We need to suppress this error
  // because this is used to set the config we want. As mentioned here
  // https://docs.mathjax.org/en/v2.7-latest/configuration.html#using-plain-javascript
  // Also after the MathJax config is loaded, window.MathJax becomes
  // a MathJax object as the typescript compiler expects.
  // @ts-ignore
  skipStartupTypeset: true,
  messageStyle: 'none',
  jax: ['input/TeX', 'output/SVG'],
  extensions: ['tex2jax.js', 'MathMenu.js', 'MathZoom.js'],
  showMathMenu: false,
  showProcessingMessages: false,
  SVG: {
    useGlobalCache: false,
    linebreaks: {
      automatic: true,
      width: '500px'
    },
    scale: 91,
    showMathMenu: false,
    useFontCache: false
  },
  TeX: {
    extensions: ['AMSmath.js', 'AMSsymbols.js', 'autoload-all.js']
  }
};
