function WidgetRepository($scope, $http, activeInputData) {
  $scope.widgetDataUrl = '/widgetrepository/data/';
  $scope.widgetParams = [];

  $scope.fillFrame = function(domId, widgetCode) {
    var F = $('#' + domId);
    // TODO(sll): Clear this before writing anything.
    F[0].contentWindow.document.write(widgetCode);
  };

  $scope.loadPage = function(data) {
    console.log(data);
    $scope.widgets = data.widgets;
    for (category in data.widgets) {
      for (var i = 0; i < $scope.widgets[category].length; ++i) {
        var widgetCode = $scope.widgets[category][i].raw;
        $scope.$apply();
        $scope.fillFrame('widget-' + category + '-' + i, widgetCode);
      }
    }
  };

  // Initializes the widget list using data from the server.
  $http.get($scope.widgetDataUrl).success(function(data) {
    console.log(data);
    $scope.loadPage(data);
  });

  $scope.addParam = function(index) {
    activeInputData.name = 'modalWidget.widgetParam.' + $scope.widgetParams.length;
  };

  $scope.saveParam = function(params) {
    params.push({
        'name': $scope.newParamName, 'description': $scope.newParamDescription,
        'type': $scope.newParamType, 'default': $scope.newParamDefault
    });
    $scope.newParamName = '';
    $scope.newParamDescription = '';
    $scope.newParamType = '';
    $scope.newParamDefault = '';
    activeInputData.name = 'modalWidget';
  };

  $('#editWidgetModal').on('hidden', function () {
    $scope.newWidgetIsBeingAdded = false;
  })

  $scope.editWidget = function(widget) {
    $('#editWidgetModal').modal();
    $scope.modalWidget = widget;
  };

  $scope.closeEditorModal = function(widget) {
    if (widget) {
      var request = $.param(
        {'widget': JSON.stringify(widget)},
        true
      );

      $http.put(
        '/widgetrepository/',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
      ).success(function(widgetData) {
        console.log('Data saved successfully');
        console.log(widgetData);
        var category = widgetData.widget.category;
        for (var i = 0; i < $scope.widgets[category].length; ++i) {
          if ($scope.widgets[category][i].name == widgetData.widget.name) {
            var widgetCode = $scope.widgets[category][i].raw;
            $scope.$apply();
            $scope.fillFrame('widget-' + category + '-' + i, widgetCode);
          }
        }
      });
    }
  };

  $scope.previewModalWidget = function(widgetCode) {
    $scope.addContentToIframe('modalPreview', widgetCode);
    $('#modalTabs a[href="#preview"]').tab('show');
  };

  $scope.addWidget = function() {
    $scope.newWidgetIsBeingAdded = true;
    $('#editWidgetModal').modal();
    $scope.modalWidget = {params: [], blurb: '', name: '', raw: '', category: ''};
  };

  $scope.saveNewWidget = function(widget) {
    console.log(widget);
    // TODO(sll): Check that the name, raw and category are non-empty.
    // Also, check that the name is not a duplicate.

    var request = $.param(
      {'widget': JSON.stringify(widget)},
      true
    );

    $http.post(
      '/widgetrepository/',
      request,
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(widgetData) {
      $('#editWidgetModal').modal('hide');
      if (widgetData.widget.category in $scope.widgets) {
        $scope.widgets[widgetData.widget.category].push(widgetData.widget);
      } else {
        $scope.widgets[widgetData.widget.category] = [widgetData.widget];
      }
      activeInputData.clear();
    });
  };


  /**
   * Displays a modal allowing customization of the widget's parameters.
   * @param {string} id The id of the widget to customize.
   */
  $scope.showCustomizeModal = function(id) {
     $scope.modalIndex = id;
     $('#customizeModal').modal();
  };

  $scope.selectWidget = function(widget) {
    window.parent.postMessage(widget, '*');
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
WidgetRepository.$inject = ['$scope', '$http', 'activeInputData'];
