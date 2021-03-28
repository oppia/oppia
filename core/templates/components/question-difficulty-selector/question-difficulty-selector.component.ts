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
 * @fileoverview Component for the question difficulty selector.
 */

import { Component, OnInit, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'question-difficulty-selector',
  templateUrl: './question-difficulty-selector.component.html',
  styleUrls: []
})
export class QuestionDifficultySelectorComponent implements OnInit {

  @Input() skillIdToRubricsObject: string;
  @Input() skillWithDifficulty: string;
  availableDifficultyValues: Array<Object>;

  ngOnInit(): void {
    this.availableDifficultyValues = [];
            for (var difficulty in AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT) {
              this.availableDifficultyValues.push(
                AppConstants.SKILL_DIFFICULTY_LABEL_TO_FLOAT[difficulty]);
            }
  }
}
    
angular.module('oppia').directive(
  'questionDifficultySelector', downgradeComponent({
   component: QuestionDifficultySelectorComponent
}) as angular.IDirectiveFactory );
