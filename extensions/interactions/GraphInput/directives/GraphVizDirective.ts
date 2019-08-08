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
 * @fileoverview Directive for the graph-viz.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/UrlInterpolationService.ts');
require('interactions/GraphInput/directives/GraphDetailService.ts');
require('services/contextual/DeviceInfoService.ts');
require('services/stateful/FocusManagerService.ts');

require('interactions/interactions-extension.constants.ajs.ts');

angular.module('oppia').directive('graphViz', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
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
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$element', '$attrs', '$document', '$timeout',
        'FocusManagerService', 'GraphDetailService', 'GRAPH_INPUT_LEFT_MARGIN',
        'EVENT_NEW_CARD_AVAILABLE', 'DeviceInfoService',
        function(
            $scope, $element, $attrs, $document, $timeout,
            FocusManagerService, GraphDetailService, GRAPH_INPUT_LEFT_MARGIN,
            EVENT_NEW_CARD_AVAILABLE, DeviceInfoService) {
          var ctrl = this;
          var _MODES = {
            MOVE: 0,
            ADD_EDGE: 1,
            ADD_VERTEX: 2,
            DELETE: 3
          };
          // The current state of the UI and stuff like that
          ctrl.state = {
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

          ctrl.VERTEX_RADIUS = GraphDetailService.VERTEX_RADIUS;
          ctrl.EDGE_WIDTH = GraphDetailService.EDGE_WIDTH;
          ctrl.selectedEdgeWeightValue = 0;
          ctrl.shouldShowWrongWeightWarning = false;

          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            ctrl.state.currentMode = null;
          });

          ctrl.isMobile = false;
          if (DeviceInfoService.isMobileDevice()) {
            ctrl.isMobile = true;
          }

          var vizContainer = $($element).find('.oppia-graph-viz-svg');
          ctrl.vizWidth = vizContainer.width();

          ctrl.mousemoveGraphSVG = function(event) {
            if (!ctrl.isInteractionActive()) {
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
            ctrl.state.mouseX = svgp.x;
            ctrl.state.mouseY = svgp.y;
            // We use vertexDragStartX/Y and mouseDragStartX/Y to make
            // mouse-dragging by label more natural, by moving the vertex
            // according to the difference from the original position.
            // Otherwise, mouse-dragging by label will make the vertex
            // awkwardly jump to the mouse.
            if (ctrl.state.currentlyDraggedVertex !== null &&
                (ctrl.state.mouseX > GRAPH_INPUT_LEFT_MARGIN)) {
              ctrl.graph.vertices[ctrl.state.currentlyDraggedVertex].x = (
                ctrl.state.vertexDragStartX + (
                  ctrl.state.mouseX - ctrl.state.mouseDragStartX));
              ctrl.graph.vertices[ctrl.state.currentlyDraggedVertex].y = (
                ctrl.state.vertexDragStartY + (
                  ctrl.state.mouseY - ctrl.state.mouseDragStartY));
            }
          };

          ctrl.onClickGraphSVG = function() {
            if (!ctrl.isInteractionActive()) {
              return;
            }
            if (ctrl.state.currentMode === _MODES.ADD_VERTEX &&
                ctrl.canAddVertex) {
              ctrl.graph.vertices.push({
                x: ctrl.state.mouseX,
                y: ctrl.state.mouseY,
                label: ''
              });
            }
            if (ctrl.state.hoveredVertex === null) {
              ctrl.state.selectedVertex = null;
            }
            if (ctrl.state.hoveredEdge === null) {
              ctrl.state.selectedEdge = null;
            }
          };

          ctrl.init = function() {
            initButtons();
            ctrl.state.currentMode = ctrl.buttons[0].mode;
            if (ctrl.isMobile) {
              if (ctrl.state.currentMode === _MODES.ADD_EDGE) {
                ctrl.helpText =
                  'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
              } else if (ctrl.state.currentMode === _MODES.MOVE) {
                ctrl.helpText =
                  'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
              } else {
                ctrl.helpText = null;
              }
            } else {
              ctrl.helpText = null;
            }
          };

          var initButtons = function() {
            ctrl.buttons = [];
            if (ctrl.canMoveVertex) {
              ctrl.buttons.push({
                text: '\uE068',
                description: 'I18N_INTERACTIONS_GRAPH_MOVE',
                mode: _MODES.MOVE
              });
            }
            if (ctrl.canAddEdge) {
              ctrl.buttons.push({
                text: '\uE144',
                description: 'I18N_INTERACTIONS_GRAPH_ADD_EDGE',
                mode: _MODES.ADD_EDGE
              });
            }
            if (ctrl.canAddVertex) {
              ctrl.buttons.push({
                text: '\u002B',
                description: 'I18N_INTERACTIONS_GRAPH_ADD_NODE',
                mode: _MODES.ADD_VERTEX
              });
            }
            if (ctrl.canDeleteVertex || ctrl.canDeleteEdge) {
              ctrl.buttons.push({
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
            ctrl.svgViewBox = (
              0 + ' ' + 0 + ' ' + (boundingBox.width + boundingBox.x) +
                ' ' + (viewBoxHeight));
          };

          ctrl.graphOptions = [{
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
          ctrl.toggleGraphOption = function(option) {
            // Handle the case when we have two edges s -> d and d -> s
            if (option === 'isDirected' && ctrl.graph[option]) {
              _deleteRepeatedUndirectedEdges();
            }
            ctrl.graph[option] = !ctrl.graph[option];
          };

          ctrl.helpText = null;
          var setMode = function(mode) {
            ctrl.state.currentMode = mode;
            if (ctrl.isMobile) {
              if (ctrl.state.currentMode === _MODES.ADD_EDGE) {
                ctrl.helpText =
                  'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
              } else if (ctrl.state.currentMode === _MODES.MOVE) {
                ctrl.helpText =
                  'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
              } else {
                ctrl.helpText = null;
              }
            } else {
              ctrl.helpText = null;
            }
            ctrl.state.addEdgeVertex = null;
            ctrl.state.selectedVertex = null;
            ctrl.state.selectedEdge = null;
            ctrl.state.currentlyDraggedVertex = null;
            ctrl.state.hoveredVertex = null;
          };
          ctrl.onClickModeButton = function(mode, $event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (ctrl.isInteractionActive()) {
              setMode(mode);
            }
          };

          // TODO(czx): Consider if there's a neat way to write a reset()
          // function to clear bits of ctrl.state
          // (e.g. currentlyDraggedVertex, addEdgeVertex)

          // Vertex events
          ctrl.onClickVertex = function(index) {
            if (ctrl.state.currentMode === _MODES.DELETE) {
              if (ctrl.canDeleteVertex) {
                deleteVertex(index);
              }
            }
            if (ctrl.state.currentMode !== _MODES.DELETE &&
                ctrl.graph.isLabeled &&
                ctrl.canEditVertexLabel) {
              beginEditVertexLabel(index);
            }
            if (ctrl.isMobile) {
              ctrl.state.hoveredVertex = index;
              if (ctrl.state.addEdgeVertex === null &&
                  ctrl.state.currentlyDraggedVertex === null) {
                ctrl.onTouchInitialVertex(index);
              } else {
                if (ctrl.state.addEdgeVertex === index) {
                  ctrl.state.hoveredVertex = null;
                  ctrl.helpText =
                    'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
                  ctrl.state.addEdgeVertex = null;
                  return;
                }
                ctrl.onTouchFinalVertex(index);
              }
            }
          };

          ctrl.onTouchInitialVertex = function(index) {
            if (ctrl.state.currentMode === _MODES.ADD_EDGE) {
              if (ctrl.canAddEdge) {
                beginAddEdge(index);
                ctrl.helpText = 'I18N_INTERACTIONS_GRAPH_EDGE_FINAL_HELPTEXT';
              }
            } else if (ctrl.state.currentMode === _MODES.MOVE) {
              if (ctrl.canMoveVertex) {
                beginDragVertex(index);
                ctrl.helpText = 'I18N_INTERACTIONS_GRAPH_MOVE_FINAL_HELPTEXT';
              }
            }
          };

          ctrl.onTouchFinalVertex = function(index) {
            if (ctrl.state.currentMode === _MODES.ADD_EDGE) {
              tryAddEdge(
                ctrl.state.addEdgeVertex, index);
              endAddEdge();
              ctrl.state.hoveredVertex = null;
              ctrl.helpText = 'I18N_INTERACTIONS_GRAPH_EDGE_INITIAL_HELPTEXT';
            } else if (ctrl.state.currentMode === _MODES.MOVE) {
              if (ctrl.state.currentlyDraggedVertex !== null) {
                endDragVertex();
                ctrl.state.hoveredVertex = null;
                ctrl.helpText =
                  'I18N_INTERACTIONS_GRAPH_MOVE_INITIAL_HELPTEXT';
              }
            }
          };

          ctrl.onMousedownVertex = function(index) {
            if (ctrl.isMobile) {
              return;
            }
            if (ctrl.state.currentMode === _MODES.ADD_EDGE) {
              if (ctrl.canAddEdge) {
                beginAddEdge(index);
              }
            } else if (ctrl.state.currentMode === _MODES.MOVE) {
              if (ctrl.canMoveVertex) {
                beginDragVertex(index);
              }
            }
          };

          ctrl.onMouseleaveVertex = function(index) {
            if (ctrl.isMobile) {
              return;
            }
            ctrl.state.hoveredVertex = (
              index === ctrl.state.hoveredVertex) ?
              null : ctrl.state.hoveredVertex;
          };

          ctrl.onClickVertexLabel = function(index) {
            if (ctrl.graph.isLabeled && ctrl.canEditVertexLabel) {
              beginEditVertexLabel(index);
            }
          };

          // Edge events
          ctrl.onClickEdge = function(index) {
            if (ctrl.state.currentMode === _MODES.DELETE) {
              if (ctrl.canDeleteEdge) {
                deleteEdge(index);
              }
            }
            if (ctrl.state.currentMode !== _MODES.DELETE &&
                ctrl.graph.isWeighted &&
                ctrl.canEditEdgeWeight) {
              beginEditEdgeWeight(index);
            }
          };
          ctrl.onClickEdgeWeight = function(index) {
            if (ctrl.graph.isWeighted && ctrl.canEditEdgeWeight) {
              beginEditEdgeWeight(index);
            }
          };

          // Document event
          ctrl.onMouseupDocument = function() {
            if (ctrl.isMobile) {
              return;
            }
            if (ctrl.state.currentMode === _MODES.ADD_EDGE) {
              if (ctrl.state.hoveredVertex !== null) {
                tryAddEdge(
                  ctrl.state.addEdgeVertex, ctrl.state.hoveredVertex);
              }
              endAddEdge();
            } else if (ctrl.state.currentMode === _MODES.MOVE) {
              if (ctrl.state.currentlyDraggedVertex !== null) {
                endDragVertex();
              }
            }
          };
          $document.on('mouseup', ctrl.onMouseupDocument);

          // Actions
          var beginAddEdge = function(startIndex) {
            ctrl.state.addEdgeVertex = startIndex;
          };

          var endAddEdge = function() {
            ctrl.state.addEdgeVertex = null;
          };

          var tryAddEdge = function(startIndex, endIndex) {
            if (
              startIndex === null ||
              endIndex === null ||
              startIndex === endIndex ||
              startIndex < 0 ||
              endIndex < 0 ||
              startIndex >= ctrl.graph.vertices.length ||
              endIndex >= ctrl.graph.vertices.length) {
              return;
            }
            for (var i = 0; i < ctrl.graph.edges.length; i++) {
              if (startIndex === ctrl.graph.edges[i].src &&
                  endIndex === ctrl.graph.edges[i].dst) {
                return;
              }
              if (!ctrl.graph.isDirected) {
                if (startIndex === ctrl.graph.edges[i].dst &&
                    endIndex === ctrl.graph.edges[i].src) {
                  return;
                }
              }
            }
            ctrl.graph.edges.push({
              src: startIndex,
              dst: endIndex,
              weight: 1
            });
            return;
          };

          var beginDragVertex = function(index) {
            ctrl.state.currentlyDraggedVertex = index;
            ctrl.state.vertexDragStartX = ctrl.graph.vertices[index].x;
            ctrl.state.vertexDragStartY = ctrl.graph.vertices[index].y;
            ctrl.state.mouseDragStartX = ctrl.state.mouseX;
            ctrl.state.mouseDragStartY = ctrl.state.mouseY;
          };

          var endDragVertex = function() {
            ctrl.state.currentlyDraggedVertex = null;
            ctrl.state.vertexDragStartX = 0;
            ctrl.state.vertexDragStartY = 0;
            ctrl.state.mouseDragStartX = 0;
            ctrl.state.mouseDragStartY = 0;
          };

          var beginEditVertexLabel = function(index) {
            ctrl.state.selectedVertex = index;
            FocusManagerService.setFocus('vertexLabelEditBegun');
          };

          var beginEditEdgeWeight = function(index) {
            ctrl.state.selectedEdge = index;
            ctrl.selectedEdgeWeightValue = (
              ctrl.graph.edges[ctrl.state.selectedEdge].weight);
            ctrl.shouldShowWrongWeightWarning = false;
            FocusManagerService.setFocus('edgeWeightEditBegun');
          };

          var deleteEdge = function(index) {
            ctrl.graph.edges.splice(index, 1);
            ctrl.state.hoveredEdge = null;
          };

          var _deleteRepeatedUndirectedEdges = function() {
            for (var i = 0; i < ctrl.graph.edges.length; i++) {
              var edge1 = ctrl.graph.edges[i];
              for (var j = i + 1; j < ctrl.graph.edges.length; j++) {
                var edge2 = ctrl.graph.edges[j];
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
            ctrl.graph.edges = $.map(ctrl.graph.edges, function(edge) {
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
            ctrl.graph.vertices.splice(index, 1);
            ctrl.state.hoveredVertex = null;
          };

          ctrl.selectedVertexLabelGetterSetter = function(label) {
            if (ctrl.state.selectedVertex === null) {
              return '';
            }
            if (angular.isDefined(label)) {
              ctrl.graph.vertices[ctrl.state.selectedVertex].label = label;
            }
            return ctrl.graph.vertices[ctrl.state.selectedVertex].label;
          };

          ctrl.selectedEdgeWeight = function(weight) {
            if (ctrl.state.selectedEdge === null) {
              return '';
            }
            if (weight === null) {
              ctrl.selectedEdgeWeightValue = '';
            }
            if (angular.isNumber(weight)) {
              ctrl.selectedEdgeWeightValue = weight;
            }
            return ctrl.selectedEdgeWeightValue;
          };

          ctrl.isValidEdgeWeight = function() {
            return angular.isNumber(ctrl.selectedEdgeWeightValue);
          };

          ctrl.onUpdateEdgeWeight = function() {
            if (angular.isNumber(ctrl.selectedEdgeWeightValue)) {
              ctrl.graph.edges[ctrl.state.selectedEdge].weight = (
                ctrl.selectedEdgeWeightValue);
            }
            ctrl.state.selectedEdge = null;
          };

          // Styling functions
          var DELETE_COLOR = 'red';
          var HOVER_COLOR = 'aqua';
          var SELECT_COLOR = 'orange';
          var DEFAULT_COLOR = 'black';
          ctrl.getEdgeColor = function(index) {
            if (!ctrl.isInteractionActive()) {
              return DEFAULT_COLOR;
            }
            if (ctrl.state.currentMode === _MODES.DELETE &&
                index === ctrl.state.hoveredEdge &&
                ctrl.canDeleteEdge) {
              return DELETE_COLOR;
            } else if (index === ctrl.state.hoveredEdge) {
              return HOVER_COLOR;
            } else if (ctrl.state.selectedEdge === index) {
              return SELECT_COLOR;
            } else {
              return DEFAULT_COLOR;
            }
          };
          ctrl.getVertexColor = function(index) {
            if (!ctrl.isInteractionActive()) {
              return DEFAULT_COLOR;
            }
            if (ctrl.state.currentMode === _MODES.DELETE &&
                index === ctrl.state.hoveredVertex &&
                ctrl.canDeleteVertex) {
              return DELETE_COLOR;
            } else if (index === ctrl.state.currentlyDraggedVertex) {
              return HOVER_COLOR;
            } else if (index === ctrl.state.hoveredVertex) {
              return HOVER_COLOR;
            } else if (ctrl.state.selectedVertex === index) {
              return SELECT_COLOR;
            } else {
              return DEFAULT_COLOR;
            }
          };
          ctrl.getDirectedEdgeArrowPoints = function(index) {
            return GraphDetailService.getDirectedEdgeArrowPoints(
              ctrl.graph, index);
          };
          ctrl.getEdgeCentre = function(index) {
            return GraphDetailService.getEdgeCentre(ctrl.graph, index);
          };

          // Initial value of SVG view box.
          ctrl.svgViewBox = initViewboxSize();

          if (ctrl.isInteractionActive()) {
            ctrl.init();
          }
        }
      ]
    };
  }
]);
