// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the skills list component.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MergeSkillModalComponent } from 'components/skill-selector/merge-skill-modal.component';
import { SkillSelectorComponent } from 'components/skill-selector/skill-selector.component';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { TopicsAndSkillsDashboardBackendApiService } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { AssignSkillToTopicModalComponent } from '../modals/assign-skill-to-topic-modal.component';
import { DeleteSkillModalComponent } from '../modals/delete-skill-modal.component';
import { UnassignSkillFromTopicsModalComponent } from '../modals/unassign-skill-from-topics-modal.component';
import { SelectTopicsComponent } from '../topic-selector/select-topics.component';
import { SkillsListComponent } from './skills-list.component';

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Skills List Component', () => {
  let fixture: ComponentFixture<SkillsListComponent>;
  let componentInstance: SkillsListComponent;
  let topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService;
  let alertsService: AlertsService;
  let mockNgbModal: MockNgbModal;
  let mockSkillBackendApiService: MockSkillBackendApiService;

  class MockNgbModal {
    success: boolean = true;
    open(content, options) {
      return {
        componentInstance: {
          skillId: ''
        },
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

  class MockSkillBackendApiService {
    doesNotHaveSkillLinked: boolean = false;
    deleteSkill(skillId: string) {
      return {
        then: (callb: () => void) => {
          callb();
          return {
            'catch': (callback: (errorMessage: string) => void) => {
              if (this.doesNotHaveSkillLinked) {
                callback('does not have any skills linked');
              } else {
                callback('');
              }
            }
          };
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
        SkillsListComponent,
        DeleteSkillModalComponent,
        UnassignSkillFromTopicsModalComponent,
        AssignSkillToTopicModalComponent,
        MergeSkillModalComponent,
        SelectTopicsComponent,
        SkillSelectorComponent
      ],
      providers: [
        AlertsService,
        UrlInterpolationService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        EditableTopicBackendApiService,
        {
          provide: SkillBackendApiService,
          useClass: MockSkillBackendApiService
        },
        TopicsAndSkillsDashboardBackendApiService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillsListComponent);
    componentInstance = fixture.componentInstance;
    componentInstance.skillSummaries = [];
    componentInstance.pageNumber = 0;
    componentInstance.itemsPerPage = 5;
    componentInstance.editableTopicSummaries = [];
    componentInstance.mergeableSkillSummaries = [];
    componentInstance.untriagedSkillSummaries = [];

    topicsAndSkillsDashboardBackendApiService =
      TestBed.inject(TopicsAndSkillsDashboardBackendApiService);
    topicsAndSkillsDashboardBackendApiService = (
      topicsAndSkillsDashboardBackendApiService as unknown) as
      jasmine.SpyObj<TopicsAndSkillsDashboardBackendApiService>;
    alertsService = TestBed.inject(AlertsService);
    alertsService = (alertsService as unknown) as jasmine.SpyObj<AlertsService>;
    mockNgbModal = (TestBed.inject(NgbModal) as unknown) as
      jasmine.SpyObj<MockNgbModal>;
    mockSkillBackendApiService = (
      TestBed.inject(SkillBackendApiService) as
    unknown) as jasmine.SpyObj<MockSkillBackendApiService>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should destroy', () => {
    spyOn(componentInstance.directiveSubscriptions, 'unsubscribe');
    componentInstance.ngOnDestroy();
    expect(componentInstance.directiveSubscriptions.unsubscribe)
      .toHaveBeenCalled();
  });

  it('should show edit options', () => {
    componentInstance.selectedIndex = 'test_index';
    expect(componentInstance.showEditOptions('test_index')).toBeTrue();
    expect(componentInstance.showEditOptions('test')).toBeFalse();
  });

  it('should change edit options', () => {
    componentInstance.selectedIndex = '';
    let skillId: string = 'test_id';
    componentInstance.changeEditOptions(skillId);
    expect(componentInstance.selectedIndex).toEqual(skillId);
    componentInstance.selectedIndex = 'not_empty';
    componentInstance.changeEditOptions(skillId);
    expect(componentInstance.selectedIndex).toEqual('');
  });

  it('should get serial number for skill', () => {
    expect(componentInstance.getSerialNumberForSkill(5)).toEqual(6);
  });

  it('should get skill editor url', () => {
    expect(componentInstance.getSkillEditorUrl('test_id'))
      .toEqual('/skill_editor/test_id');
  });

  it('should delete skill', fakeAsync(() => {
    spyOn(
      topicsAndSkillsDashboardBackendApiService
        .onTopicsAndSkillsDashboardReinitialized, 'emit');
    spyOn(alertsService, 'addSuccessMessage');
    componentInstance.deleteSkill('skill_id');
    tick(500);
    expect(
      topicsAndSkillsDashboardBackendApiService
        .onTopicsAndSkillsDashboardReinitialized.emit).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'The skill has been deleted.',
      1000
    );
    mockSkillBackendApiService.doesNotHaveSkillLinked = true;
    componentInstance.deleteSkill('skill_id');
    tick(500);
  }));

  it('should cancel delete skil modal', () => {
    mockNgbModal.success = false;
    componentInstance.deleteSkill('test_skill');
  });
});
