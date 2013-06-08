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

function GuiEditor($scope, $http, $routeParams, explorationData, warningsData, activeInputData) {
  explorationData.getData().then(function(data) {
    var promise = explorationData.getStateData($scope.$parent.stateId);
    promise.then(function(data) {
      $scope.init(data);
      $scope.updateMath();
    });
  });

  $scope.$parent.stateId = $routeParams.stateId;

  $scope.init = function(data) {
    $scope.stateName = data.name;
    $scope.content = data.content || [];
    $scope.paramChanges = data.param_changes || [];
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
    $http.post(
      '/noninteractive_widgets/' + widget.id + '?parent_index=' + index,
      $scope.createRequest({params: widget.params, state_params: $scope.paramChanges}),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
      $scope.addContentToIframe(
          'widgetPreview' + widgetData.parent_index, widgetData.widget.raw);
    });
  };

  $scope.saveStateName = function() {
    if (!$scope.isValidEntityName($scope.stateName, true))
      return;
    if ($scope.isDuplicateInput(
            $scope.states, 'name', $scope.stateId, $scope.stateName)) {
      warningsData.addWarning(
          'The name \'' + $scope.stateName + '\' is already in use.');
      return;
    }

    explorationData.saveStateData(
        $scope.stateId, {'state_name': $scope.stateName});
    activeInputData.clear();
  };


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
      myEditor.setEditorHTML(initContent || 'Click \'Edit\' to enter text here.');
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
  }

  //logic for parameter change interface

  //TODO: (in html) see if there's a clean way of having the editor pop-up in
  //the list itself

  //start editing/adding a parameter change
  $scope.startAddParamChange = function() {
    $scope.editingParamChange = 'New change';
    $scope.initSelectorOptions();
  };

  // TODO(sll): Change the following to take an $index.
  $scope.startEditParamChange = function(index) {
    var param = $scope.paramChanges[index];
    fields = $scope.initParamFields(param);
    $scope.tmpParamName = fields[0];   // There are $scope issues that don't let me 
    $scope.tmpParamValues = fields[2]; // reuse the exploration-level tmp* variables
    $scope.editingParamChange = index;
  };

  //reset and/or initialize variables for parameter change input
  $scope.resetParamChangeInput = function() {
    $scope.editingParamChange = null; //used to determine what to display in the html
    $scope.tmpParamName = '';
    $scope.tmpParamValues = [];
  };

  $scope.resetParamChangeInput();

  $scope.addParamChange = function(index) {
    if (!$scope.tmpParamName) {
      warningsData.addWarning('Please specify a parameter name.');
      return;
    }
    if ($scope.tmpParamValues.length === 0) {
      warningsData.addWarning('Please specify at least one value for the parameter.');
      return;
    }

    // tmpParamName as output by the selector is usually of the format {id:param_name, text:param_name}
    // except when the user is creating a new parameter, then it is {id:'new', text:param_name}
    var name = $scope.tmpParamName.text;
    // tmpParamValues comes back with the string that needs to be stored as the id;
    // for changing to other parameter values or student input, this is {{pname}} or {{input}}
    // otherwise the value option is interpreted as a string literal
    var vals = [];
    $scope.tmpParamValues.forEach(function(val){
      vals.push(val.id);
    });

    if (index !== 'New change') {
      $scope.paramChanges[index] = {
        'obj_type': 'UnicodeString', 'values': vals, 'name': name};
    } else {
      $scope.paramChanges.push(
        {'obj_type': 'UnicodeString', 'values': vals, 'name': name});
    }

    $scope.saveParamChanges();
    $scope.resetParamChangeInput();
  };

  $scope.deleteParamChange = function (index) {
    $scope.paramChanges.splice(index, 1);
    $scope.saveParamChanges();
  };

  $scope.saveParamChanges = function() {
    explorationData.saveStateData(
      $scope.stateId,
      {'param_changes': $scope.paramChanges});
  };
}

GuiEditor.$inject = ['$scope', '$http', '$routeParams', 'explorationData',
    'warningsData', 'activeInputData'];
