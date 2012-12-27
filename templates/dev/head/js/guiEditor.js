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


// override the default input to update on blur
oppia.directive('ngModelOnblur', function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elm, attr, ngModelCtrl) {
      if (attr.type === 'radio' || attr.type === 'checkbox') return;
        elm.unbind('input').unbind('keydown').unbind('change');
        elm.bind('blur', function() {
          scope.$apply(function() {
          ngModelCtrl.$setViewValue(elm.val());
        });
      });
    }
  };
});

function GuiEditor($scope, $http, stateData, explorationData, warningsData, activeInputData) {
  // Sets up the state editor, given its data from the backend.
  $scope.$on('stateData', function() {
    // If a widget exists, show its compiled version and populate the widget
    // view fields.
    for (var i = 0; i < $scope.stateContent.length; ++i) {
      if ($scope.stateContent[i].type == 'widget') {
        var widgetFrameId = 'widgetPreview' + i;
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
  });

  $scope.deleteCategory = function(categoryId) {
    $scope.states[$scope.stateId]['dests'].splice(categoryId, 1);
    $scope.saveStateChange('states');
    drawStateGraph($scope.states);
  };

  $scope.showFeedbackEditor = function(activeInput, categoryId) {
    $scope.initializeNewActiveInput(activeInput);
    if ($scope.states[$scope.stateId]['dests'][categoryId]['text']) {
      $scope['textData'] =
          $scope.states[$scope.stateId]['dests'][categoryId]['text'];
    }
  };

  $scope.getTextDescription = function(text) {
    return text ? 'Feedback: ' + text : '';
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
    // If destName is a question, find the id in questions.
    if (destName.indexOf('[Question] ') == 0) {
      destName = destName.substring(11);
      for (var id in $scope.questions) {
        if ($scope.questions[id].desc == destName) {
          found = true;
          $scope.states[$scope.stateId]['dests'][categoryId].dest = 'q-' + id;
          break;
        }
      }
    }
    // Otherwise, find the id in states.
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
    drawStateGraph($scope.states);
  };

  $scope.getReadableInputType = function(inputType) {
    return HUMAN_READABLE_INPUT_TYPE_MAPPING[inputType];
  };

  /**
   * Triggered when the content creator changes the input type.
   * @param {string} newInputType The input type specified by the content
   *     creator.
   */
  $scope.changeInputType = function(newInputType) {
    $scope.$parent.inputType = newInputType;
    if (!$scope.inputType) {
      $scope.$parent.inputType = 'none';
    }
    if ($scope.$parent.inputType == 'none') {
      $scope.$parent.newInputType = '';
    }

    $scope.classifier = CLASSIFIER_MAPPING[$scope.inputType];
    if (!$scope.classifier) {
      warningsData.addWarning('Invalid input type: ' + $scope.inputType);
      $scope.$parent.classifier = 'none';
    }

    console.log($scope.states[$scope.stateId]);
    // Change $scope.states to the default for the new classifier type.
    $scope.states[$scope.stateId]['dests'] =
        DEFAULT_DESTS[$scope.classifier].slice();

    if ($scope.classifier != 'finite') {
      $scope.saveStateChange('states');
    }
    // Update the graph.
    drawStateGraph($scope.states);
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
        console.log('IMAGEID');
        console.log(data.image_id);
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

    $scope.saveWidget(arg.data, index);
  });

  $scope.saveWidget = function(widgetCode, index) {
    $scope.addContentToIframe('widgetPreview' + index, widgetCode);

    // TODO(sll): This does not update the view value when widgetCode is
    // called from the repository. Fix this.
    $scope.widgetCode = widgetCode;
    // TODO(sll): Escape widgetCode first!
    // TODO(sll): Need to ensure that anything stored server-side cannot lead
    //     to malicious behavior (e.g. the user could do his/her own POST
    //     request). Get a security review done on this feature.

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
}

GuiEditor.$inject = ['$scope', '$http', 'stateDataFactory',
    'explorationDataFactory', 'warningsData', 'activeInputData'];
