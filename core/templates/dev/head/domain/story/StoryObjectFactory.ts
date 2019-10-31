// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * story domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { StoryContents, StoryContentsObjectFactory } from
  'domain/story/StoryContentsObjectFactory';

export class Story {
  _id: string;
  _title: string;
  _description: string;
  _notes: string;
  _storyContents: StoryContents;
  _languageCode: string;
  _version: number;
  _correspondingTopicId: string;
  constructor(
      id: string, title: string, description: string, notes: string,
      storyContents: StoryContents, languageCode: string, version: number,
      correspondingTopicId: string) {
    this._id = id;
    this._title = title;
    this._description = description;
    this._notes = notes;
    this._storyContents = storyContents;
    this._languageCode = languageCode;
    this._version = version;
    this._correspondingTopicId = correspondingTopicId;
  }

  getId(): string {
    return this._id;
  }

  getTitle(): string {
    return this._title;
  }

  setTitle(title: string): void {
    this._title = title;
  }

  getDescription(): string {
    return this._description;
  }

  setDescription(description: string): void {
    this._description = description;
  }

  getNotes(): string {
    return this._notes;
  }

  setNotes(notes: string): void {
    this._notes = notes;
  }

  getLanguageCode(): string {
    return this._languageCode;
  }

  setLanguageCode(languageCode: string): void {
    this._languageCode = languageCode;
  }

  getVersion(): number {
    return this._version;
  }

  getStoryContents(): StoryContents {
    return this._storyContents;
  }

  getCorrespondingTopicId(): string {
    return this._correspondingTopicId;
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a list with varying element types.
  validate(): any {
    var issues = [];
    if (this._title === '') {
      issues.push('Story title should not be empty');
    }
    issues = issues.concat(this._storyContents.validate());
    return issues;
  }

  // Reassigns all values within this story to match the existing
  // story. This is performed as a deep copy such that none of the
  // internal, bindable objects are changed within this story.
  copyFromStory(otherStory: Story): void {
    this._id = otherStory.getId();
    this.setTitle(otherStory.getTitle());
    this.setDescription(otherStory.getDescription());
    this.setNotes(otherStory.getNotes());
    this.setLanguageCode(otherStory.getLanguageCode());
    this._version = otherStory.getVersion();
    this._storyContents = otherStory.getStoryContents();
    this._correspondingTopicId = otherStory.getCorrespondingTopicId();
  }
}

@Injectable({
  providedIn: 'root'
})
export class StoryObjectFactory {
  constructor(private storyContentsObjectFactory: StoryContentsObjectFactory) {}
  createFromBackendDict(storyBackendDict: any): Story {
    return new Story(
      storyBackendDict.id, storyBackendDict.title,
      storyBackendDict.description, storyBackendDict.notes,
      this.storyContentsObjectFactory.createFromBackendDict(
        storyBackendDict.story_contents),
      storyBackendDict.language_code,
      storyBackendDict.version, storyBackendDict.corresponding_topic_id
    );
  }

  // Create an interstitial story that would be displayed in the editor until
  // the actual story is fetched from the backend.
  createInterstitialStory() {
    return new Story(
      null, 'Story title loading', 'Story description loading',
      'Story notes loading', null, 'en', 1, null);
  }
}

angular.module('oppia').factory(
  'StoryObjectFactory', downgradeInjectable(StoryObjectFactory));
