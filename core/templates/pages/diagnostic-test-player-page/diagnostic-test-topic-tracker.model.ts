// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview The model maintains a list of the eligible topic IDs from
 * which the next topic should be selected and tested in the diagnostic test.
 * This model also keeps track of all the topic IDs that were failed by
 * the learner.
 */

import cloneDeep from 'lodash/cloneDeep';

export interface TopicIdToRelatedTopicIds {
  [topicId: string]: string[];
}

export class DiagnosticTestTopicTrackerModel {
  // The list of pending topic IDs from which the next topic can be selected
  // and tested in the diagnostic test.
  private _pendingTopicIdsToTest: string[];

  // The field keeps track of the topic ID that are failed by the learner.
  // Failing on a topic means the learner has attempted two questions
  // incorrectly that are associated with the given topic.
  private _failedTopicIds: string[];

  // The dependency among topics is represented in a form of a dict with
  // topic ID as key and a list of immediate parent topic IDs as value.
  // Example graph: A --> B --> C, here, the prerequisite of C is only B.
  private _topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds;

  // A dict with topic ID as key and a list of ancestor topic IDs as value.
  // Example graph: A --> B --> C, therefore the ancestors of C are both
  // A and B.
  private _topicIdToAncestorTopicIds: TopicIdToRelatedTopicIds;

  // A dict with topic ID as key and a list of successor topic IDs as value.
  // Example graph: A --> B --> C, here the successors of A are B, C, and the
  // successor of B is only C.
  private _topicIdToSuccessorTopicIds: TopicIdToRelatedTopicIds;

  constructor(topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds) {
    this._failedTopicIds = [];
    this._topicIdToAncestorTopicIds = {};
    this._topicIdToSuccessorTopicIds = {};

    this._topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;
    this._pendingTopicIdsToTest = Object.keys(
      this._topicIdToPrerequisiteTopicIds
    ).sort();

    this.generateTopicIdToAncestorTopicIds();
    this.generateTopicIdToSuccessorTopicIds();
  }

  getPendingTopicIdsToTest(): string[] {
    return this._pendingTopicIdsToTest;
  }

  getFailedTopicIds(): string[] {
    return this._failedTopicIds;
  }

  getAncestorTopicIds(topicId: string): string[] {
    return this._topicIdToAncestorTopicIds[topicId];
  }

  getTopicIdToAncestorTopicIds(): TopicIdToRelatedTopicIds {
    return this._topicIdToAncestorTopicIds;
  }

  getSuccessorTopicIds(topicId: string): string[] {
    return this._topicIdToSuccessorTopicIds[topicId];
  }

  getTopicIdToSuccessorTopicIds(): TopicIdToRelatedTopicIds {
    return this._topicIdToSuccessorTopicIds;
  }

  getTopicIdToPrerequisiteTopicIds(): TopicIdToRelatedTopicIds {
    return this._topicIdToPrerequisiteTopicIds;
  }

  generateTopicIdToAncestorTopicIds(): void {
    // The method generates a dict with topic ID as the key and all of its
    // ancestor topic IDs as value. The ancestor's list is generated using the
    // prerequisite dependency graph.
    // Example: A -> B -> C, here the topic ID to ancestor topic IDs dict will
    // look like: {A: [], B: [A], C: [A, B]}.
    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      let ancestorTopicIds: string[] = [];
      let unprocessedAncestorTopicIds: string[] = cloneDeep(
        this._topicIdToPrerequisiteTopicIds[topicId]
      );

      let visitedTopicIdsForCurrentTopic: string[] = [];
      let lastTopicId: string;

      while (unprocessedAncestorTopicIds.length > 0) {
        // '.pop()' here can return an undefined value, but we're already
        // checking for length > 0, so this is safe.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lastTopicId = unprocessedAncestorTopicIds.pop()!;

        if (ancestorTopicIds.indexOf(lastTopicId) === -1) {
          ancestorTopicIds.push(lastTopicId);
        }

        unprocessedAncestorTopicIds = unprocessedAncestorTopicIds.concat(
          this._topicIdToPrerequisiteTopicIds[lastTopicId].filter(
            topic => visitedTopicIdsForCurrentTopic.indexOf(topic) === -1
          )
        );
        visitedTopicIdsForCurrentTopic.push(lastTopicId);
      }
      this._topicIdToAncestorTopicIds[topicId] = ancestorTopicIds.sort();
    }
  }

  _generateTopicIdToChildTopicId(
    topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds
  ): TopicIdToRelatedTopicIds {
    // The method generates a dict with topic ID as the key and its immediate
    // successor topic IDs as value. The successor's list is generated using
    // the prerequisite dependency graph.
    // Example: A -> B -> C, here the topic ID to child topic IDs dict will
    // look like: {A: [B], B: [C], C: []}.
    let topicIdToChildTopicId: TopicIdToRelatedTopicIds = {};

    for (let topicId in topicIdToPrerequisiteTopicIds) {
      topicIdToChildTopicId[topicId] = [];
    }

    for (let topicId in topicIdToPrerequisiteTopicIds) {
      let prereqTopicIds = topicIdToPrerequisiteTopicIds[topicId];
      for (let prereqTopicId of prereqTopicIds) {
        topicIdToChildTopicId[prereqTopicId].push(topicId);
      }
    }
    return topicIdToChildTopicId;
  }

  generateTopicIdToSuccessorTopicIds(): void {
    // The method generates a dict with topic ID as the key and all of its
    // successor topic IDs as value. The successor's list is generated using
    // the prerequisite dependency graph.
    // Example: A -> B -> C, here the topic ID to successor topic IDs dict will
    // look like: {A: [B, C], B: [C], C: []}.
    let topicIdToChildTopicId: TopicIdToRelatedTopicIds =
      this._generateTopicIdToChildTopicId(this._topicIdToPrerequisiteTopicIds);

    for (let topicId in topicIdToChildTopicId) {
      let successorTopicIds: string[] = [];
      let unprocessedSuccessorTopicIds: string[] = cloneDeep(
        topicIdToChildTopicId[topicId]
      );

      let visitedTopicIdsForCurrentTopic: string[] = [];
      let lastTopicId: string;

      while (unprocessedSuccessorTopicIds.length > 0) {
        // '.pop()' here can return an undefined value, but we're already
        // checking for length > 0, so this is safe.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        lastTopicId = unprocessedSuccessorTopicIds.pop()!;

        if (successorTopicIds.indexOf(lastTopicId) === -1) {
          successorTopicIds.push(lastTopicId);
        }

        unprocessedSuccessorTopicIds = unprocessedSuccessorTopicIds.concat(
          topicIdToChildTopicId[lastTopicId].filter(
            topicId => visitedTopicIdsForCurrentTopic.indexOf(topicId) === -1
          )
        );
        visitedTopicIdsForCurrentTopic.push(lastTopicId);
      }
      this._topicIdToSuccessorTopicIds[topicId] = successorTopicIds.sort();
    }
  }

  selectNextTopicIdToTest(): string {
    // A dict with topic ID as key and
    // min(length of ancestors, length of successors) topic IDs as value.
    let topicIdToLengthOfRelatedTopicIds: {[topicId: string]: number} = {};

    for (let topicId of this._pendingTopicIdsToTest) {
      let ancestorTopicIds = this._topicIdToAncestorTopicIds[topicId];
      let successorTopicIds = this._topicIdToSuccessorTopicIds[topicId];

      // Considering a given topic, the assured number of topics that will be
      // removed from the eligible topic IDs after testing, is the minimum of
      // the counts of its ancestors and successors.
      topicIdToLengthOfRelatedTopicIds[topicId] = Math.min(
        ancestorTopicIds.length,
        successorTopicIds.length
      );
    }

    // Among all the eligible topics, the topic with the maximum value for
    // min(ancestors, successors) should be selected for testing. The
    // maximum value helps us to reach the result faster which helps in quicker
    // recommendations.
    return Object.keys(topicIdToLengthOfRelatedTopicIds).reduce(
      (item1, item2) => {
        return topicIdToLengthOfRelatedTopicIds[item1] >=
          topicIdToLengthOfRelatedTopicIds[item2]
          ? item1
          : item2;
      }
    );
  }

  recordTopicPassed(passedTopicId: string): void {
    // If a topic is passed, that means we don't need to test any of the
    // ancestor topics. Hence the ancestors of the current topic must be
    // removed from the eligible topic IDs, topic ID to ancestor topic IDs dict,
    // and topic ID to successor topic IDs dict.
    let topicIdsToRemove: string[] = [];

    let ancestorTopicIds = this._topicIdToAncestorTopicIds[passedTopicId];

    // Removing the ancestor topic IDs because the given topic ID is passed.
    topicIdsToRemove = topicIdsToRemove.concat(ancestorTopicIds);
    // Removing the given topic ID because it is already tested.
    topicIdsToRemove.push(passedTopicId);

    this._pendingTopicIdsToTest = this._pendingTopicIdsToTest.filter(
      topicId => topicIdsToRemove.indexOf(topicId) === -1
    );
    this.removeTopicIdsFromTopicIdToAncestorsDict(topicIdsToRemove);
    this.removeTopicIdsFromTopicIdToSuccessorsDict(topicIdsToRemove);
  }

  recordTopicFailed(failedTopicId: string): void {
    // If a topic is failed, that means we don't need to test any of the
    // successor topics. Hence the successors of the current topic must be
    // removed from the eligible topic IDs, topic ID to ancestor topic IDs dict,
    // and topic ID to successor topic IDs dict.
    this._failedTopicIds.push(failedTopicId);
    let topicIdsToRemove: string[] = [];

    let successorTopicIds = this._topicIdToSuccessorTopicIds[failedTopicId];

    // Removing the successor topic IDs because the given topic ID is failed.
    topicIdsToRemove = topicIdsToRemove.concat(successorTopicIds);
    // Removing the given topic ID because it is already tested.
    topicIdsToRemove.push(failedTopicId);

    this._pendingTopicIdsToTest = this._pendingTopicIdsToTest.filter(
      topicId => topicIdsToRemove.indexOf(topicId) === -1
    );
    this.removeTopicIdsFromTopicIdToAncestorsDict(topicIdsToRemove);
    this.removeTopicIdsFromTopicIdToSuccessorsDict(topicIdsToRemove);
  }

  removeTopicIdsFromTopicIdToAncestorsDict(topicIdsToRemove: string[]): void {
    // Removing the given topic IDs from the topic ID to the ancestor
    // topic IDs dict.
    for (let topicId of topicIdsToRemove) {
      delete this._topicIdToAncestorTopicIds[topicId];
    }
    for (let topicId in this._topicIdToAncestorTopicIds) {
      let ancestors = this._topicIdToAncestorTopicIds[topicId];
      this._topicIdToAncestorTopicIds[topicId] = ancestors.filter(topic => {
        return topicIdsToRemove.indexOf(topic) === -1;
      });
    }
  }

  removeTopicIdsFromTopicIdToSuccessorsDict(topicIdsToRemove: string[]): void {
    // Removing the given topic IDs from the topic ID to the successor
    // topic IDs dict.
    for (let topicId of topicIdsToRemove) {
      delete this._topicIdToSuccessorTopicIds[topicId];
    }
    for (let topicId in this._topicIdToSuccessorTopicIds) {
      let successors = this._topicIdToSuccessorTopicIds[topicId];
      this._topicIdToSuccessorTopicIds[topicId] = successors.filter(topic => {
        return topicIdsToRemove.indexOf(topic) === -1;
      });
    }
  }
}
