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
    $scope.answer = data.default_answer;
    $scope.blockNumber = data.block_number;
    $scope.categories = data.categories;
    $scope.html = data.html;
    $scope.inputTemplate = data.interactive_widget_html;
    // $scope.inputTemplate = data.input_template;   //OLD
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
    ).success($scope.refreshPage)
    .error(function(data) {
      warningsData.addWarning(
        data.error || 'There was an error processing your input.');
    });
  };

  $scope.refreshPage = function(data) {
    console.log(data);
    $scope.blockNumber = data.block_number;
    $scope.categories = data.categories;
    $scope.inputTemplate = data.interactive_widget_html;
    $scope.stateId = data.state_id;

    $scope.html += data.html;
    $scope.answer = data.default_answer;
    // We need to generate the HTML (with the iframe) before populating it.
    // TODO(sll): Try and get rid of the "$digest already in progress" error here.
    $scope.$apply();
    if ($scope.widgets.length > 0) {
      $scope.addContentToIframe('widgetCompiled' + $scope.widgets[0].blockIndex + '-' +
          $scope.widgets[0].index, $scope.widgets[0].code);
    }
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
ReaderExploration.$inject = ['$scope', '$http', '$timeout', 'warningsData'];
