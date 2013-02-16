oppia.directive('unfocusStateContent', function(activeInputData) {
  return {
    restrict: 'A',
    link: function(scope, element, attribs) {
      element[0].focus();
      element.bind('blur', function() {
        scope.stateContent[scope.$index] = scope.item;
        scope.$apply(attribs['unfocusStateContent']);
        scope.saveStateChange('stateContent');
        activeInputData.clear();
      });
    }
  };
});

// Makes the corresponding elements sortable.
// TODO(sll): This directive doesn't actually update the underlying array,
// so ui-sortable still needs to be used. Try and fix this.
oppia.directive('sortable', function($compile) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      $(element).sortable({
        scroll: false,
        stop: function(event, ui) {
          if ($(ui.item).hasClass('oppia-state-text-item')) {
            // This prevents a collision with the itemDroppable trashing.
            for (var i = 0; i < scope.stateContent.length; ++i) {
              if (scope.stateContent[i] == undefined) {
                scope.stateContent.splice(i, 1);
                --i;
              }
            }
            scope.saveStateChange('stateContent');
            scope.$apply();
          }
        }
      });
    }
  };
});

function GuiEditor($scope, $http, $routeParams, stateData, explorationData, warningsData, activeInputData) {
  $scope.$parent.stateId = $routeParams.stateId;
  // Switch to the stateEditor tab when this controller is activated.
  $('#editorViewTab a[href="#stateEditor"]').tab('show');

  // Sets up the state editor, given its data from the backend.
  $scope.$on('stateData', function() {
    // If a widget exists, show its compiled version and populate the widget
    // view fields.
    for (var i = 0; i < $scope.stateContent.length; ++i) {
      if ($scope.stateContent[i].type == 'widget') {
        var widgetFrameId = 'widgetPreview' + i;
        if ($scope.stateContent[i].value) {
          $http.get('/widgets/' + $scope.stateContent[i].value).
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
  });

  $scope.showFeedbackEditor = function(activeInput, categoryId) {
    $scope.initializeNewActiveInput(activeInput);
    if ($scope.states[$scope.stateId]['dests'][categoryId]['text']) {
      $scope['textData'] =
          $scope.states[$scope.stateId]['dests'][categoryId]['text'];
    }
  };

  $scope.getDestDescription = function(dest) {
    if (!dest) {
      return 'Error: unspecified destination';
    } else if (dest == END_DEST) {
      return 'Destination: END';
    } else if (dest in $scope.states) {
      return 'Destination: ' + $scope.states[dest].desc;
    } else if (dest.indexOf(QN_DEST_PREFIX) == 0 &&
               dest.substring(2) in $scope.questions) {
      return 'Destination question: ' +
          $scope.questions[dest.substring(2)].desc;
    } else {
      return '[Error: invalid destination]';
    }
  };

  $scope.getCategoryClass = function(categoryName) {
    return categoryName != DEFAULT_CATEGORY_NAME ? 'category-name' : '';
  };

  $scope.saveText = function(textData, categoryId) {
    $scope.states[$scope.stateId]['dests'][categoryId]['text'] = textData;
    $scope.saveStateChange('states');
  };

  $scope.saveDest = function(categoryId, destName) {
    if (!destName) {
      warningsData.addWarning('Please choose a destination.');
      return;
    }

    var oldDest = $scope.states[$scope.stateId]['dests'][categoryId].dest;

    var found = false;
    if (destName.toUpperCase() == 'END') {
      found = true;
      $scope.states[$scope.stateId]['dests'][categoryId].dest = END_DEST;
    }

    // Find the id in states.
    if (!found) {
      for (var id in $scope.states) {
        if ($scope.states[id].desc == destName) {
          found = true;
          $scope.states[$scope.stateId]['dests'][categoryId].dest = id;
          break;
        }
      }
    }

    if (!found) {
      $scope.addState(destName, true, categoryId);
      return;
    }

    $scope.saveStateChange('states');
    activeInputData.clear();
  };

  $scope.getReadableInputType = function(inputType) {
    return HUMAN_READABLE_INPUT_TYPE_MAPPING[inputType];
  };

  $scope.hideVideoInputDialog = function(videoLink, index) {
    if (videoLink) {
      // The content creator has added a new video link. Extract its ID.
      if (videoLink.indexOf('http://') == 0)
        videoLink = videoLink.substring(7);
      if (videoLink.indexOf('https://') == 0)
        videoLink = videoLink.substring(8);
      if (videoLink.indexOf('www.') == 0)
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
            $scope.stateContent[index].value = videoId[2];
            $scope.saveStateChange('stateContent');
          }).error(function(data) {
            warningsData.addWarning('This is not a valid YouTube video id.');
          });
      */
      $scope.stateContent[index].value = videoId[2];
      $scope.saveStateChange('stateContent');
    }
    activeInputData.clear();
  };

  $scope.deleteVideo = function(index) {
    $scope.stateContent[index].value = '';
    $scope.saveStateChange('stateContent');
  };

  $scope.addContent = function(contentType) {
    if (contentType == 'text') {
      activeInputData.name = 'stateContent.' + $scope.stateContent.length;
      $scope.stateContent.push({type: 'text', value: ''});
    } else if (contentType == 'image') {
      $scope.stateContent.push({type: 'image', value: ''});
    } else if (contentType == 'video') {
      $scope.stateContent.push({type: 'video', value: ''});
    } else if (contentType == 'widget') {
      $scope.stateContent.push({type: 'widget', value: ''});
    } else {
      warningsData.addWarning('Unknown content type ' + contentType + '.');
      return;
    }
    $scope.saveStateChange('states');
  };

  $scope.deleteContent = function(index) {
    for (var i = 0; i < $scope.stateContent.length; ++i) {
      if (i == index) {
        // TODO(sll): Using just scope.stateContent.splice(i, 1) doesn't
        // work, because the other objects in the array get randomly
        // arranged. Find out why, or refactor the following into a
        // different splice() method and use that throughout.
        var tempstateContent = [];
        for (var j = 0; j < $scope.stateContent.length; ++j) {
          if (i != j) {
            tempstateContent.push($scope.stateContent[j]);
          }
        }
        $scope.$parent.stateContent = tempstateContent;
        $scope.saveStateChange('states');
        return;
      }
    }
  };

  $scope.saveStateContentImage = function(index) {
    activeInputData.clear();
    $scope.saveImage(function(data) {
        $scope.stateContent[index].value = data.image_id;
        $scope.saveStateChange('stateContent');
    });
  };

  $scope.deleteImage = function(index) {
    // TODO(sll): Send a delete request to the backend datastore.
    $scope.stateContent[index].value = '';
    $scope.saveStateChange('stateContent');
  };

  // Receive messages from the widget repository.
  $scope.$on('message', function(event, arg) {
    var index = -1;
    for (var i = 0; i < $scope.stateContent.length; ++i) {
      if ($scope.stateContent[i].type == 'widget') {
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
    var widgetId = $scope.stateContent[index].value || '';
    console.log(widgetId);

    $http.post(
      '/widgets/' + widgetId,
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
      // Check that the data has been saved correctly.
      console.log(widgetData);
      $('#widgetTabs' + index + ' a:first').tab('show');
      $scope.stateContent[index].value = widgetData.widgetId;
      $scope.$apply();
      $scope.addContentToIframe('widgetPreview' + index, widgetCode);
      $scope.widgetCode = widgetCode;
      $scope.saveStateChange('stateContent');
      // TODO(sll): Display multiple widget div's here.
      activeInputData.clear();
      console.log($scope.stateContent);
    });
  };

  $scope.isWidgetInStateContent = function() {
    for (var i = 0; i < $scope.stateContent.length; ++i) {
      if ($scope.stateContent[i] && $scope.stateContent[i]['type'] == 'widget') {
        return true;
      }
    }
    return false;
  };

  //logic for parameter change interface

  //reset and/or initialize variables for parameter change input
  $scope.resetParamChangeInput = function() {
    console.log($scope);
    activeInputData.clear();
    $scope.tmpParamName = '';
    $scope.tmpNewValue = '';
    $scope.tmpLiteral = ''; //new value literal, if parameter is to be changed to a literal value
  }

  $scope.resetParamChangeInput();

  $scope.addParamChange = function(paramName, paramVal, valLiteral) {
    // Verify that the active input was the parameter input, as expected TODO(yanamal)
    // Add the new change to the list
    if(paramVal == 'newval') { //changing param to a new literal value
      $scope.paramChanges.push({name: paramName, newVal: valLiteral})
    }
    else { //changing to a computed value - either value of another var, or student input
      $scope.paramChanges.push({name: paramName, newVal: '{{'+paramVal+'}}'});
    }
    console.log($scope.paramChanges);
    // Save the parameter property TODO(yanamal)
    // Reset and hide the input field
    $scope.resetParamChangeInput();
  }

  $scope.deleteParamChange = function (paramIndex) { //TODO(yanamal): add category index when this is per-category
    $scope.paramChanges.splice(paramIndex, 1)
    // TODO(yanamal): save to server-side
  }
}

GuiEditor.$inject = ['$scope', '$http', '$routeParams', 'stateData',
    'explorationData', 'warningsData', 'activeInputData'];
