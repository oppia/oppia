window.MathJax = {
  // Need this because technically the type error thrown here is correct.
  // This is not the type of MathJax but MathJaxConfig.
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
