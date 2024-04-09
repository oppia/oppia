// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview New classroom model.
 */

import {AppConstants} from 'app.constants';

export interface NewClassroom {
  _classroomId: string;
  _name: string;
  _urlFragment: string;
  _classroomDataIsValid: boolean;
  getClassroomId: () => string;
  getClassroomName: () => string;
  getClassroomUrlFragment: () => string;
  setClassroomName: (classroomName: string) => void;
  setUrlFragment: (urlFragment: string) => void;
  getClassroomNameValidationErrors: () => string;
  getClassroomUrlValidationErrors: () => string;
  isClassroomDataValid: () => boolean;
  setClassroomValidityFlag: (classroomDataIsValid: boolean) => void;
}

export class NewClassroomData implements NewClassroom {
  _classroomId: string;
  _name: string;
  _urlFragment: string;
  _classroomDataIsValid!: boolean;

  constructor(classroomId: string, name: string, urlFragment: string) {
    this._classroomId = classroomId;
    this._name = name;
    this._urlFragment = urlFragment;
  }

  isClassroomDataValid(): boolean {
    return this._classroomDataIsValid;
  }

  setClassroomValidityFlag(classroomDataIsValid: boolean): void {
    this._classroomDataIsValid = classroomDataIsValid;
  }

  getClassroomId(): string {
    return this._classroomId;
  }

  getClassroomName(): string {
    return this._name;
  }

  getClassroomUrlFragment(): string {
    return this._urlFragment;
  }

  setClassroomName(classroomName: string): void {
    this._name = classroomName;
  }

  setUrlFragment(urlFragment: string): void {
    this._urlFragment = urlFragment;
  }

  getClassroomNameValidationErrors(): string {
    let errorMsg = '';
    if (this._name === '') {
      errorMsg = 'The classroom name should not be empty.';
    } else if (this._name.length > AppConstants.MAX_CHARS_IN_CLASSROOM_NAME) {
      errorMsg = 'The classroom name should contain at most 39 characters.';
    }
    return errorMsg;
  }

  getClassroomUrlValidationErrors(): string {
    let errorMsg = '';
    const validUrlFragmentRegex = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX
    );

    if (this._urlFragment === '') {
      errorMsg = 'The classroom URL fragment should not be empty.';
    } else if (
      this._urlFragment.length >
      AppConstants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
    ) {
      errorMsg =
        'The classroom URL fragment should contain at most 20 characters.';
    } else if (!validUrlFragmentRegex.test(this._urlFragment)) {
      errorMsg =
        'The classroom URL fragment should only contain lowercase ' +
        'letters separated by hyphens.';
    }
    return errorMsg;
  }
}
