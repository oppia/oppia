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
 * subtopic page data domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import {
  IRecordedVoiceOverBackendDict,
  RecordedVoiceovers,
  RecordedVoiceoversObjectFactory
} from 'domain/exploration/RecordedVoiceoversObjectFactory';

import {
  ISubtitledHtmlBackendDict,
  SubtitledHtml,
  SubtitledHtmlObjectFactory
} from 'domain/exploration/SubtitledHtmlObjectFactory';

export interface ISubtopicPageContentsBackendDict {
  'subtitled_html': ISubtitledHtmlBackendDict;
  'recorded_voiceovers': IRecordedVoiceOverBackendDict;
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
    return this._subtitledHtml.getHtml();
  }

  setHtml(html: string): void {
    this._subtitledHtml.setHtml(html);
  }

  getRecordedVoiceovers(): RecordedVoiceovers {
    return this._recordedVoiceovers;
  }

  setRecordedVoiceovers(newRecordedVoiceovers: RecordedVoiceovers): void {
    this._recordedVoiceovers = cloneDeep(newRecordedVoiceovers);
  }

  toBackendDict(): ISubtopicPageContentsBackendDict {
    return {
      subtitled_html: this._subtitledHtml.toBackendDict(),
      recorded_voiceovers: this._recordedVoiceovers.toBackendDict()
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtopicPageContentsObjectFactory {
  constructor(
    private recordedVoiceoversObjectFactory: RecordedVoiceoversObjectFactory,
    private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory) {}

  createDefault(): SubtopicPageContents {
    var recordedVoiceovers = this.recordedVoiceoversObjectFactory.createEmpty();
    recordedVoiceovers.addContentId('content');
    return new SubtopicPageContents(
      this.subtitledHtmlObjectFactory.createDefault('', 'content'),
      recordedVoiceovers);
  }

  createFromBackendDict(
      backendDict: ISubtopicPageContentsBackendDict): SubtopicPageContents {
    return new SubtopicPageContents(
      this.subtitledHtmlObjectFactory.createFromBackendDict(
        backendDict.subtitled_html),
      this.recordedVoiceoversObjectFactory.createFromBackendDict(
        backendDict.recorded_voiceovers));
  }
}

angular.module('oppia').factory(
  'SubtopicPageContentsObjectFactory',
  downgradeInjectable(SubtopicPageContentsObjectFactory));
