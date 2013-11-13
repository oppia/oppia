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
 * @fileoverview Controllers for a state's interactive widget editor.
 *
 * @author sll@google.com (Sean Lip)
 */

function InteractiveWidgetEditor($scope, $http, $modal, warningsData, explorationData, requestCreator) {
  // Tests whether an object is a JavaScript array.
  $scope.isArray = function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  $scope.generateWidgetPreview = function(widgetId, customizationArgs, successCallback) {
    $http.post(
        '/widgets/interactive/' + widgetId,
        requestCreator.createRequest({
          customization_args: customizationArgs
        }),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
      $scope.interactiveWidget = widgetData.widget;
      $scope.addContentToIframeWithId(
          'interactiveWidgetPreview', $scope.interactiveWidget.raw);
      if (successCallback) {
        successCallback();
      }
    }).error(function(errorData) {
      warningsData.addWarning(errorData.error);
    });
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
    // the corresponding handler name and the value has several keys:
    // - 'description' (the rule description string)
    // - 'inputs' (a list of parameters)
    // - 'name' (stuff needed to build the Python classifier code)
    // - 'dest' (the destination for this rule)
    // - 'feedback' (any feedback given for this rule)
    // - 'paramChanges' (parameter changes associated with this rule)
    $scope.widgetHandlers = {};
    for (var i = 0; i < data.widget.handlers.length; i++) {
      $scope.widgetHandlers[data.widget.handlers[i].name] = (
          data.widget.handlers[i].rule_specs);
    }
    $scope.widgetSticky = data.widget.sticky;
    $scope.generateWidgetPreview(data.widget.id, data.widget.customization_args);

    $scope.unresolvedAnswers = data.unresolved_answers;
    $scope.generateUnresolvedAnswersMap();
  };

  $scope.$on('stateEditorInitialized', function(event, stateId) {
    $scope.stateId = stateId;
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
  });

  $scope.getCustomizationArgs = function() {
    // Returns a dict mapping param names to customization args.
    var customizationArgs = {};
    for (var param in $scope.interactiveWidget.params) {
      customizationArgs[param] = $scope.interactiveWidget.params[param].customization_args;
    }
    return customizationArgs;
  };

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

  // Returns a list of all states, as well as an 'Add New State' option.
  $scope.getAllDests = function() {
    var result = $scope.getAllStates();
    result.push('?');
    return result;
  };

  $scope.getRules = function(handlerName) {
    if (!handlerName || !$scope.interactiveWidget) {
      return;
    }
    var wHandlers = $scope.interactiveWidget.handlers;
    for (var i = 0; i < wHandlers.length; i++) {
      if (wHandlers[i].name == handlerName) {
        ruleDict = {};
        for (var description in wHandlers[i].rules) {
          ruleDict[description] = wHandlers[i].rules[description].classifier;
        }
        return ruleDict;
      }
    }
  };

  $scope.deselectAllRules = function() {
    $scope.tmpRule = {
      index: null,
      description: null,
      name: null,
      inputs: {},
      dest: null,
      destNew: '',
      feedback: [],
      paramChanges: null
    };
  };

  $scope.openAddRuleModal = function(handlerName) {
    $scope.ruleModalHandlerName = handlerName;
    $scope.deselectAllRules();
    $scope.showRuleEditorModal('Add Rule');
  };

  $scope.openEditRuleModal = function(handlerName, index) {
    $scope.ruleModalHandlerName = handlerName;

    var rule = $scope.widgetHandlers[handlerName][index];
    $scope.tmpRule = {
      index: index,
      description: rule.description,
      // TODO(sll): Generalize these to Boolean combinations of rules.
      name: rule.definition.name,
      inputs: rule.definition.inputs,
      dest: rule.dest,
      destNew: '',
      feedback: rule.feedback,
      paramChanges: rule.paramChanges
    };
    $scope.showRuleEditorModal('Edit Rule');
  };

  $scope.showRuleEditorModal = function(modalTitle) {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/ruleEditor',
      backdrop: 'static',
      resolve: {
        modalTitle: function() {
          return modalTitle;
        },
        tmpRule: function() {
          return $scope.tmpRule;
        },
        handlerName: function() {
          return $scope.ruleModalHandlerName;
        },
        existingRules: function() {
          return $scope.getRules($scope.ruleModalHandlerName);
        },
        choices: function() {
          return $scope.interactiveWidget.params.choices;
        },
        allDests: function() {
          return $scope.getAllDests();
        },
        states: function() {
          return $scope.states;
        },
        stateId: function() {
          return $scope.stateId;
        }
      },
      controller: function($scope, $modalInstance, modalTitle, tmpRule,
            handlerName, existingRules, choices, allDests, states, stateId) {
        $scope.modalTitle = modalTitle;
        $scope.tmpRule = tmpRule;
        $scope.handlerName = handlerName;
        $scope.existingRules = existingRules;
        // TODO(sll): Remove this special-casing.
        $scope.choices = choices;
        $scope.allDests = allDests;
        $scope.states = states;
        $scope.stateId = stateId;

        $scope.resetTmpRule = function() {
          $scope.tmpRule = {
            index: null,
            description: null,
            name: null,
            inputs: {},
            dest: null,
            destNew: '',
            feedback: [],
            paramChanges: null
          };
        };

        $scope.getRuleDescriptionFragments = function(input, choices) {
          if (!input) {
            return '';
          }
          var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
          var index = 0;

          var isMultipleChoice = (choices ? true : false);
          var finalInput = input;
          var iter = 0;
          while (true) {
            if (!input.match(pattern) || iter == 100) {
              break;
            }
            iter++;

            var varName = input.match(pattern)[1],
                varType = null;
            if (input.match(pattern)[2]) {
              varType = input.match(pattern)[2].substring(1);
            }
      
            var replacementHtml = '';
            if (isMultipleChoice) {
              replacementHtml = '<SELECT|' + varName + '>';
            } else if (varType == 'Set') {
              replacementHtml = '<LIST|' + varName + '>';
            } else {
              replacementHtml = '<INPUT|' + varName + '>';
            }
    
            finalInput = finalInput.replace(pattern, replacementHtml);
            input = input.replace(pattern, ' ');
            index++;
          }

          var finalInputArray = finalInput.split('<');
          var result = [];
          for (var i = 0; i < finalInputArray.length; i++) {
            var tmpVarName;
            if (finalInputArray[i].indexOf('SELECT') === 0) {
              finalInputArray[i] = finalInputArray[i].substr(7);
              tmpVarName = finalInputArray[i].substring(0, finalInputArray[i].indexOf('>'));
              finalInputArray[i] = finalInputArray[i].substr(tmpVarName.length + 1);
              result.push({'type': 'select', 'varName': tmpVarName});
            } else if (finalInputArray[i].indexOf('INPUT') === 0) {
              finalInputArray[i] = finalInputArray[i].substr(6);
              tmpVarName = finalInputArray[i].substring(0, finalInputArray[i].indexOf('>'));
              finalInputArray[i] = finalInputArray[i].substr(tmpVarName.length + 1);
              result.push({'type': 'input', 'varName': tmpVarName});
            } else if (finalInputArray[i].indexOf('LIST') === 0) {
              finalInputArray[i] = finalInputArray[i].substr(5);
              tmpVarName = finalInputArray[i].substring(0, finalInputArray[i].indexOf('>'));
              finalInputArray[i] = finalInputArray[i].substr(tmpVarName.length + 1);
              result.push({'type': 'list', 'varName': tmpVarName});
            }
            
            result.push({'type': 'html', 'text': finalInputArray[i]});
          }
          return result;
        };

        $scope.tmpRuleDescriptionFragments = [];
        $scope.$watch('tmpRule.description', function(newValue) {
          $scope.tmpRuleDescriptionFragments = $scope.getRuleDescriptionFragments(
            newValue, choices);
        });

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

        $scope.getExtendedChoiceArray = function(choices) {
          var result = [];
          for (var i = 0; i < choices.length; i++) {
            result.push({id: i, val: choices[i]});
          }
          return result;
        };

        $scope.selectRule = function(description, name) {
          $scope.tmpRule.description = description;
          $scope.tmpRule.name = name;
          $scope.tmpRule.dest = explorationData.stateId;
          $scope.tmpRule.destNew = '';

          // Finds the parameters and sets them in $scope.tmpRule.inputs.
          var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
          var copyOfRule = description;
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
              $scope.tmpRule.inputs[varName] = [];
            } else {
              $scope.tmpRule.inputs[varName] = '';
            }

            copyOfRule = copyOfRule.replace(pattern, ' ');
          }
        };

        $scope.save = function() {
          $modalInstance.close({tmpRule: tmpRule});
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }
    });

    modalInstance.result.then(function(result) {
      $scope.saveRule(result.tmpRule);
    }, function () {
      console.log('Rule editor modal dismissed.');
    });
  };

  $scope.saveExtendedRule = function(handlerName, extendedRule) {
    if (!$scope.widgetHandlers.hasOwnProperty(handlerName)) {
      $scope.widgetHandlers[handlerName] = [];
    }

    var rules = $scope.widgetHandlers[handlerName];
    if ($scope.tmpRule.index !== null) {
      rules[$scope.tmpRule.index] = extendedRule;
    } else {
      rules.splice(rules.length - 1, 0, extendedRule);
    }

    $scope.saveInteractiveWidget();
  };

  $scope.saveExtendedRuleWithNewDest = function(handlerName, extendedRule, destId) {
    extendedRule['dest'] = destId;
    $scope.saveExtendedRule(handlerName, extendedRule);
  };

  $scope.saveRule = function(tmpRule) {
    if (tmpRule.description) {
      var extendedRule = {
        description: tmpRule.description,
        definition: {
          rule_type: tmpRule.description == 'Default' ? 'default' : 'atomic',
          name: tmpRule.name,
          inputs: tmpRule.inputs,
          subject: 'answer'
        },
        dest: tmpRule.dest,
        feedback: tmpRule.feedback
      };

      // TODO(sll): Do more error-checking here.
      if (tmpRule.dest === '?') {
        // The user has added a new state.
        if (!tmpRule.destNew) {
          warningsData.addWarning('Error: destination state is empty.');
        } else if ($scope.convertDestToId(tmpRule.destNew, true)) {
          // The new state already exists.
          extendedRule.dest = $scope.convertDestToId(tmpRule.destNew);
        } else {
          extendedRule.dest = tmpRule.destNew;
          // Adds the new state, then saves the rule.
          $scope.addState(
              tmpRule.destNew,
              $scope.saveExtendedRuleWithNewDest.bind(
                  null, $scope.ruleModalHandlerName, extendedRule));
          return;
        }
      }

      $scope.saveExtendedRule($scope.ruleModalHandlerName, extendedRule);
    }

    $scope.ruleModalHandlerName = null;
    $scope.deselectAllRules();
  };

  $scope.getDefaultRule = function(handlerName) {
    var ruleset = $scope.widgetHandlers[handlerName];
    return ruleset[ruleset.length - 1];
  };

  $scope.swapRules = function(handlerName, index1, index2) {
    $scope.tmpRule = $scope.widgetHandlers[handlerName][index1];
    $scope.widgetHandlers[handlerName][index1] =
        $scope.widgetHandlers[handlerName][index2];
    $scope.widgetHandlers[handlerName][index2] = $scope.tmpRule;

    $scope.saveInteractiveWidget();
  };

  $scope.deleteRule = function(handlerName, index) {
    $scope.widgetHandlers[handlerName].splice(index, 1);
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

  window.addEventListener('message', function(evt) {
    if (evt.origin != window.location.protocol + '//' + window.location.host) {
      return;
    }

    if (event.data.hasOwnProperty('widgetHeight')) {
      console.log('Resize event received for widget preview.');
      console.log(evt.data);
      // Change the height of the included iframe.
      var height = parseInt(event.data.widgetHeight, 10) + 2;
      var iframe = document.getElementById('interactiveWidgetPreview');
      iframe.height = height + 'px';
    }
  }, false);

  $scope.deleteUnresolvedAnswer = function(answer) {
    $scope.unresolvedAnswers[answer] = 0;
    explorationData.saveStateData($scope.stateId, {
      'resolved_answers': [answer]
    });
    $scope.generateUnresolvedAnswersMap();
  };

  $scope.saveWidgetSticky = function() {
    explorationData.saveStateData($scope.stateId, {
      'widget_sticky': $scope.widgetSticky
    });
  };

  $scope.showCustomizeInteractiveWidgetModal = function(index) {
    warningsData.clear();
    var widgetParams = $scope.interactiveWidget.params;
    var modalInstance = $scope.$parent.getCustomizationModalInstance(
        $scope.interactiveWidget.id, widgetParams);

    modalInstance.result.then(function(result) {
      $scope.interactiveWidget.params = result.widgetParams;
      $scope.generateWidgetPreview(
          $scope.interactiveWidget.id, $scope.getCustomizationArgs(),
          $scope.saveInteractiveWidget);
      console.log('Interactive customization modal saved.');
    }, function() {
      console.log('Interactive customization modal dismissed.');
    });
  };

  $scope.showChooseInteractiveWidgetModal = function() {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/chooseInteractiveWidget',
      backdrop: 'static',
      resolve: {},
      controller: function($scope, $modalInstance) {
        // Receive messages from the exploration editor broadcast (these
        // messages originate from the widget repository).
        // TODO(sll): This results in a "Cannot read property '$$nextSibling'
        // of null" error in the exploration editor $broadcast. This error does
        // not seem to have any side effects, but we should try and fix it. Is
        // it because it is being triggered when a postMessage call happens?
        $scope.$on('message', function(evt, arg) {
          if (arg.origin != window.location.protocol + '//' + window.location.host) {
            return;
          }
          if (arg.data.widgetType && arg.data.widgetType == 'interactive') {
            $modalInstance.close(arg);
          }
        });

        $scope.cancel = function() {
          warningsData.clear();
          $modalInstance.dismiss('cancel');
        };
      }
    });

    modalInstance.result.then(function(arg) {
      if (!$scope.interactiveWidget || $scope.interactiveWidget.id != arg.data.widget.id) {
        $scope.interactiveWidget = arg.data.widget;
        // Preserve the old default rule.
        $scope.widgetHandlers['submit'] = [
            $scope.widgetHandlers['submit'][$scope.widgetHandlers['submit'].length - 1]
        ];
      }
      $scope.saveInteractiveWidget();
    }, function () {
      console.log('Choose interactive widget modal dismissed.');
    });
  };

  $scope.saveInteractiveWidget = function() {
    var customizationArgs = $scope.getCustomizationArgs();
    $scope.generateWidgetPreview(
        $scope.interactiveWidget.id, customizationArgs, function() {
          explorationData.saveStateData($scope.stateId, {
            'widget_id': $scope.interactiveWidget.id,
            'widget_customization_args': customizationArgs,
            'widget_handlers': $scope.widgetHandlers
          });
          $scope.updateStatesData();
          $scope.drawGraph();
        });
  };

  $scope.updateStatesData = function() {
    // Updates $scope.states from $scope.widgetHandlers.
    var stateDict = $scope.states[$scope.stateId];
    for (var i = 0; i < stateDict.widget.handlers.length; i++) {
      var handlerName = stateDict.widget.handlers[i].name;
      var ruleSpecs = $scope.widgetHandlers[handlerName];
      stateDict.widget.handlers[i].rule_specs = ruleSpecs;
    }
  };
}

InteractiveWidgetEditor.$inject = [
  '$scope', '$http', '$modal', 'warningsData', 'explorationData', 'requestCreator'
];
