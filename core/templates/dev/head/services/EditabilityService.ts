// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for checking the ability to edit an exploration.
 */

// TODO(sll): Should this depend on a versioning service that keeps track of
// the current active version? Previous versions should not be editable.
// TODO(SD): Remove translatable part from this service after translation tab
// will get implemented.

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class EditabilityService {
  isEditableBool: boolean = false;
  isTranslatableBool: boolean = false;
  inTutorialModeBool: boolean = false;

  isEditable() {
    return this.isEditableBool && !this.inTutorialModeBool;
  }
  isTranslatable() {
    return this.isTranslatableBool && !this.inTutorialModeBool;
  }
  isEditableOutsideTutorialMode() {
    return this.isEditableBool;
  }
  markEditable() {
    this.isEditableBool = true;
  }
  markTranslatable() {
    this.isTranslatableBool = true;
  }
  markNotEditable() {
    this.isEditableBool = false;
  }
  onEndTutorial() {
    this.inTutorialModeBool = false;
  }
  onStartTutorial() {
    this.inTutorialModeBool = true;
  }
}

var oppia = require('AppInit.ts').module;

oppia.factory('EditabilityService', downgradeInjectable(EditabilityService));
