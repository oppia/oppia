function GuiEditor($scope, $http, stateData, explorationData, warningsData, activeInputData) {
  /**
   * Sets up the state editor, given its data from the backend.
   * @param {Object} data Data received from the backend about the state.
   */
  $scope.$on('stateData', function() {
    // If a widget exists, show its compiled version and populate the widget
    // view fields.
    for (var i = 0; i < $scope.stateContent.length; ++i) {
      if ($scope.stateContent[i].type == 'widget') {
        var widgetFrameId = 'widgetPreview' + i;
        // Get the widget with id $scope.stateContent[i].value
        $http.get('/widgets/' + $scope.stateContent[i].value).
            success(function(data) {
              console.log(data);
              $scope.widgetCode = data.raw;
              $scope.addContentToIframe(widgetFrameId, $scope.widgetCode);
            }).error(function(data) {
              warningsData.addWarning(
                  'Widget could not be loaded: ' + String(data.error));
            });
      }
    }
  });

  // Clears modal window data when it is closed.
  $scope.closeModalWindow = function() {
    $scope.isModalWindowActive = false;
    $scope.activeModalCategoryId = '';
    $scope.textData = '';
  };

  $scope.closeModalWindow();

  $scope.deleteCategory = function(categoryId) {
    // TODO(wilsonhong): Modify the following to remove the edge corresponding
    // to the specific category ID from the graph (rather than a generic edge
    // from the start node to the destination node).
    $scope.states[$scope.stateId]['dests'].splice(categoryId, 1);
    $scope.saveStateChange('states');
    drawStateGraph($scope.states);
  };

  $scope.showEditorModal = function(actionType, categoryId) {
    // TODO(sll): Get this modal dialog to show up next to the button that was
    // clicked. Do this by getting the DOM object, and the clicked position
    // from it using $(buttonElement).position().left,
    // $(buttonElement).position().top.

    $scope.isModalWindowActive = true;
    $('.editorInput').hide();
    $('#' + actionType + 'Input').show();
    $('.firstInputField').focus();

    if (actionType != 'view') {
      $scope.activeModalCategoryId = categoryId;
      if ($scope.states[$scope.stateId]['dests'][categoryId][actionType]) {
        if (actionType === 'text') {
          $scope[actionType + 'Data'] =
              $scope.states[$scope.stateId]['dests'][categoryId][actionType];
        }
      }
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

  $scope.saveText = function() {
    var categoryId = $scope.activeModalCategoryId;
    $scope.states[$scope.stateId]['dests'][categoryId]['text'] = $scope.textData;
    $scope.saveStateChange('states');
    $scope.closeModalWindow();
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

  /**
   * Saves a change to a state property.
   * @param {String} property The state property to be saved.
   */
  $scope.saveStateChange = function(property) {
    if (!$scope.stateId)
      return;
    activeInputData.clear();

    var requestParameters = {state_id: $scope.stateId};

    if (property == 'stateName') {
      requestParameters['state_name'] = $scope.stateName;
    } else if (property == 'stateContent') {
      // Remove null values from $scope.stateContent.
      $scope.tempstateContent = [];
      for (var i = 0; i < $scope.stateContent.length; ++i) {
        if ($scope.stateContent[i]['value'])
          $scope.tempstateContent.push($scope.stateContent[i]);
      }
      requestParameters['state_content'] = JSON.stringify($scope.tempstateContent);
    } else if (property == 'inputType' || property == 'states') {
      requestParameters['input_type'] = $scope.inputType;
      if ($scope.classifier != 'none' &&
          $scope.states[$scope.stateId]['dests'].length == 0) {
        warningsData.addWarning(
            'Interactive questions should have at least one category.');
        $scope.changeInputType('none');
        return;
      }

      var actionsForBackend = $scope.states[$scope.stateId].dests;
      console.log(actionsForBackend);
      for (var ind = 0;
           ind < $scope.states[$scope.stateId]['dests'].length; ++ind) {
        actionsForBackend[ind]['category'] =
            $scope.states[$scope.stateId]['dests'][ind].category;
        actionsForBackend[ind]['dest'] =
            $scope.states[$scope.stateId]['dests'][ind].dest;
      }
      requestParameters['actions'] = JSON.stringify(actionsForBackend);
    }

    var request = $.param(requestParameters, true);
    console.log('REQUEST');
    console.log(request);

    $http.put(
        $scope.explorationUrl + '/' + $scope.stateId + '/data',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      console.log('Changes saved successfully.');
      drawStateGraph($scope.states);
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
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
    $scope.closeModalWindow();
    $scope.inputType = newInputType;
    if (!$scope.inputType) {
      $scope.inputType = 'none';
    }
    if ($scope.inputType == 'none') {
      $scope.newInputType = '';
    }

    $scope.classifier = CLASSIFIER_MAPPING[$scope.inputType];
    if (!$scope.classifier) {
      warningsData.addWarning('Invalid input type: ' + $scope.inputType);
      $scope.classifier = 'none';
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

  $scope.setActiveImage = function(image) {
    $scope.image = image;
  };

  $scope.saveImage = function(index) {
    $('#newImageForm')[0].reset();
    activeInputData.clear();
    image = $scope.image;

    if (!image || !image.type.match('image.*')) {
      warningsData.addWarning('This file is not recognized as an image.');
      return;
    }

    $('#uploadImageLoading').show();
    // The content creator has uploaded an image.
    var form = new FormData();
    form.append('image', image);

    $.ajax({
        url: '/imagehandler/',
        data: form,
        processData: false,
        contentType: false,
        type: 'POST',
        datatype: 'json',
        success: function(data) {
          data = jQuery.parseJSON(data);
          if (data.image_id) {
            $scope.$apply(function() {
              $scope.stateContent[index].value = data.image_id;
              $scope.saveStateChange('stateContent');
            });
          } else {
            warningsData.addWarning(
                'There was an error saving your image. Please retry later.');
          }
          $('#uploadImageLoading').hide();
        },
        error: function(data) {
          warningsData.addWarning(data.error || 'Error communicating with server.');
          $('#uploadImageLoading').hide();
        }
    });
  };

  $scope.deleteImage = function(index) {
    // TODO(sll): Send a delete request to the backend datastore.
    $scope.stateContent[index].value = '';
    $scope.saveStateChange('stateContent');
  };

  // Receive messages from the widget repository.
  $scope.$on('message', function(event, arg) {
    console.log(arg);
    // Save the code. TODO(sll): fix this, the $scope is wrong.
    console.log(arg.data.raw);
    // Send arg.data.raw to the preview. Change tab to preview. Save code in backend.

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

  $scope.isWidgetInstateContent = function() {
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
