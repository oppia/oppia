// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for editing a collection node. This includes:
 * editing pre-requisite skills, editing acquired skills and deleting a node.
 *
 * @author mgowano@google.com (Abraham Mgowano)
 */

oppia.directive('collectionNodeDirective', [function() {
  return {
    restrict: 'E',
    scope: {
      getPrerequisiteSkills: '&prerequisiteSkills',
      getAcquiredSkills: '&acquiredSkills',
      getExplorationId: '&explorationId',
      getExplorationTitle: '&explorationTitle',
      addPrereqSkill: '&',
      addAcquiredSkill: '&',
      deleteExploration: '&'
    },
    templateUrl: 'inline/collection_node_directive'
  };
}]);
