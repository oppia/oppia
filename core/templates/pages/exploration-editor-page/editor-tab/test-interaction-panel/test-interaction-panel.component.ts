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
 * @fileoverview Component for the test interaction panel in the state editor.
 */

import {Component, Input, OnInit} from '@angular/core';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {AppConstants} from 'app.constants';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';

@Component({
  selector: 'oppia-test-interaction-panel',
  templateUrl: './test-interaction-panel.component.html',
})
export class TestInteractionPanel implements OnInit {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() inputTemplate!: string;
  @Input() stateName!: string;
  interactionIsInline!: boolean;

  constructor(
    private currentInteractionService: CurrentInteractionService,
    private explorationStatesService: ExplorationStatesService
  ) {}

  isSubmitButtonDisabled(): boolean {
    return this.currentInteractionService.isSubmitButtonDisabled();
  }

  onSubmitAnswerFromButton(): void {
    this.currentInteractionService.submitAnswer();
  }

  ngOnInit(): void {
    let _stateName = this.stateName;
    let _state = this.explorationStatesService.getState(_stateName);
    this.interactionIsInline =
      INTERACTION_SPECS[_state.interaction.id as InteractionSpecsKey]
        .display_mode === AppConstants.INTERACTION_DISPLAY_MODE_INLINE;
  }
}
