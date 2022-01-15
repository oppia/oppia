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
 * @fileoverview Component for the solution editor.
 */

import { Component, Input, OnInit } from '@angular/core';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { EditabilityService } from 'services/editability.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { downgradeComponent } from '@angular/upgrade/static';

interface explanationFormSchema {
  type: string;
  ui_config: object;
}

@Component({
  selector: 'oppia-solution-editor',
  templateUrl: './solution-editor.component.html'
})
export class SolutionEditor implements OnInit {
  @Input() interactionId;
  @Input() onSaveSolution;
  @Input() correctAnswerEditorHtml;
  @Input() onOpenSolutionEditor;
  @Input() showMarkAllAudioAsNeedingUpdateModalIfRequired;

  isEditable: boolean;
  EXPLANATION_FORM_SCHEMA: explanationFormSchema;

  constructor(
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private editabilityService: EditabilityService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private stateInteractionIdService: StateInteractionIdService,
    private stateSolutionService: StateSolutionService,
  ) {}

  getAnswerHtml(): string {
    return this.explorationHtmlFormatterService.getAnswerHtml(
      this.stateSolutionService.savedMemento.correctAnswer as string,
      this.stateInteractionIdService.savedMemento,
      this.stateCustomizationArgsService.savedMemento);
  }

  ngOnInit(): void {
    this.isEditable = this.editabilityService.isEditable();

    this.EXPLANATION_FORM_SCHEMA = {
      type: 'html',
      ui_config: {}
    };
  }
}

angular.module('oppia').directive('oppiaSolutionEditor',
  downgradeComponent({
    component: SolutionEditor
  }) as angular.IDirectiveFactory);
