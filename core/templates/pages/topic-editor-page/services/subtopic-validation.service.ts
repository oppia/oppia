// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to validate subtopic name.
 */

import {Injectable} from '@angular/core';
import {TopicEditorStateService} from './topic-editor-state.service';
import {AppConstants} from 'app.constants';

@Injectable({
  providedIn: 'root',
})
export class SubtopicValidationService {
  private _VALID_URL_FRAGMENT_REGEX = new RegExp(
    AppConstants.VALID_URL_FRAGMENT_REGEX
  );

  constructor(private topicEditorStateService: TopicEditorStateService) {}

  checkValidSubtopicName(title: string): boolean {
    let subtopicTitles: string[] = [];
    let topic = this.topicEditorStateService.getTopic();
    topic.getSubtopics().forEach(subtopic => {
      subtopicTitles.push(subtopic.getTitle());
    });
    return subtopicTitles.indexOf(title) === -1;
  }

  doesSubtopicWithUrlFragmentExist(urlFragment: string): boolean {
    let topic = this.topicEditorStateService.getTopic();
    return topic
      .getSubtopics()
      .some(subtopic => subtopic.getUrlFragment() === urlFragment);
  }

  isUrlFragmentValid(urlFragment: string): boolean {
    return this._VALID_URL_FRAGMENT_REGEX.test(urlFragment);
  }
}
