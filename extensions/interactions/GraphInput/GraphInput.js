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
 * Directive for the GraphInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.constant('GRAPH_INPUT_LEFT_MARGIN', 120);

oppia.directive('oppiaInteractiveGraphInput', [
  'oppiaHtmlEscaper', 'graphInputRulesService', function(
  oppiaHtmlEscaper, graphInputRulesService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interaction/GraphInput',
      controller: ['$scope', '$element', '$attrs',
          function($scope, $element, $attrs) {
        $scope.errorMessage = '';
        $scope.graph = {
          'vertices': [], 'edges': [], 'isDirected': false, 'isWeighted': false,
          'isLabeled': false };

        $scope.submitGraph = function() {
          // angular.copy needed to strip $$hashkey from the graph
          $scope.$parent.submitAnswer(
            angular.copy($scope.graph), graphInputRulesService);
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
          $scope.canDeleteVertex = stringToBool(
            $attrs.canDeleteVertexWithValue);
          $scope.canEditVertexLabel = stringToBool(
            $attrs.canEditVertexLabelWithValue);
          $scope.canMoveVertex = stringToBool($attrs.canMoveVertexWithValue);
          $scope.canAddEdge = stringToBool($attrs.canAddEdgeWithValue);
          $scope.canDeleteEdge = stringToBool($attrs.canDeleteEdgeWithValue);
          $scope.canEditEdgeWeight = stringToBool(
            $attrs.canEditEdgeWeightWithValue);
        };
        $scope.init();

        // TODO(czxcjx): Write this function
        function checkValidGraph(graph) {
          return true;
        }

        function updateGraphFromJSON(jsonGraph) {
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

oppia.factory('graphDetailService', [function() {
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
  'oppiaHtmlEscaper', 'graphDetailService', 'GRAPH_INPUT_LEFT_MARGIN',
      function(oppiaHtmlEscaper, graphDetailService, GRAPH_INPUT_LEFT_MARGIN) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/GraphInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.graph = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);

        $scope.VERTEX_RADIUS = graphDetailService.VERTEX_RADIUS;
        $scope.EDGE_WIDTH = graphDetailService.EDGE_WIDTH;
        $scope.GRAPH_INPUT_LEFT_MARGIN = GRAPH_INPUT_LEFT_MARGIN;

        $scope.getDirectedEdgeArrowPoints = function(index) {
          return graphDetailService.getDirectedEdgeArrowPoints(
            $scope.graph, index);
        };
        $scope.getEdgeCentre = function(index) {
          return graphDetailService.getEdgeCentre($scope.graph, index);
        };

      }]
    };
  }
]);

oppia.directive('oppiaShortResponseGraphInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/GraphInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        // TODO(bhenning): Improve this short response by using a small version
        // of the graph image instead of an arbitrary label of vertices and
        // edges.
        $scope.graph = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);

/*
 * Directive for graph-viz.
 * TODO(czx): Move directive to GraphEditor.js once it gets included in the
 * learner page
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
    controller: ['$scope', '$element', '$attrs', '$document', 'focusService',
                 'graphDetailService', 'GRAPH_INPUT_LEFT_MARGIN',
      function($scope, $element, $attrs, $document, focusService,
          graphDetailService, GRAPH_INPUT_LEFT_MARGIN) {
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
          // Original position of dragged vertex
          vertexDragStartX: 0,
          vertexDragStartY: 0,
          // Original position of mouse when dragging started
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
          // vertexDragStartX/Y and mouseDragStartX/Y are to make mouse-dragging
          // by label more natural, by moving the vertex according to the
          // difference from the original position. Otherwise, mouse-dragging by
          // label will make the vertex awkwardly jump to the mouse.
          if ($scope.state.currentlyDraggedVertex !== null &&
              ($scope.state.mouseX > GRAPH_INPUT_LEFT_MARGIN)) {
            $scope.graph.vertices[$scope.state.currentlyDraggedVertex].x =
              $scope.state.vertexDragStartX + ($scope.state.mouseX - $scope.state.mouseDragStartX);
            $scope.graph.vertices[$scope.state.currentlyDraggedVertex].y =
              $scope.state.vertexDragStartY + ($scope.state.mouseY - $scope.state.mouseDragStartY);
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
              description: 'Add Edge',
              mode: _MODES.ADD_EDGE
            });
          }
          if ($scope.canAddVertex) {
            $scope.buttons.push({
              text: '\u002B',
              description: 'Add Node',
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
        // function to clear bits of $scope.state
        // (e.g. currentlyDraggedVertex, addEdgeVertex)

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
              tryAddEdge(
                $scope.state.addEdgeVertex, $scope.state.hoveredVertex);
            }
            endAddEdge();
          } else if ($scope.state.currentMode === _MODES.MOVE) {
            if ($scope.state.currentlyDraggedVertex !== null) {
              endDragVertex();
            }
          }
        };
        $document.on('mouseup', $scope.onMouseupDocument);

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
            if (startIndex === $scope.graph.edges[i].src &&
                endIndex === $scope.graph.edges[i].dst) {
              return;
            }
            if (!$scope.graph.isDirected) {
              if (startIndex === $scope.graph.edges[i].dst &&
                  endIndex === $scope.graph.edges[i].src) {
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
          $scope.graph.edges.splice(index, 1);
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
          } else if (index === $scope.state.hoveredEdge) {
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
          } else if (index === $scope.state.hoveredVertex) {
            return HOVER_COLOR;
          } else if ($scope.state.selectedVertex === index) {
            return SELECT_COLOR;
          } else {
            return DEFAULT_COLOR;
          }
        };
        $scope.getDirectedEdgeArrowPoints = function(index) {
          return graphDetailService.getDirectedEdgeArrowPoints(
            $scope.graph, index);
        };
        $scope.getEdgeCentre = function(index) {
          return graphDetailService.getEdgeCentre($scope.graph, index);
        };
      }]
  };
});

oppia.factory('graphUtilsService', [function() {
  return {
    constructAdjacencyMatrix: function(graph) {
      var adjMatrix = [];
      for (var i = 0; i < graph.vertices.length; i++) {
        var adjMatrixRow = [];
        for (var j = 0; j < graph.vertices.length; j++) {
          adjMatrixRow.push(null);
        }
        adjMatrix.push(adjMatrixRow);
      }
      graph.edges.map(function(edge) {
        var weight = graph.isWeighted ? edge.weight : 1;
        adjMatrix[edge.src][edge.dst] = weight;
        if (!graph.isDirected) {
          adjMatrix[edge.dst][edge.src] = weight;
        }
      });
      return adjMatrix;
    },
    nextPermutation: function(permutation) {
      // Generates (in place) the next lexicographical permutation.
      // permutation is a permutation of [0, 1, 2, ..., permutation.length - 1]

      // Find the pivot to longest decreasing suffix and successor
      var pivot = null;
      var successor = null;
      permutation.reduce(function(previousValue, currentValue, currentIndex) {
        if (previousValue < currentValue) {
          pivot = currentIndex - 1;
        }
        if (pivot !== null && currentValue > permutation[pivot]) {
          successor = currentIndex;
        }
        return currentValue;
      });

      if (pivot === null) {
        return null;
      }

      // swap the pivot and successor and reverse the suffix
      var tmp = permutation[pivot];
      permutation[pivot] = permutation[successor];
      permutation[successor] = tmp;
      permutation = permutation.concat(permutation.splice(pivot + 1).reverse());
      return permutation;
    },
    areAdjacencyMatricesEqualWithPermutation: function(adj1, adj2, permutation) {
      var numVertices = adj1.length;
      for (var i = 0; i < numVertices; i++) {
        for (var j = 0; j < numVertices; j++) {
          if (adj1[permutation[i]][permutation[j]] != adj2[i][j]) {
            return false;
          }
        }
      }
      return true;
    }
  };
}]);

oppia.factory('graphInputRulesService', [
    'graphUtilsService', function(graphUtilsService) {
  var IsIsomorphic = function(graph1, graph2) {
    if (graph1.vertices.length != graph2.vertices.length) {
      return false;
    }

    var adj1 = graphUtilsService.constructAdjacencyMatrix(graph1);
    var adj2 = graphUtilsService.constructAdjacencyMatrix(graph2);

    // Check against every permutation of vectices.
    var numVertices = graph2.vertices.length;
    var permutation = [];
    for (var i = 0; i < numVertices; i++) {
      permutation.push(i);
    }
    while (permutation !== null) {
      var doLabelsMatch = (!graph1.isLabeled && !graph2.isLabeled) ||
        graph2.vertices.every(function(vertex, index) {
          return vertex.label == graph1.vertices[permutation[index]].label;
        });
      if (doLabelsMatch &&
          graphUtilsService.areAdjacencyMatricesEqualWithPermutation(
          adj1, adj2, permutation)) {
        return true;
      }
      permutation = graphUtilsService.nextPermutation(permutation);
    }
    return false;
  };

  return {
    IsIsomorphicTo: function(answer, inputs) {
      return IsIsomorphic(answer, inputs.g);
    },
    FuzzyMatches: function(answer, inputs) {
      return inputs.training_data.some(function(trainingGraph) {
        return IsIsomorphic(answer, trainingGraph);
      });
    }
  };
}]);
