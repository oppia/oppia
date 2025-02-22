// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A data service that stores the current interaction skill.
 */

import {EventEmitter, Injectable} from '@angular/core';
import {AlertsService} from 'services/alerts.service';
import {
  StatePropertyService,
  // eslint-disable-next-line max-len
} from 'components/state-editor/state-editor-properties-services/state-property.service';
import {UtilsService} from 'services/utils.service';

@Injectable({
  providedIn: 'root',
})
// Until a skill is selected, the state attribute is null. Also used to
// avoid circular dependencies.
export class StateLinkedSkillIdService extends StatePropertyService<
  string | null
> {
  constructor(alertsService: AlertsService, utilsService: UtilsService) {
    super(alertsService, utilsService);
    this.setterMethodKey = 'saveLinkedSkillId';
  }

  get onStateLinkedSkillIdInitialized(): EventEmitter<string> {
    return this.statePropertyInitializedEmitter;
  }
}
