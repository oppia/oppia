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

/**
 * Directive for the GraphInput interactive widget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaInteractiveGraphInput',[
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/GraphInput',
      controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
        $scope.errorMessage = '';
        //var testGraph = {"vertices":[{"x":50,"y":50},{"x":100,"y":50},{"x":50,"y":100}],"edges":[{"src":0,"dst":1},{"src":0,"dst":2}]}
        $scope.graph = {'vertices':[], 'edges':[], 'isDirected':[], 'isWeighted':[], 'isLabeled':[]};
        
        //Updates graph using json in input field
        $scope.updateGraphFromInput = function() {
          updateGraphFromJSON(d3.select($element[0]).select('.json-graph-input')[0][0].value);
        }
        
        $scope.submitGraph = function() {
          var strGraph = JSON.stringify($scope.graph);
          $scope.$parent.$parent.submitAnswer(strGraph, 'submit');
        };
        
        $scope.init = function() {
          updateGraphFromJSON($attrs.graphWithValue);
        };
        $scope.init();
        
        //TODO(czxcjx): Actually write this function?
        function checkValidGraph(graph) {
          return true;
        }

        function updateGraphFromJSON (jsonGraph) {
          var newGraph = JSON.parse(jsonGraph);
          if (checkValidGraph(newGraph)) {
            $scope.graph = newGraph;
          } else {
            $scope.errorMessage = "Invalid graph!";
          }
        }

      }]
    };
  }
]);

oppia.directive('graphInputDraggableVertex', ['$document', function($document){
  return function(scope, element, attr){
    //Starting event.pageX and event.pageY coordinates for mousemove
    var startX = 0;
    var startY = 0;
    //Starting cx and cy coordinates for svg element
    var startCX = 0;
    var startCY = 0;
    var graph = scope.$parent.graph;
    var index = parseInt(attr.index);
    var vertex = graph.vertices[index];
    element.on('mousedown', function(event){
      event.preventDefault();

      startX = event.pageX;
      startY = event.pageY;
      startCX = parseInt(attr.cx);
      startCY = parseInt(attr.cy);

      $document.on('mousemove', mousemove);
      $document.on('mouseup', mouseup);
    });

    //TODO(czxcjx): Prevent vertices from leaving boundaries of svg element
    function mousemove(event) {
      vertex.x = event.pageX - startX + startCX;
      vertex.y = event.pageY - startY + startCY;
      scope.$parent.$apply();
    }

    function mouseup(event) {
      $document.off('mousemove', mousemove);
      $document.off('mouseup', mouseup);
    }
  };
}]);
