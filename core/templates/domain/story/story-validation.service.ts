// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to validate a story.
 */

import {Injectable} from '@angular/core';

import {StoryContents} from 'domain/story/story-contents-object.model';

@Injectable({
  providedIn: 'root',
})
export class StoryValidationService {
  /**
   * Validates the prerequisite skills in the story contents.
   *
   * @returns {string[]} - List of validation issues.
   */
  validatePrerequisiteSkillsInStoryContents(
    topicRelevantSkills: string[],
    storyContents: StoryContents
  ): string[] {
    let issues: string[] = [];
    let nodeIds = storyContents.getNodeIds();
    let nodes = storyContents.getNodes();
    // Variable nodesQueue stores the pending nodes to visit in a queue form.
    let nodesQueue = [];
    let nodeIsVisited = new Array(nodeIds.length).fill(false);
    const _initialNodeId = storyContents.getInitialNodeId();
    if (_initialNodeId === null) {
      throw new Error('Starting Node does not exist');
    }
    let startingNode = nodes[storyContents.getNodeIndex(_initialNodeId)];
    nodesQueue.push(startingNode.getId());

    // The user is assumed to have all the prerequisite skills of the
    // starting node before starting the story. Also, this list models the
    // skill IDs acquired by a learner as they progress through the story.
    var simulatedSkillIds = new Set(startingNode.getPrerequisiteSkillIds());

    // Validate the prerequisite skills of the starting node.
    startingNode.getPrerequisiteSkillIds().forEach((skillId: string) => {
      if (topicRelevantSkills.includes(skillId)) {
        issues.push(
          `The skill with id ${skillId} was specified as a ` +
            `prerequisite for Chapter ${startingNode.getTitle()} but ` +
            'was not taught in any chapter before it.'
        );
      }
    });

    // The following loop employs a Breadth First Search from the given
    // starting node and makes sure that the user has acquired all the
    // prerequisite skills required by the destination nodes 'unlocked' by
    // visiting a particular node by the time that node is finished.
    while (nodesQueue.length > 0) {
      var currentNodeIndex = storyContents.getNodeIndex(nodesQueue.shift());
      nodeIsVisited[currentNodeIndex] = true;
      var currentNode = nodes[currentNodeIndex];

      currentNode.getAcquiredSkillIds().forEach(skillId => {
        simulatedSkillIds.add(skillId);
      });
      for (var i = 0; i < currentNode.getDestinationNodeIds().length; i++) {
        var nodeId = currentNode.getDestinationNodeIds()[i];
        var nodeIndex = storyContents.getNodeIndex(nodeId);
        // The following condition checks whether the destination node
        // for a particular node, has already been visited, in which case
        // the story would have loops, which are not allowed.
        if (nodeIsVisited[nodeIndex]) {
          issues.push('Loops are not allowed in the node graph');
          // If a loop is encountered, then all further checks are halted,
          // since it can lead to same error being reported again.
          return issues;
        }
        var destinationNode = nodes[nodeIndex];
        destinationNode.getPrerequisiteSkillIds().forEach((skillId: string) => {
          if (
            topicRelevantSkills.includes(skillId) &&
            !simulatedSkillIds.has(skillId)
          ) {
            issues.push(
              `The skill with id ${skillId} was specified as a ` +
                `prerequisite for Chapter ${destinationNode.getTitle()} but ` +
                'was not taught in any chapter before it.'
            );
          }
        });
        nodesQueue.push(nodeId);
      }
    }
    return issues;
  }
}
