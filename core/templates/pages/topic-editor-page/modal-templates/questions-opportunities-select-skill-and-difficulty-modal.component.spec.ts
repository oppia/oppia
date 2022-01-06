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
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { ImageFile } from 'domain/utilities/image-file.model';
import { ExtractImageFilenamesFromModelService } from 'pages/exploration-player-page/services/extract-image-filenames-from-model.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { QuestionsOpportunitiesSelectSkillAndDifficultyModalComponent } from './questions-opportunities-select-skill-and-difficulty-modal.component';

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
    let alertsService: AlertsService;
    let assetsBackendApiService: AssetsBackendApiService;
    let ngbActiveModal: NgbActiveModal;
    let skillBackendApiService: SkillBackendApiService;
    let skillObjectFactory: SkillObjectFactory;
    let extractImageFilenamesFromModelService: ExtractImageFilenamesFromModelService;
    let mockImageFile: ImageFile;
    let mockBlob: Blob;

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
          ExtractImageFilenamesFromModelService,
          {
            provide: NgbActiveModal,
            useClass: MockActiveModal
          },
          SkillBackendApiService
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    }));

    describe('when fetching skill successfully', () => {
      beforeEach(() => {
        fixture = TestBed.createComponent(QuestionsOpportunitiesSelectSkillAndDifficultyModalComponent);
        component = fixture.componentInstance;
        alertsService = TestBed.inject(AlertsService);
        assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
        ngbActiveModal = TestBed.inject(NgbActiveModal);
        skillBackendApiService = TestBed.inject(SkillBackendApiService);
        skillObjectFactory = TestBed.inject(SkillObjectFactory);
        extractImageFilenamesFromModelService = TestBed.inject(ExtractImageFilenamesFromModelService);
        let skillDifficulties = ['easy', 'medium'];
        
        let misconceptionDict1 = {
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: true
        };
        let rubricDict = {
          difficulty: skillDifficulties[0],
          explanations: ['explanation']
        };
        let skillContentsDict = {
          explanation: {
            html: 'test explanation',
            content_id: 'explanation',
          },
          worked_examples: [],
          recorded_voiceovers: {
            voiceovers_mapping: {}
          }
        };
        skill = {
          id: skillId,
          description: 'Skill 1 description',
          misconceptions: [misconceptionDict1],
          rubrics: [rubricDict],
          skill_contents: skillContentsDict,
          language_code: 'en',
          version: 1,
          next_misconception_id: 3,
          prerequisite_skill_ids: []
        };

        spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
          Promise.resolve({
            skill: skillObjectFactory.createFromBackendDict(skill),
            assignedSkillTopicData: {},
            groupedSkillSummaries: {},
        }));
        mockImageFile = new ImageFile('dummyImg.png', mockBlob);
        spyOn(
          extractImageFilenamesFromModelService,
          'getImageFilenamesInSkill').and.returnValue(['dummyImg.png']);
        spyOn(assetsBackendApiService, 'fetchFiles').and.returnValue(
          Promise.resolve(mockImageFile));
        // This throws "Argument of type 'MockReaderObject' is not assignable
        // to parameter of type 'FileReader'.". We need to suppress this error
        // because 'FileReader' has around 15 more properties. We have only
        // defined the properties we need in 'MockReaderObject'.
        // @ts-expect-error
        spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());
        fixture.detectChanges();
      });

      it('should initialize properties after component is' +
        ' initialized', fakeAsync(() => {
        expect(component.skill).toEqual(skillObjectFactory.createFromBackendDict(
          skill));
      }));

      it('should create a question and select its difficulty when closing' +
        ' the modal', () => {
        component.startQuestionCreation();

        expect(ngbActiveModal.close).toHaveBeenCalledWith({
          skill: skillObjectFactory.createFromBackendDict(skill),
          skillDifficulty: 0.3
        });
      });
    });

    describe('when fetching skill fails', () => {
      beforeEach(() => {
        fixture = TestBed.createComponent(QuestionsOpportunitiesSelectSkillAndDifficultyModalComponent);
        component = fixture.componentInstance;
        alertsService = TestBed.inject(AlertsService);
        ngbActiveModal = TestBed.inject(NgbActiveModal);
        skillBackendApiService = TestBed.inject(SkillBackendApiService);
       
        spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
            Promise.reject('It was not possible to fetch the skill'));
        fixture.detectChanges();
      });

      it('should shows a warning error', fakeAsync(() => {
        let addWarningSpy = spyOn(alertsService, 'addWarning');

        expect(addWarningSpy.calls.allArgs()[0]).toEqual(
          ['Error populating skill: It was not possible to fetch the skill.']);
      }));
    });
});
