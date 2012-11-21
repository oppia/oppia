oppia.directive('angularHtmlBind', function($compile) {
  return function(scope, elm, attrs) {
    scope.$watch(attrs.angularHtmlBind, function(newValue, oldValue) {
      if (newValue && newValue !== oldValue) {
        elm.html(newValue);
        console.log(elm.contents());
        $compile(elm.contents())(scope);
      }
    });
  };
});

function Reader($scope, $http, $timeout) {
  // The pathname is expected to be: /[story_id]
  var pathnameArray = window.location.pathname.split('/');
  $scope.story = { id: pathnameArray[2] };
  $scope.storyUrl = '/reader/' + $scope.story.id + '/data';
  $scope.contentPanelIsActive = true;

  $scope.refreshStory = function(data) {
    if (!$scope.chapterList)
      $scope.chapterList = data.chapter_list;
    console.log(data);
    $scope.questionId = data.question_id;
    if (data.hasOwnProperty('group_id'))
      $scope.groupId = data.group_id;
    if (data.hasOwnProperty('group_name'))
      $scope.groupName = data.group_name;
    if (data.currChapter)
      $scope.currChapter = parseInt(data.curr_chapter);
    if ($scope.chapterList && !$scope.questionId)
      $scope.contentPanelIsActive = false;
    else
      $scope.contentPanelIsActive = true;
    $scope.html = '<div>' + data.html.join(' </div><div> ') + '</div>';
    $scope.categories = data.categories;
    $scope.inputTemplate = data.input_template;
    $scope.currentPage = data.current_page;
    $scope.maxPage = data.max_page;
    for (var i = 0; i < data.widgets.length; ++i) {
      for (var j = 0; j < data.widgets[i].length; ++j) {
        widgetCode = data.widgets[i][j];
        caja.load(document.getElementById('widgetCompiled' + i + '-' + j),
            caja.policy.net.NO_NETWORK,
            function(frame) {
              frame.cajoled('https://fake.url', widgetCode['js'],
                  widgetCode['html']).run();
            });
      }
    }
  };

  // Initializes the story page using data from the server.
  $http.get($scope.storyUrl)
      .success(function(data) {
        $scope.storyName = data.story_name;
        $scope.refreshStory(data);
        $scope.switchChapter(0);
      }).error(function(data) {
        $scope.addWarning(
            data.error || 'There was an error loading the story.');
      });

  $scope.submitAnswer = function() {
    $http.post(
        $scope.storyUrl,
        $('.answer').serialize(),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshStory);
  };

  $scope.changePage = function(page) {
    $http.get(
        $scope.storyUrl + '/' + page, '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshStory);
  };

  $scope.clearProgress = function() {
    $http.delete(
        $scope.storyUrl, '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      location.reload();
    });
  };

  $scope.getQuestionPage = function(chapterIndex, groupId) {
    $http.get(
        $scope.storyUrl + '/' + chapterIndex + '/' + groupId, '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshStory)
    .error(function(data) {
      $scope.addWarning(data.error);
    });
  };

  $scope.switchChapter = function(newChapter) {
    $scope.currChapter = newChapter;
    $scope.getQuestionPage(newChapter,
        $scope.chapterList[newChapter].groups[0].groupId);
  };
}

function SetCtrl($scope, $http) {
  $scope.answer = [];

  $scope.addElement = function() {
    $scope.answer.push($scope.newElement);
    $scope.newElement = '';
    console.log($scope.answer);
  };

  $scope.deleteElement = function(index) {
    $scope.answer = $scope.answer.splice(index, 1);
  };

  $scope.submitAnswer = function() {
    // Send a JSON version of $scope.answer to the backend.
    $http.post(
        $scope.storyUrl,
        'answer=' + JSON.stringify($scope.answer),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshStory);
    $scope.answer = [];
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Reader.$inject = ['$scope', '$http', '$timeout'];
SetCtrl.$inject = ['$scope', '$http'];
