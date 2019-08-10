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

import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory.ts';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory.ts';

export class SubtopicPageContents {
  _subtitledHtml: any;
  _recordedVoiceovers: any;
  constructor(subtitledHtml, recordedVoiceovers) {
    this._subtitledHtml = subtitledHtml;
    this._recordedVoiceovers = recordedVoiceovers;
  }

  getSubtitledHtml() {
    return this._subtitledHtml;
  }

  setSubtitledHtml(newSubtitledHtml) {
    this._subtitledHtml = cloneDeep(newSubtitledHtml);
  }

  getHtml() {
    return this._subtitledHtml.getHtml();
  }

  setHtml(html) {
    this._subtitledHtml.setHtml(html);
  }

  getRecordedVoiceovers() {
    return this._recordedVoiceovers;
  }

  setRecordedVoiceovers(newRecordedVoiceovers) {
    this._recordedVoiceovers = cloneDeep(newRecordedVoiceovers);
  }

  toBackendDict() {
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

  createDefault() {
    var recordedVoiceovers = this.recordedVoiceoversObjectFactory.createEmpty();
    recordedVoiceovers.addContentId('content');
    return new SubtopicPageContents(
      this.subtitledHtmlObjectFactory.createDefault('', 'content'),
      recordedVoiceovers);
  }

  createFromBackendDict(backendDict) {
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
