// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Unit tests for
 * QuestionsOpportunitiesSelectSkillAndDifficultyModalComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { ExtractImageFilenamesFromModelService } from 'pages/exploration-player-page/services/extract-image-filenames-from-model.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { QuestionsOpportunitiesSelectSkillAndDifficultyModalComponent } from './question-opportunities-select-skill-and-difficulty-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockReaderObject {
  result = null;
  onload = null;
  constructor() {
    this.onload = () => {
      return 'Fake onload executed';
    };
  }
  readAsDataURL(file) {
    this.onload();
    return 'The file is loaded';
  }
}

describe(
  'Questions Opportunities Select Skill And Difficulty Modal Component',
  () => {
    let component: QuestionsOpportunitiesSelectSkillAndDifficultyModalComponent;
    let fixture: ComponentFixture<QuestionsOpportunitiesSelectSkillAndDifficultyModalComponent>;  
    let ngbActiveModal: NgbActiveModal;
    let alertsService: AlertsService;
    let skillBackendApiService: SkillBackendApiService;
    let skillObjectFactory: SkillObjectFactory;
    let extractImageFilenamesFromModelService: ExtractImageFilenamesFromModelService;
    let assetsBackendApiService: AssetsBackendApiService;

    let skillId = 'skill_1';
    let skill = null;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        declarations: [
          QuestionsOpportunitiesSelectSkillAndDifficultyModalComponent
        ],
        providers: [
          AlertsService,
          AssetsBackendApiService,
          ChangeDetectorRef,
          {
            provide: NgbActiveModal,
            useClass: MockActiveModal
          },
          SkillBackendApiService
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    }));


});