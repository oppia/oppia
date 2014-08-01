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
				$scope.graph = {'vertices':[],'edges':[],'isDirected':[],'isWeighted':[],'isLabeled':[]};
				//$scope.updateGraphViz = function() {}

				//TODO: Actually write this function?
				$scope.checkValidGraph = function(g) {
					return true;
				}

				//Updates graph using json input
				$scope.updateGraphFromJSON = function(jsonGraph) {
					var newGraph = JSON.parse(jsonGraph);
					if ($scope.checkValidGraph(newGraph)) {
						$scope.graph = newGraph;
						//$scope.updateGraphViz();
					} else {
						errorMessage = "Invalid graph!";
					}
				}
				$scope.updateGraphFromInput = function() {
					$scope.updateGraphFromJSON(d3.select($element[0]).select('.json-graph-input')[0][0].value);
				}
				
				$scope.submitGraph = function() {
					var strGraph = JSON.stringify($scope.graph);
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

oppia.directive('graphInputDraggableVertex', ['$document', function($document){
	return function(scope,element,attr){
		var startX = 0;
		var startY = 0;
		var startCX = 0;
		var startCY = 0;
		var graph = scope.$parent.graph;
		var index = parseInt(attr.index);
		var vertex = graph.vertices[index];
		element.on('mousedown',function(event){
			event.preventDefault();

			startX = event.pageX;
			startY = event.pageY;
			startCX = parseInt(attr.cx);
			startCY = parseInt(attr.cy);

			$document.on('mousemove',mousemove);
			$document.on('mouseup',mouseup);
		});

		function mousemove(event) {
			vertex.x = event.pageX - startX + startCX;
			vertex.y = event.pageY - startY + startCY;
			scope.$parent.$apply();
		}

		function mouseup(event) {
			$document.off('mousemove',mousemove);
			$document.off('mouseup',mouseup);
		}
	};
}]);
