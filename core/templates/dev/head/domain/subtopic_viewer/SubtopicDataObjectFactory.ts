// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating instances of frontend
 * subtopic data domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { SubtopicPageContentsObjectFactory } from
  'domain/topic/SubtopicPageContentsObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';

export class SubtopicData {
  _subtopic_title;
  _page_contents;

  constructor(private subtopicPageContentsObjectFactory:SubtopicPageContentsObjectFactory, subtopicTitle, pageContents) {
    this._subtopic_title = subtopicTitle;
    this._page_contents = subtopicPageContentsObjectFactory.
        createFromBackendDict(pageContents);
  }

  getSubtopicTitle() {
    return this._subtopic_title;
  }

  getPageContents() {
    return this._page_contents;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtopicDataObjectFactory {
  createFromBackendDict(subtopicDataBackendDict: any): SubtopicData {
    return new SubtopicData(
      new SubtopicPageContentsObjectFactory(
        new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()),
        new SubtitledHtmlObjectFactory()
      ),
      subtopicDataBackendDict.subtopic_title,
      subtopicDataBackendDict.page_contents
    )
  }
}

angular.module('oppia').factory(
  'SubtopicDataObjectFactory',
  downgradeInjectable(SubtopicDataObjectFactory));