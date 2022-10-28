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
 * @fileoverview Provides utility functions for
 * offering response when the learner misspells the answer.
 */

import { Injectable} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';


@Injectable({
  providedIn: 'root'
})

export class MisspelledAnswerResponseUtilityService {
constructor(
    private translateService: TranslateService
) {}

getFeedbackHtmlWhenAnswerMisspelled(): string {
let availableKeyCount = ExplorationPlayerConstants.
    I18N_ANSWER_MISSPELLED_RESPONSE_TEXT_IDS.length;
const randomKeyIndex = Math.floor(Math.random() * availableKeyCount) + 1;
return this.translateService.instant(
    ExplorationPlayerConstants[randomKeyIndex - 1]
);
}
}
