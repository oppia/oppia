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
 * @fileoverview Component for the subtopic viewer.
 */

import { Component, EventEmitter, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
 
@Component({
  selector: 'oppia-learner-group-details',
  templateUrl: './learner-group-details.component.html'
})
export class LearnerGroupDetailsComponent {
  @Output() updateLearnerGroupTitle: EventEmitter<string> = new EventEmitter();
  @Output() updateLearnerGroupDesc: EventEmitter<string> = new EventEmitter();
  learnerGroupTitle: string;
  learnerGroupDescription: string;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {}

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  updateLearnerGroupDetails(): void {
    this.updateLearnerGroupTitle.emit(this.learnerGroupTitle);
    this.updateLearnerGroupDesc.emit(this.learnerGroupDescription);
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupDetails',
  downgradeComponent({component: LearnerGroupDetailsComponent}));
