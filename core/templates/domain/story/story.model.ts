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
 * @fileoverview Model class for creating and mutating instances of frontend
 * story domain objects.
 */

import {AppConstants} from 'app.constants';

import {
  StoryContentsBackendDict,
  StoryContents,
} from 'domain/story/story-contents-object.model';

export interface StoryBackendDict {
  id: string;
  title: string;
  description: string;
  notes: string;
  story_contents: StoryContentsBackendDict;
  language_code: string;
  version: number;
  corresponding_topic_id: string;
  thumbnail_filename: string;
  thumbnail_bg_color: string;
  url_fragment: string;
  meta_tag_content: string;
}

export class Story {
  _id: string;
  _title: string;
  _description: string;
  _notes: string;
  _storyContents: StoryContents;
  _languageCode: string;
  _version: number;
  _correspondingTopicId: string;
  _thumbnailFilename: string | null;
  _thumbnailBgColor: string | null;
  _urlFragment: string;
  _metaTagContent: string;
  constructor(
    id: string,
    title: string,
    description: string,
    notes: string,
    storyContents: StoryContents,
    languageCode: string,
    version: number,
    correspondingTopicId: string,
    thumbnailBgColor: string | null,
    thumbnailFilename: string | null,
    urlFragment: string,
    metaTagContent: string
  ) {
    this._id = id;
    this._title = title;
    this._description = description;
    this._notes = notes;
    this._storyContents = storyContents;
    this._languageCode = languageCode;
    this._version = version;
    this._correspondingTopicId = correspondingTopicId;
    this._thumbnailBgColor = thumbnailBgColor;
    this._thumbnailFilename = thumbnailFilename;
    this._urlFragment = urlFragment;
    this._metaTagContent = metaTagContent;
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

  getMetaTagContent(): string {
    return this._metaTagContent;
  }

  setMetaTagContent(metaTagContent: string): void {
    this._metaTagContent = metaTagContent;
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

  getThumbnailFilename(): string | null {
    return this._thumbnailFilename;
  }

  setThumbnailFilename(thumbnailFilename: string | null): void {
    this._thumbnailFilename = thumbnailFilename;
  }

  getThumbnailBgColor(): string | null {
    return this._thumbnailBgColor;
  }

  setThumbnailBgColor(thumbnailBgColor: string | null): void {
    this._thumbnailBgColor = thumbnailBgColor;
  }

  getUrlFragment(): string {
    return this._urlFragment;
  }

  setUrlFragment(urlFragment: string): void {
    this._urlFragment = urlFragment;
  }

  validate(): string[] {
    var issues = [];
    if (this._title === '') {
      issues.push('Story title should not be empty');
    }
    const VALID_URL_FRAGMENT_REGEX = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX
    );
    if (!this._urlFragment) {
      issues.push('Url Fragment should not be empty.');
    } else {
      if (!VALID_URL_FRAGMENT_REGEX.test(this._urlFragment)) {
        issues.push(
          'Url Fragment contains invalid characters. ' +
            'Only lowercase words separated by hyphens are allowed.'
        );
      }
      if (
        this._urlFragment.length > AppConstants.MAX_CHARS_IN_STORY_URL_FRAGMENT
      ) {
        issues.push(
          'Url Fragment should not be greater than ' +
            `${AppConstants.MAX_CHARS_IN_STORY_URL_FRAGMENT} characters`
        );
      }
    }
    issues = issues.concat(this._storyContents.validate());
    return issues;
  }

  prepublishValidate(): string[] {
    const metaTagContentCharLimit = AppConstants.MAX_CHARS_IN_META_TAG_CONTENT;
    let issues = [];
    if (!this._thumbnailFilename) {
      issues.push('Story should have a thumbnail.');
    }
    if (!this._metaTagContent) {
      issues.push('Story should have meta tag content.');
    } else if (this._metaTagContent.length > metaTagContentCharLimit) {
      issues.push(
        'Story meta tag content should not be longer than ' +
          `${metaTagContentCharLimit} characters.`
      );
    }
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
    this._thumbnailFilename = otherStory.getThumbnailFilename();
    this._thumbnailBgColor = otherStory.getThumbnailBgColor();
    this._urlFragment = otherStory.getUrlFragment();
    this.setMetaTagContent(otherStory.getMetaTagContent());
  }

  static createFromBackendDict(storyBackendDict: StoryBackendDict): Story {
    return new Story(
      storyBackendDict.id,
      storyBackendDict.title,
      storyBackendDict.description,
      storyBackendDict.notes,
      StoryContents.createFromBackendDict(storyBackendDict.story_contents),
      storyBackendDict.language_code,
      storyBackendDict.version,
      storyBackendDict.corresponding_topic_id,
      storyBackendDict.thumbnail_bg_color,
      storyBackendDict.thumbnail_filename,
      storyBackendDict.url_fragment,
      storyBackendDict.meta_tag_content
    );
  }
}
