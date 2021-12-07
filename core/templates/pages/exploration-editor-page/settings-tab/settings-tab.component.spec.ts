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

import { EventEmitter } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { Subscription } from 'rxjs';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { ChangeListService } from '../services/change-list.service';
import { ExplorationDataService } from '../services/exploration-data.service';

class MockRouterService {
  private refreshSettingsTabEventEmitter: EventEmitter<void>;
  get onRefreshSettingsTab() {
    return this.refreshSettingsTabEventEmitter;
  }
  set refreshSettingsTabEmitter(val) {
    this.refreshSettingsTabEventEmitter = val;
  }
}
describe('Settings Tab Component', () => {
  let ctrl = null;
  let $q = null;
  let $rootScope = null;
  let $scope = null;
  let $uibModal = null;
  let alertsService = null;
  let changeListService = null;
  let explorationDataService = null;
  let contextService = null;
  let editableExplorationBackendApiService = null;
  let explorationCategoryService = null;
  let explorationInitStateNameService = null;
  let explorationLanguageCodeService = null;
  let explorationObjectiveService = null;
  let explorationRightsService = null;
  let explorationStatesService = null;
  let explorationTagsService = null;
  let explorationTitleService = null;
  let explorationWarningsService = null;
  let userEmailPreferencesService = null;
  let userExplorationPermissionsService = null;
  let userService = null;
  let windowRef = null;
  let routerService = null;
  let settingTabBackendApiService = null;
  let ngbModal: NgbModal = null;

  let testSubscriptipns = null;
  let refreshGraphSpy = null;

  let explorationId = 'exp1';
  let userPermissions = {
    canDelete: true,
    canModifyRoles: true,
    canReleaseOwnership: true,
    canUnpublish: true,
    canManageVoiceArtist: true
  };
  let mockWindowDimensionsService = {
    isWindowNarrow: () => true
  };

  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: explorationId,
            data: {
              param_changes: []
            },
            getDataAsync: () => $q.resolve(),
            autosaveChangeListAsync() {
              return;
            }
          }
        }
      ]
    });

    alertsService = TestBed.inject(AlertsService);
    changeListService = TestBed.inject(ChangeListService);
    userExplorationPermissionsService = (
      TestBed.inject(UserExplorationPermissionsService));
    windowRef = TestBed.inject(WindowRef);
    routerService = new MockRouterService();
    ngbModal = TestBed.inject(NgbModal);
    mockWindowDimensionsService = {
      isWindowNarrow: () => true
    };
  });

  beforeEach(angular.mock.module('oppia', ($provide) => {
    $provide.value('AngularNameService', TestBed.inject(AngularNameService));
    $provide.value('WindowDimensionsService', TestBed.inject(
      WindowDimensionsService));
    $provide.value(
      'TextInputRulesService',
      TestBed.inject(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.inject(OutcomeObjectFactory));
    $provide.value(
      'StateCustomizationArgsService',
      TestBed.inject(StateCustomizationArgsService));
    $provide.value(
      'StateEditorRefreshService', TestBed.inject(StateEditorRefreshService));
    $provide.value(
      'StateInteractionIdService', TestBed.inject(StateInteractionIdService));
    $provide.value(
      'StateSolutionService', TestBed.inject(StateSolutionService));
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.inject(ReadOnlyExplorationBackendApiService));
    $provide.value(
      'ExplorationDataService',
      TestBed.inject(ExplorationDataService));
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  describe('when the device is narrow', () => {
    beforeEach(angular.mock.inject(($injector, $componentController) => {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      ngbModal = $injector.get('NgbModal');
      explorationDataService = $injector.get('ExplorationDataService');
      contextService = $injector.get('ContextService');
      settingTabBackendApiService = $injector.get(
        'SettingTabBackendApiService');

      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
      editableExplorationBackendApiService = $injector.get(
        'EditableExplorationBackendApiService');
      explorationCategoryService = $injector.get('ExplorationCategoryService');
      explorationInitStateNameService = $injector.get(
        'ExplorationInitStateNameService');
      explorationLanguageCodeService = $injector.get(
        'ExplorationLanguageCodeService');
      explorationObjectiveService = $injector.get(
        'ExplorationObjectiveService');
      explorationRightsService = $injector.get('ExplorationRightsService');
      explorationStatesService = $injector.get('ExplorationStatesService');
      explorationTagsService = $injector.get('ExplorationTagsService');
      explorationTitleService = $injector.get('ExplorationTitleService');
      explorationWarningsService = $injector.get('ExplorationWarningsService');
      userEmailPreferencesService = $injector.get(
        'UserEmailPreferencesService');
      userService = $injector.get('UserService');

      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue($q.resolve(userPermissions));
      spyOn(userExplorationPermissionsService, 'fetchPermissionsAsync').and
        .returnValue($q.resolve(userPermissions));
      spyOn(explorationStatesService, 'isInitialized').and.returnValue(true);
      spyOn(explorationStatesService, 'getStateNames').and.returnValue([
        'Introduction']);
      spyOn(userService, 'getUserInfoAsync').and.returnValue($q.resolve({
        getUsername: () => 'username1'
      }));

      explorationCategoryService.init('Astrology');

      routerService.refreshSettingsTabEmitter = new EventEmitter();
      $scope = $rootScope.$new();
      ctrl = $componentController('settingsTab', {
        $scope: $scope,
        AlertsService: alertsService,
        UserExplorationPermissionsService: userExplorationPermissionsService,
        RouterService: routerService,
        WindowRef: windowRef,
        WindowDimensionsService: mockWindowDimensionsService
      });
      ctrl.$onInit();
      $scope.$apply();
    }));

    beforeEach(() => {
      testSubscriptipns = new Subscription();
      refreshGraphSpy = jasmine.createSpy('refreshGraph');
      testSubscriptipns.add(
        explorationStatesService.onRefreshGraph.subscribe(refreshGraphSpy));
    });

    afterEach(() => {
      testSubscriptipns.unsubscribe();
    });

    it('should initialize controller properties after its initialization',
      () => {
        expect(ctrl.isRolesFormOpen).toBe(false);
        expect(ctrl.canDelete).toBe(true);
        expect(ctrl.canModifyRoles).toBe(true);
        expect(ctrl.canReleaseOwnership).toBe(true);
        expect(ctrl.canUnpublish).toBe(true);
        expect(ctrl.explorationId).toBe(explorationId);
        expect(ctrl.canManageVoiceArtist).toBe(true);

        expect(ctrl.CATEGORY_LIST_FOR_SELECT2[0]).toEqual({
          id: 'Astrology',
          text: 'Astrology'
        });

        expect(ctrl.stateNames).toEqual(['Introduction']);
        expect(ctrl.hasPageLoaded).toBe(true);
        expect(ctrl.loggedInUser).toBe('username1');
      });

    it('should refresh settings tab when refreshSettingsTab flag is ' +
        'broadcasted', () => {
      routerService.onRefreshSettingsTab.emit();
      $scope.$apply();

      expect(ctrl.stateNames).toEqual(['Introduction']);
      expect(ctrl.hasPageLoaded).toBe(true);
    });

    it('should get explore page url based on the exploration id', () => {
      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          protocol: 'https:',
          host: 'oppia.org'
        }
      });
      expect(ctrl.getExplorePageUrl()).toBe('https://oppia.org/explore/exp1');
    });

    it('should save exploration title', () => {
      spyOn(explorationTitleService, 'saveDisplayedValue');
      explorationTitleService.init('New title');

      ctrl.saveExplorationTitle();

      expect(explorationTitleService.saveDisplayedValue).toHaveBeenCalled();
      expect(ctrl.isTitlePresent()).toBe(true);
    });

    it('should save exploration category', () => {
      spyOn(explorationCategoryService, 'saveDisplayedValue');
      explorationCategoryService.init('New Category');

      ctrl.saveExplorationCategory();

      expect(explorationCategoryService.saveDisplayedValue).toHaveBeenCalled();
    });

    it('should save exploration language code', () => {
      spyOn(explorationLanguageCodeService, 'saveDisplayedValue');
      explorationLanguageCodeService.init('hi-en');

      ctrl.saveExplorationLanguageCode();

      expect(explorationLanguageCodeService.saveDisplayedValue)
        .toHaveBeenCalled();
    });

    it('should save exploration objective', () => {
      spyOn(explorationObjectiveService, 'saveDisplayedValue');
      explorationObjectiveService.init('New Objective');

      ctrl.saveExplorationObjective();

      expect(explorationObjectiveService.saveDisplayedValue).toHaveBeenCalled();
    });

    it('should save exploration tags', () => {
      spyOn(explorationTagsService, 'saveDisplayedValue');
      explorationTagsService.init('testing');

      ctrl.saveExplorationTags();

      expect(explorationTagsService.saveDisplayedValue).toHaveBeenCalled();
    });

    it('should not save exploration init state name if it\'s invalid',
      () => {
        explorationInitStateNameService.init('First State');
        spyOn(explorationStatesService, 'getState').and.returnValue(false);
        spyOn(alertsService, 'addWarning');

        ctrl.saveExplorationInitStateName();
        expect(alertsService.addWarning).toHaveBeenCalledWith(
          'Invalid initial state name: First State');
      });

    it('should save exploration init state name successfully and refresh graph',
      () => {
        explorationInitStateNameService.init('Introduction');
        spyOn(explorationStatesService, 'getState').and.returnValue(true);
        spyOn(explorationInitStateNameService, 'saveDisplayedValue');

        ctrl.saveExplorationInitStateName();

        expect(explorationInitStateNameService.saveDisplayedValue)
          .toHaveBeenCalled();
        expect(refreshGraphSpy).toHaveBeenCalled();
      });

    it('should delete exploration when closing delete exploration modal',
      fakeAsync(() => {
        spyOn(editableExplorationBackendApiService, 'deleteExplorationAsync')
          .and.returnValue($q.resolve());
        spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
          location: {
            reload: () => {}
          }
        });

        ctrl.deleteExploration();
        tick();
        $scope.$apply();

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

        ctrl.deleteExploration();
        tick();
        $scope.$apply();

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

      ctrl.removeRole('username', 'editor');
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
        .returnValue($q.resolve());

      ctrl.removeRole('username', 'editor');
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

        ctrl.removeRole('username1', 'editor');
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

        ctrl.removeRole('username1', 'editor');
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
      ctrl.removeVoiceArtist('username');
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
          .returnValue($q.resolve());

        ctrl.removeVoiceArtist('username');
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

        ctrl.removeVoiceArtist('username');
        tick();
        $scope.$apply();

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

      ctrl.openEditRolesForm();
      explorationRightsService.init(
        ['owner'], [], [], [], '', false, false, true);

      spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
        .and.returnValue(Promise.resolve());
      spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
        Promise.resolve());
      ctrl.editRole('Username1', 'editor');
      tick();
      ctrl.editRole('Username1', 'owner');
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

        ctrl.openEditRolesForm();
        explorationRightsService.init(
          ['owner'], [], [], [], '', false, false, true);

        spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
          .and.returnValue(Promise.resolve());
        spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
          Promise.resolve());

        ctrl.editRole('Username1', 'editor');
        tick();
        $scope.$apply();
        ctrl.editRole('Username1', 'owner');
        $scope.$apply();
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
          ['owner'], [], [], [], '', false, false, true);

        spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
          .and.returnValue({result: $q.resolve()});
        spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue({
          result: $q.resolve()
        });
        ctrl.editRole('Username1', 'editor');
        tick();
        $scope.$apply();
        ctrl.editRole('Username1', 'owner');
        tick();
        $scope.$apply();

        expect(
          explorationRightsService.saveRoleChanges).not.toHaveBeenCalled();
      }));

    it('should transfer exploration ownership when closing transfer ownership' +
    ' modal', fakeAsync(() => {
      spyOn(explorationRightsService, 'makeCommunityOwned').and.returnValue(
        Promise.resolve()
      );

      ctrl.showTransferExplorationOwnershipModal();
      tick();
      $scope.$apply();

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

      ctrl.showTransferExplorationOwnershipModal();
      tick();

      expect(alertsService.clearWarnings).toHaveBeenCalled();
    }));

    it('should open preview summary tile modal with $uibModal',
      fakeAsync(() => {
        spyOn($uibModal, 'open').and.returnValue({
          result: Promise.resolve()
        });

        ctrl.previewSummaryTile();
        tick();

        expect($uibModal.open).toHaveBeenCalled();
      }));

    it('should clear alerts warning when dismissing preview summary tile modal',
      () => {
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.reject()
        });
        spyOn(alertsService, 'clearWarnings');

        ctrl.previewSummaryTile();
        $scope.$apply();

        expect(alertsService.clearWarnings).toHaveBeenCalled();
      });

    it('should open preview summary tile modal with $uibModal',
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

        ctrl.unpublishExplorationAsModerator();
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

      ctrl.canUnpublish = false;
      ctrl.canReleaseOwnership = false;
      ctrl.unpublishExplorationAsModerator();
      tick();
      $scope.$apply();

      expect(explorationRightsService.saveModeratorChangeToBackendAsync)
        .toHaveBeenCalled();
      expect(userExplorationPermissionsService.fetchPermissionsAsync)
        .toHaveBeenCalled();
      expect(ctrl.canUnpublish).toBe(true);
      expect(ctrl.canReleaseOwnership).toBe(true);
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

        ctrl.unpublishExplorationAsModerator();
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
      ctrl.muteFeedbackNotifications();
      expect(feedbackNotificationsSpy)
        .toHaveBeenCalledWith(true, ctrl._successCallback);

      ctrl.unmuteFeedbackNotifications();
      expect(feedbackNotificationsSpy)
        .toHaveBeenCalledWith(false, ctrl._successCallback);

      ctrl.muteSuggestionNotifications();
      expect(suggestionNotificationsSpy)
        .toHaveBeenCalledWith(true, ctrl._successCallback);

      ctrl.unmuteSuggestionNotifications();
      expect(suggestionNotificationsSpy)
        .toHaveBeenCalledWith(false, ctrl._successCallback);
    });

    it('should open edit roles form and edit username and role', () => {
      ctrl.openEditRolesForm();
      explorationRightsService.init(
        ['owner'], [], [], [], '', '', false, true);

      expect(ctrl.isRolesFormOpen).toBe(true);
      expect(ctrl.newMemberUsername).toBe('');
      expect(ctrl.newMemberRole.value).toBe('owner');

      spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
        Promise.resolve());
      ctrl.editRole('Username1', 'editor');

      expect(explorationRightsService.saveRoleChanges).toHaveBeenCalledWith(
        'Username1', 'editor');
      expect(ctrl.isRolesFormOpen).toBe(false);
    });

    it('should open edit roles form and close it', () => {
      ctrl.openEditRolesForm();

      expect(ctrl.isRolesFormOpen).toBe(true);
      expect(ctrl.newMemberUsername).toBe('');
      expect(ctrl.newMemberRole.value).toBe('owner');

      ctrl.closeEditRolesForm();

      expect(ctrl.isRolesFormOpen).toBe(false);
      expect(ctrl.newMemberUsername).toBe('');
      expect(ctrl.newMemberRole.value).toBe('owner');
    });

    it('should open voice artist edit roles form and edit username', () => {
      ctrl.openVoiceoverRolesForm();
      explorationRightsService.init(
        ['owner'], [], [], [], '', '', false, true);

      expect(ctrl.isVoiceoverFormOpen).toBe(true);
      expect(ctrl.newVoiceArtistUsername).toBe('');

      spyOn(explorationRightsService, 'assignVoiceArtistRoleAsync')
        .and.returnValue(Promise.resolve());
      ctrl.editVoiseArtist('Username1');

      expect(explorationRightsService.assignVoiceArtistRoleAsync)
        .toHaveBeenCalledWith('Username1');
      expect(ctrl.isVoiceoverFormOpen).toBe(false);
    });

    it('should open voice artist edit roles form and close it', () => {
      ctrl.openVoiceoverRolesForm();

      expect(ctrl.isVoiceoverFormOpen).toBe(true);
      expect(ctrl.newVoiceArtistUsername).toBe('');

      ctrl.closeVoiceoverForm();

      expect(ctrl.isVoiceoverFormOpen).toBe(false);
      expect(ctrl.newVoiceArtistUsername).toBe('');
    });

    it('should evaluate when parameters are enabled', () => {
      ctrl.enableParameters();
      expect(ctrl.areParametersEnabled()).toBe(true);
    });

    it('should evaluate when automatic text to speech is enabled', () => {
      ctrl.toggleAutomaticTextToSpeech();
      expect(ctrl.isAutomaticTextToSpeechEnabled()).toBe(true);
      ctrl.toggleAutomaticTextToSpeech();
      expect(ctrl.isAutomaticTextToSpeechEnabled()).toBe(false);
    });

    it('should evaluate when correctness feedback is enabled', () => {
      ctrl.toggleCorrectnessFeedback();
      expect(ctrl.isCorrectnessFeedbackEnabled()).toBe(true);
      ctrl.toggleCorrectnessFeedback();
      expect(ctrl.isCorrectnessFeedbackEnabled()).toBe(false);
    });

    it('should check if exploration is locked for editing', () => {
      let changeListSpy = spyOn(
        changeListService, 'isExplorationLockedForEditing');

      changeListSpy.and.returnValue(true);
      expect(ctrl.isExplorationLockedForEditing()).toBe(true);

      changeListSpy.and.returnValue(false);
      expect(ctrl.isExplorationLockedForEditing()).toBe(false);
    });

    it('should check edit-modal has been open ' +
    'when editRole function has been called', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: NgbModalRef,
        result: Promise.resolve()
      } as NgbModalRef);

      ctrl.openEditRolesForm();
      expect(ctrl.isRolesFormOpen).toEqual(true);
      tick();
      explorationRightsService.init(
        ['owner'], [], [], [], '', false, false, true);
      tick();
      spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
        .and.returnValue(Promise.resolve());
      spyOn(explorationRightsService, 'saveRoleChanges').and.returnValue(
        Promise.resolve()
      );
      ctrl.editRole('Username1', 'editor');
      tick();
      ctrl.editRole('Username1', 'owner');
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(explorationRightsService.saveRoleChanges).toHaveBeenCalled();
      expect(ctrl.isRolesFormOpen).toEqual(false);
    }));

    it('should update warnings when save param changes hook', () => {
      spyOn(explorationWarningsService, 'updateWarnings');

      ctrl.postSaveParamChangesHook();
      expect(explorationWarningsService.updateWarnings).toHaveBeenCalled();
    });

    it('should check if parameters are used', () => {
      let paramChangeBackendDict = {
        customization_args: {
          parse_with_jinja: false,
          value: 'test value'
        },
        generator_id: '123',
        name: 'test',
      };

      expect(ctrl.areParametersUsed()).toBe(false);
      explorationDataService.data.param_changes.push(paramChangeBackendDict);
      expect(ctrl.areParametersUsed()).toBe(true);
    });

    describe('on calling onRolesFormUsernameBlur', function() {
      it('should disable save button when exploration title is empty', () => {
        ctrl.newMemberUsername = 'newUser';
        ctrl.rolesSaveButtonEnabled = true;
        spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
          .and.returnValue(false);

        explorationTitleService.init('');
        ctrl.saveExplorationTitle();

        expect(ctrl.rolesSaveButtonEnabled).toBe(false);
        expect(ctrl.errorMessage).toBe(
          'Please provide a title before inviting.');
      });

      it('should disable save button when adding same role to existing users.',
        () => {
          ctrl.openEditRolesForm();
          ctrl.rolesSaveButtonEnabled = true;
          explorationRightsService.init(
            ['Username1'], [], [], [], '', false, false, true);
          ctrl.newMemberUsername = 'Username1';
          explorationTitleService.init('Exploration title');
          ctrl.saveExplorationTitle();
          spyOn(explorationRightsService, 'getOldRole')
            .and.returnValue('owner');

          ctrl.onRolesFormUsernameBlur();

          expect(ctrl.rolesSaveButtonEnabled).toBe(false);
          expect(ctrl.errorMessage).toBe('User is already owner.');
        });

      it('should disable save button when adding another role to itself',
        () => {
          ctrl.newMemberUsername = ctrl.loggedInUser;
          ctrl.rolesSaveButtonEnabled = true;
          explorationTitleService.init('Exploration title');
          ctrl.saveExplorationTitle();

          spyOn(explorationRightsService, 'checkUserAlreadyHasRoles')
            .and.returnValue(true);

          ctrl.onRolesFormUsernameBlur();

          expect(ctrl.rolesSaveButtonEnabled).toBe(false);
          expect(ctrl.errorMessage).toBe(
            'Users are not allowed to assign other roles to themselves.');
        });

      it('should enable save button when tile and username are valid', () => {
        ctrl.newMemberUsername = 'newUser';
        ctrl.newMemberRole = 'owner';
        ctrl.rolesSaveButtonEnabled = true;
        explorationTitleService.init('Exploration title');
        ctrl.saveExplorationTitle();
        spyOn(explorationRightsService, 'getOldRole')
          .and.returnValue('editor');
        expect(ctrl.rolesSaveButtonEnabled).toBe(true);
        expect(ctrl.errorMessage).toBe('');
      });
    });

    it('should toggle exploration visibility', () => {
      spyOn(explorationRightsService, 'setViewability');
      spyOn(explorationRightsService, 'viewableIfPrivate').and.returnValue(
        false);
      ctrl.toggleViewabilityIfPrivate();

      expect(explorationRightsService.setViewability).toHaveBeenCalledWith(
        true);
    });

    it('should refresh settings tab when refreshSettingsTab event occurs',
      () => {
        spyOn(ctrl, 'refreshSettingsTab').and.callThrough();
        routerService.onRefreshSettingsTab.emit();
        expect(ctrl.refreshSettingsTab).toHaveBeenCalled();
      });

    it('should toggle the preview cards', () => {
      expect(ctrl.basicSettingIsShown).toEqual(false);
      ctrl.toggleCards('settings');
      expect(ctrl.basicSettingIsShown).toEqual(true);

      expect(ctrl.advancedFeaturesIsShown).toEqual(false);
      ctrl.toggleCards('advanced_features');
      expect(ctrl.advancedFeaturesIsShown).toEqual(true);

      expect(ctrl.rolesCardIsShown).toEqual(false);
      ctrl.toggleCards('roles');
      expect(ctrl.rolesCardIsShown).toEqual(true);

      expect(ctrl.permissionsCardIsShown).toEqual(false);
      ctrl.toggleCards('permissions');
      expect(ctrl.permissionsCardIsShown).toEqual(true);

      expect(ctrl.feedbackCardIsShown).toEqual(false);
      ctrl.toggleCards('feedback');
      expect(ctrl.feedbackCardIsShown).toEqual(true);

      expect(ctrl.controlsCardIsShown).toEqual(false);
      ctrl.toggleCards('controls');
      expect(ctrl.controlsCardIsShown).toEqual(true);
    });
  });

  describe('when device is not narrow', () => {
    beforeEach(() => {
      mockWindowDimensionsService = {
        isWindowNarrow: () => false
      };
    });

    beforeEach(angular.mock.inject(($injector, $componentController) => {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      contextService = $injector.get('ContextService');
      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
      editableExplorationBackendApiService = $injector.get(
        'EditableExplorationBackendApiService');
      explorationCategoryService = $injector.get('ExplorationCategoryService');
      explorationDataService = $injector.get('ExplorationDataService');
      explorationInitStateNameService = $injector.get(
        'ExplorationInitStateNameService');
      explorationLanguageCodeService = $injector.get(
        'ExplorationLanguageCodeService');
      explorationObjectiveService = $injector.get(
        'ExplorationObjectiveService');
      explorationRightsService = $injector.get('ExplorationRightsService');
      explorationStatesService = $injector.get('ExplorationStatesService');
      explorationTagsService = $injector.get('ExplorationTagsService');
      explorationTitleService = $injector.get('ExplorationTitleService');
      explorationWarningsService = $injector.get('ExplorationWarningsService');
      userEmailPreferencesService = $injector.get(
        'UserEmailPreferencesService');
      settingTabBackendApiService = $injector.get(
        'SettingTabBackendApiService');

      spyOn(userExplorationPermissionsService, 'getPermissionsAsync').and
        .returnValue($q.resolve(userPermissions));
      spyOn(explorationStatesService, 'isInitialized').and.returnValue(true);
      spyOn(explorationStatesService, 'getStateNames').and.returnValue([
        'Introduction']);

      explorationCategoryService.init('Astrology');
      routerService.refreshSettingsTabEmitter = new EventEmitter();
      $scope = $rootScope.$new();
      ctrl = $componentController('settingsTab', {
        $scope: $scope,
        AlertsService: alertsService,
        UserExplorationPermissionsService: userExplorationPermissionsService,
        RouterService: routerService,
        WindowRef: windowRef,
        WindowDimensionsService: mockWindowDimensionsService
      });
      ctrl.$onInit();
      $scope.$apply();
    }));

    beforeEach(() => {
      testSubscriptipns = new Subscription();
      refreshGraphSpy = jasmine.createSpy('refreshGraph');
      testSubscriptipns.add(
        explorationStatesService.onRefreshGraph.subscribe(refreshGraphSpy));
    });

    afterEach(() => {
      testSubscriptipns.unsubscribe();
    });

    it('should not toggle the preview cards', () => {
      expect(ctrl.basicSettingIsShown).toEqual(true);
      ctrl.toggleCards('settings');
      expect(ctrl.basicSettingIsShown).toEqual(true);
    });

    it('should display Unpublish button', function() {
      ctrl.canUnpublish = false;
      expect(ctrl.canUnpublish).toBe(false);

      userExplorationPermissionsService.
        onUserExplorationPermissionsFetched.emit();
      $scope.$apply();

      expect(userExplorationPermissionsService.getPermissionsAsync)
        .toHaveBeenCalled();
      expect(ctrl.canUnpublish).toBe(true);
    });

    it('should display Transfer ownership button', function() {
      ctrl.canReleaseOwnership = false;
      expect(ctrl.canReleaseOwnership).toBe(false);

      userExplorationPermissionsService.
        onUserExplorationPermissionsFetched.emit();
      $scope.$apply();

      expect(userExplorationPermissionsService.getPermissionsAsync)
        .toHaveBeenCalled();
      expect(ctrl.canReleaseOwnership).toBe(true);
    });
  });
});
