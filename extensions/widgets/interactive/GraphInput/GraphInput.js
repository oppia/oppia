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

        $scope.submitGraph = function() {
          // angular.copy needed to strip $$hashkey from the graph 
          $scope.$parent.$parent.submitAnswer(angular.copy($scope.graph), 'submit');
        };
        
        $scope.init = function() {
          updateGraphFromJSON($attrs.graphWithValue);
          $scope.movePermissions = ($attrs.movePermissionsWithValue === 'true') ? true : false;
          $scope.vertexEditPermissions = ($attrs.vertexEditPermissionsWithValue === 'true') ? true : false;
        };
        $scope.init();
        
        // TODO(czxcjx): Write this function
        function checkValidGraph(graph) {
          return true;
        }

        function updateGraphFromJSON (jsonGraph) {
          var newGraph = oppiaHtmlEscaper.escapedJsonToObj(jsonGraph);
          if (checkValidGraph(newGraph)) {
            $scope.graph = newGraph;
          } else {
            $scope.errorMessage = 'Invalid graph!';
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
 * TODO(czx): Move directive to GraphEditor.js once it gets included in the learner page
 */
oppia.directive('graphViz', function() {
  return {
    restrict: 'E',
    scope: {
      graph: '=',
      vertexEditPermissions: '=',
      movePermissions: '=',
      optionsEditPermissions: '=',
    },
    templateUrl: 'graphViz/graphVizSvg',
    controller: ['$scope', '$element', '$attrs', '$document', 'focusService', function($scope, $element, $attrs, $document, focusService) {
      var _MODES = {
        MOVE: 0,
        ADD_EDGE: 1,
        ADD_VERTEX: 2,
        DELETE: 3
      };

      // The current state of the UI and stuff like that
      $scope.state = {
        currentMode: _MODES.MOVE,
        // Vertex, edge, mode button currently being hovered over
        hoveredVertex: null,
        hoveredEdge: null,
        hoveredModeButton: null,
        // If in ADD_EDGE mode, source vertex of the new edge, if it exists
        addEdgeVertex: null,
        // Currently dragged vertex
        currentlyDraggedVertex: null,
        // Selected vertex for editing label
        selectedVertex: null,
        // Selected edge for editing weight
        selectedEdge: null,
        // Mouse position in SVG coordinates
        mouseX: 0,
        mouseY: 0,
      };
      
      $scope.vertexRadius = 6;
      $scope.edgeWidth = 3;

      var vizContainer = $($element).find('.oppia-graph-viz-svg');
      $scope.vizWidth = vizContainer.width();
      $scope.mousemoveGraphSVG = function(event) {
        $scope.state.mouseX = event.pageX - vizContainer.offset().left;
        $scope.state.mouseY = event.pageY - vizContainer.offset().top;
        if ($scope.state.currentlyDraggedVertex !== null) {
          $scope.graph.vertices[$scope.state.currentlyDraggedVertex].x = $scope.state.mouseX;
          $scope.graph.vertices[$scope.state.currentlyDraggedVertex].y = $scope.state.mouseY;
        }
      };

      $scope.onClickGraphSVG = function(event) {
        if ($scope.state.currentMode === _MODES.ADD_VERTEX && $scope.vertexEditPermissions) {
          $scope.graph.vertices.push({
            x: $scope.state.mouseX,
            y: $scope.state.mouseY,
            label: ''
          });
        }
        if ($scope.state.hoveredVertex === null) {
          $scope.state.selectedVertex = null;
        }
        $scope.state.selectedEdge = null;
      };

      $scope.init = function() {
        initButtons();
        $scope.state.currentMode = $scope.buttons[0].mode;
      }; 
      $scope.init();
      
      function initButtons() {
        $scope.buttons = [];
        if ($scope.movePermissions) {
          $scope.buttons.push({
            text: '\uE068',
            mode: _MODES.MOVE
          });
        }
        $scope.buttons.push({
          text: '\uE144',
          mode: _MODES.ADD_EDGE
        });
        if ($scope.vertexEditPermissions) {
          $scope.buttons.push({
            text: '\u002B',
            mode: _MODES.ADD_VERTEX
          });
        }
        $scope.buttons.push({
          text: '\u2212',
          mode: _MODES.DELETE
        });
      }

      // TODO(czx): Consider a better way to make the tooltip appear
      $scope.getModeTooltipText = function() {
        if ($scope.state.hoveredModeButton == _MODES.MOVE) {
          return "[Move vertices]";
        } else if ($scope.state.hoveredModeButton == _MODES.ADD_EDGE) {
          return "[Add edges]";
        } else if ($scope.state.hoveredModeButton == _MODES.ADD_VERTEX) {
          return "[Add vertices]";
        } else if ($scope.state.hoveredModeButton == _MODES.DELETE) {
          return "[Delete]";
        }
        return "";
      };

      $scope.graphOptions = [{
        text: 'Labeled',
        option: 'isLabeled'
      },
      {
        text: 'Directed',
        option: 'isDirected'
      },
      {
        text: 'Weighted',
        option: 'isWeighted'
      }];
      $scope.toggleGraphOption = function(option) {
        // Handle the case when we have two edges s -> d and d -> s
        if (option === 'isDirected' && $scope.graph[option]) {
          _deleteRepeatedUndirectedEdges();
        }
        $scope.graph[option] = !$scope.graph[option];
      };
      $scope.setMode = function(mode, $event) {
        // Prevents new vertex from being added in add edge mode
        $event.preventDefault();
        $event.stopPropagation();
        $scope.state.currentMode = mode;
        $scope.state.addEdgeVertex = null;
        $scope.state.selectedVertex = null;
        $scope.state.selectedEdge = null;
      };

      // TODO(czx): Consider if there's a neat way to write a reset()
      // function to clear bits of $scope.state (e.g. currentlyDraggedVertex, addEdgeVertex)

      // Vertex events
      $scope.onClickVertex = function(index) {
        if ($scope.state.currentMode === _MODES.DELETE) {
          if ($scope.vertexEditPermissions) {
            deleteVertex(index);
          }
        }
      };
      $scope.onMousedownVertex = function(index) {
        if ($scope.state.currentMode === _MODES.ADD_EDGE) {
          beginAddEdge(index);
        } else if ($scope.state.currentMode === _MODES.MOVE) {
          if ($scope.movePermissions) {
            beginDragVertex(index);
          }
        }
      };
      
      $scope.onDoubleclickVertex = function(index) {
        if ($scope.graph.isLabeled) {
          beginEditVertexLabel(index);
        }
      };
      $scope.onDoubleclickVertexLabel = function(index) {
        if ($scope.graph.isLabeled) {
          beginEditVertexLabel(index);
        }
      };

      // Edge events
      $scope.onClickEdge = function(index) {
        if ($scope.state.currentMode === _MODES.DELETE) {
          deleteEdge(index);
        }
      };
      $scope.onDoubleclickEdgeWeight = function(index) {
        if ($scope.graph.isWeighted) {
          beginEditEdgeWeight(index);
        }
      };
     
      // Document event
      $scope.onMouseupDocument = function() {
        if ($scope.state.currentMode === _MODES.ADD_EDGE) {
          if ($scope.state.hoveredVertex !== null) {
            tryAddEdge($scope.state.addEdgeVertex, $scope.state.hoveredVertex);
          }
          endAddEdge();
        } else if ($scope.state.currentMode === _MODES.MOVE) {
          if ($scope.state.currentlyDraggedVertex !== null) {
            endDragVertex();
          }
        }
      };
      $document.on("mouseup", $scope.onMouseupDocument);

      // Actions
      function beginAddEdge(startIndex) {
        $scope.state.addEdgeVertex = startIndex;
      }
      function endAddEdge() {
        $scope.state.addEdgeVertex = null;
      }
      function tryAddEdge(startIndex, endIndex) {
        if (
            startIndex === null ||
            endIndex === null ||
            startIndex === endIndex ||
            startIndex < 0 ||
            endIndex < 0 ||
            startIndex >= $scope.graph.vertices.length ||
            endIndex >= $scope.graph.vertices.length) {
          return;
        }
        for (var i = 0; i < $scope.graph.edges.length; i++) {
          if (startIndex === $scope.graph.edges[i].src && endIndex === $scope.graph.edges[i].dst) {
            return;
          }
          if (!$scope.graph.isDirected) {
            if (startIndex === $scope.graph.edges[i].dst && endIndex === $scope.graph.edges[i].src) {
              return;
            }
          }
        }
        $scope.graph.edges.push({
          src: startIndex,
          dst: endIndex,
          weight: 1
        });
        return;
      }
      function beginDragVertex(index) {
        $scope.state.currentlyDraggedVertex = index;
      }
      function endDragVertex() {
        $scope.state.currentlyDraggedVertex = null;
      }
      function beginEditVertexLabel(index) {
        $scope.state.selectedVertex = index;
        focusService.setFocus('vertexLabelEditBegun');
      }

      function beginEditEdgeWeight(index) {
        $scope.state.selectedEdge = index;
        focusService.setFocus('edgeWeightEditBegun');
      }
      function deleteEdge(index) {
        $scope.graph.edges.splice(index,1);
        $scope.state.hoveredEdge = null;
      }
      function _deleteRepeatedUndirectedEdges() {
        for (var i = 0; i < $scope.graph.edges.length; i++) {
          var edge1 = $scope.graph.edges[i];
          for (var j = i + 1; j < $scope.graph.edges.length; j++) {
            var edge2 = $scope.graph.edges[j];
            if ((edge1.src === edge2.src && edge1.dst === edge2.dst) ||
                (edge1.src === edge2.dst && edge1.dst === edge2.src)) {
              deleteEdge(j);
              j--;
            }
          }
        }
      }
      function deleteVertex(index) {
        // Using jQuery's map instead of normal array.map because 
        // it removes elements for which the callback returns null
        $scope.graph.edges = $.map($scope.graph.edges, function(edge) {
          if (edge.src === index || edge.dst === index) {
            return null;
          }
          if (edge.src > index) {
            edge.src--;
          }
          if (edge.dst > index) {
            edge.dst--;
          }
          return edge;
        }); 
        $scope.graph.vertices.splice(index, 1);
        $scope.state.hoveredVertex = null;
      }
      $scope.selectedVertexLabelGetterSetter = function(label) {
        if ($scope.state.selectedVertex === null) {
          return '';
        }
        if (angular.isDefined(label)) {
          $scope.graph.vertices[$scope.state.selectedVertex].label = label;
        }
        return $scope.graph.vertices[$scope.state.selectedVertex].label;
      };
      $scope.selectedEdgeWeight = function(weight) {
        if ($scope.state.selectedEdge === null) {
          return '';
        }
        if (angular.isDefined(weight) && angular.isNumber(weight)) {
          $scope.graph.edges[$scope.state.selectedEdge].weight = weight;
        }
        return $scope.graph.edges[$scope.state.selectedEdge].weight;
      };


      // Styling functions
      $scope.getEdgeColor = function(index) {
        if ($scope.state.currentMode === _MODES.DELETE && 
            index === $scope.state.hoveredEdge) {
          return 'red';
        } else {
          return 'black';
        }
      };
      $scope.getHoverVertexColor = function() {
        if ($scope.state.currentMode === _MODES.DELETE &&
            $scope.vertexEditPermissions) {
          return 'red';
        } else {
          return 'aqua';
        }
      };
      $scope.getDirectedEdgeArrowPoints = function(index) {
        var ARROW_WIDTH = 5;
        var ARROW_HEIGHT = 10;

        var edge = $scope.graph.edges[index];
        var srcVertex = $scope.graph.vertices[edge.src];
        var dstVertex = $scope.graph.vertices[edge.dst];
        var dx = dstVertex.x - srcVertex.x;
        var dy = dstVertex.y - srcVertex.y;
        var length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) {
          return '';
        }
        dx /= length;
        dy /= length;
        var endX = dstVertex.x - 4 * dx;
        var endY = dstVertex.y - 4 * dy;
        
        var ret = '';
        ret += 
          endX + ',' + 
          endY + ' ';
        ret += 
          (endX - ARROW_HEIGHT * dx + ARROW_WIDTH * dy) + ',' + 
          (endY - ARROW_HEIGHT * dy - ARROW_WIDTH * dx) + ' ';
        ret += 
          (endX - ARROW_HEIGHT * dx - ARROW_WIDTH * dy) + ',' + 
          (endY - ARROW_HEIGHT * dy + ARROW_WIDTH * dx);
        return ret;
      };
      $scope.getEdgeCentre = function(index) {
        var edge = $scope.graph.edges[index];
        var srcVertex = $scope.graph.vertices[edge.src];
        var dstVertex = $scope.graph.vertices[edge.dst];
        return {
          x: (srcVertex.x + dstVertex.x) / 2.0,
          y: (srcVertex.y + dstVertex.y) / 2.0
        };
      };
    }]
  }
}); 
