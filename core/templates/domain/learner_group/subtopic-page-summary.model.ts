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
 * subtopic page summary domain objects.
 */

export interface SubtopicPageSummaryBackendDict {
  'subtopic_id': string;
  'subtopic_title': string;
  'parent_topic_id': string;
  'parent_topic_name': string;
  'thumbnail_filename': string;
  'thumbnail_bg_color': string;
  'subtopic_mastery'?: number;
}

export class SubtopicPageSummary {
  _parentTopicId: string;
  _parentTopicName: string;
  _subtopicId: string;
  _subtopicTitle: string;
  _thumbnailFilename: string;
  _thumbnailBgColor: string;
  // Optional, if it's none, it means the subtopic is not started yet.
  _subtopicMastery?: number;

  constructor(
      parentTopicId: string,
      parentTopicName: string,
      subtopicId: string,
      subtopicTitle: string,
      thumbnailFilename: string,
      thumbnailBgColor: string,
      subtopicMastery?: number) {
    this._parentTopicId = parentTopicId;
    this._parentTopicName = parentTopicName;
    this._subtopicId = subtopicId;
    this._subtopicTitle = subtopicTitle;
    this._thumbnailFilename = thumbnailFilename;
    this._thumbnailBgColor = thumbnailBgColor;
    this._subtopicMastery = subtopicMastery;
  }

  get parentTopicId(): string {
    return this._parentTopicId;
  }

  get parentTopicName(): string {
    return this._parentTopicName;
  }

  get subtopicId(): string {
    return this._subtopicId;
  }

  get subtopicTitle(): string {
    return this._subtopicTitle;
  }

  get thumbnailFilename(): string {
    return this._thumbnailFilename;
  }

  get thumbnailBgColor(): string {
    return this._thumbnailBgColor;
  }

  get subtopicMastery(): number | undefined {
    return this._subtopicMastery;
  }

  get subtopicPageId(): string {
    return this._parentTopicId + ':' + this._subtopicId;
  }

  static createFromBackendDict(
      SubtopicPageSummaryBackendDict: SubtopicPageSummaryBackendDict
  ): SubtopicPageSummary {
    return new SubtopicPageSummary(
      SubtopicPageSummaryBackendDict.parent_topic_id,
      SubtopicPageSummaryBackendDict.parent_topic_name,
      SubtopicPageSummaryBackendDict.subtopic_id,
      SubtopicPageSummaryBackendDict.subtopic_title,
      SubtopicPageSummaryBackendDict.thumbnail_filename,
      SubtopicPageSummaryBackendDict.thumbnail_bg_color,
      SubtopicPageSummaryBackendDict.subtopic_mastery);
  }
}
