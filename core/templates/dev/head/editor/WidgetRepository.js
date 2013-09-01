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
  $scope.widgetType = ('interactive' in WidgetRepositoryConfig ?
                       'interactive' : 'noninteractive');

  var dataUrl = '/widgetrepository/data';
  dataUrl += ('/' + $scope.widgetType);
  if ('parent_index' in WidgetRepositoryConfig) {
    dataUrl += ('?parent_index=' + WidgetRepositoryConfig['parent_index']);
  }

  // Initializes the widget list using data from the server.
  $http.get(dataUrl).success(function(data) {
    $scope.parentIndex = data.parent_index || null;
    $scope.widgets = data.widgets;
  });

  $scope.selectWidget = function(category, index) {
    var data = {
      widget: $scope.cloneObject($scope.widgets[category][index]),
      widgetType: $scope.widgetType
    };

    // Parent index for non-interactive widgets.
    if ($scope.widgetType == 'noninteractive') {
      data.parentIndex = $scope.parentIndex;
      if ($scope.parentIndex === null) {
        console.log('ERROR: Non-interactive widget has no parentIndex.');
      }
    }

    window.parent.postMessage(data, '*');
  };

  $scope.previewWidget = function(category, index) {
    $scope.addContentToIframeWithId(
      'widgetPreview', $scope.widgets[category][index].raw);
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
WidgetRepository.$inject = ['$scope', '$http', 'activeInputData'];
