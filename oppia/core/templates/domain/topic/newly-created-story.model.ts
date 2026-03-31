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
 * @fileoverview Frontend Model for newly created story.
 */
import {AppConstants} from 'app.constants';

export class NewlyCreatedStory {
  title: string;
  description: string;
  urlFragment: string;
  /**
   * @param {String} title - title of the story.
   * @param {String} description - description of the story.
   * @param {String} urlFragment - url fragment of the story.
   */
  constructor(title: string, description: string, urlFragment: string) {
    this.title = title;
    this.description = description;
    this.urlFragment = urlFragment;
  }

  static createDefault(): NewlyCreatedStory {
    return new NewlyCreatedStory('', '', '');
  }

  /**
   * @returns {Boolean} - A boolean indicating if the story is valid.
   */
  isValid(): boolean {
    const VALID_URL_FRAGMENT_REGEX = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX
    );
    return Boolean(
      this.title &&
        this.description &&
        this.urlFragment &&
        VALID_URL_FRAGMENT_REGEX.test(this.urlFragment)
    );
  }
}
