// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration settings tab.
 */

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DeleteExplorationModalComponent } from './templates/delete-exploration-modal.component';
import { RemoveRoleConfirmationModalComponent } from './templates/remove-role-confirmation-modal.component';
import { ModeratorUnpublishExplorationModalComponent } from './templates/moderator-unpublish-exploration-modal.component';
import { ReassignRoleConfirmationModalComponent } from './templates/reassign-role-confirmation-modal.component';
import { TransferExplorationOwnershipModalComponent } from './templates/transfer-exploration-ownership-modal.component';
import { PreviewSummaryTileModalComponent } from './templates/preview-summary-tile-modal.component';
import { EditableExplorationBackendApiService } from 'domain/exploration/editable-exploration-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { EditabilityService } from 'services/editability.service';
import { ExplorationFeaturesService } from 'services/exploration-features.service';
import { UserService } from 'services/user.service';
import { ChangeListService } from '../services/change-list.service';
import { ExplorationAutomaticTextToSpeechService } from '../services/exploration-automatic-text-to-speech.service';
import { ExplorationCategoryService } from '../services/exploration-category.service';
import { ExplorationCorrectnessFeedbackService } from '../services/exploration-correctness-feedback.service';
import { ExplorationDataService } from '../services/exploration-data.service';
import { ExplorationEditsAllowedBackendApiService } from '../services/exploration-edits-allowed-backend-api.service';
import { ExplorationInitStateNameService } from '../services/exploration-init-state-name.service';
import { ExplorationLanguageCodeService } from '../services/exploration-language-code.service';
import { ExplorationObjectiveService } from '../services/exploration-objective.service';
import { ExplorationParamChangesService } from '../services/exploration-param-changes.service';
import { ExplorationParamSpecsService } from '../services/exploration-param-specs.service';
import { ExplorationRightsService } from '../services/exploration-rights.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { ExplorationTagsService } from '../services/exploration-tags.service';
import { ExplorationTitleService } from '../services/exploration-title.service';
import { ExplorationWarningsService } from '../services/exploration-warnings.service';
import { RouterService } from '../services/router.service';
import { SettingTabBackendApiService, SettingTabResponse } from '../services/setting-tab-backend-api.service';
import { UserEmailPreferencesService } from '../services/user-email-preferences.service';
import { UserExplorationPermissionsService } from '../services/user-exploration-permissions.service';
import { ExplorationEditorPageConstants } from '../exploration-editor-page.constants';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'oppia-settings-tab',
  templateUrl: './settings-tab.component.html'
})
export class SettingsTabComponent
  implements OnInit, OnDestroy {
  @Input() currentUserIsCurriculumAdmin: boolean;
  @Input() currentUserIsModerator: boolean;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  CREATOR_DASHBOARD_PAGE_URL: string = '/creator-dashboard';
  EXPLORE_PAGE_PREFIX: string = '/explore/';
  directiveSubscriptions = new Subscription();
  explorationIsLinkedToStory: boolean = false;
  isSuperAdmin: boolean = false;
  rolesSaveButtonEnabled: boolean;
  errorMessage: string;
  isRolesFormOpen: boolean;
  newMemberUsername: string;
  newMemberRole: { name: string; value: string};
  isVoiceoverFormOpen: boolean;
  newVoiceArtistUsername: string;
  hasPageLoaded: boolean;
  basicSettingIsShown: boolean;
  advancedFeaturesIsShown: boolean;
  rolesCardIsShown: boolean;
  permissionsCardIsShown: boolean;
  feedbackCardIsShown: boolean;
  controlsCardIsShown: boolean;
  voiceArtistsCardIsShown: boolean;
  EXPLORATION_TITLE_INPUT_FOCUS_LABEL: string;
  ROLES = [{
    name: 'Manager (can edit permissions)',
    value: 'owner'
  }, {
    name: 'Collaborator (can make changes)',
    value: 'editor'
  }, {
    name: 'Playtester (can give feedback)',
    value: 'viewer'
  }];

  CATEGORY_LIST_FOR_SELECT2: {
    id: string;
    text: string;
  } [];

  stateNames: string[];
  formStyle: string;
  canDelete: boolean;
  canModifyRoles: boolean;
  canReleaseOwnership: boolean;
  canUnpublish: boolean;
  canManageVoiceArtist: boolean;
  explorationId: string;
  loggedInUser: string;
  TAG_REGEX: string;
  addOnBlur: boolean = true;

  constructor(
    private alertsService: AlertsService,
    private changeListService: ChangeListService,
    private contextService: ContextService,
    private editabilityService: EditabilityService,
    private editableExplorationBackendApiService:
      EditableExplorationBackendApiService,
    private explorationAutomaticTextToSpeechService:
      ExplorationAutomaticTextToSpeechService,
    private explorationCategoryService: ExplorationCategoryService,
    private explorationCorrectnessFeedbackService:
      ExplorationCorrectnessFeedbackService,
    private explorationDataService: ExplorationDataService,
    private explorationEditsAllowedBackendApiService:
      ExplorationEditsAllowedBackendApiService,
    private explorationFeaturesService: ExplorationFeaturesService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationLanguageCodeService: ExplorationLanguageCodeService,
    private explorationObjectiveService: ExplorationObjectiveService,
    private explorationParamChangesService: ExplorationParamChangesService,
    private explorationParamSpecsService: ExplorationParamSpecsService,
    private explorationRightsService: ExplorationRightsService,
    private explorationStatesService: ExplorationStatesService,
    private explorationTagsService: ExplorationTagsService,
    private explorationTitleService: ExplorationTitleService,
    private explorationWarningsService: ExplorationWarningsService,
    private ngbModal: NgbModal,
    private routerService: RouterService,
    private settingTabBackendApiService: SettingTabBackendApiService,
    private userEmailPreferencesService: UserEmailPreferencesService,
    private userExplorationPermissionsService:
      UserExplorationPermissionsService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
  ) {}

  filteredChoices = [];
  newCategory: {
    id: string;
    text: string;
  };

  explorationTags: string[] = [];

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our explorationTags.
    if (value) {
      if (!(this.explorationTagsService.displayed) ||
        (this.explorationTagsService.displayed as []).length < 10) {
        if (
          (this.explorationTagsService.displayed as string[]).includes(value)) {
          // Clear the input value.
          event.input.value = '';
          return;
        }

        this.explorationTags.push(value.toLowerCase());
      }
    }

    // Clear the input value.
    event.input.value = '';

    this.explorationTagsService.displayed = this.explorationTags;

    this.saveExplorationTags();
  }

  remove(explorationTags: string): void {
    const index = this.explorationTags.indexOf(explorationTags);

    if (index >= 0) {
      this.explorationTags.splice(index, 1);
    }

    this.explorationTagsService.displayed = this.explorationTags;

    this.saveExplorationTags();
  }

  updateCategoryListWithUserData(): void {
    if (this.newCategory) {
      this.CATEGORY_LIST_FOR_SELECT2.push(this.newCategory);
      this.explorationCategoryService.displayed = this.newCategory.id;
    }

    this.explorationCategoryService.saveDisplayedValue();
  }

  filterChoices(searchTerm: string): void {
    this.newCategory = {
      id: searchTerm,
      text: searchTerm
    };

    this.filteredChoices = this.CATEGORY_LIST_FOR_SELECT2.filter(
      value => value.text.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1);

    this.filteredChoices.push(this.newCategory);

    if (searchTerm === '') {
      this.filteredChoices = this.CATEGORY_LIST_FOR_SELECT2;
    }
  }

  refreshSettingsTab(): void {
    // Ensure that ExplorationStatesService has been initialized before
    // getting the state names from it. Otherwise, navigating to the
    // settings tab directly (by entering a URL that ends with
    // /settings) results in a console error.

    this.hasPageLoaded = false;
    this.explorationDataService.getDataAsync(() => {}).then(() => {
      if (this.explorationStatesService.isInitialized()) {
        var categoryIsInSelect2 = this.CATEGORY_LIST_FOR_SELECT2.some(
          (categoryItem) => {
            return (
              categoryItem.id ===
                  this.explorationCategoryService.savedMemento);
          }
        );
        // If the current category is not in the dropdown, add it
        // as the first option.
        if (!categoryIsInSelect2 &&
            this.explorationCategoryService.savedMemento) {
          this.CATEGORY_LIST_FOR_SELECT2.unshift({
            id: this.explorationCategoryService.savedMemento as string,
            text: this.explorationCategoryService.savedMemento as string
          });
        }

        this.stateNames = this.explorationStatesService.getStateNames();
        this.explorationIsLinkedToStory = (
          this.contextService.isExplorationLinkedToStory());
      }
      this.hasPageLoaded = true;
    });
  }

  saveExplorationTitle(): void {
    this.explorationTitleService.saveDisplayedValue();
    if (!this.isTitlePresent()) {
      this.rolesSaveButtonEnabled = false;
      this.errorMessage = (
        'Please provide a title before inviting.');
      return;
    } else {
      this.rolesSaveButtonEnabled = true;
      this.errorMessage = ('');
      return;
    }
  }

  saveExplorationObjective(): void {
    this.explorationObjectiveService.saveDisplayedValue();
  }

  saveExplorationLanguageCode(): void {
    this.explorationLanguageCodeService.saveDisplayedValue();
  }

  saveExplorationTags(): void {
    setTimeout(() => {
      this.explorationTagsService.saveDisplayedValue();
    });
  }

  saveExplorationInitStateName(): void {
    var newInitStateName = this.explorationInitStateNameService.displayed;

    if (!this.explorationStatesService.getState(newInitStateName as string)) {
      this.alertsService.addWarning(
        'Invalid initial state name: ' + newInitStateName);
      this.explorationInitStateNameService.restoreFromMemento();
      return;
    }

    this.explorationInitStateNameService.saveDisplayedValue();

    this.explorationStatesService.onRefreshGraph.emit();
  }

  postSaveParamChangesHook(): void {
    this.explorationWarningsService.updateWarnings();
  }

  // Methods for enabling advanced features.
  areParametersEnabled(): boolean {
    return this.explorationFeaturesService.areParametersEnabled();
  }

  areParametersUsed(): boolean {
    if (this.hasPageLoaded) {
      return (this.explorationDataService.data.param_changes.length > 0);
    }
  }

  enableParameters(): void {
    this.explorationFeaturesService.enableParameters();
  }

  isAutomaticTextToSpeechEnabled(): boolean {
    return this.explorationAutomaticTextToSpeechService
      .isAutomaticTextToSpeechEnabled();
  }

  toggleAutomaticTextToSpeech(): void {
    return this.explorationAutomaticTextToSpeechService
      .toggleAutomaticTextToSpeech();
  }

  isCorrectnessFeedbackEnabled(): boolean {
    return (this.explorationCorrectnessFeedbackService.isEnabled() as boolean);
  }

  toggleCorrectnessFeedback(): void {
    this.explorationCorrectnessFeedbackService.toggleCorrectnessFeedback();
  }

  isExplorationEditable(): boolean {
    return (
      this.explorationDataService.data &&
      this.explorationDataService.data.edits_allowed) || false;
  }

  enableEdits(): void {
    this.explorationEditsAllowedBackendApiService.setEditsAllowed(
      true, this.explorationDataService.explorationId,
      () => {
        this.editabilityService.lockExploration(false);
        this.explorationDataService.data.edits_allowed = true;
      });
  }

  disableEdits(): void {
    this.explorationEditsAllowedBackendApiService.setEditsAllowed(
      false, this.explorationDataService.explorationId,
      () => {
        this.editabilityService.lockExploration(true);
        this.explorationDataService.data.edits_allowed = false;
      });
  }

  // Methods for rights management.
  openEditRolesForm(): void {
    this.isRolesFormOpen = true;
    this.newMemberUsername = '';
    this.newMemberRole = this.ROLES[0];
  }

  openVoiceoverRolesForm(): void {
    this.isVoiceoverFormOpen = true;
    this.newVoiceArtistUsername = '';
  }

  closeEditRolesForm(): void {
    this.newMemberUsername = '';
    this.newMemberRole = this.ROLES[0];
    this.closeRolesForm();
  }

  closeVoiceoverForm(): void {
    this.newVoiceArtistUsername = '';
    this.isVoiceoverFormOpen = false;
  }

  editRole(newMemberUsername: string, newMemberRole: string): void {
    if (!this.explorationRightsService.checkUserAlreadyHasRoles(
      newMemberUsername)) {
      this.explorationRightsService.saveRoleChanges(
        newMemberUsername, newMemberRole);

      this.closeRolesForm();
      return;
    }

    let oldRole = this.explorationRightsService.getOldRole(
      newMemberUsername);

    this.reassignRole(newMemberUsername, newMemberRole, oldRole);
  }

  toggleCards(card: string): void {
    if (!this.windowDimensionsService.isWindowNarrow()) {
      return;
    }

    if (card === 'settings') {
      this.basicSettingIsShown = !this.basicSettingIsShown;
    } else if (card === 'advanced_features') {
      this.advancedFeaturesIsShown = !this.advancedFeaturesIsShown;
    } else if (card === 'roles') {
      this.rolesCardIsShown = !this.rolesCardIsShown;
    } else if (card === 'permissions') {
      this.permissionsCardIsShown = !this.permissionsCardIsShown;
    } else if (card === 'feedback') {
      this.feedbackCardIsShown = !this.feedbackCardIsShown;
    } else if (card === 'controls') {
      this.controlsCardIsShown = !this.controlsCardIsShown;
    } else if (card === 'voice_artists') {
      this.voiceArtistsCardIsShown = !this.voiceArtistsCardIsShown;
    }
  }

  removeRole(memberUsername: string, memberRole: string): void {
    this.alertsService.clearWarnings();

    const modalRef = this.ngbModal
      .open(RemoveRoleConfirmationModalComponent, {
        backdrop: true,
      });

    modalRef.componentInstance.username = memberUsername;
    modalRef.componentInstance.role = memberRole;

    modalRef.result.then(() => {
      this.explorationRightsService.removeRoleAsync(
        memberUsername);
      this.closeRolesForm();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  editVoiceArtist(newVoiceArtistUsername: string): void {
    this.explorationRightsService.assignVoiceArtistRoleAsync(
      newVoiceArtistUsername);
    this.closeVoiceoverForm();
    return;
  }

  removeVoiceArtist(voiceArtistUsername: string): void {
    this.alertsService.clearWarnings();

    const modalRef = this.ngbModal
      .open(RemoveRoleConfirmationModalComponent, {
        backdrop: true,
      });
    modalRef.componentInstance.username = voiceArtistUsername;
    modalRef.componentInstance.role = 'voice artist';
    modalRef.result.then(() => {
      this.explorationRightsService.removeVoiceArtistRoleAsync(
        voiceArtistUsername);
      this.closeVoiceoverForm();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  toggleViewabilityIfPrivate(): void {
    this.explorationRightsService.setViewability(
      !this.explorationRightsService.viewableIfPrivate());
  }

  // Methods for muting notifications.
  muteFeedbackNotifications(): void {
    this.userEmailPreferencesService.setFeedbackNotificationPreferences(
      true, () => {});
  }

  muteSuggestionNotifications(): void {
    this.userEmailPreferencesService.setSuggestionNotificationPreferences(
      true,
      () => {}
    );
  }

  unmuteFeedbackNotifications(): void {
    this.userEmailPreferencesService.setFeedbackNotificationPreferences(
      false,
      () => {}
    );
  }

  unmuteSuggestionNotifications(): void {
    this.userEmailPreferencesService.setSuggestionNotificationPreferences(
      false, () => {});
  }

  // Methods relating to control buttons.
  previewSummaryTile(): void {
    this.alertsService.clearWarnings();
    this.ngbModal.open(PreviewSummaryTileModalComponent, {
      backdrop: true,
    }).result.then(() => {}, () => {
      this.alertsService.clearWarnings();
    });
  }

  showTransferExplorationOwnershipModal(): void {
    this.alertsService.clearWarnings();
    this.ngbModal.open(TransferExplorationOwnershipModalComponent, {
      backdrop: true,
    }).result.then(() => {
      this.explorationRightsService.makeCommunityOwned();
    }, () => {
      this.alertsService.clearWarnings();
    });
  }

  deleteExploration(): void {
    this.alertsService.clearWarnings();

    this.ngbModal.open(DeleteExplorationModalComponent, {
      backdrop: true,
    }).result.then(() => {
      this.editableExplorationBackendApiService.deleteExplorationAsync(
        this.explorationId).then(() => {
        this.windowRef.nativeWindow.location = this.CREATOR_DASHBOARD_PAGE_URL;
      });
    }, () => {
      this.alertsService.clearWarnings();
    });
  }

  unpublishExplorationAsModerator(): void {
    this.alertsService.clearWarnings();

    var moderatorEmailDraftUrl = '/moderatorhandler/email_draft';

    this.settingTabBackendApiService
      .getData(moderatorEmailDraftUrl).then(
        (response: SettingTabResponse) => {
          // If the draft email body is empty, email functionality will not
          // be exposed to the mdoerator.
          const draftEmailBody = response.draft_email_body;

          const modalRef = this.ngbModal
            .open(ModeratorUnpublishExplorationModalComponent, {
              backdrop: true,
            });

          modalRef.componentInstance.draftEmailBody = draftEmailBody;

          modalRef.result.then((emailBody) => {
            this.explorationRightsService.saveModeratorChangeToBackendAsync(
              emailBody).then(() => {
              this.userExplorationPermissionsService.fetchPermissionsAsync()
                .then((permissions) => {
                  this.canUnpublish = permissions.canUnpublish;
                  this.canReleaseOwnership = permissions.canReleaseOwnership;
                });
            });
          }, () => {
            this.alertsService.clearWarnings();
          });
        });
  }

  isExplorationLockedForEditing(): boolean {
    return this.changeListService.isExplorationLockedForEditing();
  }

  closeRolesForm(): void {
    this.errorMessage = '';
    this.rolesSaveButtonEnabled = true;
    this.isRolesFormOpen = false;
  }

  isTitlePresent(): boolean {
    return (this.explorationTitleService.savedMemento as string).length > 0;
  }

  onRolesFormUsernameBlur(): void {
    this.rolesSaveButtonEnabled = true;
    this.errorMessage = '';

    if (this.newMemberUsername === this.loggedInUser) {
      this.rolesSaveButtonEnabled = false;
      this.errorMessage = (
        'Users are not allowed to assign other roles to themselves.');
      return;
    }
    if (this.explorationRightsService.checkUserAlreadyHasRoles(
      this.newMemberUsername)) {
      var oldRole = this.explorationRightsService.getOldRole(
        this.newMemberUsername);
      if (oldRole === this.newMemberRole.value) {
        this.rolesSaveButtonEnabled = false;
        this.errorMessage = `User is already ${oldRole}.`;
        return;
      }
    }
  }

  getExplorePageUrl(): string {
    return (
      this.windowRef.nativeWindow.location.protocol + '//' +
      this.windowRef.nativeWindow.location.host +
      this.EXPLORE_PAGE_PREFIX + this.explorationId);
  }

  reassignRole(
      username: string,
      newRole: string,
      oldRole: string
  ): void {
    this.alertsService.clearWarnings();
    const modalRef: NgbModalRef = this.ngbModal
      .open(ReassignRoleConfirmationModalComponent, {
        backdrop: true,
      });
    modalRef.componentInstance.username = username;
    modalRef.componentInstance.newRole = newRole;
    modalRef.componentInstance.oldRole = oldRole;

    modalRef.result.then(() => {
      this.explorationRightsService.saveRoleChanges(
        username, newRole);
      this.closeRolesForm();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is
      // clicked. No further action is needed.
    });
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.explorationTagsService.onExplorationPropertyChanged
        .subscribe(
          () => {
            this.explorationTags = (
              this.explorationTagsService.displayed as string[]);
          }
        )
    );

    this.directiveSubscriptions.add(
      this.routerService.onRefreshSettingsTab.subscribe(
        () => {
          // TODO(#15473): Remove this delay after this has been
          // migrated to Angular 2+.
          setTimeout(()=>{
            this.refreshSettingsTab();
          }, 500);
        }
      )
    );

    this.directiveSubscriptions.add(
      this.userExplorationPermissionsService.onUserExplorationPermissionsFetched
        .subscribe(
          () => {
            this.userExplorationPermissionsService.getPermissionsAsync()
              .then((permissions) => {
                this.canUnpublish = permissions.canUnpublish;
                this.canReleaseOwnership = permissions.canReleaseOwnership;
              });
          }
        )
    );

    this.EXPLORATION_TITLE_INPUT_FOCUS_LABEL = (
      ExplorationEditorPageConstants.EXPLORATION_TITLE_INPUT_FOCUS_LABEL);

    this.CATEGORY_LIST_FOR_SELECT2 = [];

    for (var i = 0; i < AppConstants.ALL_CATEGORIES.length; i++) {
      this.CATEGORY_LIST_FOR_SELECT2.push({
        id: AppConstants.ALL_CATEGORIES[i],
        text: AppConstants.ALL_CATEGORIES[i]
      });
    }
    this.isRolesFormOpen = false;
    this.isVoiceoverFormOpen = false;
    this.rolesSaveButtonEnabled = false;
    this.errorMessage = '';
    this.basicSettingIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.advancedFeaturesIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.rolesCardIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.permissionsCardIsShown = (
      !this.windowDimensionsService.isWindowNarrow());
    this.feedbackCardIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.controlsCardIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.voiceArtistsCardIsShown = (
      !this.windowDimensionsService.isWindowNarrow());

    this.TAG_REGEX = AppConstants.TAG_REGEX;
    this.canDelete = false;
    this.canModifyRoles = false;
    this.canReleaseOwnership = false;
    this.canUnpublish = false;
    this.canManageVoiceArtist = false;
    this.explorationId = this.explorationDataService.explorationId;
    this.loggedInUser = null;

    this.userService.getUserInfoAsync().then((userInfo) => {
      this.loggedInUser = userInfo.getUsername();
      this.isSuperAdmin = userInfo.isSuperAdmin();
    });

    this.userExplorationPermissionsService.getPermissionsAsync()
      .then((permissions) => {
        this.canDelete = permissions.canDelete;
        this.canModifyRoles = permissions.canModifyRoles;
        this.canReleaseOwnership = permissions.canReleaseOwnership;
        this.canUnpublish = permissions.canUnpublish;
        this.canManageVoiceArtist = permissions.canManageVoiceArtist;
      });

    this.formStyle = JSON.stringify({
      display: 'table-cell',
      width: '16.66666667%',
      'vertical-align': 'top'
    });

    this.filteredChoices = this.CATEGORY_LIST_FOR_SELECT2;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaSettingsTab',
  downgradeComponent({
    component: SettingsTabComponent
  }) as angular.IDirectiveFactory);
