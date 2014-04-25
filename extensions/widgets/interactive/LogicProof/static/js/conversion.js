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

  // Returns first and last characters in the new string that have been
  // changed, or false if one string is not defined.
  var compareStrings = function(newString, oldString) {
    if (newString === undefined || oldString === undefined) {
      return false;
    }
    for (var i = 0; i < newString.length; i++) {
      if (newString[i] !== oldString[i]) {
        var firstChange = i;
        break;
      }
    }
    for (var i = newString.length - 1; i >= 0; i--) {
      if (newString[i] !== oldString[i + oldString.length - newString.length]) {
        var lastChange = Math.max(i, firstChange);
        break;
      }
    }
    return {
      first: firstChange,
      last: lastChange
    };
  }

  return {
    convertToLogicCharacters: convertToLogicCharacters,
    compareStrings: compareStrings
  }
})()