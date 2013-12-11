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
 * @fileoverview Controllers for the graphical state editor.
 *
 * @author sll@google.com (Sean Lip)
 */

function StateEditor($scope, $http, $filter, $sce, $modal, explorationData,
                   warningsData, activeInputData, requestCreator) {

  $scope.$on('guiTabSelected', function(event, stateData) {
    $scope.stateName = stateData.name;
    $scope.content = stateData.content || [];
    $scope.stateParamChanges = stateData.param_changes || [];

    $scope.$broadcast('stateEditorInitialized', $scope.stateId);
    // TODO(sll): Why isn't this working?
    $scope.updateMath();

    console.log('Content updated.');
  });

  $scope.getIncomingStates = function(stateId) {
    var incomingStates = {},
        statesToRuleNames = {},
        otherStateId;

    for (otherStateId in $scope.states) {
      var handlers = $scope.states[otherStateId].widget.handlers;
      var widgetParams = $scope.states[otherStateId].widget.customization_args;
      for (var i = 0; i < handlers.length; i++) {
        for (var j = 0; j < handlers[i].rule_specs.length; j++) {
          if (handlers[i].rule_specs[j].dest == stateId) {
            incomingStates[otherStateId] = $scope.states[otherStateId];

            var previousChoices = null;
            if (widgetParams.hasOwnProperty('choices')) {
              previousChoices = widgetParams.choices;
            }

            var ruleName = $filter('parameterizeRuleDescription')(
                handlers[i].rule_specs[j], previousChoices);

            if (otherStateId in statesToRuleNames) {
              statesToRuleNames[otherStateId].push(ruleName);
            } else {
              statesToRuleNames[otherStateId] = [ruleName];
            }
          }
        }
      }
    }

    for (otherStateId in incomingStates) {
      incomingStates[otherStateId].rules = statesToRuleNames[otherStateId];
    }
    return incomingStates;
  };

  // This should only be non-null when the state name editor is open.
  $scope.stateNameMemento = null;

  $scope.openStateNameEditor = function() {
    $scope.stateNameMemento = $scope.stateName;
  };

  $scope.saveStateName = function(stateName) {
    stateName = $scope.normalizeWhitespace(stateName);
    if (!$scope.isValidEntityName(stateName, true)) {
      return;
    }
    if ($scope.isDuplicateInput(
            $scope.states, 'name', $scope.stateId, stateName)) {
      warningsData.addWarning(
          'The name \'' + stateName + '\' is already in use.');
      return;
    }

    if ($scope.stateNameMemento !== stateName) {
      $scope.addStateChange(
          'state_name',
          ['stateName', 'states.' + $scope.stateId + '.name'],
          stateName,
          $scope.stateNameMemento
      );
      $scope.stateName = stateName;
    }

    $scope.stateNameMemento = null;
  };

  // This should only be non-null when the content editor is open.
  $scope.contentMemento = null;

  $scope.editContent = function() {
    $scope.contentMemento = angular.copy($scope.content);
  };

  $scope.saveTextContent = function() {
    $scope.$apply();
    if ($scope.contentMemento !== $scope.content) {
      // The $apply() call seems to be needed in order to ensure that the latest
      // values from the RTE are captured.
      // TODO(sll): Do we need to update math?
      $scope.addStateChange(
          'content',
          ['content'],
          angular.copy($scope.content),
          angular.copy($scope.contentMemento)
      );
    }
    $scope.contentMemento = null;
  };

  $scope.getCustomizationModalInstance = function(widgetId, widgetParams) {
    // NB: This method is used for interactive widgets.
    return $modal.open({
      templateUrl: 'modals/customizeWidget',
      backdrop: 'static',
      resolve: {
        widgetId: function() {
          return widgetId;
        },
        widgetParams: function() {
          return widgetParams;
        }
      },
      controller: function($scope, $http, $modalInstance, widgetId, widgetParams, warningsData, requestCreator) {
        $scope.widgetId = widgetId;
        $scope.widgetParams = widgetParams;

        $http.post(
            '/widgets/interactive/' + widgetId,
            requestCreator.createRequest({
              'customization_args': {}
            }),
            {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
                success(function(data) {
                  $scope.paramDescriptions = {};
                  for (var paramName in data.widget.params) {
                    $scope.paramDescriptions[paramName] = data.widget.params[paramName].description;
                  }
                }).error(function(data) {
                  warningsData.addWarning(
                      'Error: Failed to obtain widget parameter descriptions.');
                });

        $scope.save = function(widgetParams) {
          $scope.$broadcast('externalSave');
          $modalInstance.close({
            widgetParams: widgetParams
          });
        };
      }
    });
  };

  $scope.saveStateParamChanges = function(newValue, oldValue) {
    if (!angular.equals(newValue, oldValue)) {
      $scope.addStateChange(
          'param_changes', ['stateParamChanges'], newValue, oldValue);
    }
  };

  $scope.PROPERTY_CHANGE_SUMMARIES = {
    // In future these will be elaborated to describe the changes made to each
    // state property.
    'state_name': {
      'saveStateModalFormat': function(newValue, oldValue) {
        return 'State name';
      },
      'versionLogFormat': function(newValue, oldValue) {
        return 'state name';
      }
    },
    'param_changes': {
      'saveStateModalFormat': function(newValue, oldValue) {
        return 'Parameter changes';
      },
      'versionLogFormat': function(newValue, oldValue) {
        return 'parameter changes';
      }
    },
    'content': {
      'saveStateModalFormat': function(newValue, oldValue) {
        return 'Content';
      },
      'versionLogFormat': function(newValue, oldValue) {
        return 'content';
      }
    },
    'widget_id': {
      'saveStateModalFormat': function(newValue, oldValue) {
        return 'Interaction type';
      },
      'versionLogFormat': function(newValue, oldValue) {
        return 'interaction type';
      }
    },
    'widget_customization_args': {
      'saveStateModalFormat': function(newValue, oldValue) {
        return 'Interaction customizations';
      },
      'versionLogFormat': function(newValue, oldValue) {
        return 'interaction customizations';
      }
    },
    'widget_sticky': {
      'saveStateModalFormat': function(newValue, oldValue) {
        return 'Whether to reuse the previous interaction'
      },
      'versionLogFormat': function(newValue, oldValue) {
        return 'whether to reuse the previous interaction'
      }
    },
    'widget_handlers': {
      'saveStateModalFormat': function(newValue, oldValue) {
        return 'Reader submission rules';
      },
      'versionLogFormat': function(newValue, oldValue) {
        return 'reader submission rules';
      }
    }
  };

  $scope.getPropertyChangeSummary = function(
      propertyName, format, values) {
    return $scope.PROPERTY_CHANGE_SUMMARIES[propertyName][format](
      values['newValue'], values['oldValue']);
  };

  $scope.createStateChangeSummary = function() {
    // This ensures the property changes are listed in the same order as 
    // properties appear on the webpage.
    var changes = {};
    for (property in $scope.PROPERTY_CHANGE_SUMMARIES) {
      changes[property] = null;
    }

    //Identifies the net changes made to each property
    for (var i = 0; i < $scope.stateChangeList.length; i++) {
      var stateChange = $scope.stateChangeList[i];
      if (changes[stateChange['backendName']] === null) {
        changes[stateChange['backendName']] = {
          'newValue': stateChange['newValue'],
          'oldValue': stateChange['oldValue']
        };
      } else {
        changes[stateChange['backendName']]['newValue'] = (
          stateChange['newValue']);
      }
    }

    var changesExist = false;
    var saveStateModalSummary = [];
    var versionLogSummaryArrary = [];

    //The summary displayed in the save confirmation dialogue
    for (property in changes) {
      if (changes[property] !== null) {
        if (JSON.stringify(changes[property]['newValue']) !==
            JSON.stringify(changes[property]['oldValue'])) {
          changesExist = true;
          saveStateModalSummary.push(
            $scope.getPropertyChangeSummary(
              property, 'saveStateModalFormat', changes[property]));
          versionLogSummaryArrary.push(
            $scope.getPropertyChangeSummary(
              property, 'versionLogFormat', changes[property]));
        }
      }
    }

    //The summary included in the commit message
    if (changesExist) {
      var versionLogSummary = 'Changes have been made to these properties of ' +
        'state \'' + $scope.stateName + '\': ' + 
        versionLogSummaryArrary.join(", ") + ".";
    } else {
      var versionLogSummary = '';
    }

    return {
      'changesExist': changesExist,
      'saveStateModalFormat': saveStateModalSummary,
      'versionLogFormat': versionLogSummary
    };
  };
 
  $scope.showSaveStateModal = function() {
    //Create the save-confirmation and commit-message request dialogue.
    if (!$scope.isPublic) {
      // For unpublished explorations no commit message is needed
      $scope.saveStateChanges('');
    } else {
      warningsData.clear();
      $scope.stateChangeSummary = $scope.createStateChangeSummary();
      if (!$scope.stateChangeSummary['changesExist']) {
        warningsData.addWarning('Your changes all cancel each other out, ' +
          'so nothing has been saved.');
      } else {
        var modalInstance = $modal.open({
          templateUrl: 'modals/saveState',
          backdrop: 'static',
          resolve: {
            stateChangeSummary: function() {
              return $scope.stateChangeSummary;
            }
          },
          controller: function($scope, $modalInstance, stateChangeSummary) {
            $scope.stateChangeSummary = (
              stateChangeSummary['saveStateModalFormat']);
            $scope.neatJoin = function(string1, string2) {
              if(string1.slice(-1) === "." || string1.slice(-1) === "!" || 
                  string1.slice(-1) === "?") {
                return string1 + " " + string2;
              } else {
                return string1 + ". " + string2;
              }
            };
            $scope.publish = function(commitMessage) {
              $modalInstance.close(
                $scope.neatJoin(
                  commitMessage, stateChangeSummary['versionLogFormat']));
            };
            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              warningsData.clear();
            };
          }
        });

        modalInstance.result.then(function(commitMessage) {
          $scope.saveStateChanges(commitMessage);
        }, function () {
          console.log('Save state modal dismissed.');
        });
      }        
    }
  };
}

StateEditor.$inject = ['$scope', '$http', '$filter', '$sce', '$modal',
    'explorationData', 'warningsData', 'activeInputData', 'requestCreator'];
