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
 * @fileoverview Model for creating and mutating instances of frontend
 * learner group domain objects.
 */

export interface LearnerGroupBackendDict {
  id: string ;
  title: string;
  description: string;
  facilitator_usernames: string[];
  learner_usernames: string[];
  invited_learner_usernames: string[];
  subtopic_page_ids: string[];
  story_ids: string[];
}

export class LearnerGroupData {
  _id: string;
  _title: string;
  _description: string;
  _facilitatorUsernames: string[];
  _learnerUsernames: string[];
  _invitedLearnerUsernames: string[];
  _subtopicPageIds: string[];
  _storyIds: string[];

  constructor(
      id: string,
      title: string,
      description: string,
      facilitatorUsernames: string[],
      learnerUsernames: string[],
      invitedLearnerUsernames: string[],
      subtopicPageIds: string[],
      storyIds: string[]
  ) {
    this._id = id;
    this._title = title;
    this._description = description;
    this._facilitatorUsernames = facilitatorUsernames;
    this._learnerUsernames = learnerUsernames;
    this._invitedLearnerUsernames = invitedLearnerUsernames;
    this._subtopicPageIds = subtopicPageIds;
    this._storyIds = storyIds;
  }

  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  set title(title: string) {
    this._title = title;
  }

  get description(): string {
    return this._description;
  }

  set description(description: string) {
    this._description = description;
  }

  get facilitatorUsernames(): string[] {
    return this._facilitatorUsernames;
  }

  get learnerUsernames(): string[] {
    return this._learnerUsernames;
  }

  get invitedLearnerUsernames(): string[] {
    return this._invitedLearnerUsernames;
  }

  get subtopicPageIds(): string[] {
    return this._subtopicPageIds;
  }

  get storyIds(): string[] {
    return this._storyIds;
  }

  addFacilitator(facilitatorUsername: string): void {
    this._facilitatorUsernames.push(facilitatorUsername);
  }

  removeFacilitator(facilitatorUsername: string): void {
    let index = this._facilitatorUsernames.indexOf(facilitatorUsername);
    this._facilitatorUsernames.splice(index, 1);
  }

  addLearner(learnerUsername: string): void {
    this._learnerUsernames.push(learnerUsername);
  }

  removeLearner(learnerUsername: string): void {
    let index = this._learnerUsernames.indexOf(learnerUsername);
    this._learnerUsernames.splice(index, 1);
  }

  inviteLearners(learnerUsernames: string[]): void {
    this._invitedLearnerUsernames.push(...learnerUsernames);
  }

  revokeInvitation(learnerUsername: string): void {
    let index = this._invitedLearnerUsernames.indexOf(learnerUsername);
    this._invitedLearnerUsernames.splice(index, 1);
  }

  addSubtopicPageIds(subtopicPageIds: string[]): void {
    this._subtopicPageIds.push(...subtopicPageIds);
  }

  removeSubtopicPageId(subtopicPageId: string): void {
    let index = this._subtopicPageIds.indexOf(subtopicPageId);
    this._subtopicPageIds.splice(index, 1);
  }

  addStoryIds(storyIds: string[]): void {
    this._storyIds.push(...storyIds);
  }

  removeStoryId(storyId: string): void {
    let index = this._storyIds.indexOf(storyId);
    this._storyIds.splice(index, 1);
  }

  // Creation mode is true if the learner group is being created.
  validate(creationMode: boolean): string[] {
    let issues = [];
    if (this._title === '') {
      issues.push(
        'Learner Group title should not be empty.');
    }
    if (this._description === '') {
      issues.push(
        'Learner Group description should not be empty.');
    }
    if (this._facilitatorUsernames.length === 0) {
      issues.push(
        'Learner Group should have at least one facilitator.');
    }
    if (this._subtopicPageIds.length + this._storyIds.length === 0) {
      issues.push(
        'Learner Group should have at least one syllabus item.');
    }
    if (creationMode && this._learnerUsernames.length > 0) {
      issues.push(
        'Learner Group cannot have any learners while creation.');
    }
    if (!creationMode) {
      const commonUsernames = this.learnerUsernames.filter(
        username => this.invitedLearnerUsernames.includes(username)
      );
      if (commonUsernames.length > 0) {
        issues.push(
          'Learners can not be invited to join the same group again.'
        );
      }
    }
    return issues;
  }

  static createFromBackendDict(
      learnerGroupBackendDict: LearnerGroupBackendDict): LearnerGroupData {
    return new LearnerGroupData (
      learnerGroupBackendDict.id,
      learnerGroupBackendDict.title,
      learnerGroupBackendDict.description,
      learnerGroupBackendDict.facilitator_usernames,
      learnerGroupBackendDict.learner_usernames,
      learnerGroupBackendDict.invited_learner_usernames,
      learnerGroupBackendDict.subtopic_page_ids,
      learnerGroupBackendDict.story_ids
    );
  }
}
