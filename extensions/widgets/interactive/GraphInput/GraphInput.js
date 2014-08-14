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

oppia.directive('oppiaInteractiveGraphInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/GraphInput',
      controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
        $scope.errorMessage = '';
        $scope.graph = {'vertices': [], 'edges': [], 'isDirected': false, 'isWeighted': false, 'isLabeled': false};

        var testGraph = {
          "vertices":  [
            {"x": 50, "y": 50},
            {"x": 100, "y": 50},
            {"x": 50, "y": 100}
          ],
          "edges":  [
            {"src": 0, "dst": 1}, 
            {"src": 0, "dst": 2}
          ]
        };
        
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
          $scope.movePermissions = ($attrs.movePermissionsWithValue == "true") ? true : false;
          $scope.vertexEditPermissions = ($attrs.vertexEditPermissionsWithValue == "true") ? true : false;
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

oppia.directive('oppiaResponseGraphInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/GraphInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        
      }]
    };
  }
]);

/*
 * Directive for graph-viz.
 * Template is in extensions/dependencies/graph_viz.html
 * Requires $scope to have a $scope.graph object
 * TODO(czxcjx): Is there a better place to put this code than in this file?
 */
oppia.directive('graphViz', function() {
  return {
    restrict: 'E',
    templateUrl: 'graphViz/graphVizSvg',
    controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
      if ($scope.graph === undefined) {
        $scope.graph = {'vertices': [], 'edges': [], 'isDirected': false, 'isWeighted': false, 'isLabeled': false};
      }
      
      $scope.modes = {
        SELECT: 0,
        ADD_EDGE: 1,
        ADD_VERTEX: 2,
        DELETE: 3
      };

      //The current state of the UI and stuff like that
      $scope.state = {
        modes: $scope.modes,
        currentMode: $scope.modes.SELECT,
        //Vertex currently being hovered over
        hoverVertex: null,
        //If in ADD_EDGE mode, source vertex of the new edge, if it exists
        addEdgeVertex: null,
        //Currently dragged vertex
        dragVertex: null,
        //Mouse position in SVG coordinates
        mouseX: 0,
        mouseY: 0,
        vertexEditPermissions: $scope.vertexEditPermissions,
        movePermissions: $scope.movePermissions
      };

      //TODO(czxcjx): Find better way of getting offset()
      var vizContainer = $($element).find(".oppia-graph-viz-svg");
      $scope.mousemoveGraphSVG = function(event) {
        $scope.state.mouseX = event.pageX - vizContainer.offset().left;
        $scope.state.mouseY = event.pageY - vizContainer.offset().top;
        if ($scope.state.dragVertex !== null) {
          $scope.graph.vertices[$scope.state.dragVertex].x = $scope.state.mouseX;
          $scope.graph.vertices[$scope.state.dragVertex].y = $scope.state.mouseY;
        }
      };

      $scope.clickGraphSVG = function(event) {
        if ($scope.state.currentMode == $scope.modes.ADD_VERTEX && $scope.vertexEditPermissions) {
          $scope.graph.vertices.push({
            x: $scope.state.mouseX,
            y: $scope.state.mouseY,
            label: ""
          });
        }
      };

      $scope.init = function() {
        initButtons();
      }; 
      $scope.init();
      
      function initButtons() {
        $scope.buttons = [$scope.modes.SELECT, $scope.modes.ADD_EDGE];
        if ($scope.vertexEditPermissions) {
          $scope.buttons.push($scope.modes.ADD_VERTEX);
        }
        $scope.buttons.push($scope.modes.DELETE);
      }
      $scope.setMode = function(mode, $event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.state.currentMode = mode;
        $scope.state.addEdgeVertex = null;
      };

    }]
  }
}); 

oppia.directive('graphInputVertex', ['$document', function($document) {
  return function($scope, $element, $attrs) {
    $scope.clickGraphVertex = function(graph, state) {
      if (state.currentMode == state.modes.DELETE && state.vertexEditPermissions) {
        graph.edges = $.map(graph.edges, function(edge) {
          if (edge.src == $scope.$index || edge.dst == $scope.$index) {
            return null;
          }
          if (edge.src > $scope.$index) {
            edge.src--;
          }
          if (edge.dst > $scope.$index) {
            edge.dst--;
          }
          return edge;
        });
        graph.vertices.splice($scope.$index, 1);
      }
    };

    $scope.mousedownGraphVertex = function(graph, state) {
      if (state.currentMode == state.modes.ADD_EDGE) {
        state.addEdgeVertex = $scope.$index;
        $document.on("mouseup", clearAddEdgeVertex);
        function clearAddEdgeVertex() {
          if (state.hoverVertex !== null) {
            if (checkValidEdge(graph, state.addEdgeVertex, state.hoverVertex)) {
              graph.edges.push({
                src: state.addEdgeVertex,
                dst: state.hoverVertex,
                weight: 1
              });
            }
          }
          state.addEdgeVertex = null;
          $scope.$apply();
          $document.off("mouseup", clearAddEdgeVertex);
        }
      } else if (state.currentMode == state.modes.SELECT && state.movePermissions) {
        state.dragVertex = $scope.$index;
      }
    };

    $scope.mouseupGraphVertex = function(graph, state) {
      state.dragVertex = null;
    };
    
    function checkValidEdge(graph, src, dst) {
      if (src === null || dst === null || src == dst) {
        return false;
      }
      for (var i = 0; i < graph.edges.length; i++) {
        if (src == graph.edges[i].src && dst == graph.edges[i].dst) {
          return false;
        }
      }
      return true;
    }
  };
}]);

oppia.directive('graphInputEdge', ['$document', function($document){
  return function($scope, $element, $attrs) {
    $scope.clickGraphEdge = function(graph, state) {
      if (state.currentMode == state.modes.DELETE) {
        graph.edges.splice($scope.$index, 1);
      }
    }
  };
}]);
