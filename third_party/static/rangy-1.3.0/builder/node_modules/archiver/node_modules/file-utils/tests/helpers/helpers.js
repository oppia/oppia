exports.assertTextEqual = function (value, expected, test, msg) {
  function eol(str) {
    return str.replace(/\r\n/g, '\n');
  }

  test.strictEqual(eol(value), eol(expected), msg);
};
