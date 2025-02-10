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
 * @fileoverview Model class for creating domain object for frontend topics
 * that are used in topics dashboard.
 */

import {AppConstants} from 'app.constants';

export class NewlyCreatedTopic {
  name: string;
  description: string;
  urlFragment: string;
  pageTitleFragment: string;
  /**
   * @param {String} name - name of the topic.
   * @param {String} description - description of the topic.
   * @param {String} urlFragment - url fragment of the topic.
   * @param {String} pageTitleFragment - page title fragment of the topic.
   */
  constructor(
    name: string,
    description: string,
    urlFragment: string,
    pageTitleFragment: string
  ) {
    this.name = name;
    this.description = description;
    this.urlFragment = urlFragment;
    this.pageTitleFragment = pageTitleFragment;
  }

  /**
   * @returns {Boolean} - A boolean indicating if the topic is valid.
   */
  isValid(): boolean {
    let validUrlFragmentRegex = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX
    );
    let urlFragmentCharLimit = AppConstants.MAX_CHARS_IN_TOPIC_URL_FRAGMENT;
    let titleFragMaxLimit =
      AppConstants.MAX_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB;
    let titleFragMinLimit =
      AppConstants.MIN_CHARS_IN_PAGE_TITLE_FRAGMENT_FOR_WEB;
    return Boolean(
      this.name &&
        this.description &&
        this.urlFragment &&
        validUrlFragmentRegex.test(this.urlFragment) &&
        this.urlFragment.length <= urlFragmentCharLimit &&
        this.pageTitleFragment &&
        this.pageTitleFragment.length >= titleFragMinLimit &&
        this.pageTitleFragment.length <= titleFragMaxLimit
    );
  }

  /**
   * @returns {NewlyCreatedTopic} - A new NewlyCreatedTopic instance.
   */
  static createDefault(): NewlyCreatedTopic {
    return new NewlyCreatedTopic('', '', '', '');
  }
}
