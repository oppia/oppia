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
 * @fileoverview Tests for Admin roles tab component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {
  AdminBackendApiService,
  AdminPageData,
  UserRolesBackendResponse,
} from 'domain/admin/admin-backend-api.service';
import {CreatorTopicSummary} from 'domain/topic/creator-topic-summary.model';
import {AdminDataService} from '../services/admin-data.service';
import {AdminRolesTabComponent} from './admin-roles-tab.component';
import {AlertsService} from 'services/alerts.service';

import {TopicManagerRoleEditorModalComponent} from './topic-manager-role-editor-modal.component';
import {TranslationCoordinatorRoleEditorModalComponent} from './translation-coordinator-role-editor-modal.component';

describe('Admin roles tab component ', function () {
  let component: AdminRolesTabComponent;
  let fixture: ComponentFixture<AdminRolesTabComponent>;

  let adminBackendApiService: AdminBackendApiService;
  let adminDataService: AdminDataService;
  let alertsService: AlertsService;

  const sampleCreatorTopicSummaryBackendDict = {
    id: 'sample_topic_id',
    name: 'Topic Name',
    subtopic_count: 5,
    canonical_story_count: 4,
    total_skill_count: 10,
    total_published_node_count: 3,
    uncategorized_skill_count: 3,
    language_code: 'en',
    description: 'description',
    version: 1,
    additional_story_count: 0,
    topic_model_created_on: 231241343,
    topic_model_last_updated: 3454354354,
    classroom: 'math',
    url_fragment: 'topic-name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    is_published: false,
    can_edit_topic: true,
    total_upcoming_chapters_count: 1,
    total_overdue_chapters_count: 1,
    total_chapter_counts_for_each_story: [5, 4],
    published_chapter_counts_for_each_story: [3, 4],
  };

  const sampleTopicSummary: CreatorTopicSummary =
    CreatorTopicSummary.createFromBackendDict(
      sampleCreatorTopicSummaryBackendDict
    );

  const adminPageData: AdminPageData = {
    demoExplorationIds: ['expId'],
    demoExplorations: [['0', 'welcome.yaml']],
    demoCollections: [['collectionId']],
    updatableRoles: ['MODERATOR'],
    roleToActions: {
      Admin: ['Accept any suggestion', 'Access creator dashboard'],
    },
    viewableRoles: ['MODERATOR', 'TOPIC_MANAGER'],
    humanReadableRoles: {
      FULL_USER: 'full user',
    },
    topicSummaries: [sampleTopicSummary],
    platformParameters: [],
    skillList: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule],
      declarations: [AdminRolesTabComponent],
      providers: [AdminBackendApiService, AdminDataService, AlertsService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRolesTabComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    adminBackendApiService = TestBed.inject(AdminBackendApiService);
    adminDataService = TestBed.inject(AdminDataService);
    alertsService = TestBed.inject(AlertsService);
  });

  it(
    'should retrieve data from the backend and ' +
      'set properties when initialized',
    fakeAsync(() => {
      spyOn(adminDataService, 'getDataAsync').and.returnValue(
        Promise.resolve(adminPageData)
      );

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.UPDATABLE_ROLES).toEqual(adminPageData.updatableRoles);
      expect(component.roleToActions).toEqual(adminPageData.roleToActions);
      expect(component.VIEWABLE_ROLES).toEqual(adminPageData.viewableRoles);
      expect(component.topicSummaries).toEqual(adminPageData.topicSummaries);
    })
  );

  it('should flush the value to properties on calling clearEditor', () => {
    component.userRoles = ['MODERATOR'];
    component.roleCurrentlyBeingUpdatedInBackend = 'FULL_USER';
    component.userIsBanned = true;

    component.clearEditor();

    expect(component.userRoles).toEqual([]);
    expect(component.roleCurrentlyBeingUpdatedInBackend).toBeNull();
    expect(component.userIsBanned).toEqual(false);
  });

  describe('on startEditing', function () {
    let successPromise: Promise<UserRolesBackendResponse>;

    beforeEach(function () {
      successPromise = Promise.resolve({
        roles: ['TOPIC_MANAGER'],
        managed_topic_ids: ['topic_id_1'],
        banned: false,
        coordinated_language_ids: [],
      });
    });

    it('should enable roleIsCurrentlyBeingEdited', fakeAsync(() => {
      spyOn(adminBackendApiService, 'viewUsersRoleAsync').and.returnValue(
        successPromise
      );
      expect(component.roleIsCurrentlyBeingEdited).toBeFalse();

      component.startEditing();
      tick();

      expect(component.roleIsCurrentlyBeingEdited).toBeTrue();
    }));

    it('should fetch user roles and intialize properties', fakeAsync(() => {
      spyOn(adminBackendApiService, 'viewUsersRoleAsync').and.returnValue(
        successPromise
      );

      // Prechecks.
      expect(component.rolesFetched).toBeFalse();
      expect(component.userRoles).toEqual([]);
      expect(component.managedTopicIds).toEqual([]);
      expect(component.userIsBanned).toBeFalse();

      component.startEditing();
      tick();

      expect(component.rolesFetched).toBeTrue();
      expect(component.userRoles).toEqual(['TOPIC_MANAGER']);
      expect(component.managedTopicIds).toEqual(['topic_id_1']);
      expect(component.userIsBanned).toBeFalse();
    }));

    it('should set status when viewUsersRoleAsync fails', fakeAsync(() => {
      spyOn(adminBackendApiService, 'viewUsersRoleAsync').and.returnValue(
        Promise.reject('Error')
      );
      spyOn(component.setStatusMessage, 'emit');
      expect(component.roleIsCurrentlyBeingEdited).toBeFalse();

      component.startEditing();
      tick();

      // As the promise is rejected with error, we do not expect it to be marked
      // as being edited and the status message is shown with the error.
      expect(component.roleIsCurrentlyBeingEdited).toBeFalse();
      expect(component.setStatusMessage.emit).toHaveBeenCalledWith('Error');
    }));
  });

  describe('on calling markUserBanned', function () {
    it('should enable bannedStatusChangeInProgress until user is banned', fakeAsync(() => {
      spyOn(adminBackendApiService, 'markUserBannedAsync').and.returnValue(
        Promise.resolve()
      );

      expect(component.bannedStatusChangeInProgress).toBeFalse();

      component.markUserBanned();
      expect(component.bannedStatusChangeInProgress).toBeTrue();

      tick();

      expect(component.bannedStatusChangeInProgress).toBeFalse();
    }));

    it('should set userIsBanned to true', fakeAsync(() => {
      spyOn(adminBackendApiService, 'markUserBannedAsync').and.returnValue(
        Promise.resolve()
      );

      expect(component.userIsBanned).toBeFalse();

      component.markUserBanned();
      tick();

      expect(component.userIsBanned).toBeTrue();
    }));

    it('should set alert warning on failed request', fakeAsync(() => {
      spyOn(alertsService, 'addWarning');
      spyOn(adminBackendApiService, 'markUserBannedAsync').and.returnValue(
        Promise.reject('Failed!')
      );

      component.markUserBanned();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalled();
    }));
  });

  describe('on calling unmarkUserBanned', function () {
    beforeEach(function () {
      spyOn(adminBackendApiService, 'unmarkUserBannedAsync').and.returnValue(
        Promise.resolve()
      );
    });

    it('should enable bannedStatusChangeInProgress until user is unbanned', fakeAsync(() => {
      expect(component.bannedStatusChangeInProgress).toBeFalse();

      component.unmarkUserBanned();
      expect(component.bannedStatusChangeInProgress).toBeTrue();

      tick();

      expect(component.bannedStatusChangeInProgress).toBeFalse();
    }));

    it('should set userIsBanned to false', fakeAsync(() => {
      component.userIsBanned = true;

      component.unmarkUserBanned();
      tick();

      expect(component.userIsBanned).toBeFalse();
    }));
  });

  describe('on calling removeRole', function () {
    beforeEach(function () {
      spyOn(adminBackendApiService, 'removeUserRoleAsync').and.returnValue(
        Promise.resolve()
      );
    });

    it('should remove the given role', fakeAsync(() => {
      component.userRoles = ['MODERATOR', 'TOPIC_MANAGER'];

      component.removeRole('MODERATOR');
      tick();

      expect(component.userRoles).toEqual(['TOPIC_MANAGER']);
    }));

    it('should flush managedTopicIds while removing topic manager role', fakeAsync(() => {
      component.userRoles = ['MODERATOR', 'TOPIC_MANAGER'];
      component.managedTopicIds = ['topic_1', 'topic_2'];

      component.removeRole('TOPIC_MANAGER');
      tick();

      expect(component.userRoles).toEqual(['MODERATOR']);
      expect(component.managedTopicIds).toEqual([]);
    }));

    it(
      'should flush coordinated_language_ids while removing' +
        ' translation coordinator role',
      fakeAsync(() => {
        component.userRoles = ['MODERATOR', 'TRANSLATION_COORDINATOR'];
        component.coordinatedLanguageIds = ['en', 'hi'];

        component.removeRole('TRANSLATION_COORDINATOR');
        tick();

        expect(component.userRoles).toEqual(['MODERATOR']);
        expect(component.coordinatedLanguageIds).toEqual([]);
      })
    );
  });

  describe('on calling addNewRole', function () {
    beforeEach(function () {
      spyOn(adminBackendApiService, 'addUserRoleAsync').and.returnValue(
        Promise.resolve()
      );
    });

    it('should add the given role', fakeAsync(() => {
      component.userRoles = ['TOPIC_MANAGER'];

      component.addNewRole('MODERATOR');
      tick();

      expect(component.userRoles).toEqual(['TOPIC_MANAGER', 'MODERATOR']);
    }));

    it('should open topic manager modal on adding topic manager role', () => {
      spyOn(component, 'openTopicManagerRoleEditor').and.returnValue();

      component.addNewRole('TOPIC_MANAGER');

      expect(component.openTopicManagerRoleEditor).toHaveBeenCalled();
    });

    it(
      'should open translation coordinator modal on adding' +
        ' translation coordinator role',
      () => {
        spyOn(
          component,
          'openTranslationCoordinatorRoleEditor'
        ).and.returnValue();

        component.addNewRole('TRANSLATION_COORDINATOR');

        expect(
          component.openTranslationCoordinatorRoleEditor
        ).toHaveBeenCalled();
      }
    );
  });

  describe('on calling openTopicManagerRoleEditor', function () {
    let ngbModal: NgbModal;

    class MockNgbModalRef {
      componentInstance!: {};
    }

    beforeEach(function () {
      ngbModal = TestBed.inject(NgbModal);
      component.topicSummaries = [sampleTopicSummary];
    });

    it('should open the TopicManagerRoleEditorModal', fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve(['topic_id_1']),
        } as NgbModalRef;
      });

      component.userRoles = ['MODERATOR'];
      component.managedTopicIds = [];

      component.openTopicManagerRoleEditor();
      tick();

      expect(modalSpy).toHaveBeenCalledWith(
        TopicManagerRoleEditorModalComponent
      );
      expect(component.managedTopicIds).toEqual(['topic_id_1']);
      expect(component.userRoles).toEqual(['MODERATOR', 'TOPIC_MANAGER']);
    }));

    it('should not read topic manager role if user is already a manager', fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve(['topic_id_1']),
        } as NgbModalRef;
      });

      component.userRoles = ['MODERATOR', 'TOPIC_MANAGER'];
      component.managedTopicIds = [];

      component.openTopicManagerRoleEditor();
      tick();

      expect(modalSpy).toHaveBeenCalledWith(
        TopicManagerRoleEditorModalComponent
      );
      expect(component.managedTopicIds).toEqual(['topic_id_1']);
      expect(component.userRoles).toEqual(['MODERATOR', 'TOPIC_MANAGER']);
    }));
  });

  describe('on calling openTranslationCoordinatorRoleEditor', function () {
    let ngbModal: NgbModal;

    class MockNgbModalRef {
      componentInstance!: {};
    }

    beforeEach(function () {
      ngbModal = TestBed.inject(NgbModal);
    });

    it('should open the TranslationCoordinatorRoleEditor', fakeAsync(() => {
      let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve(['en']),
        } as NgbModalRef;
      });

      component.userRoles = ['MODERATOR'];
      component.coordinatedLanguageIds = [];

      component.openTranslationCoordinatorRoleEditor();
      tick();

      expect(modalSpy).toHaveBeenCalledWith(
        TranslationCoordinatorRoleEditorModalComponent
      );
      expect(component.coordinatedLanguageIds).toEqual(['en']);
      expect(component.userRoles).toEqual([
        'MODERATOR',
        'TRANSLATION_COORDINATOR',
      ]);
    }));

    it(
      'should not read translation coordinator role if user is already a' +
        ' coordinator',
      fakeAsync(() => {
        let modalSpy = spyOn(ngbModal, 'open').and.callFake(() => {
          return {
            componentInstance: MockNgbModalRef,
            result: Promise.resolve(['en']),
          } as NgbModalRef;
        });

        component.userRoles = ['MODERATOR', 'TRANSLATION_COORDINATOR'];
        component.coordinatedLanguageIds = [];

        component.openTranslationCoordinatorRoleEditor();
        tick();

        expect(modalSpy).toHaveBeenCalledWith(
          TranslationCoordinatorRoleEditorModalComponent
        );
        expect(component.coordinatedLanguageIds).toEqual(['en']);
        expect(component.userRoles).toEqual([
          'MODERATOR',
          'TRANSLATION_COORDINATOR',
        ]);
      })
    );
  });

  describe('on calling showNewRoleSelector', function () {
    it('should enable roleSelectorIsShown', () => {
      component.roleSelectorIsShown = false;
      component.userRoles = ['FULL_USER', 'MODERATOR'];
      component.UPDATABLE_ROLES = ['MODERATOR', 'TOPIC_MANAGER'];

      component.showNewRoleSelector();

      expect(component.roleSelectorIsShown).toBeTrue();
    });

    it('should set correct value for possibleRolesToAdd', () => {
      component.userRoles = ['FULL_USER', 'MODERATOR'];
      component.UPDATABLE_ROLES = ['MODERATOR', 'TOPIC_MANAGER'];
      component.possibleRolesToAdd = [];

      component.showNewRoleSelector();

      expect(component.possibleRolesToAdd).toEqual(['TOPIC_MANAGER']);
    });
  });
});
