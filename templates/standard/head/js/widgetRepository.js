function Widgets($scope, $http) {
  $scope.widgetDataUrl = '/widgets/repository/data/';

  // TODO(sll): Make sure the code retrieved from the server is safe before
  // running it in the student's browser.
  $scope.loadPage = function(data) {
    console.log(data);
    $scope.widgets = data.widgets;
    for (var i = 0; i < data.widgets.length; ++i) {
      var widgetCode = data.widgets[i];
      caja.load(document.getElementById('widget-' + i),
        caja.policy.net.NO_NETWORK,
        function(frame) {
          frame.cajoled('https://fake.url', widgetCode['js'],
              widgetCode['html']).run();
        });
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
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Widgets.$inject = ['$scope', '$http'];
