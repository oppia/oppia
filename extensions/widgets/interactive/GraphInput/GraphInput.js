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
				var graph = {'vertices':[],'edges':[],'isDirected':[],'isWeighted':[],'isLabeled':[]};

				var VIS_WIDTH = '100%';
				var VIS_HEIGHT = 250;
				var VERTEX_RADIUS = 5;
				var EDGE_STYLE = "stroke:black;stroke-width:2;";

				$scope.updateGraphViz = function() {
					//Clear all SVG elements
					d3.select($element[0]).selectAll('svg').remove();

					//Create main SVG element
					var graphVis = d3.select($element[0]).select('.oppia-graph-input-viz-container').append('svg:svg')
						.attr({
							'class': 'oppia-graph-input-viz',
							'width': VIS_WIDTH,
							'height': VIS_HEIGHT
						});

					//Create vertices
					for (var i = 0; i < graph.vertices.length; i++) {
						var vertex = graph.vertices[i];
						graphVis.append('svg:circle').attr({
							'cx': vertex.x,
							'cy': vertex.y,
							'r': VERTEX_RADIUS,
							'stroke-width': 0,
							'fill': 'black'
						});
					}

					//Create edges
					for (var i = 0; i < graph.edges.length; i++) {
						var edge = graph.edges[i];
						graphVis.append('svg:line').attr({
							'x1': graph.vertices[edge.src].x,
							'y1': graph.vertices[edge.src].y,
							'x2': graph.vertices[edge.dst].x,
							'y2': graph.vertices[edge.dst].y,
							'style': EDGE_STYLE
						});
					}
				}

				//TODO: Actually write this function?
				$scope.checkValidGraph = function(g) {
					return true;
				}

				//Updates graph using json input
				$scope.updateGraphFromJSON = function(jsonGraph) {
					var newGraph = JSON.parse(jsonGraph);
					if ($scope.checkValidGraph(newGraph)) {
						graph = newGraph;
						$scope.updateGraphViz();
					} else {
						errorMessage = "Invalid graph!";
					}
				}
				$scope.updateGraphFromInput = function() {
					$scope.updateGraphFromJSON(d3.select($element[0]).select('.json-graph-input')[0][0].value);
				}
				
				$scope.submitGraph = function() {
					var strGraph = JSON.stringify(graph);
					$scope.$parent.$parent.submitAnswer(strGraph, 'submit');
				};
				
				$scope.init = function() {
					$scope.updateGraphFromJSON($attrs.graphWithValue);
				};
				$scope.init();
				

			}]
		};
	}
]);
