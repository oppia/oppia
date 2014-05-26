var logicProofConversion = (function() {

  // NOTE: these must all be single characters
  var REPLACEMENT_PAIRS = [{
    old: '&',
    new: '\u2227'
  }, {
    old: '|',
    new: '\u2228'
  }, {
    old: '@',
    new: '\u2200'
  }, {
    old: '$',
    new: '\u2203'
  }]

  var convertToLogicCharacters = function(oldString) {
    var replacedString = oldString;
    for (var i = 0; i < REPLACEMENT_PAIRS.length; i++) {
      replacedString = replacedString.replace(
        REPLACEMENT_PAIRS[i].old, REPLACEMENT_PAIRS[i].new);
    }
    return replacedString;
  }

  var convertElementToLogicChars = function(element) {
    // NOTE: this function is first called before the DOM is defined, when
    // the element will be undefined and we do nothing.
    if(element) {
      var cursorPosition = element.selectionEnd;
      element.value = convertToLogicCharacters(element.value);
      element.selectionEnd = cursorPosition;
    }
  }

  return {
    convertToLogicCharacters: convertToLogicCharacters,
    convertElementToLogicChars: convertElementToLogicChars
  };
}())