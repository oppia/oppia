// Copyright 2014 The Oppia Authors. All Rights Reserved.
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

function InteractiveWidgetEditor($scope, $http, $modal, $log, warningsData, oppiaRequestCreator, editorContextService) {
  // Variables storing specifications for the widget parameters and possible
  // rules.
  $scope.widgetHandlerSpecs = [];

  // Declare dummy submitAnswer() and adjustPageHeight() methods for the widget
  // preview.
  $scope.submitAnswer = function(answer, handler) {};
  $scope.adjustPageHeight = function(scroll) {};

  $scope.generateWidgetPreview = function(widgetId, customizationArgs, successCallback) {
    $http.post(
        '/widgets/interactive/' + widgetId,
        oppiaRequestCreator.createRequest({customization_args: customizationArgs}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      $scope.widgetHandlerSpecs = data.widget.handlers;

      $scope.widgetId = data.widget.widget_id;
      $scope.widgetCustomizationArgs = data.widget.customization_args;

      $scope.widgetPreviewHtml = data.widget.tag;
      if (successCallback) {
        successCallback();
      }
    }).error(function(errorData) {
      warningsData.addWarning(errorData.error);
    });
  };

  $scope.initInteractiveWidget = function(data) {
    $scope.resetInteractiveWidgetEditor();

    if (!editorContextService.isInStateContext()) {
      $log.error('Attempted to open interactive widget editor outside a state context.');
      return;
    }

    $scope.stateName = editorContextService.getActiveStateName();

    // Stores rules in the form of key-value pairs. For each pair, the key is
    // the corresponding handler name and the value has several keys:
    // - 'definition' (the rule definition)
    // - 'description' (the rule description string)
    // - 'dest' (the destination for this rule)
    // - 'feedback' (list of feedback given for this rule)
    // - 'param_changes' (parameter changes associated with this rule)
    $scope.widgetHandlers = {};
    for (var i = 0; i < data.widget.handlers.length; i++) {
      $scope.widgetHandlers[data.widget.handlers[i].name] = (
          data.widget.handlers[i].rule_specs);
    }
    $scope.widgetSticky = data.widget.sticky;

    $scope.generateWidgetPreview(data.widget.widget_id, data.widget.customization_args);
  };

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.initInteractiveWidget(stateData);
  });

  // Returns a list of all states, as well as 'END' and 'Add New State' options.
  $scope.getAllDests = function() {
    var allStates = [];
    for (var state in $scope.states) {
      allStates.push(state);
    }

    allStates.push(END_DEST);
    allStates.push('?');
    return allStates;
  };

  $scope.getRules = function(handlerName) {
    if (!handlerName || !$scope.widgetId) {
      return;
    }
    for (var i = 0; i < $scope.widgetHandlerSpecs.length; i++) {
      if ($scope.widgetHandlerSpecs[i].name == handlerName) {
        ruleDict = {};
        for (var description in $scope.widgetHandlerSpecs[i].rules) {
          ruleDict[description] = $scope.widgetHandlerSpecs[i].rules[description].classifier;
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
      param_changes: []
    };
  };

  $scope.openAddRuleModal = function(handlerName) {
    $scope.ruleModalHandlerName = handlerName;
    $scope.deselectAllRules();
    $scope.showRuleEditorModal('Add Rule');
  };

  $scope.openEditRuleModal = function(handlerName, index) {
    $scope.ruleModalHandlerName = handlerName;

    var rule = angular.copy($scope.widgetHandlers[handlerName][index]);
    $scope.tmpRule = {
      index: index,
      description: rule.description,
      // TODO(sll): Generalize the rule definition to allow Boolean combinations
      // of rules.
      name: rule.definition.name,
      inputs: rule.definition.inputs,
      dest: rule.dest,
      destNew: '',
      feedback: rule.feedback,
      param_changes: rule.param_changes
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
        widgetCustomizationArgs: function() {
          return $scope.widgetCustomizationArgs;
        },
        allDests: function() {
          return $scope.getAllDests();
        },
        states: function() {
          return $scope.states;
        },
        stateName: function() {
          return $scope.stateName;
        }
      },
      controller: [
        '$scope', '$modalInstance', 'modalTitle', 'tmpRule', 'handlerName',
        'existingRules', 'widgetCustomizationArgs', 'allDests', 'states', 'stateName',
        function($scope, $modalInstance, modalTitle, tmpRule,
            handlerName, existingRules, widgetCustomizationArgs, allDests, states, stateName) {
          $scope.modalTitle = modalTitle;
          $scope.tmpRule = tmpRule;
          $scope.handlerName = handlerName;
          $scope.existingRules = existingRules;
          $scope.widgetCustomizationArgs = widgetCustomizationArgs;
          $scope.allDests = allDests;
          $scope.states = states;
          $scope.stateName = stateName;

          $scope.UNICODE_STRING_LIST_INIT_ARGS = {
            'objType': 'UnicodeString'
          };

          $scope.FEEDBACK_LIST_INIT_ARGS = {
            'objType': 'Html',
            'addItemText': 'Add feedback message'
          };

          $scope.resetTmpRule = function() {
            $scope.tmpRule = {
              index: null,
              description: null,
              name: null,
              inputs: {},
              dest: null,
              destNew: '',
              feedback: [],
              param_changes: []
            };
          };

          $scope.tmpRuleDescriptionFragments = [];
          $scope.$watch('tmpRule.description', function(newValue) {
            if (!newValue) {
              return;
            }

            var pattern = /\{\{\s*(\w+)\s*\|\s*(\w+)\s*\}\}/;

            var finalInputArray = newValue.split(pattern);
            if (finalInputArray.length % 3 !== 1) {
              $log.error('Could not process rule description.');
            }

            var result = [];
            // TODO(sll): Remove this special-casing.
            var isMultipleChoice = Boolean($scope.widgetCustomizationArgs.choices);
            for (var i = 0; i < finalInputArray.length; i += 3) {
              result.push({'type': 'noneditable', 'text': finalInputArray[i]});
              if (i == finalInputArray.length - 1) {
                break;
              }

              if (isMultipleChoice) {
                result.push({'type': 'select', 'varName': finalInputArray[i+1]});
              } else {
                result.push({
                  'type': finalInputArray[i+2],
                  'varName': finalInputArray[i+1]
                });
              }
            }
            $scope.tmpRuleDescriptionFragments = result;
          });

          $scope.getDestName = function(stateName) {
            return (
                stateName === '?'              ? 'Add New State...' :
                stateName === $scope.stateName ? stateName + ' ⟳' :
                stateName
            );
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
            $scope.tmpRule.dest = editorContextService.getActiveStateName();
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
            $scope.$broadcast('externalSave');
            $modalInstance.close({tmpRule: tmpRule});
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }
      ]
    });

    modalInstance.result.then(function(result) {
      $scope.saveRule(result.tmpRule);
    });
  };

  $scope.saveRule = function(tmpRule) {
    if (tmpRule.description) {
      var extendedRule = {
        description: tmpRule.description,
        definition: {
          rule_type: tmpRule.description == 'Default' ? 'default' : 'atomic',
          name: tmpRule.name,
          inputs: tmpRule.inputs
        },
        dest: tmpRule.dest,
        feedback: tmpRule.feedback,
        param_changes: []
      };

      if (extendedRule.definition.rule_type === 'atomic') {
        extendedRule.definition.subject = 'answer';
      }

      // TODO(sll): Do more error-checking here.
      if (tmpRule.dest === '?') {
        // The user has added a new state.
        if (!tmpRule.destNew) {
          warningsData.addWarning('Error: destination state is empty.');
        } else if (
            $scope.$parent.states.hasOwnProperty(tmpRule.destNew) ||
            tmpRule.destNew == END_DEST) {
          // The new state already exists.
          extendedRule.dest = tmpRule.destNew;
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

  $scope.saveExtendedRule = function(handlerName, extendedRule) {
    var widgetHandlersMemento = angular.copy($scope.widgetHandlers);

    if (!$scope.widgetHandlers.hasOwnProperty(handlerName)) {
      $scope.widgetHandlers[handlerName] = [];
    }

    var rules = $scope.widgetHandlers[handlerName];
    if ($scope.tmpRule.index !== null) {
      rules[$scope.tmpRule.index] = extendedRule;
    } else {
      rules.splice(rules.length - 1, 0, extendedRule);
    }

    $scope.saveWidgetHandlers($scope.widgetHandlers, widgetHandlersMemento);
  };

  $scope.saveExtendedRuleWithNewDest = function(handlerName, extendedRule, destId) {
    extendedRule['dest'] = destId;
    $scope.saveExtendedRule(handlerName, extendedRule);
  };

  $scope.swapRules = function(handlerName, index1, index2) {
    var widgetHandlersMemento = angular.copy($scope.widgetHandlers);

    $scope.tmpRule = $scope.widgetHandlers[handlerName][index1];
    $scope.widgetHandlers[handlerName][index1] =
        $scope.widgetHandlers[handlerName][index2];
    $scope.widgetHandlers[handlerName][index2] = $scope.tmpRule;

    $scope.saveWidgetHandlers($scope.widgetHandlers, widgetHandlersMemento);
  };

  $scope.deleteRule = function(handlerName, index) {
    var widgetHandlersMemento = angular.copy($scope.widgetHandlers);
    $scope.widgetHandlers[handlerName].splice(index, 1);
    $scope.saveWidgetHandlers($scope.widgetHandlers, widgetHandlersMemento);
  };

  $scope.isRuleConfusing = function(rule) {
    return rule.feedback.length === 0 && rule.dest === editorContextService.getActiveStateName();
  };

  $scope.getCssClassForRule = function(rule) {
    return $scope.isRuleConfusing(rule) ? 'oppia-rule-bubble-warning' : 'oppia-rule-bubble';
  };

  $scope.toggleWidgetSticky = function() {
    $scope.addStateChange('widget_sticky', $scope.widgetSticky, !$scope.widgetSticky);
    var activeStateName = editorContextService.getActiveStateName();
    $scope.states[activeStateName].widget.sticky = $scope.widgetSticky;
  };

  $scope.interactiveWidgetRepository = null;

  $scope.showInteractiveWidgetEditor = function() {
    warningsData.clear();

    if (!$scope.interactiveWidgetRepository) {
      // Initializes the widget list using data from the server.
      $http.get('/widgetrepository/data/interactive').success(function(data) {
        $scope.interactiveWidgetRepository = data.widgetRepository;
        for (var category in $scope.interactiveWidgetRepository) {
          for (var i = 0; i < $scope.interactiveWidgetRepository[category].length; i++) {
            if ($scope.interactiveWidgetRepository[category][i].widget_id == $scope.widgetId) {
              $scope.tmpWidget = $scope.interactiveWidgetRepository[category][i];
              $scope.tmpWidget.customization_args = angular.copy($scope.widgetCustomizationArgs);
              $scope.tmpWidget.tag = $scope.widgetPreviewHtml;
              break;
            }
          }
        }
      });
    }

    $scope.interactiveWidgetEditorIsShown = true;
    $scope.widgetIdMemento = $scope.widgetId;
    $scope.widgetCustomizationArgsMemento = angular.copy($scope.widgetCustomizationArgs);
    $scope.widgetHandlersMemento = angular.copy($scope.widgetHandlers);

    for (var category in $scope.interactiveWidgetRepository) {
      for (var i = 0; i < $scope.interactiveWidgetRepository[category].length; i++) {
        if ($scope.interactiveWidgetRepository[category][i].widget_id == $scope.widgetId) {
          $scope.tmpWidget = $scope.interactiveWidgetRepository[category][i];
          $scope.tmpWidget.customization_args = angular.copy($scope.widgetCustomizationArgs);
          $scope.tmpWidget.tag = $scope.widgetPreviewHtml;
          break;
        }
      }
    }
  };

  $scope.selectInteractiveWidget = function(tmpWidget) {
    $scope.$broadcast('externalSave');

    var newWidget = $scope.cloneObject(tmpWidget);

    if (!angular.equals(newWidget.widget_id, $scope.widgetIdMemento)) {
      $scope.widgetId = angular.copy(newWidget.widget_id);
      $scope.addStateChange('widget_id', $scope.widgetId, $scope.widgetIdMemento);

      // Change the widget handlers, but preserve the old default rule.
      $scope.widgetHandlers = {
        'submit': [$scope.widgetHandlers['submit'][$scope.widgetHandlers['submit'].length - 1]]
      };
      $scope.addStateChange('widget_handlers', $scope.widgetHandlers, $scope.widgetHandlersMemento);
    }

    if (!angular.equals(newWidget.customization_args, $scope.widgetCustomizationArgsMemento)) {
      $scope.widgetCustomizationArgs = angular.copy(newWidget.customization_args);
      $scope.addStateChange(
        'widget_customization_args', $scope.widgetCustomizationArgs,
        $scope.widgetCustomizationArgsMemento
      );
    }

    $scope.generateWidgetPreview($scope.widgetId, $scope.widgetCustomizationArgs);
    $scope.updateStatesData();
    $scope.drawGraph();

    var activeStateName = editorContextService.getActiveStateName();
    $scope.states[activeStateName].widget.widget_id = $scope.widgetId;
    $scope.states[activeStateName].widget.customization_args = angular.copy(
      $scope.widgetCustomizationArgs);

    $scope.resetInteractiveWidgetEditor();
  };

  $scope.generateTmpWidgetPreview = function() {
    $scope.tmpWidget.tag = 'Loading...';
    $http.post(
        '/widgets/interactive/' + $scope.tmpWidget.widget_id,
        oppiaRequestCreator.createRequest({
          customization_args: $scope.tmpWidget.customization_args
        }),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      $scope.tmpWidget.tag = data.widget.tag;
    });
  };

  $scope.setNewTmpWidget = function(widget) {
    $scope.tmpWidget = angular.copy(widget);
  };

  $scope.resetInteractiveWidgetEditor = function() {
    $scope.interactiveWidgetEditorIsShown = false;
    $scope.tmpWidget = null;
    $scope.widgetIdMemento = null;
    $scope.widgetCustomizationArgsMemento = null;
    $scope.widgetHandlersMemento = null;
  };

  $scope.saveWidgetHandlers = function(newHandlers, oldHandlers) {
    if (!angular.equals(newHandlers, oldHandlers)) {
      $scope.addStateChange(
        'widget_handlers', angular.copy(newHandlers), angular.copy(oldHandlers));
      $scope.updateStatesData();
      $scope.drawGraph();
    }
  };

  $scope.updateStatesData = function() {
    // Updates $scope.states from $scope.widgetHandlers.
    var activeStateName = editorContextService.getActiveStateName();
    var stateDict = $scope.states[activeStateName];
    for (var i = 0; i < stateDict.widget.handlers.length; i++) {
      var handlerName = stateDict.widget.handlers[i].name;
      stateDict.widget.handlers[i].rule_specs = $scope.widgetHandlers[handlerName];
    }
  };
}

InteractiveWidgetEditor.$inject = [
  '$scope', '$http', '$modal', '$log', 'warningsData', 'oppiaRequestCreator', 'editorContextService'
];
