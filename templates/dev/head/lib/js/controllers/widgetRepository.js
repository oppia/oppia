// Copyright 2012 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Controllers for the widget repository.
 *
 * @author sll@google.com (Sean Lip)
 */

 oppia.directive('notDuplicateWidget', function() {
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        for (var category in scope.widgets) {
          for (var i = 0; i < scope.widgets[category].length; ++i) {
            if (scope.widgets[category][i].name == viewValue) {
              ctrl.$setValidity('notDuplicateWidget', false);
              return undefined;
            }
          }
        }
        ctrl.$setValidity('notDuplicateWidget', true);
        return viewValue;
      });
    }
  };
});

function WidgetRepository($scope, $http, activeInputData) {
  $scope.widgetDataUrl = '/widgetrepository/data/';
  $scope.widgetParams = [];

  $scope.loadPage = function(data) {
    $scope.widgets = data.widgets;
    console.log(data);
    // Display previews of each widget.
    for (var category in data.widgets) {
      for (var i = 0; i < $scope.widgets[category].length; ++i) {
        var rawCode = $scope.widgets[category][i].raw;
        $scope.$apply();
        $scope.addContentToIframe(
            'widget-' + category + '-' + i,
            $scope.createCustomizedCode(
                $scope.widgets[category][i].params, null, rawCode));
      }
    }
  };

  // Creates the final, parameterized code for a widget.
  $scope.createCustomizedCode = function(params, customValues, rawCode) {
    var result = rawCode;
    for (var i = 0; i < params.length; i++) {
      var val = params[i]['default'];
      if (customValues && (params[i].name in customValues)) {
        val = customValues[params[i].name];
      }
      // TODO(sll): Figure out whether to add single quotes around a string
      // using "formattedVal = '\'' + val + '\''". Currently we don't.
      var formattedVal = val;
      // The following regex matches {{, then arbitrary whitespace, then the
      // parameter name, then arbitrary whitespace, then }}.
      result = result.replace(
          new RegExp('{{\\s*' + params[i].name + '\\s*}}', 'g'), formattedVal);
    }
    return result;
  };

  var dataUrl = $scope.widgetDataUrl;
  if ('interactive' in WidgetRepositoryConfig) {
    dataUrl += '?interactive=true';
  }

  // Initializes the widget list using data from the server.
  $http.get(dataUrl).success(function(data) {
    $scope.loadPage(data);
  });

  $scope.addParam = function(widget) {
    activeInputData.name = 'modalWidget.widgetParam.' + widget.params.length;
  };

  $scope.saveParam = function(widget) {
    widget.params.push({
        'name': $scope.newParamName, 'description': $scope.newParamDescription,
        'type': $scope.newParamType, 'default': $scope.newParamDefault
    });
    $scope.newParamName = '';
    $scope.newParamDescription = '';
    $scope.newParamType = '';
    $scope.newParamDefault = '';
    activeInputData.name = 'modalWidget';
    if (!$scope.newWidgetIsBeingAdded) {
      $scope.saveEditedWidget(widget);
    }
  };

  $scope.deleteParam = function(widget, index) {
    widget.params.splice(index, 1);
    activeInputData.name = 'modalWidget';
    if (!$scope.newWidgetIsBeingAdded) {
      $scope.saveEditedWidget(widget);
    }
  };

  // Clears the "new widget" indication when the modal window is closed.
  $('#editWidgetModal').on('hidden', function () {
    $scope.newWidgetIsBeingAdded = false;
  });

  // Inserts content into the preview tab just before it is shown.
  $('#modalTabs a[href="#preview"]').on('show', function (e) {
    $scope.addContentToIframe(
      'modalPreview',
      $scope.createCustomizedCode($scope.modalWidget.params, null, $scope.modalWidget.raw));
  });

  $scope.editWidget = function(widget) {
    $('#editWidgetModal').modal();
    $scope.modalWidget = widget;
  };

  $scope.saveEditedWidget = function(widget) {
    if (widget) {
      $http.put(
        '/widgetrepository/',
        $scope.createRequest({'widget': widget}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
      ).success(function(widgetData) {
        var category = widgetData.widget.category;
        for (var i = 0; i < $scope.widgets[category].length; ++i) {
          if ($scope.widgets[category][i].name == widgetData.widget.name) {
            var rawCode = $scope.widgets[category][i].raw;
            $scope.$apply();
            $scope.addContentToIframe(
                'widget-' + category + '-' + i,
                $scope.createCustomizedCode($scope.widgets[category][i].params, null, rawCode));
          }
        }
      });
    }
  };

  $scope.addWidget = function() {
    $scope.newWidgetIsBeingAdded = true;
    $('#editWidgetModal').modal();
    $('#modalTabs a[href="#code"]').tab('show');
    $scope.modalWidget = {
      params: [], description: '', name: '', raw: '', category: ''
    };
  };

  $scope.saveNewWidget = function(widget) {
    $http.post(
      '/widgetrepository/',
      $scope.createRequest({'widget': widget}),
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
    var customizedCode = $scope.createCustomizedCode(
        $scope.widgets[category][index].params, $scope.customizedParams,
        $scope.widgets[category][index].raw);
    $scope.$apply();
    $scope.addContentToIframe('widget-' + category + '-' + index, customizedCode);
    $scope.closeCustomizeModal();
  };

  $scope.closeCustomizeModal = function() {
    $scope.customizeCategory = '';
    $scope.customizeIndex = '';
    $('#customizeModal').modal('hide');
  };

  $scope.selectWidget = function(category, index) {
    var customizedCode = $scope.createCustomizedCode(
        $scope.widgets[category][index].params, $scope.customizedParams,
        $scope.widgets[category][index].raw);
    var data = {
      raw: customizedCode,
      widget: $scope.widgets[category][index]
    };

    window.parent.postMessage(data, '*');
  };

  $scope.previewWidget = function(category, index) {
    $scope.previewCategory = category;
    $scope.previewIndex = index;

    var rawCode = $scope.widgets[category][index].raw;
    $scope.addContentToIframe(
        'widgetPreview',
        $scope.createCustomizedCode(
             $scope.widgets[category][index].params, null, rawCode));
  };

  $scope.initializeWidgetParamEditor = function(index) {
    activeInputData.name = 'modalWidget.widgetParam.' + index;
  };

  $scope.hideWidgetParamEditor = function(index) {
    activeInputData.name = 'modalWidget';
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
WidgetRepository.$inject = ['$scope', '$http', 'activeInputData'];
