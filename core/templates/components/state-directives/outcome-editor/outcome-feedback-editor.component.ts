// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directives for the outcome feedback editor.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';

@Component({
  selector: 'oppia-outcome-feedback-editor',
  templateUrl: './outcome-feedback-editor.component.html',
})
export class OutcomeFeedbackEditorComponent implements OnInit {
  @Input() outcome: string;
  OUTCOME_FEEDBACK_SCHEMA: object;
  constructor(
    private subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory,
    private urlInterpolationService: UrlInterpolationService,
    private contextService: ContextService) {}

  ngOnInit(): void {
    this.OUTCOME_FEEDBACK_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: (
          this.contextService.getEntityType() === 'question')
      }
    };
  }

  getSchema(): object {
    return this.OUTCOME_FEEDBACK_SCHEMA;
  }
}
angular.module('oppia').directive(
  'oppiaOutcomeFeedbackEditor', downgradeComponent(
    {component: OutcomeFeedbackEditorComponent}));
