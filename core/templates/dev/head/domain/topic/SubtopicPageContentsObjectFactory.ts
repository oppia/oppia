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

import * as cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory.ts';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory.ts';

export class SubtopicPageContents {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because '_subtitledHtml' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing. Same goes for '_recordedVoiceovers'.
  _subtitledHtml: any;
  _recordedVoiceovers: any;
  constructor(subtitledHtml: any, recordedVoiceovers: any) {
    this._subtitledHtml = subtitledHtml;
    this._recordedVoiceovers = recordedVoiceovers;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  getSubtitledHtml(): any {
    return this._subtitledHtml;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'newSubtitledHtml' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  setSubtitledHtml(newSubtitledHtml: any): void {
    this._subtitledHtml = cloneDeep(newSubtitledHtml);
  }

  getHtml(): string {
    return this._subtitledHtml.getHtml();
  }

  setHtml(html: string): void {
    this._subtitledHtml.setHtml(html);
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  getRecordedVoiceovers(): any {
    return this._recordedVoiceovers;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'newRecordedVoiceovers' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  setRecordedVoiceovers(newRecordedVoiceovers: any): void {
    this._recordedVoiceovers = cloneDeep(newRecordedVoiceovers);
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  toBackendDict(): any {
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

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'backendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(backendDict: any): SubtopicPageContents {
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
