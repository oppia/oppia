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
 * @fileoverview Unit tests for settingsTab.
 */

import { ChangeDetectorRef, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserExplorationPermissionsService } from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ChangeListService } from '../services/change-list.service';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationEditsAllowedBackendApiService } from '../services/exploration-edits-allowed-backend-api.service';
import { EditabilityService } from 'services/editability.service';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { UserService } from 'services/user.service';
import { ExplorationCategoryService } from '../services/exploration-category.service';
import { ExplorationInitStateNameService } from '../services/exploration-init-state-name.service';
import { ExplorationLanguageCodeService } from '../services/exploration-language-code.service';
import { ExplorationObjectiveService } from '../services/exploration-objective.service';
import { ExplorationRightsService } from '../services/exploration-rights.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { ExplorationTagsService } from '../services/exploration-tags.service';
import { ExplorationTitleService } from '../services/exploration-title.service';
import { ExplorationWarningsService } from '../services/exploration-warnings.service';
import { RouterService } from '../services/router.service';
import { SettingTabBackendApiService } from '../services/setting-tab-backend-api.service';
import { UserEmailPreferencesService } from '../services/user-email-preferences.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { SettingsTabComponent } from './settings-tab.component';
import { UserInfo } from 'domain/user/user-info.model';
import { ExplorationPermissions } from 'domain/exploration/exploration-permissions.model';
import { State } from 'domain/state/StateObjectFactory';
import { MatChipInputEvent } from '@angular/material/chips';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';

describe('Settings Tab Component', () => {
  let component: SettingsTabComponent;
  let fixture: ComponentFixture<SettingsTabComponent>;
  let alertsService: AlertsService;
  let changeListService: ChangeListService;
  let explorationDataService: ExplorationDataService;
  let contextService: ContextService;
  let editableExplorationBackendApiService:
    EditableExplorationBackendApiService;
  let explorationCategoryService: ExplorationCategoryService;
  let explorationInitStateNameService: ExplorationInitStateNameService;
  let explorationLanguageCodeService: ExplorationLanguageCodeService;
  let explorationObjectiveService: ExplorationObjectiveService;
  let explorationRightsService: ExplorationRightsService;
  let explorationStatesService: ExplorationStatesService;
  let explorationTagsService: ExplorationTagsService;
  let explorationTitleService: ExplorationTitleService;
  let explorationWarningsService: ExplorationWarningsService;
  let userEmailPreferencesService: UserEmailPreferencesService;
  let userExplorationPermissionsService: UserExplorationPermissionsService;
  let windowDimensionsService: WindowDimensionsService;
  let userService: UserService;
  let windowRef: WindowRef;
  let settingTabBackendApiService: SettingTabBackendApiService;
  let ngbModal: NgbModal = null;
  let eeabas: ExplorationEditsAllowedBackendApiService = null;
  let editabilityService: EditabilityService = null;
  let explorationId = 'exp1';
  let userPermissions = {
    canDelete: true,
    canModifyRoles: true,
    canReleaseOwnership: true,
    canUnpublish: true,
    canManageVoiceArtist: true
  };
  let mockExplorationTagsServiceonPropertyChanged = new EventEmitter();
  let mockEventEmitterRouterService = new EventEmitter();
  let mockEventEmitteruserExplorationPermissionsService = new EventEmitter();

  class MockChangeDetectorRef {
    detectChanges(): void {}
  }

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve()
      };
    }
  }

  class MockRouterService {
    onRefreshSettingsTab = mockEventEmitterRouterService;
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        SettingsTabComponent
      ],
      providers: [
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: explorationId,
            data: {
              param_changes: []
            },
            getDataAsync: () => Promise.resolve(),
            autosaveChangeListAsync() {
              return;
            }
          }
        },
        WindowDimensionsService,
        ExplorationTitleService,
        FocusManagerService,
        {
          provide: RouterService,
          useClass: MockRouterService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));


  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsTabComponent);
    component = fixture.componentInstance;

    alertsService = TestBed.inject(AlertsService);
    changeListService = TestBed.inject(ChangeListService);
    userExplorationPermissionsService = (
      TestBed.inject(UserExplorationPermissionsService));
    windowRef = TestBed.inject(WindowRef);
    ngbModal = TestBed.inject(NgbModal);
    eeabas = TestBed.inject(ExplorationEditsAllowedBackendApiService);
    editabilityService = TestBed.inject(EditabilityService);
    ngbModal = TestBed.inject(NgbModal);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    explorationDataService = TestBed.inject(ExplorationDataService);
    contextService = TestBed.inject(ContextService);
    settingTabBackendApiService = TestBed.inject(
      SettingTabBackendApiService);
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService);
    explorationCategoryService = TestBed.inject(ExplorationCategoryService);
    explorationInitStateNameService = TestBed.inject(
      ExplorationInitStateNameService);
    explorationLanguageCodeService = TestBed.inject(
      ExplorationLanguageCodeService);
    explorationObjectiveService = TestBed.inject(
      ExplorationObjectiveService);
    explorationRightsService = TestBed.inject(ExplorationRightsService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    explorationTagsService = TestBed.inject(ExplorationTagsService);
    explorationTitleService = TestBed.inject(ExplorationTitleService);
    explorationWarningsService = TestBed.inject(ExplorationWarningsService);
    userEmailPreferencesService = TestBed.inject(
      UserEmailPreferencesService);
    userService = TestBed.inject(UserService);

    spyOn(explorationTagsService, 'onExplorationPropertyChanged')
      .and.returnValue(mockExplorationTagsServiceonPropertyChanged);
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
      .returnValue(Promise.resolve(userPermissions as ExplorationPermissions));
    spyOn(userExplorationPermissionsService, 'fetchPermissionsAsync').and
      .returnValue(Promise.resolve(userPermissions as ExplorationPermissions));
    spyOn(explorationStatesService, 'isInitialized').and.returnValue(true);
    spyOn(explorationStatesService, 'getStateNames').and.returnValue([
      'Introduction']);
    spyOn(userService, 'getUserInfoAsync').and.returnValue(Promise.resolve({
      getUsername: () => 'username1',
      isSuperAdmin: () => true
    } as UserInfo));
    explorationCategoryService.init('Astrology');
    spyOnProperty(
      userExplorationPermissionsService, 'onUserExplorationPermissionsFetched')
      .and.returnValue(mockEventEmitteruserExplorationPermissionsService);

    fixture.detectChanges();
  });

  it('should initialize controller properties after its initialization',
    fakeAsync(() => {
      component.ngOnInit();
      mockExplorationTagsServiceonPropertyChanged.emit();
      tick(600);
      jasmine.createSpy('hasState').and.stub();

      expect(component.isRolesFormOpen).toBe(false);
      expect(component.canDelete).toBe(true);
      expect(component.canModifyRoles).toBe(true);
      expect(component.canReleaseOwnership).toBe(true);
      expect(component.canUnpublish).toBe(true);
      expect(component.explorationId).toBe(explorationId);
      expect(component.canManageVoiceArtist).toBe(true);
      expect(component.loggedInUser).toBe('username1');

      mockEventEmitterRouterService.emit();
      tick(600);

      expect(component.CATEGORY_LIST_FOR_SELECT2[0]).toEqual({
        id: 'Astrology',
        text: 'Astrology'
      });

      component.filterChoices('English');
      component.updateCategoryListWithUserData();
      expect(component.newCategory).toEqual({
        id: 'English',
        text: 'English',
      });

      component.filterChoices('');

      explorationTagsService.displayed = ['name'];
      component.add({
        value: 'shivam',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      component.remove('shivam');
      expect(component.stateNames).toEqual(['Introduction']);
      expect(component.hasPageLoaded).toBe(true);

      flush();
    }));

  it('should be able to add exploration editor tags',
    fakeAsync(() => {
      spyOn(component, 'saveExplorationTags').and.stub();
      explorationTagsService.displayed = [];

      component.add({
        value: 'name',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      tick();

      expect(explorationTagsService.displayed).toEqual(['name']);
    }));

  it('should not add same exploration editor tags' +
      'when user enter same tag again', fakeAsync(() => {
    spyOn(component, 'saveExplorationTags').and.stub();
    explorationTagsService.displayed = [];

    component.add({
      value: 'name',
      input: {
        value: ''
      }
    } as MatChipInputEvent);
    tick();

    expect(explorationTagsService.displayed).toEqual(['name']);

    // When user try to enter same tag again.
    component.add({
      value: 'name',
      input: {
        value: ''
      }
    } as MatChipInputEvent);
    tick();

    expect(explorationTagsService.displayed).toEqual(['name']);
  }));

  it('should be able to add multiple exploration editor tags',
    fakeAsync(() => {
      spyOn(component, 'saveExplorationTags').and.stub();
      explorationTagsService.displayed = [];

      component.add({
        value: 'tag-one',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      tick();

      component.add({
        value: 'tag-two',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      tick();

      component.add({
        value: 'tag-three',
        input: {
          value: ''
        }
      } as MatChipInputEvent);
      tick();

      expect(explorationTagsService.displayed).toEqual(
        ['tag-one', 'tag-two', 'tag-three']
      );
    }));

  it('should be able to remove multiple exploration editor tags',
    fakeAsync(() => {
      spyOn(component, 'saveExplorationTags').and.stub();
      component.explorationTags = ['tag-one', 'tag-two', 'tag-three'];
      explorationTagsService.displayed = ['tag-one', 'tag-two', 'tag-three'];

      component.remove('tag-two');
      tick();

      component.remove('tag-three');
      tick();

      expect(explorationTagsService.displayed).toEqual(
        ['tag-one']);
    }));

  it('should be able to remove exploration editor tags', fakeAsync(() => {
    spyOn(component, 'saveExplorationTags').and.stub();
    explorationTagsService.displayed = [];

    component.add({
      value: 'first',
      input: {
        value: ''
      }
    } as MatChipInputEvent);
    component.add({
      value: 'second',
      input: {
        value: ''
      }
    } as MatChipInputEvent);

    component.remove('second');
    tick();
    expect(explorationTagsService.displayed).toEqual(['first']);
  }));

  it('should get explore page url based on the exploration id', () => {
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        protocol: 'https:',
        host: 'oppia.org'
      }
    });
    expect(component.getExplorePageUrl()).toBe('https://oppia.org/explore/exp1');
  });

  it('should save exploration title', () => {
    spyOn(explorationTitleService, 'saveDisplayedValue');
    explorationTitleService.init('New title');

    component.saveExplorationTitle();

    expect(explorationTitleService.saveDisplayedValue).toHaveBeenCalled();
    expect(component.isTitlePresent()).toBe(true);
  });


  it('should save exploration language code', () => {
    spyOn(explorationLanguageCodeService, 'saveDisplayedValue');
    explorationLanguageCodeService.init('hi-en');

    component.saveExplorationLanguageCode();

    expect(explorationLanguageCodeService.saveDisplayedValue)
      .toHaveBeenCalled();
  });

  it('should save exploration objective', () => {
    spyOn(explorationObjectiveService, 'saveDisplayedValue');
    explorationObjectiveService.init('New Objective');

    component.saveExplorationObjective();

    expect(explorationObjectiveService.saveDisplayedValue).toHaveBeenCalled();
  });

  it('should save exploration tags', fakeAsync(() => {
    spyOn(explorationTagsService, 'saveDisplayedValue');
    explorationTagsService.init('testing');

    component.saveExplorationTags();
    tick();

    expect(explorationTagsService.saveDisplayedValue).toHaveBeenCalled();
  }));

  it('should not save exploration init state name if it\'s invalid',
    () => {
      explorationInitStateNameService.init('First State');
      spyOn(explorationStatesService, 'getState').and.returnValue(
        null);
      spyOn(alertsService, 'addWarning');

      component.saveExplorationInitStateName();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Invalid initial state name: First State');
    });

  it('should save exploration init state name successfully and refresh graph',
    () => {
      explorationInitStateNameService.init('Introduction');
      spyOn(explorationStatesService, 'getState').and.returnValue(
        new State(
          null, null, null, null, null,
          null, null, null, null, null, null));
      spyOn(explorationInitStateNameService, 'saveDisplayedValue');

      component.saveExplorationInitStateName();

      expect(explorationInitStateNameService.saveDisplayedValue)
        .toHaveBeenCalled();
    });

  it('should delete exploration when closing delete exploration modal',
    fakeAsync(() => {
      spyOn(editableExplorationBackendApiService, 'deleteExplorationAsync')
        .and.returnValue(Promise.resolve());
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          reload: () => {}
        }
      });

      component.deleteExploration();
      tick();

      expect(windowRef.nativeWindow.location).toBe('/creator-dashboard');
    }));

  it('should not delete exploration when dismissing delete exploration modal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          result: Promise.reject()
        } as NgbModalRef);
      });
      spyOn(alertsService, 'clearWarnings');
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: ''
      });

      component.deleteExploration();
      tick();

      expect(alertsService.clearWarnings).toHaveBeenCalled();
      expect(windowRef.nativeWindow.location).toBe('');
    }));

  it('should open a modal when removeRole is called', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: NgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef);
    });

    component.removeRole('username', 'editor');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should remove role when resolving remove-role-modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: NgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef);
    });
    spyOn(explorationRightsService, 'removeRoleAsync').and
      .returnValue(Promise.resolve());

    component.removeRole('username', 'editor');
    tick();

    expect(
      explorationRightsService.removeRoleAsync).toHaveBeenCalled();
  }));

  it('should not remove role when rejecting remove-role-modal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.reject()
        } as NgbModalRef);
      });
      spyOn(explorationRightsService, 'removeRoleAsync');

      component.removeRole('username1', 'editor');
      tick();

      expect(
        explorationRightsService.removeRoleAsync).not.toHaveBeenCalled();
    }));

  it('should remove role when user accept remove-role-modal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.resolve()
        } as NgbModalRef);
      });
      spyOn(explorationRightsService, 'removeRoleAsync')
        .and.returnValue(Promise.resolve());

      component.removeRole('username1', 'editor');
      tick();

      expect(
        explorationRightsService.removeRoleAsync).toHaveBeenCalled();
    }));

  it('should open a modal when removeVoiceArtist is called', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: NgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef);
    });
    spyOn(explorationRightsService, 'removeVoiceArtistRoleAsync')
      .and.returnValue(Promise.resolve());
    component.removeVoiceArtist('username');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(explorationRightsService.removeVoiceArtistRoleAsync)
      .toHaveBeenCalled();
  }));

  it('should remove voice artist when resolving remove-role-modal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.resolve()
        } as NgbModalRef);
      });
      spyOn(explorationRightsService, 'removeVoiceArtistRoleAsync').and
        .returnValue(Promise.resolve());

      component.removeVoiceArtist('username');
      tick();

      expect(
        explorationRightsService.removeVoiceArtistRoleAsync)
        .toHaveBeenCalledWith('username');
    }));

  it('should not remove voice artist when rejecting remove-role-modal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.reject()
        } as NgbModalRef);
      });
      spyOn(explorationRightsService, 'removeVoiceArtistRoleAsync');

      component.removeVoiceArtist('username');
      tick();

      expect(
        explorationRightsService.removeVoiceArtistRoleAsync)
        .not.toHaveBeenCalled();
    }));

  it('should open a modal when reassignRole is called', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: NgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef);
    });

    component.openEditRolesForm();
    explorationRightsService.init(
      ['owner'], [], [], [], '', '', false, true);

    spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
      .and.returnValue(true);
    spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
      Promise.resolve());
    component.editRole('Username1', 'editor');
    tick();
    component.editRole('Username1', 'owner');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
  }));

  it('should reassign role when resolving reassign-role-modal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.resolve()
        } as NgbModalRef);
      });

      component.openEditRolesForm();
      explorationRightsService.init(
        ['owner'], [], [], [], '', '', false, true);

      spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
        .and.returnValue(false);
      spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
        Promise.resolve());

      component.editRole('Username1', 'editor');
      tick();
      component.editRole('Username1', 'owner');
      tick();

      expect(explorationRightsService.saveRoleChanges).toHaveBeenCalledWith(
        'Username1', 'owner');
    }));

  it('should not reassign role when rejecting remove-role-modal', fakeAsync(
    () => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.reject()
        } as NgbModalRef);
      });

      explorationRightsService.init(
        ['owner'], [], [], [], '', '', false, true);

      spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
        .and.returnValue(true);
      spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
        Promise.resolve());
      component.editRole('Username1', 'editor');
      tick();
      component.editRole('Username1', 'owner');
      tick();

      expect(
        explorationRightsService.saveRoleChanges).not.toHaveBeenCalled();
    }));

  it('should transfer exploration ownership when closing transfer ownership' +
    ' modal', fakeAsync(() => {
    spyOn(explorationRightsService, 'makeCommunityOwned').and.returnValue(
      Promise.resolve()
    );

    component.showTransferExplorationOwnershipModal();
    tick();

    expect(explorationRightsService.makeCommunityOwned).toHaveBeenCalled();
  }));

  it('should not transfer exploration ownership when dismissing transfer' +
    ' ownership modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: NgbModalRef,
        result: Promise.reject()
      } as NgbModalRef);
    });
    spyOn(alertsService, 'clearWarnings');

    component.showTransferExplorationOwnershipModal();
    tick();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
  }));

  it('should open preview summary tile modal with ngbModal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve()
      } as NgbModalRef);
      component.previewSummaryTile();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));

  it('should clear alerts warning when dismissing preview summary tile modal',
    () => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject()
      } as NgbModalRef);
      spyOn(alertsService, 'clearWarnings');

      component.previewSummaryTile();

      expect(alertsService.clearWarnings).toHaveBeenCalled();
    });

  it('should open preview summary tile modal with ngbModal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.resolve()
        } as NgbModalRef);
      });
      spyOn(settingTabBackendApiService, 'getData')
        .and.returnValue(Promise.resolve({
          draft_email_body: 'Draf message'
        }));

      component.unpublishExplorationAsModerator();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));

  it('should save moderator changes to backend when closing preview summary' +
      ' tile modal', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return ({
        componentInstance: NgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef);
    });
    spyOn(explorationRightsService, 'saveModeratorChangeToBackendAsync').and
      .callFake((emailBody) => {
        return Promise.resolve();
      });
    spyOn(
      settingTabBackendApiService, 'getData')
      .and.returnValue(Promise.resolve({
        draft_email_body: 'Draf message'
      }));

    component.canUnpublish = false;
    component.canReleaseOwnership = false;
    component.unpublishExplorationAsModerator();
    tick();

    expect(explorationRightsService.saveModeratorChangeToBackendAsync)
      .toHaveBeenCalled();
    expect(userExplorationPermissionsService.fetchPermissionsAsync)
      .toHaveBeenCalled();
    expect(component.canUnpublish).toBe(true);
    expect(component.canReleaseOwnership).toBe(true);
  }));

  it('should clear alerts warning when dismissing preview summary tile modal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return ({
          componentInstance: NgbModalRef,
          result: Promise.reject()
        } as NgbModalRef);
      });
      spyOn(alertsService, 'clearWarnings');
      spyOn(
        settingTabBackendApiService, 'getData')
        .and.returnValue(Promise.resolve({
          draft_email_body: 'Draf message'
        }));

      component.unpublishExplorationAsModerator();
      tick();

      expect(alertsService.clearWarnings).toHaveBeenCalled();
    }));

  it('should toggle notifications', () => {
    let feedbackNotificationsSpy = spyOn(
      userEmailPreferencesService, 'setFeedbackNotificationPreferences')
      .and.callFake((mute: boolean, callb: () => void) => {
        callb();
      });
    let suggestionNotificationsSpy = spyOn(
      userEmailPreferencesService, 'setSuggestionNotificationPreferences')
      .and.callFake((mute: boolean, callb: () => void) => {
        callb();
      });
    component.muteFeedbackNotifications();
    expect(feedbackNotificationsSpy)
      .toHaveBeenCalled();

    component.unmuteFeedbackNotifications();
    expect(feedbackNotificationsSpy)
      .toHaveBeenCalled();

    component.muteSuggestionNotifications();
    expect(suggestionNotificationsSpy)
      .toHaveBeenCalled();

    component.unmuteSuggestionNotifications();
    expect(suggestionNotificationsSpy)
      .toHaveBeenCalled();
  });

  it('should open edit roles form and edit username and role', () => {
    component.openEditRolesForm();
    explorationRightsService.init(
      ['owner'], [], [], [], '', '', false, true);

    expect(component.isRolesFormOpen).toBe(true);
    expect(component.newMemberUsername).toBe('');
    expect(component.newMemberRole.value).toBe('owner');

    spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
      Promise.resolve());
    component.editRole('Username1', 'editor');

    expect(explorationRightsService.saveRoleChanges).toHaveBeenCalledWith(
      'Username1', 'editor');
    expect(component.isRolesFormOpen).toBe(false);
  });

  it('should open edit roles form and close it', () => {
    component.openEditRolesForm();

    expect(component.isRolesFormOpen).toBe(true);
    expect(component.newMemberUsername).toBe('');
    expect(component.newMemberRole.value).toBe('owner');

    component.closeEditRolesForm();

    expect(component.isRolesFormOpen).toBe(false);
    expect(component.newMemberUsername).toBe('');
    expect(component.newMemberRole.value).toBe('owner');
  });

  it('should open voice artist edit roles form and edit username', () => {
    component.openVoiceoverRolesForm();
    explorationRightsService.init(
      ['owner'], [], [], [], '', '', false, true);

    expect(component.isVoiceoverFormOpen).toBe(true);
    expect(component.newVoiceArtistUsername).toBe('');

    spyOn(explorationRightsService, 'assignVoiceArtistRoleAsync')
      .and.returnValue(Promise.resolve());
    component.editVoiceArtist('Username1');

    expect(explorationRightsService.assignVoiceArtistRoleAsync)
      .toHaveBeenCalledWith('Username1');
    expect(component.isVoiceoverFormOpen).toBe(false);
  });

  it('should open voice artist edit roles form and close it', () => {
    component.openVoiceoverRolesForm();

    expect(component.isVoiceoverFormOpen).toBe(true);
    expect(component.newVoiceArtistUsername).toBe('');

    component.closeVoiceoverForm();

    expect(component.isVoiceoverFormOpen).toBe(false);
    expect(component.newVoiceArtistUsername).toBe('');
  });

  it('should evaluate when parameters are enabled', () => {
    component.enableParameters();
    expect(component.areParametersEnabled()).toBe(true);
  });

  it('should evaluate when automatic text to speech is enabled', () => {
    component.toggleAutomaticTextToSpeech();
    expect(component.isAutomaticTextToSpeechEnabled()).toBe(true);
    component.toggleAutomaticTextToSpeech();
    expect(component.isAutomaticTextToSpeechEnabled()).toBe(false);
  });

  it('should evaluate when correctness feedback is enabled', () => {
    component.toggleCorrectnessFeedback();
    expect(component.isCorrectnessFeedbackEnabled()).toBe(true);
    component.toggleCorrectnessFeedback();
    expect(component.isCorrectnessFeedbackEnabled()).toBe(false);
  });

  it('should evaluate when edits are allowed', fakeAsync(() => {
    spyOn(eeabas, 'setEditsAllowed').and.callFake(
      async(unusedValue, unusedId, cb) => cb());
    spyOn(editabilityService, 'lockExploration');
    component.enableEdits();
    tick();

    expect(editabilityService.lockExploration).toHaveBeenCalledWith(false);
    expect(component.isExplorationEditable()).toEqual(true);
  }));

  it('should evaluate when edits are not allowed', fakeAsync(() => {
    spyOn(eeabas, 'setEditsAllowed').and.callFake(
      async(unusedValue, unusedId, cb) => cb());
    spyOn(editabilityService, 'lockExploration');
    component.disableEdits();
    tick();

    expect(editabilityService.lockExploration).toHaveBeenCalledWith(true);
    expect(component.isExplorationEditable()).toEqual(false);
  }));

  it('should check if exploration is locked for editing', () => {
    let changeListSpy = spyOn(
      changeListService, 'isExplorationLockedForEditing');

    changeListSpy.and.returnValue(true);
    expect(component.isExplorationLockedForEditing()).toBe(true);

    changeListSpy.and.returnValue(false);
    expect(component.isExplorationLockedForEditing()).toBe(false);
  });

  it('should check edit-modal has been open ' +
    'when editRole function has been called', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: NgbModalRef,
      result: Promise.resolve()
    } as NgbModalRef);

    component.openEditRolesForm();
    expect(component.isRolesFormOpen).toEqual(true);
    tick();
    explorationRightsService.init(
      ['owner'], [], [], [], '', '', false, true);
    tick();
    spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
      .and.returnValue(true);
    spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
      Promise.resolve()
    );
    component.editRole('Username1', 'editor');
    tick();
    component.editRole('Username1', 'owner');
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(explorationRightsService.saveRoleChanges).toHaveBeenCalled();
    expect(component.isRolesFormOpen).toEqual(false);
  }));

  it('should update warnings when save param changes hook', () => {
    spyOn(explorationWarningsService, 'updateWarnings');

    component.postSaveParamChangesHook();
    expect(explorationWarningsService.updateWarnings).toHaveBeenCalled();
  });

  it('should check if parameters are used', fakeAsync(() => {
    let paramChangeBackendDict = {
      customization_args: {
        parse_with_jinja: false,
        value: 'test value'
      },
      generator_id: '123',
      name: 'test',
    };

    component.refreshSettingsTab();

    tick(500);

    expect(component.areParametersUsed()).toBe(false);
    explorationDataService.data.param_changes.push(paramChangeBackendDict);
    expect(component.areParametersUsed()).toBe(true);
  }));

  it('should disable save button when exploration title is empty', () => {
    component.newMemberUsername = 'newUser';
    component.rolesSaveButtonEnabled = true;
    spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
      .and.returnValue(false);

    explorationTitleService.init('');
    component.saveExplorationTitle();

    expect(component.rolesSaveButtonEnabled).toBe(false);
    expect(component.errorMessage).toBe(
      'Please provide a title before inviting.');
  });

  it('should disable save button when adding same role to existing users.',
    () => {
      component.openEditRolesForm();
      component.rolesSaveButtonEnabled = true;
      explorationRightsService.init(
        ['Username1'], [], [], [], '', 'false', false, true);
      component.newMemberUsername = 'Username1';
      explorationTitleService.init('Exploration title');
      component.saveExplorationTitle();
      spyOn(explorationRightsService, 'getOldRole')
        .and.returnValue('owner');

      component.onRolesFormUsernameBlur();

      expect(component.rolesSaveButtonEnabled).toBe(false);
      expect(component.errorMessage).toBe('User is already owner.');
    });

  it('should disable save button when adding another role to itself',
    () => {
      component.newMemberUsername = component.loggedInUser;
      component.rolesSaveButtonEnabled = true;
      explorationTitleService.init('Exploration title');
      component.saveExplorationTitle();

      spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
        .and.returnValue(true);

      component.onRolesFormUsernameBlur();

      expect(component.rolesSaveButtonEnabled).toBe(false);
      expect(component.errorMessage).toBe(
        'Users are not allowed to assign other roles to themselves.');
    });

  it('should enable save button when tile and username are valid', () => {
    component.newMemberUsername = 'newUser';
    component.newMemberRole = { name: 'owner', value: 'owner'};
    component.rolesSaveButtonEnabled = true;
    explorationTitleService.init('Exploration title');
    component.saveExplorationTitle();
    spyOn(explorationRightsService, 'getOldRole')
      .and.returnValue('editor');
    expect(component.rolesSaveButtonEnabled).toBe(true);
    expect(component.errorMessage).toBe('');
  });

  it('should toggle exploration visibility', () => {
    spyOn(explorationRightsService, 'setViewability');
    spyOn(explorationRightsService, 'viewableIfPrivate').and.returnValue(
      false);
    component.toggleViewabilityIfPrivate();

    expect(explorationRightsService.setViewability).toHaveBeenCalledWith(
      true);
  });

  it('should toggle the preview cards', fakeAsync(() => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    component.toggleCards('settings');
    tick();
    expect(component.basicSettingIsShown).toEqual(false);

    component.toggleCards('advanced_features');
    tick();
    expect(component.advancedFeaturesIsShown).toEqual(false);

    component.toggleCards('roles');
    tick();
    expect(component.rolesCardIsShown).toEqual(false);

    component.toggleCards('permissions');
    tick();
    expect(component.permissionsCardIsShown).toEqual(false);

    component.toggleCards('feedback');
    tick();
    expect(component.feedbackCardIsShown).toEqual(false);

    component.toggleCards('voice_artists');
    component.toggleCards('controls');
    tick();
    expect(component.controlsCardIsShown).toEqual(false);
  }));

  it('should not toggle the preview cards', fakeAsync(() => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    mockEventEmitteruserExplorationPermissionsService.emit();
    component.toggleCards('settings');
    tick();
    expect(component.basicSettingIsShown).toEqual(true);
  }));
});
