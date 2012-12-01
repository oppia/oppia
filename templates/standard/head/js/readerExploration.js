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
  $scope.categories = data.categories;

  // The pathname is expected to be: /[story_id]
  var pathnameArray = window.location.pathname.split('/');
  $scope.story = { id: pathnameArray[2] };
  $scope.storyUrl = '/reader/' + $scope.story.id + '/data';
  $scope.contentPanelIsActive = true;
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

