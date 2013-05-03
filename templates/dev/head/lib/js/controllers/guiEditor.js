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

function GuiEditor($scope, $routeParams, explorationData, warningsData, activeInputData) {
  explorationData.getData().then(function(data) {
    var promise = explorationData.getStateData($scope.$parent.stateId);
    promise.then(function(data) {
      $scope.init(data);
      $scope.updateMath();
    });
  });

  $scope.$parent.stateId = $routeParams.stateId;

  $scope.init = function(data) {
    $scope.content = data.content || [];
    $scope.paramChanges = data.param_changes || [];

    console.log('Content updated.');

    /*
    // NB: /widgets/ does not exist anymore!
    //
    // If a (non-interactive) widget exists, show its compiled version and
    // populate the widget view fields.
    for (var i = 0; i < $scope.content.length; ++i) {
      if ($scope.content.type == 'widget') {
        var widgetFrameId = 'widgetPreview' + i;
        if ($scope.content.value) {
          $http.get('/widgets/' + $scope.content.value).
              success(function(data) {
                $scope.widgetCode = data.raw;
                $scope.addContentToIframe(widgetFrameId, $scope.widgetCode);
              }).error(function(data) {
                warningsData.addWarning(
                    'Widget could not be loaded: ' + String(data.error));
              });
        }
      }
    }
    */

    // Switch to the stateEditor tab when this controller is activated.
    $scope.$apply($('#editorViewTab a[href="#stateEditor"]').tab('show'));
  };

  var editors = {};

  $scope.initYui = function(index, initContent) {
    var divId = 'yuiEditor' + index;

    YUI({
        base: '/third_party/static/yui3-3.8.1/build/',
        combine: false,
        groups: {
          gallery: {
            base: '/third_party/static/yui3-gallery-20121107/build/',
            patterns: {
              'gallery-': {}
            }
          }
        }
    }).use('editor-base', 'gallery-itsatoolbar', function (Y) {
      var config = {height: '10px'};

      editors[index] = new Y.EditorBase({
        content: initContent || 'Click \'Edit\' to enter text here.'
      });

      editors[index].plug(Y.Plugin.ITSAToolbar);
      editors[index].plug(Y.Plugin.EditorBidi);

      editors[index].on('frame:ready', function() {
        //Focus the Editor when the frame is ready..
        this.focus();

        // Adjust the iframe's height.
        this.frame._iframe._node.height = 10;
      });

      //Rendering the Editor.
      editors[index].render('#' + divId);
    });
  };

  $scope.saveContent = function(index) {
    if ($scope.content[index].type == 'text' && editors.hasOwnProperty(index)) {
      $scope.content[index].value = editors[index].getContent();
      $scope.saveStateContent();
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
      // Remove all old YUI editors from the DOM.
      $('.yuiEditor').empty();
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
    var index = -1;
    for (var i = 0; i < $scope.content.length; ++i) {
      if ($scope.content[i].type == 'widget') {
        index = i;
        break;
      }
    }
    if (index == -1) {
      // TODO(sll): Do more substantial error-checking here.
      return;
    }

    $scope.saveWidget(arg.data.raw, index);
  });

  $scope.saveWidget = function(widgetCode, index) {
    var widgetId = $scope.content[index].value || '';
    console.log(widgetId);

    // NB: /widgets/ does not exist anymore!
    /*
    $http.post(
      '/widgets/' + widgetId,
      $scope.createRequest({'raw': widgetCode}),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
      // Check that the data has been saved correctly.
      console.log(widgetData);
      $('#widgetTabs' + index + ' a:first').tab('show');
      $scope.content[index].value = widgetData.widgetId;
      $scope.$apply();
      $scope.addContentToIframe('widgetPreview' + index, widgetCode);
      $scope.widgetCode = widgetCode;
      $scope.saveStateContent();
      // TODO(sll): Display multiple widget div's here.
      activeInputData.clear();
    });
    */
  };

  $scope.isWidgetInStateContent = function() {
    for (var i = 0; i < $scope.content.length; ++i) {
      if ($scope.content[i] && $scope.content[i]['type'] == 'widget') {
        return true;
      }
    }
    return false;
  };

  //logic for parameter change interface
  //TODO: discuss changing back to not be keyed by parameter name, in case
  //someone wants to change the same parameter several times? e.g.
  //x=y+z; x=x/2
  //could also be useful if order of changes matters, e.g.
  //temp=x; x=y; y=temp

  //TODO: (in html) see if there's a clean way of having the editor pop-up in
  //the list itself

  //controllers for ui boxes: parameter to be changed, and change options/list
  $scope.paramSelector = {
    createSearchChoice:function(term, data) {
      if ($(data).filter(function() { return this.text.localeCompare(term)===0; }).length===0)
        {
          return {id:'new', text:term};
        }
    },
    data:[],
    formatNoMatches:function(term) {
      return "(choose a parameter name)";
    }
  };
  $scope.valueSelector = {
    createSearchChoice:function(term, data) {
      if ($(data).filter(function() { return this.text.localeCompare(term)===0; }).length===0)
        {
          return {id:term, text:'"'+term+'"'};
        }
    },
    data:[],
    tokenSeparators:[","],
    formatNoMatches:function(term) {
      return "(list new values)";
    }
  };


  // initialize dropdown options for both selectors in the parameter change interface
  // (parameter to change and new value(s) to change to)
  // the select2 library expects the options to have 'id' and 'text' fields.
  $scope.initSelectorOptions = function() {
    var namedata = [];
    $scope.parameters.forEach(function(param){
      namedata.push({id:param.name, text:param.name});
    });
    angular.extend($scope.paramSelector.data, namedata);

    var changedata = [{id:'{{answer}}', text:'Answer'}]; //TODO the student input option only applies to parameter changes that are associated with actions
    $scope.parameters.forEach(function(param){
      changedata.push({id:'{{'+param.name+'}}', text:param.name});
    });
    angular.extend($scope.valueSelector.data, changedata);
  };

  //start editing/adding a parameter change
  $scope.startAddParamChange = function() {
    $scope.editingParamChange = 'New change';
    $scope.initSelectorOptions();
  };


  // TODO(sll): Change the following to take an $index.
  $scope.startEditParamChange = function(index) {
    var pName = $scope.paramChanges[index].name;
    $scope.tmpParamName = {id:pName, text: pName};
    $scope.editingParamChange = index;

    $scope.tmpParamValues = [];
    ($scope.paramChanges[index].values).forEach(function(change){
      if(typeof change === "string") { // I think other stuff, like hashes, ends up in this object
        var txt = "";
        if(change.lastIndexOf("{{", 0) === 0) { // if change starts with "{{" - it is a variable
          txt = change.substring(2, change.length-2);
        }
        else { // it's a literal; display in quotes
          txt = '"'+change+'"';
        }
        $scope.tmpParamValues.push({id:change, text:txt});
      }
    });

    $scope.initSelectorOptions();
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

GuiEditor.$inject = ['$scope', '$routeParams', 'explorationData',
    'warningsData', 'activeInputData'];
