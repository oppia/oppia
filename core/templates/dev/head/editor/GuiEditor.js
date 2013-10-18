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
                   warningsData, activeInputData) {

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
      $scope.createRequest({
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

  $scope.defaultTextContent = (
      'Click \'Edit\' to enter text here. Text enclosed in dollar signs ' +
      'will be displayed as $LaTeX$. To write a non-LaTeXed dollar sign, ' +
      'type a single backslash (\'\\\') followed by \'$\'. For more ' +
      'information about LaTeX, see ' +
      'http://web.ift.uib.no/Teori/KURS/WRK/TeX/symALL.html');

  $scope.saveTextContent = function() {
    $scope.saveStateContent();
    activeInputData.name = '';
  };

  $scope.saveStateContent = function() {
    explorationData.saveStateData($scope.stateId, {'content': $scope.content});
  };

  $scope.getYoutubeVideoUrl = function(videoId) {
    return $sce.trustAsResourceUrl(
      '//www.youtube.com/embed/' + videoId + '?rel=0');
  };

  $scope.hideVideoInputDialog = function(videoLink, index) {
    if (videoLink) {
      // The content creator has added a new video link. Extract its ID.
      if (videoLink.indexOf('http://') === 0)
        videoLink = videoLink.substring(7);
      if (videoLink.indexOf('https://') === 0)
        videoLink = videoLink.substring(8);
      if (videoLink.indexOf('www.') === 0)
        videoLink = videoLink.substring(4);

      // Note that the second group of each regex must be the videoId in order
      // for the following code to work.
      // TODO(sll): Check these regexes carefully (or simplify the logic).
      var videoRegexp1 = new RegExp(
          '^youtube\.com\/watch\\?(.*&)?v=([A-Za-z0-9-_]+)(&.*)?$');
      var videoRegexp2 = new RegExp(
          '^(you)tube\.com\/embed\/([A-Za-z0-9-_]+)/?$');
      var videoRegexp3 = new RegExp('^(you)tu\.be\/([A-Za-z0-9-_]+)/?$');

      var videoId = (videoRegexp1.exec(videoLink) ||
                     videoRegexp2.exec(videoLink) ||
                     videoRegexp3.exec(videoLink));
      if (!videoId) {
        warningsData.addWarning(
            'Could not parse this video link. Please use a YouTube video.');
        return;
      }

      // The following validation method is the one described in
      // stackoverflow.com/questions/2742813/how-to-validate-youtube-video-ids
      // It does not work at the moment, so it is temporarily disabled and replaced
      // with the two lines below it.
      /*
      $http.get('https://gdata.youtube.com/feeds/api/videos/' + videoId[2], '').
          success(function(data) {
            $scope.content[index].value = videoId[2];
            $scope.saveStateContent();
          }).error(function(data) {
            warningsData.addWarning('This is not a valid YouTube video id.');
          });
      */
      $scope.content[index].value = videoId[2];
      $scope.saveStateContent();
    }
    activeInputData.clear();
  };

  $scope.deleteVideo = function(index) {
    $scope.content[index].value = '';
    $scope.saveStateContent();
  };

  $scope.addContent = function(contentType) {
    if (contentType == 'text') {
      $scope.content.push({type: 'text', value: ''});
    } else if (contentType == 'image') {
      $scope.content.push({type: 'image', value: ''});
    } else if (contentType == 'video') {
      $scope.content.push({type: 'video', value: ''});
    } else if (contentType == 'widget') {
      $scope.content.push({type: 'widget', value: ''});
    } else {
      warningsData.addWarning('Unknown content type ' + contentType + '.');
      return;
    }
    $scope.saveStateContent();
  };

  $scope.deleteContent = function(index) {
    activeInputData.clear();
    $scope.content.splice(index, 1);
    $scope.saveStateContent();
    $scope.initAllWidgets();
  };

  $scope.swapContent = function(index1, index2) {
    activeInputData.clear();
    if (index1 < 0 || index1 >= $scope.content.length) {
      warningsData.addWarning('Content element ' + index1 + ' does not exist.');
    }
    if (index2 < 0 || index2 >= $scope.content.length) {
      warningsData.addWarning('Content element ' + index2 + ' does not exist.');
    }

    var tmpContent = $scope.content[index1];
    $scope.content[index1] = $scope.content[index2];
    $scope.content[index2] = tmpContent;

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

  $scope.deleteImage = function(index) {
    // TODO(sll): Send a delete request to the backend datastore.
    $scope.content[index].value = '';
    $scope.saveStateContent();
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

  $scope.getWidgetRepositoryUrl = function(parentIndex) {
    return $sce.trustAsResourceUrl(
      '/widgetrepository?iframed=true&interactive=false&parent_index=' + parentIndex);
  };

  $scope.hasCustomizableParams = function(widgetValue) {
    if (widgetValue) {
      return Boolean(JSON.parse(widgetValue).params);
    } else {
      return false;
    }
  };

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

  $scope.showCustomizeNonInteractiveWidgetModal = function(index) {
    warningsData.clear();
    var widgetParams = JSON.parse($scope.content[index].value).params;
    var modalInstance = $scope.getCustomizationModalInstance(widgetParams);

    modalInstance.result.then(function(result) {
      var widgetValue = JSON.parse($scope.content[index].value);
      widgetValue.params = result.widgetParams;
      $scope.content[index].value = JSON.stringify(widgetValue);
      console.log('Non-interactive customization modal saved.');

      $scope.initWidget(index);
      $scope.saveStateContent();
    }, function() {
      console.log('Non-interactive customization modal dismissed.');
    });
  };

  $scope.deleteWidget = function(index) {
    $scope.content[index].value = '';
    $scope.saveStateContent();
  };

  $scope.saveStateParamChanges = function() {
    console.log($scope.stateParamChanges);

    explorationData.saveStateData(
      $scope.stateId,
      {'param_changes': $scope.stateParamChanges});
  };

}

GuiEditor.$inject = ['$scope', '$http', '$filter', '$sce', '$modal',
    'explorationData', 'warningsData', 'activeInputData'];
