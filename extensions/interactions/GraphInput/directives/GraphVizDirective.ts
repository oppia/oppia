// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * Directive for the graph-viz.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
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
        'FocusManagerService', 'GraphDetailService', 'GRAPH_INPUT_LEFT_MARGIN',
        'EVENT_NEW_CARD_AVAILABLE', 'DeviceInfoService',
        function(
            $scope, $element, $attrs, $document, $timeout,
            FocusManagerService, GraphDetailService, GRAPH_INPUT_LEFT_MARGIN,
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

          $scope.VERTEX_RADIUS = GraphDetailService.VERTEX_RADIUS;
          $scope.EDGE_WIDTH = GraphDetailService.EDGE_WIDTH;
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

          var initViewboxSize = function() {
            var svgContainer = $($element).find('.oppia-graph-viz-svg')[0];
            var boundingBox = svgContainer.getBBox();
            var viewBoxHeight = Math.max(
              boundingBox.height + boundingBox.y,
              svgContainer.getAttribute('height'));
            $scope.svgViewBox = (
              0 + ' ' + 0 + ' ' + (boundingBox.width + boundingBox.x) +
                ' ' + (viewBoxHeight));
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
            return GraphDetailService.getDirectedEdgeArrowPoints(
              $scope.graph, index);
          };
          $scope.getEdgeCentre = function(index) {
            return GraphDetailService.getEdgeCentre($scope.graph, index);
          };

          // Initial value of SVG view box.
          $scope.svgViewBox = initViewboxSize();

          if ($scope.isInteractionActive()) {
            $scope.init();
          }
        }
      ]
    };
  }
]);
