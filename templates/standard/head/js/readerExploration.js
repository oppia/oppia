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
    $scope.html = '<div>' + data.html.join(' </div><div> ') + '</div>';
    $scope.inputTemplate = data.input_template;
    $scope.title = data.title;
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
        $scope.storyUrl,
        $('.answer').serialize(),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshStory);
  };

  $scope.clearProgress = function() {
    $http.delete(
        $scope.explorationDataUrl, '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      location.reload();
    });
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
ReaderExploration.$inject = ['$scope', '$http', '$timeout'];
SetCtrl.$inject = ['$scope', '$http'];

