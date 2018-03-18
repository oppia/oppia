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
  'HtmlEscaperService', 'graphInputRulesService', 'UrlInterpolationService',
  'UrlService', 'EVENT_NEW_CARD_AVAILABLE',
  function(
      HtmlEscaperService, graphInputRulesService, UrlInterpolationService,
      UrlService, EVENT_NEW_CARD_AVAILABLE) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&',
        getLastAnswer: '&lastAnswer',
        // This should be called whenever the answer changes.
        setAnswerValidity: '&'
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/GraphInput/directives/' +
        'graph_input_interaction_directive.html'),
      controller: [
        '$scope', '$element', '$attrs', 'WindowDimensionsService',
        'ExplorationPlayerService', 'EVENT_PROGRESS_NAV_SUBMITTED',
        function(
            $scope, $element, $attrs, WindowDimensionsService,
            ExplorationPlayerService, EVENT_PROGRESS_NAV_SUBMITTED) {
          $scope.errorMessage = '';
          $scope.graph = {
            vertices: [],
            edges: [],
            isDirected: false,
            isWeighted: false,
            isLabeled: false
          };
          $scope.submitGraph = function() {
            // Here, angular.copy is needed to strip $$hashkey from the graph.
            $scope.onSubmit({
              answer: angular.copy($scope.graph),
              rulesService: graphInputRulesService
            });
          };
          $scope.$on(EVENT_PROGRESS_NAV_SUBMITTED, $scope.submitGraph);
          $scope.interactionIsActive = ($scope.getLastAnswer() === null);
          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            $scope.interactionIsActive = false;

            $scope.canAddVertex = false;
            $scope.canDeleteVertex = false;
            $scope.canEditVertexLabel = false;
            $scope.canMoveVertex = false;
            $scope.canAddEdge = false;
            $scope.canDeleteEdge = false;
            $scope.canEditEdgeWeight = false;
          });

          $scope.resetGraph = function() {
            var newGraph = HtmlEscaperService.escapedJsonToObj(
              $attrs.graphWithValue);
            if (checkValidGraph(newGraph)) {
              $scope.graph = newGraph;
            } else {
              $scope.errorMessage = 'I18N_INTERACTIONS_GRAPH_ERROR_INVALID';
            }
          };

          var init = function() {
            if ($scope.interactionIsActive) {
              $scope.resetGraph();
            } else {
              $scope.graph = $scope.getLastAnswer();
            }
            var stringToBool = function(str) {
              return (str === 'true');
            };
            $scope.canAddVertex = $scope.interactionIsActive ?
              stringToBool($attrs.canAddVertexWithValue) : false;
            $scope.canDeleteVertex = $scope.interactionIsActive ?
              stringToBool($attrs.canDeleteVertexWithValue) : false;
            $scope.canEditVertexLabel = $scope.interactionIsActive ?
              stringToBool($attrs.canEditVertexLabelWithValue) : false;
            $scope.canMoveVertex = $scope.interactionIsActive ?
              stringToBool($attrs.canMoveVertexWithValue) : false;
            $scope.canAddEdge = $scope.interactionIsActive ?
              stringToBool($attrs.canAddEdgeWithValue) : false;
            $scope.canDeleteEdge = $scope.interactionIsActive ?
              stringToBool($attrs.canDeleteEdgeWithValue) : false;
            $scope.canEditEdgeWeight = $scope.interactionIsActive ?
              stringToBool($attrs.canEditEdgeWeightWithValue) : false;
          };

          // TODO(czxcjx): Write this function
          var checkValidGraph = function(graph) {
            return Boolean(graph);
          };

          $scope.$watch(function() {
            return $scope.graph;
          }, function() {
            $scope.setAnswerValidity({
              answerValidity: checkValidGraph($scope.graph)
            });
          });

          init();
        }
      ]
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
  'HtmlEscaperService', 'graphDetailService', 'GRAPH_INPUT_LEFT_MARGIN',
  'UrlInterpolationService',
  function(
      HtmlEscaperService, graphDetailService, GRAPH_INPUT_LEFT_MARGIN,
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/GraphInput/directives/' +
        'graph_input_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.graph = HtmlEscaperService.escapedJsonToObj($attrs.answer);

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
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/GraphInput/directives/' +
        'graph_input_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        // TODO(bhenning): Improve this short response by using a small version
        // of the graph image instead of an arbitrary label of vertices and
        // edges.
        $scope.graph = HtmlEscaperService.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);

/*
 * Directive for graph-viz.
 * TODO(czx): Move directive to GraphEditor.js once it gets included in the
 * learner page
 */
oppia.directive('graphViz', [
  'UrlInterpolationService', function(UrlInterpolationService) {
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
        isInteractionActive: '&interactionIsActive'
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/GraphInput/directives/' +
        'graph_viz_directive.html'),
      controller: [
        '$scope', '$element', '$attrs', '$document', '$timeout',
        'FocusManagerService', 'graphDetailService', 'GRAPH_INPUT_LEFT_MARGIN',
        'EVENT_NEW_CARD_AVAILABLE', 'DeviceInfoService',
        function(
            $scope, $element, $attrs, $document, $timeout,
            FocusManagerService, graphDetailService, GRAPH_INPUT_LEFT_MARGIN,
            EVENT_NEW_CARD_AVAILABLE, DeviceInfoService) {
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
            mouseDragStartY: 0
          };

          $scope.VERTEX_RADIUS = graphDetailService.VERTEX_RADIUS;
          $scope.EDGE_WIDTH = graphDetailService.EDGE_WIDTH;
          $scope.selectedEdgeWeightValue = 0;
          $scope.shouldShowWrongWeightWarning = false;

          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            $scope.state.currentMode = null;
          });

          $scope.isMobile = false;
          if (DeviceInfoService.isMobileDevice()) {
            $scope.isMobile = true;
          }

          var vizContainer = $($element).find('.oppia-graph-viz-svg');
          $scope.vizWidth = vizContainer.width();

          $scope.mousemoveGraphSVG = function(event) {
            if (!$scope.isInteractionActive()) {
              return;
            }
            // Note: Transform client (X, Y) to SVG (X, Y). This has to be
            // done so that changes due to viewBox attribute are
            // propagated nicely.
            var pt = vizContainer[0].createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            var svgp = pt.matrixTransform(
              vizContainer[0].getScreenCTM().inverse());
            $scope.state.mouseX = svgp.x;
            $scope.state.mouseY = svgp.y;
            // We use vertexDragStartX/Y and mouseDragStartX/Y to make
            // mouse-dragging by label more natural, by moving the vertex
            // according to the difference from the original position.
            // Otherwise, mouse-dragging by label will make the vertex
            // awkwardly jump to the mouse.
            if ($scope.state.currentlyDraggedVertex !== null &&
                ($scope.state.mouseX > GRAPH_INPUT_LEFT_MARGIN)) {
              $scope.graph.vertices[$scope.state.currentlyDraggedVertex].x = (
                $scope.state.vertexDragStartX + (
                  $scope.state.mouseX - $scope.state.mouseDragStartX));
              $scope.graph.vertices[$scope.state.currentlyDraggedVertex].y = (
                $scope.state.vertexDragStartY + (
                  $scope.state.mouseY - $scope.state.mouseDragStartY));
            }
          };

          $scope.onClickGraphSVG = function() {
            if (!$scope.isInteractionActive()) {
              return;
            }
            if ($scope.state.currentMode === _MODES.ADD_VERTEX &&
                $scope.canAddVertex) {
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
            if ($scope.isMobile) {
              if ($scope.state.currentMode === _MODES.ADD_EDGE) {
                $scope.helpText =
                  'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
              } else if ($scope.state.currentMode === _MODES.MOVE) {
                $scope.helpText =
                  'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
              } else {
                $scope.helpText = null;
              }
            } else {
              $scope.helpText = null;
            }
          };

          var initButtons = function() {
            $scope.buttons = [];
            if ($scope.canMoveVertex) {
              $scope.buttons.push({
                text: '\uE068',
                description: 'I18N_INTERACTIONS_GRAPH_MOVE',
                mode: _MODES.MOVE
              });
            }
            if ($scope.canAddEdge) {
              $scope.buttons.push({
                text: '\uE144',
                description: 'I18N_INTERACTIONS_GRAPH_ADD_EDGE',
                mode: _MODES.ADD_EDGE
              });
            }
            if ($scope.canAddVertex) {
              $scope.buttons.push({
                text: '\u002B',
                description: 'I18N_INTERACTIONS_GRAPH_ADD_NODE',
                mode: _MODES.ADD_VERTEX
              });
            }
            if ($scope.canDeleteVertex || $scope.canDeleteEdge) {
              $scope.buttons.push({
                text: '\u2212',
                description: 'I18N_INTERACTIONS_GRAPH_DELETE',
                mode: _MODES.DELETE
              });
            }
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

          $scope.helpText = null;
          var setMode = function(mode) {
            $scope.state.currentMode = mode;
            if ($scope.isMobile) {
              if ($scope.state.currentMode === _MODES.ADD_EDGE) {
                $scope.helpText =
                  'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
              } else if ($scope.state.currentMode === _MODES.MOVE) {
                $scope.helpText =
                  'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
              } else {
                $scope.helpText = null;
              }
            } else {
              $scope.helpText = null;
            }
            $scope.state.addEdgeVertex = null;
            $scope.state.selectedVertex = null;
            $scope.state.selectedEdge = null;
            $scope.state.currentlyDraggedVertex = null;
            $scope.state.hoveredVertex = null;
          };
          $scope.onClickModeButton = function(mode, $event) {
            $event.preventDefault();
            $event.stopPropagation();
            if ($scope.isInteractionActive()) {
              setMode(mode);
            }
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
            if ($scope.isMobile) {
              $scope.state.hoveredVertex = index;
              if ($scope.state.addEdgeVertex === null &&
                  $scope.state.currentlyDraggedVertex === null) {
                $scope.onTouchInitialVertex(index);
              } else {
                if ($scope.state.addEdgeVertex === index) {
                  $scope.state.hoveredVertex = null;
                  $scope.helpText =
                    'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
                  $scope.state.addEdgeVertex = null;
                  return;
                }
                $scope.onTouchFinalVertex(index);
              }
            }
          };

          $scope.onTouchInitialVertex = function(index) {
            if ($scope.state.currentMode === _MODES.ADD_EDGE) {
              if ($scope.canAddEdge) {
                beginAddEdge(index);
                $scope.helpText = 'I18N_INTERACTIONS_GRAPH_EDGE_FINAL_HELPTEXT';
              }
            } else if ($scope.state.currentMode === _MODES.MOVE) {
              if ($scope.canMoveVertex) {
                beginDragVertex(index);
                $scope.helpText = 'I18N_INTERACTIONS_GRAPH_MOVE_FINAL_HELPTEXT';
              }
            }
          };

          $scope.onTouchFinalVertex = function(index) {
            if ($scope.state.currentMode === _MODES.ADD_EDGE) {
              tryAddEdge(
                $scope.state.addEdgeVertex, index);
              endAddEdge();
              $scope.state.hoveredVertex = null;
              $scope.helpText = 'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
            } else if ($scope.state.currentMode === _MODES.MOVE) {
              if ($scope.state.currentlyDraggedVertex !== null) {
                endDragVertex();
                $scope.state.hoveredVertex = null;
                $scope.helpText =
                  'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
              }
            }
          };

          $scope.onMousedownVertex = function(index) {
            if ($scope.isMobile) {
              return;
            }
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

          $scope.onMouseleaveVertex = function(index) {
            if ($scope.isMobile) {
              return;
            }
            $scope.state.hoveredVertex = (
              index === $scope.state.hoveredVertex) ?
              null : $scope.state.hoveredVertex;
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
            if ($scope.isMobile) {
              return;
            }
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
          var beginAddEdge = function(startIndex) {
            $scope.state.addEdgeVertex = startIndex;
          };

          var endAddEdge = function() {
            $scope.state.addEdgeVertex = null;
          };

          var tryAddEdge = function(startIndex, endIndex) {
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
          };

          var beginDragVertex = function(index) {
            $scope.state.currentlyDraggedVertex = index;
            $scope.state.vertexDragStartX = $scope.graph.vertices[index].x;
            $scope.state.vertexDragStartY = $scope.graph.vertices[index].y;
            $scope.state.mouseDragStartX = $scope.state.mouseX;
            $scope.state.mouseDragStartY = $scope.state.mouseY;
          };

          var endDragVertex = function() {
            $scope.state.currentlyDraggedVertex = null;
            $scope.state.vertexDragStartX = 0;
            $scope.state.vertexDragStartY = 0;
            $scope.state.mouseDragStartX = 0;
            $scope.state.mouseDragStartY = 0;
          };

          var beginEditVertexLabel = function(index) {
            $scope.state.selectedVertex = index;
            FocusManagerService.setFocus('vertexLabelEditBegun');
          };

          var beginEditEdgeWeight = function(index) {
            $scope.state.selectedEdge = index;
            $scope.selectedEdgeWeightValue = (
              $scope.graph.edges[$scope.state.selectedEdge].weight);
            $scope.shouldShowWrongWeightWarning = false;
            FocusManagerService.setFocus('edgeWeightEditBegun');
          };

          var deleteEdge = function(index) {
            $scope.graph.edges.splice(index, 1);
            $scope.state.hoveredEdge = null;
          };

          var _deleteRepeatedUndirectedEdges = function() {
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
          };

          var deleteVertex = function(index) {
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
          };

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
            if (weight === null) {
              $scope.selectedEdgeWeightValue = '';
            }
            if (angular.isNumber(weight)) {
              $scope.selectedEdgeWeightValue = weight;
            }
            return $scope.selectedEdgeWeightValue;
          };

          $scope.isValidEdgeWeight = function() {
            return angular.isNumber($scope.selectedEdgeWeightValue);
          };

          $scope.onUpdateEdgeWeight = function() {
            if (angular.isNumber($scope.selectedEdgeWeightValue)) {
              $scope.graph.edges[$scope.state.selectedEdge].weight = (
                $scope.selectedEdgeWeightValue);
            }
            $scope.state.selectedEdge = null;
          };

          // Styling functions
          var DELETE_COLOR = 'red';
          var HOVER_COLOR = 'aqua';
          var SELECT_COLOR = 'orange';
          var DEFAULT_COLOR = 'black';
          $scope.getEdgeColor = function(index) {
            if (!$scope.isInteractionActive()) {
              return DEFAULT_COLOR;
            }
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
            if (!$scope.isInteractionActive()) {
              return DEFAULT_COLOR;
            }
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

          // Initial value of SVG view box.
          $scope.svgViewBox = '';

          if ($scope.isInteractionActive()) {
            $scope.init();

            // Set the SVG viewBox to appropriate size.
            $timeout(function() {
              var svgContainer = $($element).find('.oppia-graph-viz-svg')[0];
              var boundingBox = svgContainer.getBBox();
              var viewBoxHeight = Math.max(
                boundingBox.height + boundingBox.y,
                svgContainer.getAttribute('height'));
              $scope.svgViewBox = (
                0 + ' ' + 0 + ' ' + (boundingBox.width + boundingBox.x) +
                ' ' + (viewBoxHeight));
            }, 1000);
          }
        }
      ]
    };
  }
]);

oppia.factory('graphUtilsService', [function() {
  return {
    GRAPH_ADJACENCY_MODE: {
      DIRECTED: 'directed',
      INVERTED: 'inverted',
      UNDIRECTED: 'undirected'
    },

    DFS_STATUS: {
      VISITED: 'visited',
      UNVISITED: 'unvisited',
      STILL_VISITING: 'still visiting'
    },

    /**
     * @param {object} graph - A graph object.
     * @param {string} adjacencyListMode - A string indicating the mode.
     * @return {array} An adjacency list. Depending on the mode, the list has
     *   all edges (directed),
     *   all edges inverted (inverted),
     *   or all edges in both directions, as though the graph were undirected
     *   (undirected)
     */
    constructAdjacencyLists: function(graph, adjacencyListMode) {
      var adjacencyLists = [];
      for (var i = 0; i < graph.vertices.length; i++) {
        adjacencyLists.push([]);
      }

      // If a graph is undirected, all modes work the same way anyway
      if (!graph.isDirected) {
        adjacencyListMode = this.GRAPH_ADJACENCY_MODE.UNDIRECTED;
      }
      for (var i = 0; i < graph.edges.length; i++) {
        var edge = graph.edges[i];
        if (adjacencyListMode === this.GRAPH_ADJACENCY_MODE.DIRECTED ||
            adjacencyListMode === this.GRAPH_ADJACENCY_MODE.UNDIRECTED) {
          adjacencyLists[edge.src].push(edge.dst);
        }
        if (adjacencyListMode === this.GRAPH_ADJACENCY_MODE.INVERTED ||
            adjacencyListMode === this.GRAPH_ADJACENCY_MODE.UNDIRECTED) {
          adjacencyLists[edge.dst].push(edge.src);
        }
      }
      return adjacencyLists;
    },

    /**
     * @param {integer} startVertex - The index of the starting vertex.
     * @param {array} adjacencyLists - An array of arrays.
     * @param {array} isVisited - An array with length equal to the number of
     *     vertices. All the values should be false initially.
     * This function modifies the isVisited array and changes the values at
     * the indices of the vertices reachable from the starting vertex to true.
     */
    markAccessible: function(startVertex, adjacencyLists, isVisited) {
      isVisited[startVertex] = true;
      for (var i = 0; i < adjacencyLists[startVertex].length; i++) {
        var nextVertex = adjacencyLists[startVertex][i];
        if (!isVisited[nextVertex]) {
          this.markAccessible(nextVertex, adjacencyLists, isVisited);
        }
      }
    },

    findCycle: function(
        currentVertex, previousVertex, adjacencyLists, isVisited,
        isDirected) {
      isVisited[currentVertex] = this.DFS_STATUS.STILL_VISITING;
      for (var i = 0; i < adjacencyLists[currentVertex].length; i++) {
        var nextVertex = adjacencyLists[currentVertex][i];
        if (nextVertex === previousVertex && !isDirected) {
          continue;
        }
        if (isVisited[nextVertex] === this.DFS_STATUS.STILL_VISITING) {
          return true;
        }
        if (isVisited[nextVertex] === this.DFS_STATUS.UNVISITED &&
            this.findCycle(
              nextVertex, currentVertex, adjacencyLists, isVisited,
              isDirected)) {
          return true;
        }
      }
      isVisited[currentVertex] = this.DFS_STATUS.VISITED;
      return false;
    },

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

      // Swap the pivot and successor and reverse the suffix
      var tmp = permutation[pivot];
      permutation[pivot] = permutation[successor];
      permutation[successor] = tmp;
      permutation = permutation.concat(permutation.splice(pivot + 1).reverse());
      return permutation;
    },

    areAdjacencyMatricesEqualWithPermutation: function(
        adj1, adj2, permutation) {
      var numVertices = adj1.length;
      for (var i = 0; i < numVertices; i++) {
        for (var j = 0; j < numVertices; j++) {
          if (adj1[permutation[i]][permutation[j]] !== adj2[i][j]) {
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
    /**
     * @param {object} graph - A graph object.
     * @return {boolean} Whether the graph is strongly connected.
     */
    var isStronglyConnected = function(graph) {
      // Uses depth first search on each vertex to try and visit every other
      // vertex in both the normal and inverted adjacency lists.
      if (graph.vertices.length === 0) {
        return true;
      }

      var adjacencyLists = graphUtilsService.constructAdjacencyLists(
        graph, graphUtilsService.GRAPH_ADJACENCY_MODE.DIRECTED);
      var invertedAdjacencyLists = graphUtilsService.constructAdjacencyLists(
        graph, graphUtilsService.GRAPH_ADJACENCY_MODE.INVERTED);

      var isVisited = graph.vertices.map(function() {
        return false;
      });
      graphUtilsService.markAccessible(0, adjacencyLists, isVisited);
      var isAnyVertexUnreachable = isVisited.some(function(visited) {
        return visited === false;
      });

      var isVisitedInReverse = graph.vertices.map(function() {
        return false;
      });
      graphUtilsService.markAccessible(
        0, invertedAdjacencyLists, isVisitedInReverse);
      var isAnyVertexUnreachableInReverse =
        isVisitedInReverse.some(function(visited) {
          return visited === false;
        });

      return !isAnyVertexUnreachable && !isAnyVertexUnreachableInReverse;
    };

    /**
     * @param {object} graph - A graph object.
     * @return {boolean} Whether the graph is weakly connected.
     */
    var isWeaklyConnected = function(graph) {
      // Generates adjacency lists assuming graph is undirected, then uses depth
      // first search on node 0 to try to reach every other vertex
      if (graph.vertices.length === 0) {
        return true;
      }

      var adjacencyLists = graphUtilsService.constructAdjacencyLists(
        graph, graphUtilsService.GRAPH_ADJACENCY_MODE.UNDIRECTED);
      var isVisited = graph.vertices.map(function() {
        return false;
      });
      graphUtilsService.markAccessible(0, adjacencyLists, isVisited);
      return isVisited.every(function(visited) {
        return visited === true;
      });
    };

    /**
     * @param {object} graph - A graph object.
     * @return {boolean} Whether the graph is acyclic.
     */
    var isAcyclic = function(graph) {
      // Uses depth first search to ensure that we never have an edge to an
      // ancestor in the search tree.

      var isVisited = graph.vertices.map(function() {
        return graphUtilsService.DFS_STATUS.UNVISITED;
      });
      var adjacencyLists = graphUtilsService.constructAdjacencyLists(
        graph, graphUtilsService.GRAPH_ADJACENCY_MODE.DIRECTED);
      for (var startVertex = 0;
        startVertex < graph.vertices.length;
        startVertex++) {
        if (isVisited[startVertex] === graphUtilsService.DFS_STATUS.UNVISITED) {
          if (graphUtilsService.findCycle(
            startVertex, -1, adjacencyLists, isVisited, graph.isDirected)) {
            return false;
          }
        }
      }
      return true;
    };

    /**
     * @param {object} graph - A graph object.
     * @return {boolean} Whether the graph is acyclic.
     */
    var isRegular = function(graph) {
      // Checks that every vertex has outdegree and indegree equal to the first
      if (graph.vertices.length === 0) {
        return true;
      }

      var adjacencyLists = graphUtilsService.constructAdjacencyLists(
        graph, graphUtilsService.GRAPH_ADJACENCY_MODE.DIRECTED);
      var outdegreeCounts = adjacencyLists.map(function(list) {
        return list.length;
      });
      var indegreeCounts = adjacencyLists.map(function() {
        return 0;
      });
      adjacencyLists.forEach(function(list) {
        list.forEach(function(destination) {
          indegreeCounts[destination]++;
        });
      });

      var areIndegreeCountsEqual = indegreeCounts.every(function(indegree) {
        return indegree === indegreeCounts[0];
      });
      var areOutdegreeCountsEqual = outdegreeCounts.every(function(outdegree) {
        return outdegree === outdegreeCounts[0];
      });
      return areIndegreeCountsEqual && areOutdegreeCountsEqual;
    };

    var isIsomorphic = function(graph1, graph2) {
      if (graph1.vertices.length !== graph2.vertices.length) {
        return false;
      }

      var adj1 = graphUtilsService.constructAdjacencyMatrix(graph1);
      var adj2 = graphUtilsService.constructAdjacencyMatrix(graph2);

      // Check that for every vertex from the first graph there is a vertex in
      // the second graph with the same sum of weights of outgoing edges
      var degrees1 = adj1.map(function(value) {
        return value.reduce(function(prev, cur) {
          return prev + cur;
        });
      }).sort();

      var degrees2 = adj2.map(function(value) {
        return value.reduce(function(prev, cur) {
          return prev + cur;
        });
      }).sort();

      if (!angular.equals(degrees1, degrees2)) {
        return false;
      }

      // Check against every permutation of vectices.
      var numVertices = graph2.vertices.length;
      var permutation = [];
      for (var i = 0; i < numVertices; i++) {
        permutation.push(i);
      }
      while (permutation !== null) {
        var doLabelsMatch = (!graph1.isLabeled && !graph2.isLabeled) ||
          graph2.vertices.every(function(vertex, index) {
            return vertex.label === graph1.vertices[permutation[index]].label;
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
      HasGraphProperty: function(answer, inputs) {
        if (inputs.p === 'strongly_connected') {
          return isStronglyConnected(answer);
        } else if (inputs.p === 'weakly_connected') {
          return isWeaklyConnected(answer);
        } else if (inputs.p === 'acyclic') {
          return isAcyclic(answer);
        } else if (inputs.p === 'regular') {
          return isRegular(answer);
        } else {
          return false;
        }
      },
      IsIsomorphicTo: function(answer, inputs) {
        return isIsomorphic(answer, inputs.g);
      }
    };
  }
]);
