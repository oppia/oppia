// Copyright 2014 The Oppia Authors. All Rights Reserved.
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

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

oppia.directive('segmentedImageEditor', [
  '$rootScope', '$sce', '$compile', 'warningsData', function($rootScope, $sce, $compile, warningsData) {
    return {
      link: function(scope, element, attrs) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_TEMPLATES_URL + scope.$parent.objType;
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: true,
      template: '<div ng-include="getTemplateUrl()"></div>',
      controller: function($scope, $element, $attrs) {
        $scope.alwaysEditable = true;
        $scope.getPreviewUrl = function(imageUrl) {
          return $sce.trustAsResourceUrl(
            '/imagehandler/' + $rootScope.explorationId + '/' +
            encodeURIComponent(imageUrl)
          );
        };
        $scope.mouseX = 0;
        $scope.mouseY = 0;
        $scope.$watch("$parent.value", function() {
          $scope.image = $($element).find('.oppia-segmented-image-editor-img');
          $scope.imageWidth = $scope.image.width();
          console.log($scope.image);
          $scope.imageHeight = $scope.image.height();
        });
        $scope.onImgMouseDown = function(event) {
          event.preventDefault();
        };
        $scope.onImgMouseMove = function(event) {
          console.log($scope.image.offset());
          $scope.mouseX = event.pageX - $scope.image.offset().left;
          $scope.mouseY = event.pageY - $scope.image.offset().top;
        }
      }
    };
  }
]);


