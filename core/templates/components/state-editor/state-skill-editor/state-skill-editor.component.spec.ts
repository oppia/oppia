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
 * @fileoverview Unit tests for the State Skill Editor Component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TopicsAndSkillsDashboardBackendApiService, TopicsAndSkillDashboardData } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { SelectSkillModalComponent } from 'components/skill-selector/select-skill-modal.component';
import { DeleteStateSkillModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-state-skill-modal.component';
import { StateLinkedSkillIdService } from '../state-editor-properties-services/state-skill.service';
import { StateSkillEditorComponent } from './state-skill-editor.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { SkillSelectorComponent } from 'components/skill-selector/skill-selector.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';


describe('State Skill Editor Component', () => {
  let fixture: ComponentFixture<StateSkillEditorComponent>;
  let componentInstance: StateSkillEditorComponent;
  let mockNgbModal: MockNgbModal;
  let stateLinkedSkillIdService: StateLinkedSkillIdService;
  let urlInterpolationService: UrlInterpolationService;

  class MockNgbModal {
    modal: string;
    success: boolean = true;
    open(content, options) {
      if (this.modal === 'add_skill') {
        return {
          componentInstance: {
            skillSummaries: null,
            skillsInSameTopicCount: null,
            categorizedSkills: null,
            allowSkillsFromOtherTopics: null,
            untriagedSkillSummaries: null
          },
          result: {
            then: (
                successCallback: (result) => void,
                cancelCallback: () => void
            ) => {
              if (this.success) {
                successCallback({});
              } else {
                cancelCallback();
              }
            }
          }
        };
      } else if (this.modal === 'delete_skill') {
        return {
          componentInstance: {},
          result: {
            then: (
                successCallback: () => void,
                errorCallback: () => void
            ) => {
              if (this.success) {
                successCallback();
              } else {
                errorCallback();
              }
              return {
                then: (callback: () => void) => {
                  callback();
                }
              };
            }
          }
        };
      }
    }
  }

  const topicsAndSkillsDashboardData: TopicsAndSkillDashboardData = {
    allClassroomNames: null,
    canDeleteTopic: null,
    canCreateTopic: null,
    canDeleteSkill: null,
    canCreateSkill: null,
    untriagedSkillSummaries: null,
    mergeableSkillSummaries: null,
    totalSkillCount: null,
    topicSummaries: null,
    categorizedSkillsDict: null
  };

  class MockTopicsAndSkillsDashboardBackendApiService {
    success: boolean = true;
    fetchDashboardDataAsync() {
      return {
        then: (callback: (resp) => void) => {
          callback(topicsAndSkillsDashboardData);
        }
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatCardModule,
        MatCheckboxModule,
        MatRadioModule,
        FormsModule
      ],
      declarations: [
        StateSkillEditorComponent,
        DeleteStateSkillModalComponent,
        SelectSkillModalComponent,
        SkillSelectorComponent
      ],
      providers: [
        TopicsAndSkillsDashboardBackendApiService,
        StateLinkedSkillIdService,
        UrlInterpolationService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: TopicsAndSkillsDashboardBackendApiService,
          useClass: MockTopicsAndSkillsDashboardBackendApiService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateSkillEditorComponent);
    componentInstance = fixture.componentInstance;
    fixture.detectChanges();
    componentInstance.categorizedSkills = null;
    componentInstance.skillEditorIsShown = null;
    componentInstance.untriagedSkillSummaries = [];
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    mockNgbModal = (TestBed.inject(NgbModal) as unknown) as MockNgbModal;
    stateLinkedSkillIdService = TestBed.inject(StateLinkedSkillIdService);
    stateLinkedSkillIdService = (
      stateLinkedSkillIdService as unknown) as
      jasmine.SpyObj<StateLinkedSkillIdService>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should open add skill modal for adding skill', () => {
    mockNgbModal.modal = 'add_skill';
    const modalSpy = spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: MockNgbModal,
          result: Promise.resolve('success')
        });
    });
    componentInstance.addSkill();
    fixture.detectChanges();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should close the add skill modal on clicking cancel', () => {
    mockNgbModal.modal = 'add_skill';
    mockNgbModal.success = false;
    componentInstance.addSkill();
    fixture.detectChanges();
  });

  it('should open delete skill modal for deleting skill', () => {
    mockNgbModal.modal = 'delete_skill';
    const modalSpy = spyOn(mockNgbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: MockNgbModal,
          result: Promise.resolve('success')
        });
    });
    componentInstance.deleteSkill();
    fixture.detectChanges();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should close the delete skill modal on clicking cancel', () => {
    mockNgbModal.modal = 'delete_skill';
    mockNgbModal.success = false;
    componentInstance.deleteSkill();
    fixture.detectChanges();
  });

  it('should call getSkillEditorUrl and return skillEditor URL', () => {
    const urlSpy = spyOn(
      urlInterpolationService, 'interpolateUrl')
      .and.returnValue('/skill_editor/skill_1');

    stateLinkedSkillIdService.displayed = 'skill_1';
    componentInstance.getSkillEditorUrl();
    fixture.detectChanges();
    expect(urlSpy).toHaveBeenCalled();
  });

  it('should toggle skillEditorIsShown', () => {
    componentInstance.skillEditorIsShown = true;
    componentInstance.toggleSkillEditor();
    fixture.detectChanges();
    expect(componentInstance.skillEditorIsShown).toEqual(false);
  });
});
