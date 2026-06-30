window.MathJax = {
  // This throws "Type '{ skipStartupTypeset: boolean, ...}' is not assignable
  // to type 'typeof MathJax'.". We need to suppress this error because the
  // MathJax instructions at https://docs.mathjax.org/en/v2.7-latest/configurat
  // ion.html#using-plain-javascript explicitly instruct us to set window.MathJ
  // ax to a MathJax config, which will be changed to a MathJax object (which
  // is what the typescript compiler expects) after the MathJax library loads.
  // @ts-ignore
  skipStartupTypeset: true,
  messageStyle: 'none',
  jax: ['input/TeX', 'output/SVG'],
  extensions: ['tex2jax.js', 'MathMenu.js', 'MathZoom.js'],
  showMathMenu: false,
  showProcessingMessages: false,
  SVG: {
    useGlobalCache: false,
    // This setting forces MathJax to inherit the page's font, which allows
    // the browser's native Complex Text Layout (CTL) engine to properly connect
    // right-to-left Arabic cursive characters inside \text{...} blocks (Fixes #26148).
    mtextFontInherit: true,
    linebreaks: {
      automatic: true,
      width: '500px',
    },
    scale: 91,
    showMathMenu: false,
    useFontCache: false,
  },
  TeX: {
    extensions: ['AMSmath.js', 'AMSsymbols.js', 'autoload-all.js'],
  },
};
