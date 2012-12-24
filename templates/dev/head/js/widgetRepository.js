function WidgetRepository($scope, $http, activeInputData) {
  $scope.widgetDataUrl = '/widgetrepository/data/';
  $scope.widgetParams = [];

  $scope.fillFrame = function(domId, widgetCode) {
    var F = $('#' + domId);
    F[0].contentWindow.document.open();
    console.log(widgetCode);
    F[0].contentWindow.document.write(widgetCode);
    F[0].contentWindow.document.close();
  };

  $scope.loadPage = function(data) {
    $scope.widgets = data.widgets;
    console.log(data);
    // Display previews of each widget.
    for (category in data.widgets) {
      for (var i = 0; i < $scope.widgets[category].length; ++i) {
        var rawCode = $scope.widgets[category][i].raw;
        $scope.$apply();
        $scope.fillFrame(
            'widget-' + category + '-' + i,
            $scope.createPreamble($scope.widgets[category][i].params, null) + rawCode);
      }
    }
  };

  // Creates the initial JavaScript for a widget, based on the parameters in
  // params.
  $scope.createPreamble = function(params, customValues) {
    var result = '<script>';
    for (var i = 0; i < params.length; i++) {
      var val = params[i]['default'];
      if (customValues && (params[i].name in customValues)) {
        val = customValues[params[i].name];
      }
      result += 'var ' + params[i].name + ' = ' + val + ';\n';
    }
    result += '<\/script>';
    return result;
  };

  // Initializes the widget list using data from the server.
  $http.get($scope.widgetDataUrl).success(function(data) {
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

  // Clears the "new widget" indication when the modal window is closed.
  $('#editWidgetModal').on('hidden', function () {
    $scope.newWidgetIsBeingAdded = false;
  });

  // Inserts content into the preview tab just before it is shown.
  $('#modalTabs a[href="#preview"]').on('show', function (e) {
    $scope.addContentToIframe(
      'modalPreview',
      $scope.createPreamble($scope.modalWidget.params, null) + $scope.modalWidget.raw);
  });

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

  $scope.addWidget = function() {
    $scope.newWidgetIsBeingAdded = true;
    $('#editWidgetModal').modal();
    $('#modalTabs a[href="#code"]').tab('show');
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
   * @param {string} category The category of the widget to customize.
   * @param {string} index The index of the widget in this category.
   */
  $scope.showCustomizeModal = function(category, index) {
    $scope.customizeCategory = category;
    $scope.customizeIndex = index;
    // TODO(sll): Have a global customizedParams for each widget id, which retains
    // state between successive invocations of the customize modal.
    $scope.customizedParams = [];
    $('#customizeModal').modal();
  };

  $scope.submitCustomization = function() {
    var category = $scope.customizeCategory;
    var index = $scope.customizeIndex;
    console.log($scope.customizedParams);
    // Display the new widget, but DO NOT save the code.
    var newRawCode = $scope.createPreamble(
        $scope.widgets[category][index].params, $scope.customizedParams) +
        $scope.widgets[category][index].raw;
    $scope.$apply();
    $scope.fillFrame('widget-' + category + '-' + index, newRawCode);
    $scope.closeCustomizeModal();
  };

  $scope.closeCustomizeModal = function() {
    $scope.customizeCategory = '';
    $scope.customizeIndex = '';
    $('#customizeModal').modal('hide');
  };

  $scope.selectWidget = function(category, index) {
    var rawCode = $scope.createPreamble(
        $scope.widgets[category][index].params, $scope.customizedParams) +
        $scope.widgets[category][index].raw;
    window.parent.postMessage(rawCode, '*');
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
WidgetRepository.$inject = ['$scope', '$http', 'activeInputData'];
