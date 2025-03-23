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
 * @fileoverview Component for the Editor tab in the exploration editor page.
 */

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {JoyrideService} from 'ngx-joyride';
import cloneDeep from 'lodash/cloneDeep';
import {StateTutorialFirstTimeService} from '../services/state-tutorial-first-time.service';
import {EditabilityService} from 'services/editability.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {ExplorationStatesService} from '../services/exploration-states.service';
import {UserExplorationPermissionsService} from '../services/user-exploration-permissions.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {RouterService} from '../services/router.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {InteractionData} from 'interactions/customization-args-defs';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {AnswerGroup} from 'domain/exploration/AnswerGroupObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {Hint} from 'domain/exploration/hint-object.model';
import {Solution} from 'domain/exploration/SolutionObjectFactory';
import {StateCardIsCheckpointService} from 'components/state-editor/state-editor-properties-services/state-card-is-checkpoint.service';
import {ExplorationInitStateNameService} from '../services/exploration-init-state-name.service';
import {ExplorationWarningsService} from '../services/exploration-warnings.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {StateEditorRefreshService} from '../services/state-editor-refresh.service';
import {LoaderService} from 'services/loader.service';
import {GraphDataService} from '../services/graph-data.service';
import {ExplorationNextContentIdIndexService} from '../services/exploration-next-content-id-index.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {VersionHistoryService} from '../services/version-history.service';
import {VersionHistoryBackendApiService} from '../services/version-history-backend-api.service';
import {ContextService} from 'services/context.service';
import {MisconceptionSkillMap} from 'domain/skill/MisconceptionObjectFactory';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {AlertsService} from 'services/alerts.service';

@Component({
  selector: 'oppia-exploration-editor-tab',
  templateUrl: './exploration-editor-tab.component.html',
})
export class ExplorationEditorTabComponent implements OnInit, OnDestroy {
  @Input() explorationIsLinkedToStory: boolean;

  directiveSubscriptions = new Subscription();
  misconceptionsBySkill: MisconceptionSkillMap;
  TabName: string;
  interactionIsShown: boolean;
  _ID_TUTORIAL_STATE_INTERACTION = '#tutorialStateInteraction';
  _ID_TUTORIAL_PREVIEW_TAB = '#tutorialPreviewTab';
  tutorialInProgress: boolean;
  explorationId: string;
  stateName: string;
  index: number = 0;
  validationErrorIsShown: boolean = false;
  joyRideSteps: string[] = [
    'editorTabTourContainer',
    'editorTabTourContentEditorTab',
    'editorTabTourSlideStateInteractionEditorTab',
    'editorTabTourStateResponsesTab',
    'editorTabTourPreviewTab',
    'editorTabTourSaveDraft',
    'editorTabTourTutorialComplete',
  ];

  constructor(
    private editabilityService: EditabilityService,
    private explorationNextContentIdIndexService: ExplorationNextContentIdIndexService,
    private generateContentIdService: GenerateContentIdService,
    private stateTutorialFirstTimeService: StateTutorialFirstTimeService,
    private siteAnalyticsService: SiteAnalyticsService,
    private explorationStatesService: ExplorationStatesService,
    private userExplorationPermissionsService: UserExplorationPermissionsService,
    private stateEditorService: StateEditorService,
    private explorationFeaturesService: ExplorationFeaturesService,
    private routerService: RouterService,
    public stateCardIsCheckpointService: StateCardIsCheckpointService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationWarningsService: ExplorationWarningsService,
    private focusManagerService: FocusManagerService,
    private stateEditorRefreshService: StateEditorRefreshService,
    private loaderService: LoaderService,
    private graphDataService: GraphDataService,
    private joyride: JoyrideService,
    private versionHistoryService: VersionHistoryService,
    private versionHistoryBackendApiService: VersionHistoryBackendApiService,
    private contextService: ContextService,
    private skillBackendApiService: SkillBackendApiService,
    private alertsService: AlertsService
  ) {}

  startTutorial(): void {
    this.tutorialInProgress = true;
    this.joyride
      .startTour({
        steps: this.joyRideSteps,
        stepDefaultPosition: 'top',
        themeColor: '#212f23',
      })
      .subscribe(
        value => {
          // This code make the joyride visible over navbar
          // by overriding the properties of joyride-step__holder class.
          document.querySelector<HTMLElement>(
            '.joyride-step__holder'
          ).style.zIndex = '1020';

          document.querySelector<HTMLElement>(
            '.joyride-step__counter'
          ).tabIndex = 0;

          document
            .querySelector<HTMLElement>('.e2e-test-joyride-title')
            .focus();

          if (value.number === 2) {
            $('html, body').animate(
              {
                scrollTop: true ? 0 : 20,
              },
              1000
            );

            document.querySelector<HTMLElement>(
              '.joyride-step__counter'
            ).tabIndex = 0;

            document
              .querySelector<HTMLElement>('.e2e-test-joyride-title')
              .focus();
          }

          if (value.number === 4) {
            let idToScrollTo = true
              ? this._ID_TUTORIAL_PREVIEW_TAB
              : this._ID_TUTORIAL_STATE_INTERACTION;

            $('html, body').animate(
              {
                scrollTop:
                  document.getElementById(idToScrollTo)?.offsetTop - 200,
              },
              1000
            );

            document.querySelector<HTMLElement>(
              '.joyride-step__counter'
            ).tabIndex = 0;

            document
              .querySelector<HTMLElement>('.e2e-test-joyride-title')
              .focus();
          }

          if (value.number === 6) {
            let idToScrollTo = true
              ? this._ID_TUTORIAL_PREVIEW_TAB
              : this._ID_TUTORIAL_STATE_INTERACTION;

            $('html, body').animate(
              {
                scrollTop:
                  document.getElementById(idToScrollTo)?.offsetTop - 200,
              },
              1000
            );

            document.querySelector<HTMLElement>(
              '.joyride-step__counter'
            ).tabIndex = 0;

            document
              .querySelector<HTMLElement>('.e2e-test-joyride-title')
              .focus();
          }
        },
        () => {},
        () => {
          this.siteAnalyticsService.registerFinishTutorialEvent(
            this.explorationId
          );
          this.leaveTutorial();
        }
      );
  }

  // // Remove save from tutorial if user does not has edit rights for
  // // exploration since in that case Save Draft button will not be
  // // visible on the create page.
  removeTutorialSaveButtonIfNoPermissions(): void {
    this.userExplorationPermissionsService
      .getPermissionsAsync()
      .then(permissions => {
        if (!permissions.canEdit) {
          this.joyRideSteps = [
            'editorTabTourContainer',
            'editorTabTourContentEditorTab',
            'editorTabTourSlideStateInteractionEditorTab',
            'editorTabTourStateResponsesTab',
            'editorTabTourPreviewTab',
            'editorTabTourTutorialComplete',
          ];
        }
      });
  }

  leaveTutorial(): void {
    this.joyride.closeTour();
    this.editabilityService.onEndTutorial();
    this.stateTutorialFirstTimeService.markEditorTutorialFinished();
    this.tutorialInProgress = false;
  }

  saveInteractionData(displayedValue: InteractionData): void {
    this.explorationStatesService.saveInteractionId(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(displayedValue.interactionId)
    );
    this.stateEditorService.setInteractionId(
      cloneDeep(displayedValue.interactionId)
    );

    this.explorationStatesService.saveInteractionCustomizationArgs(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(displayedValue.customizationArgs)
    );
    this.stateEditorService.setInteractionCustomizationArgs(
      cloneDeep(displayedValue.customizationArgs)
    );
  }

  saveInteractionAnswerGroups(newAnswerGroups: AnswerGroup[]): void {
    this.explorationStatesService.saveInteractionAnswerGroups(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(newAnswerGroups)
    );

    this.stateEditorService.setInteractionAnswerGroups(
      cloneDeep(newAnswerGroups)
    );
    this.recomputeGraph();
  }

  saveInteractionDefaultOutcome(newOutcome: Outcome): void {
    this.explorationStatesService.saveInteractionDefaultOutcome(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(newOutcome)
    );

    this.stateEditorService.setInteractionDefaultOutcome(cloneDeep(newOutcome));
    this.recomputeGraph();
  }

  saveNextContentIdIndex(): void {
    this.explorationNextContentIdIndexService.saveDisplayedValue();
  }

  saveSolution(displayedValue: Solution | SubtitledHtml): void {
    this.explorationStatesService.saveSolution(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(displayedValue) as SubtitledHtml
    );

    this.stateEditorService.setInteractionSolution(
      cloneDeep(displayedValue) as Solution
    );
  }

  saveHints(displayedValue: Hint[]): void {
    this.explorationStatesService.saveHints(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(displayedValue)
    );

    this.stateEditorService.setInteractionHints(cloneDeep(displayedValue));
  }

  saveSolicitAnswerDetails(displayedValue: boolean): void {
    this.explorationStatesService.saveSolicitAnswerDetails(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(displayedValue)
    );

    this.stateEditorService.setSolicitAnswerDetails(cloneDeep(displayedValue));
  }

  navigateToState(stateName: string): void {
    this.routerService.navigateToMainTab(stateName);
  }

  areParametersEnabled(): boolean {
    return this.explorationFeaturesService.areParametersEnabled();
  }

  onChangeCardIsCheckpoint(): void {
    let displayedValue = this.stateCardIsCheckpointService.displayed;
    this.explorationStatesService.saveCardIsCheckpoint(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(displayedValue)
    );
    this.stateEditorService.setCardIsCheckpoint(cloneDeep(displayedValue));
    this.stateCardIsCheckpointService.saveDisplayedValue();
  }

  isEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  getStateContentPlaceholder(): string {
    if (
      this.stateEditorService.getActiveStateName() ===
      this.explorationInitStateNameService.savedMemento
    ) {
      return (
        'This is the first card of your exploration. Use this space ' +
        'to introduce your topic and engage the learner, then ask ' +
        'them a question.'
      );
    } else {
      return 'You can speak to the learner here, then ask them a question.';
    }
  }

  getStateContentSaveButtonPlaceholder(): string {
    return 'Save Content';
  }

  addState(newStateName: string): void {
    this.explorationStatesService.addState(newStateName, null);
  }

  refreshWarnings(): void {
    this.explorationWarningsService.updateWarnings();
  }

  getLastEditedVersionNumberInCaseOfError(): number {
    return this.versionHistoryService.fetchedStateVersionNumbers[
      this.versionHistoryService.getCurrentPositionInStateVersionHistoryList()
    ];
  }

  populateMisconceptionsForState(skillId: string): void {
    this.misconceptionsBySkill = {};
    this.skillBackendApiService.fetchSkillAsync(skillId).then(
      skillResponse => {
        this.misconceptionsBySkill[skillResponse.skill.getId()] =
          skillResponse.skill.getMisconceptions();
        this.stateEditorService.setMisconceptionsBySkill(
          this.misconceptionsBySkill
        );
        this.stateEditorService.onUpdateMisconceptions.emit();
      },
      error => {
        this.alertsService.addWarning(error);
      }
    );
  }

  initStateEditor(): void {
    this.stateName = this.stateEditorService.getActiveStateName();
    this.stateEditorService.setStateNames(
      this.explorationStatesService.getStateNames()
    );
    this.stateEditorService.setInQuestionMode(false);

    let stateData = this.explorationStatesService.getState(this.stateName);
    if (stateData && stateData.linkedSkillId) {
      this.populateMisconceptionsForState(stateData.linkedSkillId);
    }

    if (this.stateName && stateData) {
      // This.stateEditorService.checkEventListenerRegistrationStatus()
      // returns true if the event listeners of the state editor child
      // components have been registered.
      // In this case 'stateEditorInitialized' is broadcasted so that:
      // 1. state-editor directive can initialise the child
      //    components of the state editor.
      // 2. state-interaction-editor directive can initialise the
      //    child components of the interaction editor.

      if (
        this.stateEditorService.checkEventListenerRegistrationStatus() &&
        this.explorationStatesService.isInitialized()
      ) {
        let stateData = this.explorationStatesService.getState(this.stateName);
        this.stateEditorService.onStateEditorInitialized.emit(stateData);
      }

      let content = this.explorationStatesService.getStateContentMemento(
        this.stateName
      );
      if (content.html || stateData.interaction.id) {
        this.interactionIsShown = true;
      }

      this.versionHistoryService.resetStateVersionHistory();
      this.validationErrorIsShown = false;
      this.versionHistoryService.insertStateVersionHistoryData(
        this.versionHistoryService.getLatestVersionOfExploration(),
        stateData,
        ''
      );

      if (this.versionHistoryService.getLatestVersionOfExploration() !== null) {
        this.versionHistoryBackendApiService
          .fetchStateVersionHistoryAsync(
            this.contextService.getExplorationId(),
            stateData.name,
            this.versionHistoryService.getLatestVersionOfExploration()
          )
          .then(response => {
            if (response !== null) {
              this.versionHistoryService.insertStateVersionHistoryData(
                response.lastEditedVersionNumber,
                response.stateInPreviousVersion,
                response.lastEditedCommitterUsername
              );
            } else {
              this.validationErrorIsShown = true;
            }
          });
      }

      this.loaderService.hideLoadingScreen();
      // $timeout is used to ensure that focus acts only after
      // element is visible in DOM.
      setTimeout(() => this.windowOnload(), 100);
    }

    if (this.editabilityService.inTutorialMode()) {
      this.startTutorial();
    }
  }

  windowOnload(): void {
    this.TabName = this.routerService.getActiveTabName();
    if (this.TabName === 'main') {
      this.focusManagerService.setFocus('oppiaEditableSection');
    }
    if (this.TabName === 'feedback') {
      this.focusManagerService.setFocus('newThreadButton');
    }
    if (this.TabName === 'history') {
      this.focusManagerService.setFocus('usernameInputField');
    }
  }

  recomputeGraph(): void {
    this.graphDataService.recompute();
  }

  saveStateContent(displayedValue: SubtitledHtml): void {
    this.explorationStatesService.saveStateContent(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(displayedValue)
    );
    // Show the interaction when the text content is saved, even if no
    // content is entered.
    this.interactionIsShown = true;
  }

  saveLinkedSkillId(displayedValue: string): void {
    this.explorationStatesService.saveLinkedSkillId(
      this.stateEditorService.getActiveStateName(),
      cloneDeep(displayedValue)
    );

    this.stateEditorService.setLinkedSkillId(cloneDeep(displayedValue));
    if (this.stateEditorService.getLinkedSkillId()) {
      this.populateMisconceptionsForState(
        this.stateEditorService.getLinkedSkillId()
      );
    }
    this.stateEditorService.onChangeLinkedSkillId.emit();
  }

  saveInapplicableSkillMisconceptionIds(displayedValue: string[]): void {
    this.stateEditorService.setInapplicableSkillMisconceptionIds(
      cloneDeep(displayedValue)
    );
    this.explorationStatesService.saveInapplicableSkillMisconceptionIds(
      this.stateEditorService.getActiveStateName(),
      displayedValue
    );
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.stateEditorRefreshService.onRefreshStateEditor.subscribe(() => {
        this.initStateEditor();
      })
    );

    this.explorationStatesService.registerOnStatesChangedCallback(() => {
      if (this.explorationStatesService.getStates()) {
        this.stateEditorService.setStateNames(
          this.explorationStatesService.getStateNames()
        );
      }
    });

    this.interactionIsShown = false;
    this.removeTutorialSaveButtonIfNoPermissions();
    this.generateContentIdService.init(
      () => {
        let indexToUse = this.explorationNextContentIdIndexService.displayed;
        this.explorationNextContentIdIndexService.displayed += 1;
        return indexToUse;
      },
      () => {
        this.explorationNextContentIdIndexService.restoreFromMemento();
      }
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
