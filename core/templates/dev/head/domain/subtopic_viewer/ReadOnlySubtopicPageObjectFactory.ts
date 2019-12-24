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

import { SubtopicPageContentsObjectFactory } from
  'domain/topic/SubtopicPageContentsObjectFactory';

export class ReadOnlySubtopicPageData {
  subtopicTitle;
  pageContents;

  constructor(subtopicTitle, pageContents) {
    this.subtopicTitle = subtopicTitle;
    this.pageContents = pageContents;
  }

  getSubtopicTitle() {
    return this.subtopicTitle;
  }

  getPageContents() {
    return this.pageContents;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ReadOnlySubtopicPageObjectFactory {
  constructor(
    private subtopicPageContentsObjectFactory: SubtopicPageContentsObjectFactory
  ) {}
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'subtopicDataBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(subtopicDataBackendDict: any):
    ReadOnlySubtopicPageData {
    return new ReadOnlySubtopicPageData(
      subtopicDataBackendDict.subtopic_title,
      this.subtopicPageContentsObjectFactory.createFromBackendDict(
        subtopicDataBackendDict.page_contents
      )
    );
  }
}

angular.module('oppia').factory(
  'ReadOnlySubtopicPageObjectFactory',
  downgradeInjectable(ReadOnlySubtopicPageObjectFactory));
