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

// Makes the corresponding elements sortable.
// TODO(sll): This directive doesn't actually update the underlying array,
// so ui-sortable still needs to be used. Try and fix this.
oppia.directive('sortable', function($compile, explorationData) {
  return {
    restrict: 'C',
    link: function(scope, element, attrs) {
      $(element).sortable({
        scroll: false,
        stop: function(event, ui) {
          if ($(ui.item).hasClass('oppia-state-text-item')) {
            // This prevents a collision with the itemDroppable trashing.
            // TODO(sll): Now that we don't have drag-and-drop trashing, is this
            // still needed?
            var content = explorationData.getStateProperty(scope.stateId, 'content');
            for (var i = 0; i < content.length; ++i) {
              if (content[i] === undefined) {
                content.splice(i, 1);
                --i;
              }
            }
            explorationData.saveStateData(scope.stateId, {'content': content});
            scope.$apply();
          }
        }
      });
    }
  };
});

function GuiEditor($scope, $http, $routeParams, explorationData, warningsData, activeInputData) {
  $scope.$parent.stateId = $routeParams.stateId;
  // Switch to the stateEditor tab when this controller is activated.
  $scope.$apply($('#editorViewTab a[href="#stateEditor"]').tab('show'));

  $scope.init = function(data) {
    $scope.content = data.content;
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
  };

  // Initializes the GuiEditor.
  $scope.init(explorationData.getStateData($scope.stateId));
  console.log('Initializing GUI editor');

  $scope.$on('explorationData', function() {
    // TODO(sll): Does this actually receive anything?
    console.log('Init content');
    $scope.init(explorationData.getStateData($scope.stateId));
  });

  $scope.saveStateContent = function() {
    explorationData.saveStateData($scope.stateId, {'content': $scope.content});
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
    $scope.content.splice(index, 1);
    $scope.saveStateContent();
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
  
GuiEditor.$inject = ['$scope', '$http', '$routeParams', 'explorationData',
    'warningsData', 'activeInputData'];
