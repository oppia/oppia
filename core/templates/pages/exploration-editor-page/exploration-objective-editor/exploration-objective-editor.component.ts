// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration objective/goal field in forms.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ExplorationObjectiveService } from 'pages/exploration-editor-page/services/exploration-objective.service';

@Component({
  selector: 'oppia-exploration-objective-editor',
  templateUrl: './exploration-objective-editor.component.html'
})
export class ExplorationObjectiveEditorComponent {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() labelText!: string;
  @Input() formStyle!: string;
  @Input() objectiveEditorClass!: string;
  @Output() onInputFieldBlur = new EventEmitter<void>();

  constructor(
    public explorationObjectiveService: ExplorationObjectiveService
  ) {}

  inputFieldBlur(): void {
    this.onInputFieldBlur.emit();
  }
}

angular.module('oppia').directive(
  'oppiaExplorationObjectiveEditor', downgradeComponent({
    component: ExplorationObjectiveEditorComponent
  }));
