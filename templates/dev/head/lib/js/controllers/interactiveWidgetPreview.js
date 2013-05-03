// Copyright 2012 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Controllers for the interactive widget preview in the GuiEditor.
 *
 * @author sll@google.com (Sean Lip)
 */

function InteractiveWidgetPreview($scope, $http, $compile, warningsData, explorationData) {
  $scope.showPreview = true;

  // Sets the 'showPreview' variable. The input is a boolean.
  $scope.setShowPreview = function(input) {
    $scope.showPreview = input;
    $scope.$apply();
    if (input) {
      $scope.addContentToIframe('interactiveWidgetPreview', $scope.interactiveWidget.raw);
    }
  };

  // Tests whether an object is a JavaScript array.
  $scope.isArray = function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  $scope.generateWidgetPreview = function(widgetId, widgetParams) {
    $http.post(
        '/interactive_widgets/' + widgetId,
        $scope.createRequest({params: widgetParams, state_params: $scope.paramChanges}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
        $scope.interactiveWidget = widgetData.widget;
        $scope.interactiveParams = widgetParams;
        if ($scope.showPreview) {
          $scope.addContentToIframe('interactiveWidgetPreview', $scope.interactiveWidget.raw);
        }
      }
    );
  };

  $scope.generateUnresolvedAnswersMap = function() {
    $scope.unresolvedAnswersMap = [];
    for (var answerItem in $scope.unresolvedAnswers) {
      $scope.unresolvedAnswersMap.push({
        'answer': answerItem,
        'count': $scope.unresolvedAnswers[answerItem]
      });
    }
  };

  $scope.initInteractiveWidget = function(data) {
    // Stores rules in the form of key-value pairs. For each pair, the key is
    // the corresponding action and the value has several keys:
    // - 'rule' (the raw rule string)
    // - 'inputs' (a list of parameters)
    // - 'name' (stuff needed to build the Python classifier code)
    // - 'dest' (the destination for this rule)
    // - 'feedback' (any feedback given for this rule)
    // - 'paramChanges' (parameter changes associated with this rule)
    $scope.interactiveRulesets = data.widget.rules;
    $scope.interactiveParams = data.widget.params;
    $scope.stickyInteractiveWidget = data.widget.sticky;
    $scope.generateWidgetPreview(data.widget.id, data.widget.params);
    $scope.unresolvedAnswers = data.unresolved_answers;
    $scope.generateUnresolvedAnswersMap();
  };

  if ($scope.stateId) {
    var dataOrPromise = explorationData.getStateData($scope.stateId);
    console.log(dataOrPromise);
    if (dataOrPromise) {
      if ('then' in dataOrPromise) {
        dataOrPromise.then($scope.initInteractiveWidget);
      } else {
        $scope.initInteractiveWidget(dataOrPromise);
      }
    } else {
      console.log('No state data exists for state ' + $scope.stateId);
    }
  }

  $scope.getStateNameForRule = function(stateId) {
    if (stateId === $scope.stateId) {
      return '⟳';
    } else if (stateId === END_DEST) {
      return END_DEST;
    } else {
      return $scope.states[stateId].name;
    }
  };

  $scope.isCurrentStateId = function(stateId) {
    return stateId === $scope.stateId;
  };

  $scope.getAllStates = function() {
    var allStates = [];
    for (var state in $scope.states) {
      allStates.push(state);
    }
    allStates.push(END_DEST);
    return allStates;
  };

  $scope.getDestName = function(stateId) {
    if (stateId === '?') {
      return 'Add New State...';
    } else if (stateId === END_DEST) {
      return END_DEST;
    } else if (stateId === $scope.stateId) {
      return $scope.states[stateId].name + ' ⟳';
    } else {
      return $scope.states[stateId].name;
    }
  };

  // Returns a list of all states, as well as an 'Add New State' option.
  $scope.getAllDests = function() {
    var result = $scope.getAllStates();
    result.push('?');
    return result;
  };

  $scope.getExtendedChoiceArray = function(choices) {
    var result = [];
    for (var i = 0; i < choices.length; i++) {
      result.push({id: i, val: choices[i]});
    }
    return result;
  };

  $scope.selectRule = function(rule, name) {
    $scope.deselectAllRules();
    $scope.addRuleActionRule = rule;
    $scope.addRuleActionName = name;
    $scope.addRuleActionDest = explorationData.stateId;
    $scope.addRuleActionDestNew = '';

    // Finds the parameters and sets them in addRuleActionInputs.
    var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    var copyOfRule = rule;
    while (true) {
      if (!copyOfRule.match(pattern)) {
        break;
      }
      var varName = copyOfRule.match(pattern)[1];
      var varType = null;
      if (copyOfRule.match(pattern)[2]) {
        varType = copyOfRule.match(pattern)[2].substring(1);
      }

      if (varType == 'Set') {
        $scope.addRuleActionInputs[varName] = [];
      } else {
        $scope.addRuleActionInputs[varName] = '';
      }

      copyOfRule = copyOfRule.replace(pattern, ' ');
    }
  };

  $scope.getRules = function(action) {
    if (!action || !$scope.interactiveWidget) {
      return;
    }
    var wHandlers = $scope.interactiveWidget.handlers;
    for (var i = 0; i < wHandlers.length; i++) {
      if (wHandlers[i].name == action) {
        ruleDict = {};
        for (var rule in wHandlers[i].rules) {
          ruleDict[rule] = wHandlers[i].rules[rule].classifier;
        }
        console.log(ruleDict);
        return ruleDict;
      }
    }
  };

  $scope.deselectAllRules = function() {
    $scope.addRuleActionIndex = null;
    $scope.addRuleActionRule = null;
    $scope.addRuleActionName = null;
    $scope.addRuleActionInputs = {};
    $scope.addRuleActionDest = null;
    $scope.addRuleActionDestNew = '';
    $scope.addRuleActionFeedback = [];
    $scope.addRuleActionParamChanges = null;
  };

  $scope.openAddRuleModal = function(action) {
    $scope.addRuleModalTitle = 'Add Rule';
    $scope.addRuleAction = action;
    $scope.deselectAllRules();
  };

  $scope.openEditRuleModal = function(action, index) {
    $scope.addRuleModalTitle = 'Edit Rule';
    $scope.addRuleAction = action;

    $scope.addRuleActionIndex = index;
    var rule = $scope.interactiveRulesets[action][index];
    $scope.addRuleActionRule = rule.rule;
    $scope.addRuleActionName = rule.name;
    $scope.addRuleActionInputs = rule.inputs;
    $scope.addRuleActionDest = rule.dest;
    $scope.addRuleActionDestNew = '';
    $scope.addRuleActionFeedback = rule.feedback;
    $scope.addRuleActionParamChanges = rule.paramChanges;
  };

  $scope.saveRuleset = function(action, ruleset) {
    if (!$scope.interactiveRulesets.hasOwnProperty(action)) {
      $scope.interactiveRulesets[action] = [];
    }

    var rules = $scope.interactiveRulesets[action];
    if ($scope.addRuleActionIndex !== null) {
      rules[$scope.addRuleActionIndex] = ruleset;
    } else {
      rules.splice(rules.length - 1, 0, ruleset);
    }

    $('#addRuleModal').modal('hide');

    $scope.saveInteractiveWidget();
  };

  $scope.saveRulesetWithNewDest = function(action, ruleset, dest) {
    ruleset['dest'] = dest.id;
    $scope.saveRuleset(action, ruleset);
  };

  $scope.saveRule = function(rule, name, inputs, dest, newDest, feedback) {
    if (rule) {
      var ruleset = {
        rule: rule,
        name: name,
        inputs: inputs,
        dest: dest,
        feedback: feedback
      };

      // TODO(sll): Do more error-checking here.
      if (dest === '?') {
        // The user has added a new state.
        if (!newDest) {
          warningsData.addWarning('Error: destination state is empty.');
        } else if ($scope.convertDestToId(newDest, true)) {
          // The new state already exists.
          ruleset.dest = $scope.convertDestToId(newDest);
        } else {
          ruleset.dest = newDest;
          $scope.addState(
              $scope.addRuleActionDestNew,
              $scope.saveRulesetWithNewDest.bind(null, $scope.addRuleAction, ruleset));
          return;
        }
      }

      $scope.saveRuleset($scope.addRuleAction, ruleset);
    }

    $scope.addRuleAction = null;
    $scope.deselectAllRules();
  };

  $scope.swapRules = function(action, index1, index2) {
    $scope.tmpRule = $scope.interactiveRulesets[action][index1];
    $scope.interactiveRulesets[action][index1] =
        $scope.interactiveRulesets[action][index2];
    $scope.interactiveRulesets[action][index2] = $scope.tmpRule;

    $scope.saveInteractiveWidget();
  };

  $scope.deleteRule = function(action, index) {
    $scope.interactiveRulesets[action].splice(index, 1);
    $scope.saveInteractiveWidget();
  };

  $scope.convertDestToId = function(destName, hideWarnings) {
    if (!destName) {
      warningsData.addWarning('Please choose a destination.');
      return;
    }

    var destId = '';

    var found = false;
    if (destName.toUpperCase() == END_DEST) {
      found = true;
      destId = END_DEST;
    } else {
      // Find the id in states.
      for (var id in $scope.states) {
        if ($scope.states[id].name == destName) {
          found = true;
          destId = id;
          break;
        }
      }
    }

    if (!found && !hideWarnings) {
      warningsData.addWarning('Invalid destination name: ' + destName);
      return;
    }

    return destId;
  };

  $('#interactiveWidgetModal').on('hide', function() {
    // Reload the iframe.
    var F = $('#interactiveWidgetRepository');
    F[0].src = F[0].src;
  });

  $scope.saveWidgetParams = function() {
    $scope.generateWidgetPreview(
        $scope.interactiveWidget.id, $scope.interactiveParams);
    $scope.saveInteractiveWidget();
  };

  // Receive messages from the widget repository.
  $scope.$on('message', function(event, arg) {
    $scope.addContentToIframe('interactiveWidgetPreview', arg.data.raw);
    $('#interactiveWidgetModal').modal('hide');
    if ($scope.interactiveWidget.id != arg.data.widget.id) {
      $scope.interactiveWidget = arg.data.widget;
      $scope.interactiveParams = $scope.interactiveWidget.params;
      $scope.interactiveRulesets = {'submit': [{
        'rule': 'Default',
        'name': '',
        'inputs': {},
        'dest': $scope.stateId,
        'feedback': [],
        'paramChanges': []
      }]};
    }
    $scope.saveInteractiveWidget();
  });

  $scope.saveInteractiveWidget = function() {
    explorationData.saveStateData($scope.stateId, {
        // The backend actually just saves the id of the widget.
        'interactive_widget': $scope.interactiveWidget.id,
        'interactive_params': $scope.interactiveParams,
        'interactive_rulesets': $scope.interactiveRulesets
    });
  };

  $scope.deleteUnresolvedAnswer = function(answer) {
    $scope.unresolvedAnswers[answer] = 0;
    explorationData.saveStateData($scope.stateId, {
      'unresolved_answers': $scope.unresolvedAnswers,
    });
    $scope.generateUnresolvedAnswersMap();
  };

  $scope.saveStickyInteractiveWidget = function() {
    explorationData.saveStateData($scope.stateId, {
      'sticky_interactive_widget': $scope.stickyInteractiveWidget
    });
  };
}

InteractiveWidgetPreview.$inject = ['$scope', '$http', '$compile', 'warningsData', 'explorationData'];
