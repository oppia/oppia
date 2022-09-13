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
 * @fileoverview Component for the EndExploration 'interaction'.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { EndExplorationCustomizationArgs } from 'interactions/customization-args-defs';

import { ContextService } from 'services/context.service';
import { EndExplorationBackendApiService } from './end-exploration-backend-api.service';
import { InteractionAttributesExtractorService } from 'interactions/interaction-attributes-extractor.service';

import { ServicesConstants } from 'services/services.constants';

@Component({
  selector: 'oppia-interactive-end-exploration',
  templateUrl: './end-exploration-interaction.component.html',
  styleUrls: []
})
export class InteractiveEndExplorationComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() recommendedExplorationIdsWithValue!: string;
  errorMessage!: string;
  isInEditorPage: boolean = false;
  isInEditorPreviewMode: boolean = false;
  isInEditorMainTab: boolean = false;

  constructor(
    private contextService: ContextService,
    private endExplorationBackendApiService: EndExplorationBackendApiService,
    private interactionAttributesExtractorService:
      InteractionAttributesExtractorService,
  ) {}

  ngOnInit(): void {
    const {
      recommendedExplorationIds
    } = this.interactionAttributesExtractorService.getValuesFromAttributes(
      'EndExploration',
      {
        recommendedExplorationIdsWithValue:
          this.recommendedExplorationIdsWithValue,
      }
    ) as EndExplorationCustomizationArgs;

    const authorRecommendedExplorationIds = recommendedExplorationIds.value;

    this.isInEditorPage = (
      this.contextService.getPageContext() ===
      ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR
    );
    this.isInEditorPreviewMode = this.isInEditorPage && (
      this.contextService.getEditorTabContext() ===
      ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW
    );
    this.isInEditorMainTab = this.isInEditorPage && (
      this.contextService.getEditorTabContext() ===
      ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR
    );

    if (this.isInEditorPage) {
      // Display a message if any author-recommended explorations are
      // invalid.
      this.endExplorationBackendApiService.getRecommendExplorationsData(
        authorRecommendedExplorationIds
      ).then((response) => {
        let foundExpIds: string[] = [];
        response.summaries.map((expSummary) => {
          foundExpIds.push(expSummary.id);
        });

        let missingExpIds: string[] = [];
        authorRecommendedExplorationIds.forEach((expId) => {
          if (!foundExpIds.includes(expId)) {
            missingExpIds.push(expId);
          }
        });

        if (missingExpIds.length === 0) {
          this.errorMessage = '';
        } else {
          let listOfIds = missingExpIds.join('", "');
          this.errorMessage = (
            `Warning: exploration(s) with the IDs "${listOfIds}" ` +
            'will not be shown as recommendations because ' +
            'they either do not exist, or are not publicly viewable.');
        }
      });
    }
  }
}

angular.module('oppia').directive(
  'oppiaInteractiveEndExploration', downgradeComponent({
    component: InteractiveEndExplorationComponent
  }) as angular.IDirectiveFactory);
