// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the training panel in the state editor.
 */

import {Component, Input, OnInit} from '@angular/core';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {ResponsesService} from '../services/responses.service';
import {TrainingDataService} from './training-data.service';
import {AppConstants} from 'app.constants';
import {InteractionAnswer} from 'interactions/answer-defs';

interface ClassificationInterface {
  answerGroupIndex: number;
  newOutcome: Outcome | null;
}

@Component({
  selector: 'oppia-training-panel',
  templateUrl: './training-panel.component.html',
})
export class TrainingPanelComponent implements OnInit {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() answer!: InteractionAnswer;
  // The classification input is an object with two keys:
  //   -answerGroupIndex: This refers to which answer group the answer
  //      being trained has been classified to (for displaying feedback
  //      to the creator). If answerGroupIndex is equal to the number of
  //      answer groups, then it represents the default outcome feedback.
  //      This index is changed by the panel when the creator specifies
  //      which feedback should be associated with the answer.
  //   -newOutcome: This refers to an outcome structure (containing a
  //      list of feedback and a destination state name) which is
  //      non-null if, and only if, the creator has specified that a new
  //      response should be created for the trained answer.
  @Input() classification!: ClassificationInterface;
  @Input() addingNewResponse!: boolean;
  selectedAnswerGroupIndex!: number;
  allOutcomes!: Outcome[];
  answerTemplate: string = '';

  constructor(
    private stateEditorService: StateEditorService,
    private responsesService: ResponsesService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private stateInteractionIdService: StateInteractionIdService,
    private trainingDataService: TrainingDataService,
    private explorationStatesService: ExplorationStatesService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private generateContentIdService: GenerateContentIdService,
    private outcomeObjectFactory: OutcomeObjectFactory
  ) {}

  _updateAnswerTemplate(): void {
    this.answerTemplate = this.explorationHtmlFormatterService.getAnswerHtml(
      this.answer,
      this.stateInteractionIdService.savedMemento,
      this.stateCustomizationArgsService.savedMemento
    );
  }

  getCurrentStateName(): string | null {
    return this.stateEditorService.getActiveStateName();
  }

  beginAddingNewResponse(): void {
    let contentId = this.generateContentIdService.getNextStateId(
      AppConstants.COMPONENT_NAME_FEEDBACK
    );
    let currentStateName = this.stateEditorService.getActiveStateName();
    if (currentStateName) {
      this.classification.newOutcome = this.outcomeObjectFactory.createNew(
        currentStateName,
        contentId,
        '',
        []
      );
    }
    this.addingNewResponse = true;
  }

  cancelAddingNewResponse(): void {
    this.addingNewResponse = false;
    this.classification.newOutcome = null;
  }

  selectAnswerGroupIndex(index: number): void {
    this.selectedAnswerGroupIndex = index;
    this.classification.answerGroupIndex = index;
    if (index > this.responsesService.getAnswerGroupCount()) {
      this.classification.newOutcome = this.allOutcomes[index];
    }
  }

  confirmNewFeedback(): void {
    if (this.classification.newOutcome) {
      // Push the new outcome at the end of the existing outcomes.
      this.allOutcomes.push(this.classification.newOutcome);
      this.selectAnswerGroupIndex(this.allOutcomes.length - 1);
      this.addingNewResponse = false;
    }
  }

  ngOnInit(): void {
    this.addingNewResponse = false;

    let _stateName = this.stateEditorService.getActiveStateName();
    if (_stateName) {
      let _state = this.explorationStatesService.getState(_stateName);
      this.allOutcomes =
        this.trainingDataService.getAllPotentialOutcomes(_state);
    }

    this._updateAnswerTemplate();
    this.selectedAnswerGroupIndex = this.classification.answerGroupIndex;
  }
}
