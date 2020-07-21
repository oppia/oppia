window.MathJax = {
  // Need this because technically the type error thrown here is correct.
  // This is not the type of MathJax but MathJaxConfig.
  // @ts-ignore
  svg: {
    scale: .91,
    fontCache: 'none'
  }
};
