function ReaderExploration($scope, $http, $timeout, warningsData) {
  // The pathname is expected to be: /[exploration_id]
  $scope.explorationId = pathnameArray[2];
  $scope.explorationDataUrl = '/learn/' + $scope.explorationId + '/data';

  // Initializes the story page using data from the server.
  $scope.initializePage = function() {
    $http.get($scope.explorationDataUrl)
        .success(function(data) {
          $scope.explorationTitle = data.title;
          $scope.loadPage(data);
        }).error(function(data) {
          warningsData.addWarning(
              data.error || 'There was an error loading the story.');
        });
  };

  $scope.initializePage();

  $scope.loadPage = function(data) {
    console.log(data);
    $scope.blockNumber = data.block_number;
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

  $scope.submitAnswer = function() {
    $http.post(
        '/learn/' + $scope.explorationId + '/' + $scope.stateId,
        $('.answer').serialize() +
            '&block_number=' + JSON.stringify($scope.blockNumber),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshPage);
  };

  $scope.refreshPage = function(data) {
    console.log(data);
    $scope.blockNumber = data.block_number;
    $scope.categories = data.categories;
    $scope.inputTemplate = data.input_template;
    $scope.stateId = data.state_id;

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
        '/learn/' + $scope.explorationId + '/' + $scope.stateId,
        'answer=' + JSON.stringify($scope.answer) +
            '&block_number=' + JSON.stringify($scope.blockNumber),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success($scope.refreshPage);
    $scope.answer = [];
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ReaderExploration.$inject = ['$scope', '$http', '$timeout', 'warningsData'];
SetCtrl.$inject = ['$scope', '$http'];

