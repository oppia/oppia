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
 * @fileoverview Model for creating and mutating instances of frontend
 * subtopic page data domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';

import {
  RecordedVoiceOverBackendDict,
  RecordedVoiceovers
} from 'domain/exploration/recorded-voiceovers.model';

import {
  SubtitledHtmlBackendDict,
  SubtitledHtml
} from 'domain/exploration/subtitled-html.model';

export interface SubtopicPageContentsBackendDict {
  'subtitled_html': SubtitledHtmlBackendDict;
  'recorded_voiceovers': RecordedVoiceOverBackendDict;
}

export class SubtopicPageContents {
  _subtitledHtml: SubtitledHtml;
  _recordedVoiceovers: RecordedVoiceovers;
  constructor(
      subtitledHtml: SubtitledHtml, recordedVoiceovers: RecordedVoiceovers) {
    this._subtitledHtml = subtitledHtml;
    this._recordedVoiceovers = recordedVoiceovers;
  }

  getSubtitledHtml(): SubtitledHtml {
    return this._subtitledHtml;
  }

  setSubtitledHtml(newSubtitledHtml: SubtitledHtml): void {
    this._subtitledHtml = cloneDeep(newSubtitledHtml);
  }

  getHtml(): string {
    return this._subtitledHtml.html;
  }

  setHtml(html: string): void {
    this._subtitledHtml.html = html;
  }

  getRecordedVoiceovers(): RecordedVoiceovers {
    return this._recordedVoiceovers;
  }

  setRecordedVoiceovers(newRecordedVoiceovers: RecordedVoiceovers): void {
    this._recordedVoiceovers = cloneDeep(newRecordedVoiceovers);
  }

  toBackendDict(): SubtopicPageContentsBackendDict {
    return {
      subtitled_html: this._subtitledHtml.toBackendDict(),
      recorded_voiceovers: this._recordedVoiceovers.toBackendDict()
    };
  }

  static createDefault(): SubtopicPageContents {
    var recordedVoiceovers = RecordedVoiceovers.createEmpty();
    recordedVoiceovers.addContentId('content');
    return new SubtopicPageContents(
      SubtitledHtml.createDefault('', 'content'),
      recordedVoiceovers);
  }

  static createFromBackendDict(
      backendDict: SubtopicPageContentsBackendDict): SubtopicPageContents {
    return new SubtopicPageContents(
      SubtitledHtml.createFromBackendDict(
        backendDict.subtitled_html),
      RecordedVoiceovers.createFromBackendDict(
        backendDict.recorded_voiceovers));
  }
}
