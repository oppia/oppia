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

function WidgetRepository($scope, $http, activeInputData) {
  $scope.widgetDataUrl = '/widgetrepository/data';
  $scope.widgetParams = [];

  $scope.loadPage = function(data) {
    $scope.parentIndex = data.parent_index || null;
    $scope.widgets = data.widgets;
    // Display previews of each widget.
    for (var category in data.widgets) {
      for (var i = 0; i < $scope.widgets[category].length; ++i) {
        var rawCode = $scope.widgets[category][i].raw;
        $scope.addContentToIframeWithId(
            'widget-' + category + '-' + i,
            $scope.createCustomizedCode(
                $scope.widgets[category][i].params, null, rawCode));
      }
    }
  };

  // Creates the final, parameterized code for a widget.
  $scope.createCustomizedCode = function(params, customValues, rawCode) {
    var result = rawCode;
    for (var param in params) {
      var val = param.value;
      if (customValues && (param.name in customValues)) {
        val = customValues[param.name];
      }

      // TODO(sll): Figure out whether to add single quotes around a string
      // using "formattedVal = '\'' + val + '\''". Currently we don't.
      var formattedVal = val;
      // The following regex matches {{, then arbitrary whitespace, then the
      // parameter name, then arbitrary whitespace, then }}.
      result = result.replace(
          new RegExp('{{\\s*' + param.name + '\\s*}}', 'g'), formattedVal);
    }
    return result;
  };

  var dataUrl = $scope.widgetDataUrl;
  if ('interactive' in WidgetRepositoryConfig) {
    dataUrl += '?interactive=true';
  }
  if ('parent_index' in WidgetRepositoryConfig) {
    dataUrl += '?parent_index=';
    dataUrl += WidgetRepositoryConfig['parent_index'];
  }

  // Initializes the widget list using data from the server.
  $http.get(dataUrl).success(function(data) {
    $scope.loadPage(data);
  });

  // Inserts content into the preview tab just before it is shown.
  $('#modalTabs a[href="#preview"]').on('show', function (e) {
    $scope.addContentToIframeWithId(
      'modalPreview',
      $scope.createCustomizedCode($scope.modalWidget.params, null, $scope.modalWidget.raw));
  });

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
    // Display the new widget, but DO NOT save the code.
    var customizedCode = $scope.createCustomizedCode(
        $scope.widgets[category][index].params, $scope.customizedParams,
        $scope.widgets[category][index].raw);
    $scope.$apply();
    $scope.addContentToIframeWithId(
        'widget-' + category + '-' + index, customizedCode);
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
      widget: $scope.cloneObject($scope.widgets[category][index])
    };
    // Transform the {PARAM_NAME: {'value': ..., 'obj_type': ...}} dict
    // into a {PARAM_NAME: PARAM_VALUE} dict before returning it.
    for (var param in data.widget.params) {
      data.widget.params[param] = data.widget.params[param].value;
    }

    // Parent index for non-interactive widgets.
    if ($scope.parentIndex !== null) {
      data.parentIndex = $scope.parentIndex;
      data.widgetType = 'noninteractive';
    } else {
      data.widgetType = 'interactive';
    }

    window.parent.postMessage(data, '*');
  };

  $scope.previewWidget = function(category, index) {
    $scope.previewCategory = category;
    $scope.previewIndex = index;

    var rawCode = $scope.widgets[category][index].raw;
    $scope.addContentToIframeWithId(
        'widgetPreview',
        $scope.createCustomizedCode(
             $scope.widgets[category][index].params, null, rawCode));
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
WidgetRepository.$inject = ['$scope', '$http', 'activeInputData'];
