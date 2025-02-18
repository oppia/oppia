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

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EditabilityService {
  static isEditable: boolean = false;
  static isTranslatable: boolean = false;
  static inTutorialMode: boolean = false;
  static isLockedByAdmin: boolean = false;

  /**
   * @return {boolean} Whether the service is editable.
   */
  isEditable(): boolean {
    return (
      EditabilityService.isEditable &&
      !EditabilityService.inTutorialMode &&
      !EditabilityService.isLockedByAdmin
    );
  }

  /**
   * @return {boolean} Whether the service is translatable.
   */
  isTranslatable(): boolean {
    return (
      EditabilityService.isTranslatable && !EditabilityService.inTutorialMode
    );
  }

  /**
   * @return {boolean} Whether the service is in tutorial mode.
   */
  inTutorialMode(): boolean {
    return EditabilityService.inTutorialMode;
  }

  /**
   * @return {boolean} Whether the service is editable outside tutorial mode.
   */
  isEditableOutsideTutorialMode(): boolean {
    return EditabilityService.isEditable;
  }

  /**
   * Mark the service's editability outside tutorial mode to true.
   */
  markEditable(): void {
    EditabilityService.isEditable = true;
  }

  /**
   * Mark the serivce's translatability outside tutorial mode to true.
   */
  markTranslatable(): void {
    EditabilityService.isTranslatable = true;
  }

  /**
   * Mark the service's editability outside tutorial mode to false.
   */
  markNotEditable(): void {
    EditabilityService.isEditable = false;
  }

  /**
   * Set the service's tutorial mode status to false when tutorial mode ends.
   */
  onEndTutorial(): void {
    EditabilityService.inTutorialMode = false;
  }

  /**
   * Set the service's tutorial mode status to true when tutorial mode starts.
   */
  onStartTutorial(): void {
    EditabilityService.inTutorialMode = true;
  }

  lockExploration(explorationIsLocked: boolean): void {
    EditabilityService.isLockedByAdmin = explorationIsLocked;
  }

  isLockedByAdmin(): boolean {
    return EditabilityService.isLockedByAdmin;
  }
}
