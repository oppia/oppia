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
 * @fileoverview Component for lesson information card modal.
 */

 import { Component } from '@angular/core';
 import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
 import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ClassroomDomainConstants } from 'domain/classroom/classroom-domain.constants';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
 import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';
import { LearnerViewInfoBackendApiService } from '../services/learner-view-info-backend-api.service';
 
 @Component({
   selector: 'oppia-information-card-modal',
   templateUrl: './lesson-information-card-modal.component.html'
 })
 export class LessonInformationCardModalComponent extends ConfirmOrCancelModal {

  topicUrlFragment: string;
  classroomUrlFragment: string;
  storyUrlFragment: string;
  storyTitle!: string;
  storyTitleTranslationKey!: string;
  storyPlaythroughObject: StoryPlaythrough;
  storyId: string;
  storyNodeTitleTranslationKey: string;
  storyNodeDescTranslationKey: string;
  explorationId: string;
  isLinkedToTopic: boolean;

 
   constructor(
    private ngbModal: NgbModal,
    private ngbActiveModal: NgbActiveModal,
    private contextService: ContextService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private i18nLanguageCodeService: I18nLanguageCodeService
   ) {
     super(ngbActiveModal);
    }
 
   ngOnInit(): void { 
        this.explorationId = this.contextService.getExplorationId();
        this.storyId = this.urlService.getUrlParams().story_id;
        this.storyTitleTranslationKey = (
            this.i18nLanguageCodeService
            .getStoryTranslationKey(
                this.storyId, TranslationKeyType.TITLE));

        this.storyNodeTitleTranslationKey = (
            this.i18nLanguageCodeService.
              getExplorationTranslationKey(
                this.explorationId, TranslationKeyType.TITLE)
          );
        this.storyNodeDescTranslationKey = (
            this.i18nLanguageCodeService.
              getExplorationTranslationKey(
                this.explorationId, TranslationKeyType.DESCRIPTION)
          );
    };
  }
