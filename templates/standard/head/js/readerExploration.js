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

function ReaderExploration($scope, $http, $timeout) {
  // The pathname is expected to be: /[exploration_id]
  var pathnameArray = window.location.pathname.split('/');
  $scope.explorationId = pathnameArray[2];
  $scope.explorationDataUrl = '/learn/' + $scope.explorationId + '/data';

  $scope.loadPage = function(data) {
    console.log(data);
    $scope.categories = data.categories;
    $scope.html = data.html;
    $scope.inputTemplate = data.input_template;
    $scope.stateId = data.state_id;
    $scope.title = data.title;
    $scope.widgets = data.widgets;
    // We need to generate the HTML (with the iframe) before populating it.
    // TODO(sll): Try and get rid of the "$digest already in progress" error here.
    $scope.$apply();
    if (data.widgets.length > 0) {
      $scope.addContentToIframe('widgetCompiled' + data.widgets[0].blockIndex + '-' +
          data.widgets[0].index, data.widgets[0].code);
    }
  };

  // Initializes the story page using data from the server.
  $http.get($scope.explorationDataUrl)
      .success(function(data) {
        $scope.explorationTitle = data.title;
        $scope.loadPage(data);
      }).error(function(data) {
        $scope.addWarning(
            data.error || 'There was an error loading the story.');
      });

  $scope.submitAnswer = function() {
    $http.post(
        '/learn/' + $scope.explorationId + '/' + $scope.stateId,
        $('.answer').serialize(),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshPage);
  };

  $scope.refreshPage = function(data) {
    console.log(data);
    $scope.html += data.html;
    // We need to generate the HTML (with the iframe) before populating it.
    // TODO(sll): Try and get rid of the "$digest already in progress" error here.
    $scope.$apply();
    if ($scope.widgets.length > 0) {
      $scope.addContentToIframe('widgetCompiled' + $scope.widgets[0].blockIndex + '-' +
          $scope.widgets[0].index, $scope.widgets[0].code);
    }
  }
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
ReaderExploration.$inject = ['$scope', '$http', '$timeout'];
SetCtrl.$inject = ['$scope', '$http'];

