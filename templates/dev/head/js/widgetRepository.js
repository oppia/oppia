function Widgets($scope, $http, activeInputData) {
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
  };

  $scope.setActiveInput = function(newActiveInput) {
    activeInputData.name = newActiveInput;
  };

  $scope.createNewWidget = function() {
    $scope.setActiveInput('addWidget');
  };

  $scope.saveWidget = function(widgetCode) {
    $scope.addContentToIframe('widgetPreview', widgetCode);

    // TODO(sll): This does not update the view value when widgetCode is
    // called from the repository. Fix this.
    $scope.widgetCode = widgetCode;
    // TODO(sll): Escape widgetCode first!
    // TODO(sll): Need to ensure that anything stored server-side cannot lead
    //     to malicious behavior (e.g. the user could do his/her own POST
    //     request). Get a security review done on this feature.

    var request = $.param(
        {'raw': JSON.stringify(widgetCode),
         'name': $scope.newWidgetName
        },
        true
    );

    $http.post(
      '/widgets/repository/',
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
      // Check that the data has been saved correctly.
      console.log(widgetData);
      $('#widgetTabs a:first').tab('show');
      activeInputData.clear();
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
Widgets.$inject = ['$scope', '$http', 'activeInputData'];
