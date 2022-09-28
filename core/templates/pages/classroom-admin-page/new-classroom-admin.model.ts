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

import { AppConstants } from "app.constants";
import { ValidateClassroomFieldResponse } from "./existing-classroom-admin.model";


export interface NewClassroom {
  _classroomId: string;
  _name: string;
  _urlFragment: string;
  _existingClassroomNames: string[];
  _classroomNameIsValid: boolean;
  _classroomUrlFragmentIsValid: boolean;
  getClassroomId: () => string;
  getClassroomName: () => string;
  getClassroomUrlFragment: () => string;
  IsClassroomNameValid: () => ValidateClassroomFieldResponse;
  IsClassroomUrlFragmentIsValid: () => ValidateClassroomFieldResponse;
}


export class NewClassroomData implements NewClassroom {
  _classroomId: string;
  _name: string;
  _urlFragment: string;
  _existingClassroomNames!: string[];
  _classroomNameIsValid!: boolean;
  _classroomUrlFragmentIsValid!: boolean;

  constructor(
      classroomId: string,
      name: string,
      urlFragment: string
  ) {
    this._classroomId = classroomId;
    this._name = name;
    this._urlFragment = urlFragment;
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

  IsClassroomNameValid(): ValidateClassroomFieldResponse {
    this._classroomNameIsValid = true;

    if (this._name === '') {
      return {
        type: 'The classroom name should not be empty.',
        result: false
      };
    }

    if (this._name.length > AppConstants.MAX_CHARS_IN_CLASSROOM_NAME) {
      return {
        type: 'The classroom name should contain at most 39 characters.',
        result: false
      };
    }

    return {
      type: '',
      result: true
    };
  }

  IsClassroomUrlFragmentIsValid(): ValidateClassroomFieldResponse {
    if (this._urlFragment === '') {
      return {
        type: 'The classroom URL fragment should not be empty.',
        result: false
      };
    }

    if (
        this._urlFragment.length >
        AppConstants.MAX_CHARS_IN_CLASSROOM_URL_FRAGMENT
    ) {
      return {
        type: (
          'The classroom URL fragment should contain at most 20 characters.'),
        result: false
      };
    }

    const validUrlFragmentRegex = new RegExp(
      AppConstants.VALID_URL_FRAGMENT_REGEX);
    if (!validUrlFragmentRegex.test(this._urlFragment)) {
      return {
        type: (
          'The classroom URL fragment should only contain lowercase ' +
          'letters separated by hyphens.'),
        result: false
      };
    }

    return {
      type: '',
      result: true
    };
  }
}
