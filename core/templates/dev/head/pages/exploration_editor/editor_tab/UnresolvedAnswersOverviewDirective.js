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
 * @fileoverview Directive for the state graph visualization.
 */

oppia.directive('unresolvedAnswersOverviewViz', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      // Note: This directive is used as attribute because pannability does not
      //    work when directive is used as element. (Convention in the codebase
      //    is to use directive as element.)
      restrict: 'A',
      scope: {
        allowPanning: '@',
        centerAtCurrentState: '@',
        currentStateId: '&',
        // A function returning an object with these keys:
        //  - 'nodes': An object whose keys are node ids and whose values are
        //             node labels
        //  - 'links': A list of objects with keys:
        //            'source': id of source node
        //            'target': id of target node
        //            'linkProperty': property of link which determines how
        //              it is styled (styles in linkPropertyMapping). If
        //              linkProperty or corresponding linkPropertyMatching
        //              is undefined, link style defaults to the gray arrow.
        //  - 'initStateId': The initial state id
        //  - 'finalStateIds': The list of ids corresponding to terminal states
        //             (i.e., those whose interactions are terminal).
        graphData: '&',
        // Object whose keys are ids of nodes to display a warning tooltip over
        highlightStates: '=',
        // Id of a second initial state, which will be styled as an initial
        // state
        initStateId2: '=',
        isEditable: '=',
        // Object which maps linkProperty to a style
        linkPropertyMapping: '=',
        // Object whose keys are node ids and whose values are node colors
        nodeColors: '=',
        // A value which is the color of all nodes
        nodeFill: '@',
        // Object whose keys are node ids with secondary labels and whose
        // values are secondary labels. If this is undefined, it means no nodes
        // have secondary labels.
        nodeSecondaryLabels: '=',
        // Function called when node is clicked. Should take a parameter
        // node.id.
        onClickFunction: '=',
        onDeleteFunction: '=',
        onMaximizeFunction: '=',
        // Object whose keys are ids of nodes, and whose values are the
        // corresponding node opacities.
        opacityMap: '=',
        showWarningSign: '@'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_tab/' +
        'unresolved_answers_overview_directive.html'),
      controller: [
        '$scope', 'EditorStateService', 'ExplorationStatesService',
        'StateStatsService',
        function(
            $scope, EditorStateService, ExplorationStatesService,
            StateStatsService) {
          var MAXIMUM_UNRESOLVED_ANSWERS = 5;
          var MINIMUM_UNRESOLVED_ANSWER_FREQUENCY = 2;

          $scope.unresolvedAnswersData = [];

          $scope.computeUnresolvedAnswers = function() {
            var state = ExplorationStatesService.getState(
              EditorStateService.getActiveStateName());

            $scope.unresolvedAnswersData = [];
            $scope.lastRefreshDate = null;

            if (StateStatsService.stateSupportsIssuesOverview(state)) {
              StateStatsService.computeStateStats(state).then(function(stats) {
                var calculatedUnresolvedAnswersData = [];

                for (var i = 0; i !== stats.visualizations_info.length; ++i) {
                  var vizInfo = stats.visualizations_info[i];
                  if (!vizInfo.show_addressed_info) {
                    // Skip visualizations which don't support addressed
                    // information.
                    continue;
                  }

                  for (var j = 0; j !== vizInfo.data.length; ++j) {
                    var datum = vizInfo.data[j];
                    if (datum.is_addressed ||
                        datum.frequency < MINIMUM_UNRESOLVED_ANSWER_FREQUENCY) {
                      continue;
                    }

                    calculatedUnresolvedAnswersData.push(datum);
                    if (calculatedUnresolvedAnswersData.length ===
                        MAXIMUM_UNRESOLVED_ANSWERS) {
                      break;
                    }
                  }
                  // Only take the first visualization with addressable answer
                  // data.
                  break;
                }

                // Only keep 5 unresolved answers.
                $scope.unresolvedAnswersData = calculatedUnresolvedAnswersData;
                $scope.lastRefreshDate = new Date();
              });
            }
          };

          $scope.$on('refreshStateEditor', $scope.computeUnresolvedAnswers);
        }
      ]
    };
  }]);
