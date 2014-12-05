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
        $scope.mouseX = $scope.mouseY = 0;
        $scope.origX = $scope.origY = 0;
        $scope.rectX = $scope.rectY = 0;
        $scope.rectWidth = $scope.rectHeight = 0;
        $scope.isDrag = false;
        $scope.$watch('$parent.value.imagePath', function(newVal) {
          if (newVal === '') {
            return;
          }
          $('<img/>').attr('src', $scope.getPreviewUrl(newVal)).load(
            function() {
              $scope.imageWidth = this.width;
              $scope.imageHeight = this.height;
              $scope.$apply();
            }
          );
        });
        $scope.onSvgMouseMove = function(event) {
          var svgElement = $($element).find('.oppia-segmented-image-editor-svg');
          $scope.mouseX = event.pageX - svgElement.offset().left;
          $scope.mouseY = event.pageY - svgElement.offset().top;
          $scope.rectX = Math.min($scope.origX, $scope.mouseX);
          $scope.rectY = Math.min($scope.origY, $scope.mouseY);
          $scope.rectWidth = Math.abs($scope.origX - $scope.mouseX);
          $scope.rectHeight = Math.abs($scope.origY - $scope.mouseY);
        };
        $scope.onSvgMouseDown = function(event) {
          event.preventDefault();
          $scope.origX = $scope.mouseX;
          $scope.origY = $scope.mouseY;
          $scope.rectWidth = $scope.rectHeight = 0;
          $scope.isDrag = true;
        }
        $scope.onSvgMouseUp = function(event) {
          $scope.isDrag = false;
          $scope.$parent.value.imageRegions.push([
            [$scope.rectX, $scope.rectY],
            [$scope.rectX + $scope.rectWidth, $scope.rectY + $scope.rectHeight]
          ]);
        };
        $scope.resetImage = function() {
          $scope.$parent.value.imagePath = '';
          $scope.$parent.value.imageRegions = [];
        };
      }
    };
  }
]);


