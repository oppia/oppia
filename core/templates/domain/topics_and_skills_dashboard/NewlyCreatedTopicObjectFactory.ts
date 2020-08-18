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
 * @fileoverview Factory for creating domain object for frontend topics
 * that are used in topics dashboard.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';

export class NewlyCreatedTopic {
  name: string;
  description: string;
  urlFragment: string;
  /**
   * @param {String} name - name of the topic.
   * @param {String} description - description of the topic.
   * @param {String} urlFragment - url fragment of the topic.
   */
  constructor(name, description, urlFragment) {
    this.name = name;
    this.description = description;
    this.urlFragment = urlFragment;
  }
  /**
   * @returns {Boolean} - A boolean indicating if the topic is valid.
   */
  isValid(): boolean {
    let validUrlFragmentRegex = new RegExp(
      // TODO(#7434): Use dot notation after we find a way to get
      // rid of the TS2339 error on AppConstants.
      // eslint-disable-next-line dot-notation
      AppConstants['VALID_URL_FRAGMENT_REGEX']);
    // TODO(#7434): Use dot notation after we find a way to get
    // rid of the TS2339 error on AppConstants.
    // eslint-disable-next-line dot-notation
    let urlFragmentCharLimit = AppConstants['MAX_CHARS_IN_TOPIC_URL_FRAGMENT'];
    return Boolean(
      this.name && this.description && this.urlFragment &&
      validUrlFragmentRegex.test(this.urlFragment) &&
      this.urlFragment.length <= urlFragmentCharLimit);
  }
}

@Injectable({
  providedIn: 'root'
})
export class NewlyCreatedTopicObjectFactory {
  /**
   * @returns {NewlyCreatedTopic} - A new NewlyCreatedTopic instance.
   */
  createDefault(): NewlyCreatedTopic {
    return new NewlyCreatedTopic('', '', '');
  }
}

angular.module('oppia').factory(
  'NewlyCreatedTopicObjectFactory',
  downgradeInjectable(NewlyCreatedTopicObjectFactory));
