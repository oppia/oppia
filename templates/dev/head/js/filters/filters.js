oppia.filter('spacesToUnderscores', function() {
  return function(input) {
    return input.trim().replace(' ', '_');
  };
});

// Filter that truncates long descriptors.
// TODO(sll): Strip out HTML tags before truncating.
oppia.filter('truncate', function() {
  return function(input, length, suffix) {
    if (!input)
      return '';
    if (isNaN(length))
      length = 70;
    if (suffix === undefined)
      suffix = '...';
    if (input.length <= length || input.length - suffix.length <= length)
      return input;
    else
      return String(input).substring(0, length - suffix.length) + suffix;
  };
});

// Filter that changes {{...}} tags into INPUT indicators.
oppia.filter('bracesToText', function() {
  return function(input) {
    if (!input) {
      return '';
    }
    var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/g;
    return input.replace(pattern, '<code>INPUT</code>');
  };
});

// Filter that changes {{...}} tags into input fields.
// Uses a multiple-choice selector if the input is multiple-choice.
oppia.filter('bracesToInput', function() {
  return function(input, choices) {
    if (!input) {
      return '';
    }
    var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    var index = 0;

    var isMultipleChoice = false;
    if (choices) {
      isMultipleChoice = true;
    }

    while (true) {
      if (!input.match(pattern)) {
        break;
      }
      var varName = input.match(pattern)[1];
      var tail = '>';
      if (index === 0) {
        tail = ' autofocus>';
      }

      var replacementHtml = '<input type="text" ng-model="addRuleActionInputs.' +
          varName + '"' + tail;
      if (isMultipleChoice) {
        replacementHtml =
          '<select ng-model="addRuleActionInputs.' + varName +
          '" ng-options="choice.id as choice.val for choice in getExtendedChoiceArray(interactiveWidget.params.choices)"' +
          tail + '</select>';
      }

      input = input.replace(pattern, replacementHtml);
      index++;
    }
    return input;
  };
});

// Filter that changes {{...}} tags into the corresponding parameter input values.
oppia.filter('parameterizeRule', function() {
  return function(input, choices) {
    if (!input) {
      return '';
    }
    var rule = input.rule;
    var inputs = input.inputs;

    var isMultipleChoice = false;
    if (choices) {
      isMultipleChoice = true;
    }

    var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    while (true) {
      if (!rule.match(pattern)) {
        break;
      }
      var varName = rule.match(pattern)[1];
      var replacementText = inputs[varName];
      if (isMultipleChoice) {
        replacementText = "'" + choices[inputs[varName]] + "'";
      }
      rule = rule.replace(pattern, replacementText);
    }
    return rule;
  };
});
