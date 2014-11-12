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
        $scope.resetGraph = function() {
          updateGraphFromJSON($attrs.graphWithValue);
        };
        
        $scope.init = function() {
          updateGraphFromJSON($attrs.graphWithValue);
          function stringToBool(str) {
            return (str === 'true');
          }
          $scope.canAddVertex = stringToBool($attrs.canAddVertexWithValue);          
          $scope.canDeleteVertex = stringToBool($attrs.canDeleteVertexWithValue);
          $scope.canEditVertexLabel = stringToBool($attrs.canEditVertexLabelWithValue);
          $scope.canMoveVertex = stringToBool($attrs.canMoveVertexWithValue);
          $scope.canAddEdge = stringToBool($attrs.canAddEdgeWithValue);
          $scope.canDeleteEdge = stringToBool($attrs.canDeleteEdgeWithValue);
          $scope.canEditEdgeWeight = stringToBool($attrs.canEditEdgeWeightWithValue);
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

oppia.factory('graphDetailService', [function(){
  return {
    VERTEX_RADIUS: 6,
    EDGE_WIDTH: 3,
    getDirectedEdgeArrowPoints: function(graph, index) {
      var ARROW_WIDTH = 5;
      var ARROW_HEIGHT = 10;

      var edge = graph.edges[index];
      var srcVertex = graph.vertices[edge.src];
      var dstVertex = graph.vertices[edge.dst];
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
    },
    getEdgeCentre: function(graph, index) {
      var edge = graph.edges[index];
      var srcVertex = graph.vertices[edge.src];
      var dstVertex = graph.vertices[edge.dst];
      return {
        x: (srcVertex.x + dstVertex.x) / 2.0,
        y: (srcVertex.y + dstVertex.y) / 2.0
      };
    }
  };
}]);

oppia.directive('oppiaResponseGraphInput', [
  'oppiaHtmlEscaper', 'graphDetailService', function(oppiaHtmlEscaper, graphDetailService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/GraphInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.graph = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);

        $scope.VERTEX_RADIUS = graphDetailService.VERTEX_RADIUS;
        $scope.EDGE_WIDTH = graphDetailService.EDGE_WIDTH;

        $scope.getDirectedEdgeArrowPoints = function(index) {
          return graphDetailService.getDirectedEdgeArrowPoints($scope.graph, index);
        };
        $scope.getEdgeCentre = function(index) {
          return graphDetailService.getEdgeCentre($scope.graph, index);
        };

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
      canAddVertex: '=',
      canDeleteVertex: '=',
      canMoveVertex: '=',
      canEditVertexLabel: '=',
      canAddEdge: '=',
      canDeleteEdge: '=',
      canEditEdgeWeight: '=',
      canEditOptions: '=',
    },
    templateUrl: 'graphViz/graphVizSvg',
    controller: ['$scope', '$element', '$attrs', '$document', 'focusService', 'graphDetailService', function($scope, $element, $attrs, $document, focusService, graphDetailService) {
      var _MODES = {
        MOVE: 0,
        ADD_EDGE: 1,
        ADD_VERTEX: 2,
        DELETE: 3
      };

      // The current state of the UI and stuff like that
      $scope.state = {
        currentMode: _MODES.MOVE,
        // Vertex, edge, mode button, label currently being hovered over
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
        // Starting vertex position of dragged vertex in SVG coordinates
        vertexDragStartX: 0,
        vertexDragStartY: 0,
        // Starting mouse position of dragged vertex
        mouseDragStartX: 0,
        mouseDragStartY: 0,
      };
      
      $scope.VERTEX_RADIUS = graphDetailService.VERTEX_RADIUS;
      $scope.EDGE_WIDTH = graphDetailService.EDGE_WIDTH;

      var vizContainer = $($element).find('.oppia-graph-viz-svg');
      $scope.vizWidth = vizContainer.width();
      $scope.mousemoveGraphSVG = function(event) {
        $scope.state.mouseX = event.pageX - vizContainer.offset().left;
        $scope.state.mouseY = event.pageY - vizContainer.offset().top;
        if ($scope.state.currentlyDraggedVertex !== null) {
          $scope.graph.vertices[$scope.state.currentlyDraggedVertex].x = $scope.state.vertexDragStartX + ($scope.state.mouseX - $scope.state.mouseDragStartX);
          $scope.graph.vertices[$scope.state.currentlyDraggedVertex].y = $scope.state.vertexDragStartY + ($scope.state.mouseY - $scope.state.mouseDragStartY);
        }
      };

      $scope.onClickGraphSVG = function(event) {
        if ($scope.state.currentMode === _MODES.ADD_VERTEX && $scope.canAddVertex) {
          $scope.graph.vertices.push({
            x: $scope.state.mouseX,
            y: $scope.state.mouseY,
            label: ''
          });
        }
        if ($scope.state.hoveredVertex === null) {
          $scope.state.selectedVertex = null;
        }
        if ($scope.state.hoveredEdge === null) {
          $scope.state.selectedEdge = null;
        }
      };

      $scope.init = function() {
        initButtons();
        $scope.state.currentMode = $scope.buttons[0].mode;
      }; 
      $scope.init();
      
      function initButtons() {
        $scope.buttons = [];
        if ($scope.canMoveVertex) {
          $scope.buttons.push({
            text: '\uE068',
            description: 'Move',
            mode: _MODES.MOVE
          });
        }
        if ($scope.canAddEdge) {
          $scope.buttons.push({
            text: '\uE144',
            description: 'Link',
            mode: _MODES.ADD_EDGE
          });
        }
        if ($scope.canAddVertex) {
          $scope.buttons.push({
            text: '\u002B',
            description: 'Add',
            mode: _MODES.ADD_VERTEX
          });
        }
        if ($scope.canDeleteVertex || $scope.canDeleteEdge) {
          $scope.buttons.push({
            text: '\u2212',
            description: 'Delete',
            mode: _MODES.DELETE
          });
        }
      }

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
          if ($scope.canDeleteVertex) {
            deleteVertex(index);
          }
        }
        if ($scope.state.currentMode !== _MODES.DELETE &&
            $scope.graph.isLabeled &&
            $scope.canEditVertexLabel) {
          beginEditVertexLabel(index);
        }
      };
      $scope.onMousedownVertex = function(index) {
        if ($scope.state.currentMode === _MODES.ADD_EDGE) {
          if ($scope.canAddEdge) {
            beginAddEdge(index);
          }
        } else if ($scope.state.currentMode === _MODES.MOVE) {
          if ($scope.canMoveVertex) {
            beginDragVertex(index);
          }
        }
      };
      
      $scope.onClickVertexLabel = function(index) {
        if ($scope.graph.isLabeled && $scope.canEditVertexLabel) {
          beginEditVertexLabel(index);
        }
      };

      // Edge events
      $scope.onClickEdge = function(index) {
        if ($scope.state.currentMode === _MODES.DELETE) {
          if ($scope.canDeleteEdge) {
            deleteEdge(index);
          }
        }
        if ($scope.state.currentMode !== _MODES.DELETE &&
            $scope.graph.isWeighted && 
            $scope.canEditEdgeWeight) {
          beginEditEdgeWeight(index);
        }
      };
      $scope.onClickEdgeWeight = function(index) {
        if ($scope.graph.isWeighted && $scope.canEditEdgeWeight) {
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
        $scope.state.vertexDragStartX = $scope.graph.vertices[index].x;
        $scope.state.vertexDragStartY = $scope.graph.vertices[index].y;
        $scope.state.mouseDragStartX = $scope.state.mouseX;
        $scope.state.mouseDragStartY = $scope.state.mouseY;
      }
      function endDragVertex() {
        $scope.state.currentlyDraggedVertex = null;
        $scope.state.vertexDragStartX = 0;
        $scope.state.vertexDragStartY = 0;
        $scope.state.mouseDragStartX = 0;
        $scope.state.mouseDragStartY = 0;
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
      var DELETE_COLOR = 'red';
      var HOVER_COLOR = 'aqua';
      var SELECT_COLOR = 'orange';
      var DEFAULT_COLOR = 'black';
      $scope.getEdgeColor = function(index) {
        if ($scope.state.currentMode === _MODES.DELETE && 
            index === $scope.state.hoveredEdge &&
            $scope.canDeleteEdge) {
          return DELETE_COLOR;
        } else if ($scope.graph.isWeighted &&
                   index === $scope.state.hoveredEdge &&
                   $scope.canEditEdgeWeight) {
          return HOVER_COLOR;
        } else if ($scope.state.selectedEdge === index) {
          return SELECT_COLOR;
        } else {
          return DEFAULT_COLOR;
        }
      };
      $scope.getVertexColor = function(index) {
        if ($scope.state.currentMode === _MODES.DELETE &&
            index === $scope.state.hoveredVertex &&
            $scope.canDeleteVertex) {
          return DELETE_COLOR;
        } else if (index === $scope.state.currentlyDraggedVertex) {
          return HOVER_COLOR;
        } else if ($scope.graph.isLabeled &&
                   index === $scope.state.hoveredVertex &&
                   $scope.canEditVertexLabel) {
          return HOVER_COLOR;
        } else if ($scope.state.selectedVertex === index) {
          return SELECT_COLOR;
        } else {
          return DEFAULT_COLOR;
        }
      }
      $scope.getDirectedEdgeArrowPoints = function(index) {
        return graphDetailService.getDirectedEdgeArrowPoints($scope.graph, index);
      };
      $scope.getEdgeCentre = function(index) {
        return graphDetailService.getEdgeCentre($scope.graph, index);
      };
    }]
  }
}); 
