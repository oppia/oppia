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

function GuiEditor($scope, $http, $filter, $sce, $modal, explorationData,
                   warningsData, activeInputData, requestCreator) {

  $scope.$on('guiTabSelected', function(event, stateData) {
    $scope.stateName = stateData.name;
    $scope.content = stateData.content || [];
    $scope.stateParamChanges = stateData.param_changes || [];
    $scope.initAllWidgets();

    $scope.$broadcast('stateEditorInitialized', $scope.stateId);
    // TODO(sll): Why isn't this working?
    $scope.updateMath();

    console.log('Content updated.');
  });

  $scope.initAllWidgets = function(index) {
    for (var i = 0; i < $scope.content.length; i++) {
      if ($scope.content[i].type == 'widget' && $scope.content[i].value) {
        $scope.initWidget(i);
      }
    }
  };

  $scope.initWidget = function(index) {
    var widget = JSON.parse($scope.content[index].value);

    var customization_args = {};
    for (var param in widget.params) {
      customization_args[param] = widget.params[param].customization_args;
    }

    $http.post(
      '/widgets/noninteractive/' + widget.id + '?parent_index=' + index,
      requestCreator.createRequest({
        customization_args: customization_args,
        state_params: $scope.stateParamChanges
      }),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
      $scope.addContentToIframeWithId(
          'widgetPreview' + widgetData.parent_index, widgetData.widget.raw);
    });
  };

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

  $scope.saveStateName = function() {
    $scope.stateName = $scope.normalizeWhitespace($scope.stateName);
    if (!$scope.isValidEntityName($scope.stateName, true))
      return;
    if ($scope.isDuplicateInput(
            $scope.states, 'name', $scope.stateId, $scope.stateName)) {
      warningsData.addWarning(
          'The name \'' + $scope.stateName + '\' is already in use.');
      return;
    }

    $scope.states[$scope.stateId].name = $scope.stateName;
    $scope.drawGraph();

    explorationData.saveStateData(
        $scope.stateId, {'state_name': $scope.stateName});
    activeInputData.clear();
  };

  // TODO(sll): Replace this with a link to code.google.com documentation.
  $scope.defaultTextContent = (
      'Click \'Edit\' to enter text here. Text enclosed in dollar signs ' +
      'will be displayed as $LaTeX$. To write a non-LaTeXed dollar sign, ' +
      'type a single backslash (\'\\\') followed by \'$\'. For more ' +
      'information about LaTeX, see ' +
      'http://web.ift.uib.no/Teori/KURS/WRK/TeX/symALL.html');

  $scope.saveTextContent = function() {
    // This seems to be needed in order to ensure that the latest values from
    // the RTE are captured.
    // TODO(sll): Do we need to update math?
    $scope.$apply();
    $scope.saveStateContent();
    activeInputData.name = '';
  };

  $scope.saveStateContent = function() {
    explorationData.saveStateData($scope.stateId, {'content': $scope.content});
  };

  $scope.addContent = function(contentType) {
    if (contentType == 'text') {
      $scope.content.push({type: 'text', value: ''});
    } else if (contentType == 'image') {
      $scope.content.push({type: 'image', value: ''});
    } else {
      warningsData.addWarning('Unknown content type ' + contentType + '.');
      return;
    }
    $scope.saveStateContent();
  };

  $scope.editContent = function(index) {
    activeInputData.name = 'content.' + index;
  };

  $scope.saveStateContentImage = function(index) {
    activeInputData.clear();
    $('#newImageForm')[0].reset();
    image = $scope.image;

    if (!image || !image.type.match('image.*')) {
      warningsData.addWarning('This file is not recognized as an image.');
      return;
    }

    warningsData.clear();

    $http({
      method: 'POST',
      url: '/imagehandler/' + $scope.explorationId,
      headers: {'Content-Type': false},
      data: {image: image},
      transformRequest: function(data) {
        var formData = new FormData();
        formData.append('image', data.image);
        return formData;
      }
    }).
    success(function(data) {
      if (data.image_id) {
        $scope.content[index].value = data.image_id;
        $scope.saveStateContent();
      }
    })
    .error(function(data) {
      warningsData.addWarning(
        data.error || 'Error communicating with server.'
      );
    });
  };

  // Receive messages from the widget repository.
  $scope.$on('message', function(event, arg) {
    if (!arg.data.widgetType || arg.data.widgetType != 'noninteractive') {
      return;
    }

    var widget = arg.data.widget;
    var index = arg.data.parentIndex;

    $scope.content[index].value = JSON.stringify({
      'id': widget.id,
      'params': widget.params
    });

    $scope.initWidget(index);
    $scope.saveStateContent();
  });

  $scope.getCustomizationModalInstance = function(widgetParams) {
    // NB: This method is used for both interactive and noninteractive widgets.
    return $modal.open({
      templateUrl: 'modals/customizeWidget',
      backdrop: 'static',
      resolve: {
        widgetParams: function() {
          return widgetParams;
        }
      },
      controller: function($scope, $modalInstance, widgetParams) {
        $scope.widgetParams = widgetParams;

        $scope.save = function(widgetParams) {
          $scope.$broadcast('externalSave');
          $modalInstance.close({
            widgetParams: widgetParams
          });
        };

        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }
    });
  };

  $scope.saveStateParamChanges = function() {
    console.log($scope.stateParamChanges);

    explorationData.saveStateData(
      $scope.stateId,
      {'param_changes': $scope.stateParamChanges});
  };

}

GuiEditor.$inject = ['$scope', '$http', '$filter', '$sce', '$modal',
    'explorationData', 'warningsData', 'activeInputData', 'requestCreator'];
