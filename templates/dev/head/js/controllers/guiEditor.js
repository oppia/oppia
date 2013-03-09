oppia.directive('unfocusStateContent', function(activeInputData, explorationData) {
  return {
    restrict: 'A',
    link: function(scope, element, attribs) {
      element[0].focus();
      element.bind('blur', function() {
        var content = explorationData.getStateProperty(scope.stateId, 'content');
        content[scope.$index] = scope.item;
        explorationData.saveStateData(scope.stateId, {'content': content});
        scope.$apply(attribs['unfocusStateContent']);
        activeInputData.clear();
      });
    }
  };
});


function GuiEditor($scope, $http, $routeParams, explorationData, warningsData, activeInputData) {
  $scope.$parent.stateId = $routeParams.stateId;

  $scope.init = function(data) {
    $scope.content = data.content;
    $scope.paramChanges = data.param_changes || [];

    console.log('Content updated.');

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

    // Switch to the stateEditor tab when this controller is activated.
    $scope.$apply($('#editorViewTab a[href="#stateEditor"]').tab('show'));
  };

  // Initializes the GuiEditor.
  $scope.init(explorationData.getStateData($scope.$parent.stateId));
  console.log('Initializing GUI editor');

  $scope.$on('explorationData', function() {
    // TODO(sll): Does this actually receive anything?
    console.log('Init content');
    $scope.init(explorationData.getStateData($scope.$parent.stateId));
  });

  var editor = null;

  $scope.initYui = function(divId, initContent) {
    YUI().use('editor-base', 'gallery-itsatoolbar', function (Y) {

      var config = {height: '10px'};

      editor = new Y.EditorBase({
        content: initContent || 'You can enter <strong>rich</strong> text here.'
      });

      editor.plug(Y.Plugin.ITSAToolbar);
      editor.plug(Y.Plugin.EditorBidi);

      editor.on('frame:ready', function() {
        //Focus the Editor when the frame is ready..
        this.focus();

        // Adjust the iframe's height.
        this.frame._iframe._node.height = 10;
      });

      //Rendering the Editor.
      editor.render('#' + divId);
    });
  };

  $scope.saveContent = function(index) {
    if ($scope.content[index].type == 'text') {
      $scope.content[index].value = editor.getContent();
    }
    activeInputData.name = '';
  };

  $scope.saveStateContent = function() {
    explorationData.saveStateData($scope.stateId, {'content': $scope.content});
  };

  // Destroy and initialize the correct rich text editors.
  $scope.$watch('activeInputData.name', function(newValue, oldValue) {
    editor = null;

    if (oldValue && oldValue.indexOf('content.') === 0) {
      // Remove all old YUI editors from the DOM.
      $('.yuiEditor').empty();
    }

    if (newValue && newValue.indexOf('content.') === 0) {
      var index = parseInt(newValue.substring(8));
      if ($scope.content[index].type == 'text') {
        $scope.initYui('yuiEditor' + index, $scope.content[index].value);
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
      activeInputData.name = 'content.' + $scope.content.length;
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
    var request = $.param(
        {'raw': JSON.stringify(widgetCode)},
        true
    );
    var widgetId = $scope.content[index].value || '';
    console.log(widgetId);

    $http.post(
      '/widgets/' + widgetId,
      request,
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

  //start editing/adding a parameter change
  $scope.startAddParamChange = function() {
    $scope.editingParamChange = 'New change';
  }

  $scope.startEditParamChange = function(pName) {
    $scope.tmpParamName = pName;
    $scope.editingParamChange = pName;
    if (pName in $scope.paramChanges) {
      $scope.tmpParamValues = $scope.paramChanges[pName];
    }
  }

  //reset and/or initialize variables for parameter change input
  $scope.resetParamChangeInput = function() {
    //activeInputData.clear();
    $scope.editingParamChange = null; //used to determine what to display in the html
    //TODO: this can be consolidated with tmpParamName if we decide to keep keying by name
    $scope.tmpParamName = '';
    $scope.tmpParamValues = [];
  };

  $scope.resetParamChangeInput();

  $scope.addParamChange = function() {
    if (!$scope.tmpParamName) {
      warningsData.addWarning('Please specify a parameter name.');
      return;
    }
    if ($scope.tmpParamValues.length === 0) {
      warningsData.addWarning('Please specify at least one value for the parameter.');
      return;
    }

    // Verify that the active input was the parameter input, as expected
    // TODO(yanamal): Add the new change to the list
    $scope.paramChanges[$scope.tmpParamName] = $scope.tmpParamValues;
    $scope.saveParamChanges();
    $scope.resetParamChangeInput();
  };

  $scope.deleteParamChange = function (paramName) {
    //TODO(yanamal): add category index when this is per-category
    delete $scope.paramChanges[paramName];
    $scope.saveParamChanges();
  };

  $scope.saveParamChanges = function() {
    explorationData.saveStateData($scope.stateId, {'param_changes': $scope.paramChanges});
  };
}

GuiEditor.$inject = ['$scope', '$http', '$routeParams', 'explorationData',
    'warningsData', 'activeInputData'];
