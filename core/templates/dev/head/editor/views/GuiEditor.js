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

function GuiEditor($scope, $http, $filter, $routeParams, explorationData,
                   warningsData, activeInputData) {
  explorationData.getData().then(function(data) {
    var promise = explorationData.getStateData($scope.$parent.stateId);
    promise.then(function(data) {
      if (!data) {
        // This state does not exist. Redirect to the exploration page.
        $('#editorViewTab a[href="#explorationMap"]').tab('show');
      }
      $scope.init(data);
      $scope.updateMath();
    });
  });

  $scope.$parent.stateId = $routeParams.stateId;

  $scope.init = function(data) {
    $scope.stateName = data.name;
    $scope.content = data.content || [];
    $scope.stateParamChanges = data.param_changes || [];
    $scope.initAllWidgets();

    console.log('Content updated.');

    // Switch to the stateEditor tab when this controller is activated.
    $('#editorViewTab a[href="#stateEditor"]').tab('show');
  };

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

  var editors = {};

  $scope.initYui = function(index, initContent) {
    var divId = 'yuiEditor' + index;

    var myEditor = new YAHOO.widget.Editor(divId, {
      height: '300px',
      width: '522px',
      handleSubmit: true,
      animate: true,
      toolbar: {
        titlebar: 'Rich Text Editor',
        buttons: [
          {
            group: 'textstyle', label: 'Font Style',
            buttons: [
              { type: 'push', label: 'Bold', value: 'bold' },
              { type: 'push', label: 'Italic', value: 'italic' },
              { type: 'push', label: 'Underline', value: 'underline' },
              { type: 'separator' },
              { type: 'select', label: 'Arial', value: 'fontname', disabled: true,
                menu: [
                  { text: 'Arial', checked: true },
                  { text: 'Courier New' },
                  { text: 'Lucida Console' },
                  { text: 'Times New Roman' },
                  { text: 'Verdana' }
                ]
              },
              { type: 'spin', label: '13', value: 'fontsize', range: [ 9, 75 ], disabled: true },
              { type: 'separator' },
              { type: 'color', label: 'Font Color', value: 'forecolor', disabled: true },
              { type: 'color', label: 'Background Color', value: 'backcolor', disabled: true }
            ]
          }
        ]
      }
    });
    myEditor.render();

    myEditor.on('windowRender', function() {
      myEditor.setEditorHTML(
        initContent || $scope.defaultTextContent
      );
    });

    editors[index] = myEditor;
  };

  $scope.saveContent = function(index) {
    if ($scope.content[index].type == 'text' && editors.hasOwnProperty(index)) {
      editors[index].saveHTML();
      $scope.content[index].value = editors[index].getEditorHTML();
      $scope.saveStateContent();
      editors[index].destroy();
      delete editors[index];
    }
    activeInputData.name = '';
  };

  $scope.saveStateContent = function() {
    explorationData.saveStateData($scope.stateId, {'content': $scope.content});
  };

  // Destroy and initialize the correct rich text editors.
  $scope.$watch('activeInputData.name', function(newValue, oldValue) {
    editors = {};

    if (oldValue && oldValue.indexOf('content.') === 0) {
      $scope.saveContent(oldValue.substring(8));
    }

    if (newValue && newValue.indexOf('content.') === 0) {
      var index = parseInt(newValue.substring(8), 10);
      if ($scope.content[index].type == 'text') {
        $scope.initYui(index, $scope.content[index].value);
      }
    }
  });

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
    $scope.saveImage(function(data) {
        $scope.content[index].value = data.image_id;
        $scope.saveStateContent();
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

    $scope.saveWidget(arg.data.widget, arg.data.parentIndex);
  });

  $scope.hasCustomizableParams = function(widgetValue) {
    return Boolean(JSON.parse(widgetValue).params);
  };

  $scope.customizeWidget = function(index) {
    $scope.customizationParams = JSON.parse($scope.content[index].value).params;
    $scope.customizeWidgetIndex = index;
  };

  $scope.saveNonInteractiveWidgetParams = function() {
    var index = $scope.customizeWidgetIndex;
    var widget = JSON.parse($scope.content[index].value);
    widget.params = $scope.customizationParams;
    $scope.content[index].value = JSON.stringify(widget);

    $scope.initWidget(index);
    $scope.saveStateContent();

    $scope.customizationParams = null;
    $scope.customizeWidgetIndex = null;
  };

  $scope.saveWidget = function(widget, index) {
    $scope.content[index].value = JSON.stringify({
      'id': widget.id,
      'params': widget.params
    });

    $scope.initWidget(index);
    $scope.saveStateContent();
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

GuiEditor.$inject = ['$scope', '$http', '$filter', '$routeParams',
    'explorationData', 'warningsData', 'activeInputData'];
