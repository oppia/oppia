function WidgetRepository($scope, $http, activeInputData) {
  $scope.widgetDataUrl = '/widgetrepository/data/';
  $scope.widgetParams = [];

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

  /**
   * Displays a modal allowing customization of the widget's parameters.
   * @param {string} id The id of the widget to customize.
   */
  $scope.showModal = function(id) {
     $scope.modalIndex = id;
     $('#customizeModal').modal();
  };

  $scope.addParam = function(index) {
    activeInputData.name = 'newWidget.widgetParam.' + $scope.widgetParams.length;
  };

  $scope.saveParam = function() {
    $scope.widgetParams.push({
        'name': $scope.newParamName, 'description': $scope.newParamDescription,
        'type': $scope.newParamType, 'default': $scope.newParamDefault
    });
    $scope.newParamName = '';
    $scope.newParamDescription = '';
    $scope.newParamType = '';
    $scope.newParamDefault = '';
    activeInputData.name = 'newWidget';
  };

  $scope.selectWidget = function(widget) {
    window.parent.postMessage(widget, '*');
  };

  $scope.fillFrame = function(domId, widgetCode) {
    var F = $('#' + domId);
    F[0].contentWindow.document.write(widgetCode);
  };

  $scope.createNewWidget = function() {
    activeInputData.name = 'newWidget';
  };

  $scope.saveWidget = function(widgetCode) {
    $scope.addContentToIframe('widgetPreview', widgetCode);

    // TODO(sll): Check that the name and widgetCode are non-empty.

    // TODO(sll): This does not update the view value when widgetCode is
    // called from the repository. Fix this.
    $scope.widgetCode = widgetCode;
    // TODO(sll): Escape widgetCode first!
    // TODO(sll): Need to ensure that anything stored server-side cannot lead
    //     to malicious behavior (e.g. the user could do his/her own POST
    //     request). Get a security review done on this feature.

    var newWidget = {
        'raw': JSON.stringify(widgetCode),
        'name': $scope.newWidgetName,
        'params': JSON.stringify($scope.widgetParams)
    }

    var request = $.param(
        newWidget,
        true
    );

    $http.post(
      '/widgetrepository/',
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
      // Check that the data has been saved correctly.
      console.log(widgetData);
      $scope.widgets.push({
        'raw': widgetCode, 'name': $scope.newWidgetName, 'params': $scope.widgetParams
      });
      activeInputData.clear();
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
WidgetRepository.$inject = ['$scope', '$http', 'activeInputData'];
