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

import cloneDeep from 'lodash/cloneDeep';


export interface TopicIdToRelatedTopicIds {
  [topicId: string]: string[];
}

export interface DiagnosticTestModel {
  _totalNumberOfAttemptedQuestions: number;
  _currentTopicId: string;
  _eligibleTopicIds: string[];
  _skippedTopicIds: string[];
  _passedTopicIds: string[];
  _failedTopicIds: string[];
  _topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds;
  _topicIdToAncestorTopicIds: TopicIdToRelatedTopicIds;
  _topicIdToSuccessorTopicIds: TopicIdToRelatedTopicIds;
  setTopicIdToAncestorTopicIds: () => void;
  setTopicIdToSuccessorTopicIds: () => void;
  getAncestorsTopicIds: (topicId: string) => string[];
  getSuccessorTopicIds: (topicId: string) => string[];
  incrementNumberOfAttemptedQuestions: (incrementByValue: number) => void;
  recordTopicPassed: () => void;
  recordTopicFailed: () => void;
  isTestFinished: () => boolean;
  getEligibleTopicIds: () => string[];
  getFailedTopicIds: () => string[];
  getCurrentTopicId: () => string;
  setCurrentTopicId: () => void;
}

export class DiagnosticTestModelData {
  _totalNumberOfAttemptedQuestions: number;
  _currentTopicId: string;
  _eligibleTopicIds: string[];
  _skippedTopicIds: string[];
  _passedTopicIds: string[];
  _failedTopicIds: string[];
  _topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds;
  _topicIdToAncestorTopicIds: TopicIdToRelatedTopicIds;
  _topicIdToSuccessorTopicIds: TopicIdToRelatedTopicIds;

  constructor(topicIdToPrerequisiteTopicIds: TopicIdToRelatedTopicIds) {
    this._topicIdToPrerequisiteTopicIds = topicIdToPrerequisiteTopicIds;
    this._totalNumberOfAttemptedQuestions = 0;
    this._eligibleTopicIds = Object.keys(this._topicIdToPrerequisiteTopicIds);
    this._skippedTopicIds = [];
    this._passedTopicIds = [];
    this._failedTopicIds = [];
    this._currentTopicId = '';
    this._topicIdToAncestorTopicIds = {};
    this._topicIdToSuccessorTopicIds = {};
    this.setTopicIdToAncestorTopicIds();
    this.setTopicIdToSuccessorTopicIds();
  }

  getTopicIdToAncestorTopicIds(): TopicIdToRelatedTopicIds {
    return this._topicIdToAncestorTopicIds;
  }

  getEligibleTopicIds(): string[] {
    return this._eligibleTopicIds;
  }

  getFailedTopicIds(): string[] {
    return this._failedTopicIds;
  }

  getPassedTopicIds(): string[] {
    return this._passedTopicIds;
  }

  getCurrentTopicId(): string {
    return this._currentTopicId;
  }

  getSkippedTopicIds(): string[] {
    return this._skippedTopicIds;
  }

  getTopicIdToSuccessorTopicIds(): TopicIdToRelatedTopicIds {
    return this._topicIdToSuccessorTopicIds;
  }

  getAncestorsTopicIds(topicId: string): string[] {
    return this._topicIdToAncestorTopicIds[topicId];
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

  setTopicIdToAncestorTopicIds(): void {
    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      let ancestors: string[] = [];
      let prerequisites: string[] = cloneDeep(
        this._topicIdToPrerequisiteTopicIds[topicId]);

      while (prerequisites.length > 0) {
        let len = prerequisites.length;
        let lastTopicId = prerequisites[len - 1];
        prerequisites.splice(len - 1, 1);
        if (ancestors.indexOf(lastTopicId) === -1) {
          ancestors.push(lastTopicId);
        }

        prerequisites = prerequisites.concat(
          this._topicIdToPrerequisiteTopicIds[lastTopicId]);
      }
      this._topicIdToAncestorTopicIds[topicId] = ancestors;
    }
  }

  setTopicIdToSuccessorTopicIds(): void {
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
        let len = children.length;
        let lastTopicId = children[len - 1];
        children.splice(len - 1, 1);
        if (successors.indexOf(lastTopicId) === -1) {
          successors.push(lastTopicId);
        }
        children = children.concat(topicIdToChildTopicId[lastTopicId]);
      }
      this._topicIdToSuccessorTopicIds[topicId] = successors;
    }
  }

  setCurrentTopicId(): void {
    let topicIdToLengthOfExpectedRemoval: {[topicId: string]: number} = {};
    let lengthOfAncestorTopicIds: number;
    let lengthOfSuccessorTopicIds: number;

    for (let topicId in this._topicIdToPrerequisiteTopicIds) {
      lengthOfAncestorTopicIds = (
        this._topicIdToAncestorTopicIds[topicId].length);
      lengthOfSuccessorTopicIds = (
        this._topicIdToSuccessorTopicIds[topicId].length);

      topicIdToLengthOfExpectedRemoval[topicId] = Math.min(
        lengthOfAncestorTopicIds, lengthOfSuccessorTopicIds);
    }

    let tempTopicId = Object.keys(topicIdToLengthOfExpectedRemoval)[0];
    let tempLenghtOfExpectedRemoval = (
      topicIdToLengthOfExpectedRemoval[tempTopicId]);
    for (let topicId in topicIdToLengthOfExpectedRemoval) {
      if (
        topicIdToLengthOfExpectedRemoval[topicId] >
          tempLenghtOfExpectedRemoval
      ) {
        tempLenghtOfExpectedRemoval = topicIdToLengthOfExpectedRemoval[topicId];
        tempTopicId = topicId;
      }
    }
    this._currentTopicId = tempTopicId;
  }

  recordTopicPassed(): void {
    let ancestors = this._topicIdToAncestorTopicIds[this._currentTopicId];
    this._passedTopicIds.push(this._currentTopicId);

    let topicIdsToRemoveFromEligibleList: string[] = [];
    topicIdsToRemoveFromEligibleList = (
      topicIdsToRemoveFromEligibleList.concat(ancestors));
    topicIdsToRemoveFromEligibleList.push(this._currentTopicId);

    this._eligibleTopicIds = this._eligibleTopicIds.filter((topicId) => {
      if (topicIdsToRemoveFromEligibleList.indexOf(topicId) === -1) {
        return true;
      }
      return false;
    });

    this._skippedTopicIds = this._skippedTopicIds.concat(ancestors);
  }

  recordTopicFailed(): void {
    let successors = this._topicIdToSuccessorTopicIds[this._currentTopicId];
    this._failedTopicIds.push(this._currentTopicId);

    let topicIdsToRemoveFromEligibleList: string[] = [];
    topicIdsToRemoveFromEligibleList = (
      topicIdsToRemoveFromEligibleList.concat(successors));
    topicIdsToRemoveFromEligibleList.push(this._currentTopicId);

    this._eligibleTopicIds = this._eligibleTopicIds.filter((topicId) => {
      if (topicIdsToRemoveFromEligibleList.indexOf(topicId) === -1) {
        return true;
      }
      return false;
    });

    this._skippedTopicIds = this._skippedTopicIds.concat(successors);
  }

  isTestFinished(): boolean {
    if (this._eligibleTopicIds.length === 0) {
      return true;
    }

    if (
      this._eligibleTopicIds.length > 0 &&
        this._totalNumberOfAttemptedQuestions >= 15
    ) {
      return true;
    }

    return false;
  }
}
