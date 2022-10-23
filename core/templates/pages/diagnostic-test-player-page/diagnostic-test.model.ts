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
 * @fileoverview Diagnostic test model.
 */

import constants from 'assets/constants';
import cloneDeep from 'lodash/cloneDeep';


export interface TopicIdToRelatedTopicIds {
  [topicId: string]: string[];
}


export class DiagnosticTestModelData {
  // The total number of questions attempted by a learner in the diagnostic
  // test.
  _totalNumberOfAttemptedQuestions: number;

  // The field keeps track of the topic ID that is currently being tested in the
  // diagnostic test.
  _currentTopicId: string;

  // The list of eligible topic IDs from which the next topic ID can be selected
  // and tested in the diagnostic test.
  _eligibleTopicIds: string[];

  // The field keeps track of the topic ID that are failed by the learner.
  // Failing on a topic means the learner has attempted two questions
  // incorrectly that are associated with the given topic.
  _failedTopicIds: string[];

  // The field keeps the dependencies between the topics in a classroom. The
  // dependency is DAG represented in a form of a dict with topic ID as key and
  // a list of an immediate parent or prerequisite topic IDs as value.
  // Example graph: A --> B --> C, here, the prerequisite of C is only B.
  _topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds;

  // A dict with topic ID as key and a list of ancestor topic IDs as value.
  // Example graph: A --> B --> C, therefore the ancestor of C is both A and B.
  _topicIdToAncestorTopicIds: TopicIdToRelatedTopicIds;

  // A dict with topic ID as key and a list of successor topic IDs as value.
  // Example graph: A --> B --> C, here the successors of A are B, C, and the
  // successor of B is only C.
  _topicIdToSuccessorTopicIds: TopicIdToRelatedTopicIds;

  constructor(topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds) {
    this._topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;
    this._totalNumberOfAttemptedQuestions = 0;
    this._eligibleTopicIds = Object.keys(this._topicIdToPrerequisiteTopicIds);
    this._failedTopicIds = [];
    this._currentTopicId = '';
    this._topicIdToAncestorTopicIds = {};
    this._topicIdToSuccessorTopicIds = {};
    this.regenerateTopicIdToAncestorTopicIds();
    this.regenerateTopicIdToSuccessorTopicIds();
  }

  getEligibleTopicIds(): string[] {
    return this._eligibleTopicIds;
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

  getTopicIdToSuccessorTopicIds(): TopicIdToRelatedTopicIds {
    return this._topicIdToSuccessorTopicIds;
  }

  getSuccessorTopicIds(topicId: string): string[] {
    return this._topicIdToSuccessorTopicIds[topicId];
  }

  incrementNumberOfAttemptedQuestions(incrementByValue: number): void {
    this._totalNumberOfAttemptedQuestions += incrementByValue;
  }

  getNumberOfAttemptedQuestions(): number {
    return this._totalNumberOfAttemptedQuestions;
  }

  regenerateTopicIdToAncestorTopicIds(): void {
    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      let ancestors: string[] = [];
      let prerequisites: string[] = cloneDeep(
        this._topicIdToPrerequisiteTopicIds[topicId]);

      while (prerequisites.length > 0) {
        let lastTopicId = prerequisites.pop();
        if (ancestors.indexOf(lastTopicId) === -1) {
          ancestors.push(lastTopicId);
        }

        prerequisites = prerequisites.concat(
          this._topicIdToPrerequisiteTopicIds[lastTopicId]);
      }
      this._topicIdToAncestorTopicIds[topicId] = ancestors;
    }
  }

  regenerateTopicIdToSuccessorTopicIds(): void {
    let topicIdToChildTopicId: TopicIdToRelatedTopicIds = {};

    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      topicIdToChildTopicId[topicId] = [];
    }

    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      let prereq = this._topicIdToPrerequisiteTopicIds[topicId];
      for (let prereqTopicId of prereq) {
        topicIdToChildTopicId[prereqTopicId].push(topicId);
      }
    }

    for (let topicId in topicIdToChildTopicId) {
      let successors: string[] = [];
      let children: string[] = topicIdToChildTopicId[topicId];

      while (children.length > 0) {
        let lastTopicId = children.pop();
        if (successors.indexOf(lastTopicId) === -1) {
          successors.push(lastTopicId);
        }
        children = children.concat(topicIdToChildTopicId[lastTopicId]);
      }
      this._topicIdToSuccessorTopicIds[topicId] = successors;
    }
  }

  selectNextTopicIdToTest(): void {
    // The length of ancestor topic IDs that are currently present in
    // the eligible topic IDs list.
    let lengthOfEligibleAncestorTopicIds: number;

    // The length of successor topic IDs that are currently present in
    // the eligible topic IDs list.
    let lengthOfEligibleSuccessorTopicIds: number;

    // A dict with topic ID as key and minimum /between the length/ of ancestor
    // and successor topic IDs as value.
    let topicIdToLengthOfRelatedTopicIds: {[topicId: string]: number} = {};

    // Iterating on each topic of the eligible topic IDs in order to build the
    // /topicIdToLengthOfRelatedTopicIds/ dict.
    for (let topicId of this._eligibleTopicIds) {
      let ancestors = this._topicIdToAncestorTopicIds[topicId];
      let successors = this._topicIdToSuccessorTopicIds[topicId];

      lengthOfEligibleAncestorTopicIds = ancestors.filter((topic) => {
        return (this._eligibleTopicIds.indexOf(topic) !== -1);
      }).length;

      lengthOfEligibleSuccessorTopicIds = successors.filter((topic) => {
        return (this._eligibleTopicIds.indexOf(topic) !== -1);
      }).length;

      // Considering a given topic, the assured number of topics that will be
      // removed from the eligible topic IDs after testing, is the minimum
      // between its ancestors and successors.
      topicIdToLengthOfRelatedTopicIds[topicId] = Math.min(
        lengthOfEligibleAncestorTopicIds, lengthOfEligibleSuccessorTopicIds);
    }

    // The topic with the maximum length value of min(ancestor, successor) among
    // all the eligible topic IDs, should be selected for the testing. The
    // maximum value helps us to reach the result faster which helps in quicker
    // recommendations.
    this._currentTopicId = Object.keys(
      topicIdToLengthOfRelatedTopicIds).reduce(
      (item1, item2) => (
        topicIdToLengthOfRelatedTopicIds[item1] >
        topicIdToLengthOfRelatedTopicIds[item2]) ? item1 : item2
    );
  }

  recordTopicPassed(): void {
    // If a topic is passed, that means we don't need to test any of the
    // ancestor topics.
    let ancestors = this._topicIdToAncestorTopicIds[this._currentTopicId];

    let topicIdsToRemoveFromEligibleList: string[] = [];
    topicIdsToRemoveFromEligibleList = (
      topicIdsToRemoveFromEligibleList.concat(ancestors));
    topicIdsToRemoveFromEligibleList.push(this._currentTopicId);

    this._eligibleTopicIds = this._eligibleTopicIds.filter((topicId) => {
      return (topicIdsToRemoveFromEligibleList.indexOf(topicId) === -1);
    });
  }

  recordTopicFailed(): void {
    // If a topic is failed, that means we don't need to test any of the
    // successor topics.
    let successors = this._topicIdToSuccessorTopicIds[this._currentTopicId];
    this._failedTopicIds.push(this._currentTopicId);

    let topicIdsToRemoveFromEligibleList: string[] = [];
    topicIdsToRemoveFromEligibleList = (
      topicIdsToRemoveFromEligibleList.concat(successors));
    topicIdsToRemoveFromEligibleList.push(this._currentTopicId);

    this._eligibleTopicIds = this._eligibleTopicIds.filter((topicId) => {
      return (topicIdsToRemoveFromEligibleList.indexOf(topicId) === -1);
    });
  }

  isTestFinished(): boolean {
    // The next topic ID testing cannot be selected from the eligible topic IDs
    // list, hence empty eligible test should terminate the diagnostic test.
    if (this._eligibleTopicIds.length === 0) {
      return true;
    }

    // If the eligible topic IDs list is non-empty but the learner has attempted
    // the maximum allowed questions for the diagnostic test, then the test
    // should be terminated.
    if (
      this._eligibleTopicIds.length > 0 &&
        this._totalNumberOfAttemptedQuestions >=
        constants.MAX_ALLOWED_QUESTIONS_IN_THE_DIAGNOSTIC_TEST
    ) {
      return true;
    }

    // If none of the above conditions are satisfied then the test should not
    // be terminated.
    return false;
  }
}
