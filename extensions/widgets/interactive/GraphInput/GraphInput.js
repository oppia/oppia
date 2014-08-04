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
        $scope.graph = {'vertices':[], 'edges':[], 'isDirected':[], 'isWeighted':[], 'isLabeled':[]};

        var testGraph = {"vertices":[{"x":50,"y":50},{"x":100,"y":50},{"x":50,"y":100}],"edges":[{"src":0,"dst":1},{"src":0,"dst":2}]}

        $scope.modes = {
          SELECT: 0,
          ADD_EDGE: 1,
          ADD_VERTEX: 2,
          DELETE: 3
        };
        $scope.currentMode = $scope.modes.SELECT;

        //Current vertex being hovered over
        $scope.currentVertex = null;
        //If in add edge mode, contains the currently selected vertex, if there is one
        $scope.addEdgeVertex = null;

        //Mouse positions in svg coordinates
        $scope.mouseX = 0;
        $scope.mouseY = 0;
        var vizContainer = $($element).find(".oppia-graph-svg");
        vizContainer.on('mousemove', function(event) {
          $scope.mouseX = event.pageX-vizContainer.offset().left;
          $scope.mouseY = event.pageY-vizContainer.offset().top;
          $scope.$apply();
        });
        
        //Updates graph using json in input field
        $scope.updateGraphFromInput = function() {
          updateGraphFromJSON($($element).find('.json-graph-input').val());
        }

        //Updates graph using testGraph (for debugging)
        $scope.updateTestGraph = function() {
          $scope.graph = $.extend(true, {}, testGraph);
        }
        
        $scope.submitGraph = function() {
          var strGraph = JSON.stringify($scope.graph);
          $scope.$parent.$parent.submitAnswer(strGraph, 'submit');
        };
        
        $scope.init = function() {
          updateGraphFromJSON($attrs.graphWithValue);
          $scope.movePermissions = ($attrs.movePermissionsWithValue=="true")?true:false;
          $scope.vertexEditPermissions = ($attrs.vertexEditPermissionsWithValue=="true")?true:false;
          initButtons();
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

        function initButtons() {
          $scope.buttons = [$scope.modes.SELECT,$scope.modes.ADD_EDGE];
          //Hmm, is it supposed to be a string?
          if ($attrs.vertexEditPermissionsWithValue=="true") {
            $scope.buttons.push($scope.modes.ADD_VERTEX);
          }
          $scope.buttons.push($scope.modes.DELETE);
        }
        $scope.setMode = function(mode) {
          $scope.currentMode = mode;
          $scope.addEdgeVertex = null;
        };
      }]
    };
  }
]);

oppia.directive('graphInputVertex', ['$document', function($document){
  return function($scope,$element,$attrs) {
    //Starting event.pageX and event.pageY coordinates for mousemove
    var startX = 0;
    var startY = 0;
    //Starting cx and cy coordinates for svg element
    var startCX = 0;
    var startCY = 0;
    //TODO(czxcjx): Figure out a better way to pass the parent scope to the vertex
    // Tried replacing it with a different way, but for some reason ng-attr- stops
    // evaluating correctly. Probably should take a look again some other day
    var graph = $scope.$parent.graph;
    var vertex = graph.vertices[$scope.$index];
    
    $element.on('mousedown', function(event){
      event.preventDefault();

      //Dragging a vertex around
      if ($scope.$parent.currentMode == $scope.$parent.modes.SELECT &&
          $scope.$parent.movePermissions) {
        startX = event.pageX;
        startY = event.pageY;
        startCX = parseInt($attrs.cx);
        startCY = parseInt($attrs.cy);

        $document.on('mousemove', dragMouseMove);
        $document.on('mouseup', dragMouseUp);

      //Adding a new edge
      } else if ($scope.$parent.currentMode == $scope.$parent.modes.ADD_EDGE) { 
        if ($scope.$parent.addEdgeVertex === null) {
          $scope.$parent.addEdgeVertex = $scope.$index;
          $document.on('mouseup', tryAddEdge);
        }
        $scope.$parent.$apply();
        
      //Deleting a vertex (and associated edges)
      } else if ($scope.$parent.currentMode == $scope.$parent.modes.DELETE &&
                 $scope.$parent.vertexEditPermissions) {
        graph.edges = $.map(graph.edges,function(edge){
          if (edge.src == $scope.$index || edge.dst == $scope.$index) return null;
          if (edge.src > $scope.$index) edge.src--;
          if (edge.dst > $scope.$index) edge.dst--;
          return edge;
        });
        graph.vertices.splice($scope.$index,1);
        $scope.$parent.$apply();
      }
    });

    $($element).mouseenter(function(){
      $scope.$parent.currentVertex = $scope.$index;
    }).mouseleave(function(){
      if ($scope.$parent.currentVertex === $scope.$index) {
        $scope.$parent.currentVertex = null;
      }
    });

    //TODO(czxcjx): Prevent vertices from leaving boundaries of svg element
    function dragMouseMove(event) {
      vertex.x = event.pageX - startX + startCX;
      vertex.y = event.pageY - startY + startCY;
      $scope.$parent.$apply();
    }

    function dragMouseUp(event) {
      $document.off('mousemove', dragMouseMove);
      $document.off('mouseup', dragMouseUp);
    }

    function checkValidEdge(src, dst) {
      if (src === null || dst === null) return false;
      if (src == dst) return false;
      return true;
    }

    function tryAddEdge(event) {
      var srcIndex = $scope.$parent.addEdgeVertex;
      var dstIndex = $scope.$parent.currentVertex;

      if (checkValidEdge(srcIndex, dstIndex)) {
        graph.edges.push({
          src: srcIndex,
          dst: dstIndex,
          weight: 1
        });
      }
      
      $scope.$parent.addEdgeVertex = null;
      $scope.$parent.$apply();
      $document.off('mouseup', tryAddEdge);
    }
  };
}]);

oppia.directive('graphInputEdge', ['$document', function($document){
  return function($scope,$element,$attrs) {
    var graph = $scope.$parent.graph;
    $element.on('click',function(event){
      if ($scope.$parent.currentMode == $scope.$parent.modes.DELETE) {
        graph.edges.splice($scope.$index,1);
        $scope.$parent.$apply();
      }
    });
  };
}]);
