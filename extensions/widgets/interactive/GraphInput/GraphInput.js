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
          console.log($scope.graph);
          $scope.$parent.$parent.submitAnswer($scope.graph, 'submit');
        };
        
        $scope.init = function() {
          updateGraphFromJSON($attrs.graphWithValue);
          $scope.movePermissions = ($attrs.movePermissionsWithValue === 'true') ? true : false;
          $scope.vertexEditPermissions = ($attrs.vertexEditPermissionsWithValue === 'true') ? true : false;
        };
        $scope.init();
        
        // TODO(czxcjx): Write this functio
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
 * Attempts to inherit $scope.graph, $scope.vertexEditPermissions and
 * $scope.movePermissions if they exist.
 */
oppia.directive('graphViz', function() {
  return {
    restrict: 'E',
    scope: {
      graph: '=?',
      vertexEditPermissions: '=?',
      movePermissions: '=?',
      optionsEditPermissions: '=?',
    },
    templateUrl: 'graphViz/graphVizSvg',
    controller: ['$scope', '$element', '$attrs', '$document', function($scope, $element, $attrs, $document) {
      if ($scope.graph === undefined) {
        $scope.graph = {'vertices': [], 'edges': [], 'isDirected': false, 'isWeighted': false, 'isLabeled': false};
      }
      
      var _MODES = {
        MOVE: 0,
        ADD_EDGE: 1,
        ADD_VERTEX: 2,
        DELETE: 3
      };

      // The current state of the UI and stuff like that
      $scope.state = {
        currentMode: _MODES.MOVE,
        // Vertex and/or edge currently being hovered over
        hoverVertex: null,
        hoverEdge: null,
        // If in ADD_EDGE mode, source vertex of the new edge, if it exists
        addEdgeVertex: null,
        // Currently dragged vertex
        dragVertex: null,
        // Selected vertex for editing label
        selectVertex: null,
        // Mouse position in SVG coordinates
        mouseX: 0,
        mouseY: 0,
      };

      // TODO(czxcjx): Can someone confirm if the jQuery offset() function is the right one to use here?
      var vizContainer = $($element).find('.oppia-graph-viz-svg');
      $scope.mousemoveGraphSVG = function(event) {
        $scope.state.mouseX = event.pageX - vizContainer.offset().left;
        $scope.state.mouseY = event.pageY - vizContainer.offset().top;
        if ($scope.state.dragVertex !== null) {
          $scope.graph.vertices[$scope.state.dragVertex].x = $scope.state.mouseX;
          $scope.graph.vertices[$scope.state.dragVertex].y = $scope.state.mouseY;
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
        if ($scope.state.hoverVertex === null) {
          $scope.state.selectVertex = null;
        }
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

      // TODO(czx): When the graph area is too small (e.g. editing rules),
      // this overlaps with the other buttons. Should try to rearrange this.
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
      // TODO(czx): Handle what happens to pairs of edges if a directed graph becomes undirected
      $scope.toggleGraphOption = function(option) {
        $scope.graph[option] = !$scope.graph[option];
      };
      $scope.setMode = function(mode, $event) {
        // Prevents new vertex from being added in add edge mode
        $event.preventDefault();
        $event.stopPropagation();
        $scope.state.currentMode = mode;
        $scope.state.addEdgeVertex = null;
        $scope.state.selectVertex = null;
      };

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
     
      // Document event
      $scope.onMouseupDocument = function() {
        if ($scope.state.currentMode === _MODES.ADD_EDGE) {
          if ($scope.state.hoverVertex !== null) {
            tryAddEdge($scope.state.addEdgeVertex, $scope.state.hoverVertex);
          }
          endAddEdge();
        } else if ($scope.state.currentMode === _MODES.MOVE) {
          if ($scope.state.dragVertex !== null) {
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
          return false;
        }
        for (var i = 0; i < $scope.graph.edges.length; i++) {
          if (startIndex === $scope.graph.edges[i].src && endIndex === $scope.graph.edges[i].dst) {
            return false;
          }
          if (!$scope.graph.isDirected) {
            if (startIndex === $scope.graph.edges[i].dst && endIndex === $scope.graph.edges[i].src) {
              return false;
            }
          }
        }
        $scope.graph.edges.push({
          src: startIndex,
          dst: endIndex,
          weight: 1
        });
        return true;
      }
      function beginDragVertex(index) {
        $scope.state.dragVertex = index;
      }
      function endDragVertex() {
        $scope.state.dragVertex = null;
      }
      function beginEditVertexLabel(index) {
        $scope.state.selectVertex = index;
        // TODO(czx): Is there an angular-ish way to do the focus?
        var inputElement = $($element).find('.graph-vertex-label');
        inputElement.focus();
      }

      function deleteEdge(index) {
        $scope.graph.edges.splice(index,1);
        $scope.state.hoverEdge = null;
      }
      function deleteVertex(index) {
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
        $scope.state.hoverVertex = null;
      }
      $scope.selectedVertexLabel = function(label) {
        if ($scope.state.selectVertex === null) {
          return '';
        }
        if (angular.isDefined(label)) {
          $scope.graph.vertices[$scope.state.selectVertex].label = label;
        }
        return $scope.graph.vertices[$scope.state.selectVertex].label;
      };

      // Styling functions
      $scope.getEdgeColor = function(index) {
        if ($scope.state.currentMode === _MODES.DELETE && 
            index === $scope.state.hoverEdge) {
          return "red";
        } else {
          return "black";
        }
      };
      $scope.getHoverVertexColor = function() {
        if ($scope.state.currentMode === _MODES.DELETE &&
            $scope.vertexEditPermissions) {
          return "red";
        } else {
          return "aqua";
        }
      };
    }]
  }
}); 
