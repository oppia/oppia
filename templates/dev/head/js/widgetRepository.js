function Widgets($scope, $http) {
  $scope.widgetDataUrl = '/widgets/repository/data/';

  $scope.loadPage = function(data) {
    console.log(data);
    $scope.widgets = data.widgets;
    for (var i = 0; i < data.widgets.length; ++i) {
      var widgetCode = data.widgets[i];
      $scope.$apply();
      $scope.fillFrame('widget-' + i, widgetCode.raw);  
    }
  };

  // Initializes the widget list using data from the server.
  $http.get($scope.widgetDataUrl).success(function(data) {
    console.log(data);
    $scope.loadPage(data);
  });

  $scope.selectWidget = function(widget) {
    window.parent.postMessage(widget, '*');
  };

  $scope.fillFrame = function(domId, widgetCode) {
    var F = $('#' + domId);
    F[0].contentWindow.document.write(widgetCode);
  }
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Widgets.$inject = ['$scope', '$http'];
