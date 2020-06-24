window.MathJax = {
  // Need this because technically the type error thrown here is correct.
  // This is not the type of MathJax but MathJaxConfig.
  // @ts-ignore
  skipStartupTypeset: true,
  messageStyle: 'none',
  'HTML-CSS': {
    imageFont: null,
    linebreaks: {
      automatic: true,
      width: '500px'
    },
    scale: 91,
    showMathMenu: false
  }
};
