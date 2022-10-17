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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { JoyrideService } from 'ngx-joyride';
import cloneDeep from 'lodash/cloneDeep';
import { MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-all-audio-and-translations-as-needing-update-modal.component';
import { StateTutorialFirstTimeService } from '../services/state-tutorial-first-time.service';
import { EditabilityService } from 'services/editability.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { UserExplorationPermissionsService } from '../services/user-exploration-permissions.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { RouterService } from '../services/router.service';
import { ExplorationFeaturesService } from 'services/exploration-features.service';
import { InteractionCustomizationArgs } from 'interactions/customization-args-defs';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { Hint } from 'domain/exploration/HintObjectFactory';
import { Solution } from 'domain/exploration/SolutionObjectFactory';
import { StateCardIsCheckpointService } from 'components/state-editor/state-editor-properties-services/state-card-is-checkpoint.service';
import { ExplorationInitStateNameService } from '../services/exploration-init-state-name.service';
import { ExplorationWarningsService } from '../services/exploration-warnings.service';
import { ExplorationCorrectnessFeedbackService } from '../services/exploration-correctness-feedback.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { StateEditorRefreshService } from '../services/state-editor-refresh.service';
import { LoaderService } from 'services/loader.service';
import { GraphDataService } from '../services/graph-data.service';

@Component({
  selector: 'oppia-exploration-editor-tab',
  templateUrl: './exploration-editor-tab.component.html'
})
export class ExplorationEditorTabComponent
    implements OnInit, OnDestroy {
    @Input() explorationIsLinkedToStory: boolean;

    directiveSubscriptions = new Subscription();
    TabName: string;
    interactionIsShown: boolean;
    _ID_TUTORIAL_STATE_INTERACTION = '#tutorialStateInteraction';
    _ID_TUTORIAL_PREVIEW_TAB = '#tutorialPreviewTab';
    tutorialInProgress: boolean;
    explorationId: string;
    stateName: string;
    index: number = 0;
    joyRideSteps: string[] = [
      'editorTabTourContainer',
      'editorTabTourContentEditorTab',
      'editorTabTourSlideStateInteractionEditorTab',
      'editorTabTourStateResponsesTab',
      'editorTabTourPreviewTab',
      'editorTabTourSaveDraft',
      'editorTabTourTutorialComplete'
    ];

    constructor(
     private editabilityService: EditabilityService,
     private stateTutorialFirstTimeService: StateTutorialFirstTimeService,
     private siteAnalyticsService: SiteAnalyticsService,
     private explorationStatesService: ExplorationStatesService,
     private userExplorationPermissionsService:
       UserExplorationPermissionsService,
     private stateEditorService: StateEditorService,
     private explorationFeaturesService: ExplorationFeaturesService,
     private routerService: RouterService,
     private ngbModal: NgbModal,
     private stateCardIsCheckpointService: StateCardIsCheckpointService,
     private explorationInitStateNameService: ExplorationInitStateNameService,
     private explorationWarningsService: ExplorationWarningsService,
     private explorationCorrectnessFeedbackService:
       ExplorationCorrectnessFeedbackService,
     private focusManagerService: FocusManagerService,
     private stateEditorRefreshService: StateEditorRefreshService,
     private loaderService: LoaderService,
     private graphDataService: GraphDataService,
     private joyride: JoyrideService,
    ) { }

    startTutorial(): void {
      this.tutorialInProgress = true;
      this.joyride.startTour(
        { steps: this.joyRideSteps,
          stepDefaultPosition: 'top',
          themeColor: '#212f23'
        }
      ).subscribe(
        (value) => {
          // This code make the joyride visible over navbar
          // by overriding the properties of joyride-step__holder class.
          document.querySelector<HTMLElement>(
            '.joyride-step__holder').style.zIndex = '1007';

          if (value.number === 2) {
            $('html, body').animate({
              scrollTop: (true ? 0 : 20)
            }, 1000);
          }

          if (value.number === 4) {
            let idToScrollTo = (
             true ? this._ID_TUTORIAL_PREVIEW_TAB :
             this._ID_TUTORIAL_STATE_INTERACTION);

            $('html, body').animate({
              scrollTop: document.getElementById(idToScrollTo)?.offsetTop - 200
            }, 1000);
          }

          if (value.number === 6) {
            let idToScrollTo = (
             true ? this._ID_TUTORIAL_PREVIEW_TAB :
             this._ID_TUTORIAL_STATE_INTERACTION);

            $('html, body').animate({
              scrollTop: document.getElementById(idToScrollTo)?.offsetTop - 200
            }, 1000);
          }
        },
        () => {},
        () => {
          this.siteAnalyticsService.registerFinishTutorialEvent(
            this.explorationId);
          this.leaveTutorial();
        },
      );
    }

    // // Remove save from tutorial if user does not has edit rights for
    // // exploration since in that case Save Draft button will not be
    // // visible on the create page.
    removeTutorialSaveButtonIfNoPermissions(): void {
      this.userExplorationPermissionsService.getPermissionsAsync()
        .then((permissions) => {
          if (!permissions.canEdit) {
            this.joyRideSteps = [
              'editorTabTourContainer',
              'editorTabTourContentEditorTab',
              'editorTabTourSlideStateInteractionEditorTab',
              'editorTabTourStateResponsesTab',
              'editorTabTourPreviewTab',
              'editorTabTourTutorialComplete'
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

    saveInteractionId(displayedValue: string): void {
      this.explorationStatesService.saveInteractionId(
        this.stateEditorService.getActiveStateName(),
        cloneDeep(displayedValue));
      this.stateEditorService.setInteractionId(cloneDeep(displayedValue));
    }

    saveInteractionAnswerGroups(newAnswerGroups: AnswerGroup[]): void {
      this.explorationStatesService.saveInteractionAnswerGroups(
        this.stateEditorService.getActiveStateName(),
        cloneDeep(newAnswerGroups));

      this.stateEditorService.setInteractionAnswerGroups(
        cloneDeep(newAnswerGroups));
      this.recomputeGraph();
    }

    saveInteractionDefaultOutcome(newOutcome: Outcome): void {
      this.explorationStatesService.saveInteractionDefaultOutcome(
        this.stateEditorService.getActiveStateName(),
        cloneDeep(newOutcome));

      this.stateEditorService.setInteractionDefaultOutcome(
        cloneDeep(newOutcome));
      this.recomputeGraph();
    }

    saveInteractionCustomizationArgs(
        displayedValue: InteractionCustomizationArgs): void {
      this.explorationStatesService.saveInteractionCustomizationArgs(
        this.stateEditorService.getActiveStateName(),
        cloneDeep(displayedValue));

      this.stateEditorService.setInteractionCustomizationArgs(
        cloneDeep(displayedValue));
    }

    saveNextContentIdIndex(displayedValue: number): void {
      this.explorationStatesService.saveNextContentIdIndex(
        this.stateEditorService.getActiveStateName(),
        cloneDeep(displayedValue));
    }

    saveSolution(displayedValue: Solution | SubtitledHtml): void {
      this.explorationStatesService.saveSolution(
        this.stateEditorService.getActiveStateName(),
       cloneDeep(displayedValue) as SubtitledHtml);

      this.stateEditorService.setInteractionSolution(
       cloneDeep(displayedValue) as Solution);
    }

    saveHints(displayedValue: Hint[]): void {
      this.explorationStatesService.saveHints(
        this.stateEditorService.getActiveStateName(),
        cloneDeep(displayedValue));

      this.stateEditorService.setInteractionHints(
        cloneDeep(displayedValue));
    }

    saveSolicitAnswerDetails(displayedValue: boolean): void {
      this.explorationStatesService.saveSolicitAnswerDetails(
        this.stateEditorService.getActiveStateName(),
        cloneDeep(displayedValue));

      this.stateEditorService.setSolicitAnswerDetails(
        cloneDeep(displayedValue));
    }

    showMarkAllAudioAsNeedingUpdateModalIfRequired(
        contentIds: string[]): void {
      let stateName = this.stateEditorService.getActiveStateName();
      let state = this.explorationStatesService.getState(stateName);
      let recordedVoiceovers = state.recordedVoiceovers;
      let writtenTranslations = state.writtenTranslations;
      const shouldPrompt = contentIds.some(contentId => {
        return (
          recordedVoiceovers.hasUnflaggedVoiceovers(contentId) ||
         writtenTranslations.hasUnflaggedWrittenTranslations(contentId));
      });

      if (shouldPrompt) {
        this.ngbModal.open(
          MarkAllAudioAndTranslationsAsNeedingUpdateModalComponent, {
            backdrop: 'static',
          }).result.then(() => {
          contentIds.forEach(contentId => {
            if (recordedVoiceovers.hasUnflaggedVoiceovers(contentId)) {
              recordedVoiceovers.markAllVoiceoversAsNeedingUpdate(
                contentId);
              this.explorationStatesService.saveRecordedVoiceovers(
                stateName, recordedVoiceovers);
            }
            if (writtenTranslations.hasUnflaggedWrittenTranslations(
              contentId)) {
              writtenTranslations.markAllTranslationsAsNeedingUpdate(
                contentId);
              this.explorationStatesService
                .markWrittenTranslationsAsNeedingUpdate(
                  contentId, stateName);
            }
          });
        }, () => {
          // This callback is triggered when the Cancel button is
          // clicked. No further action is needed.
        });
      }
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
        cloneDeep(displayedValue));
      this.stateEditorService.setCardIsCheckpoint(
        cloneDeep(displayedValue));
      this.stateCardIsCheckpointService.saveDisplayedValue();
    }

    isEditable(): boolean {
      return this.editabilityService.isEditable();
    }

    getStateContentPlaceholder(): string {
      if (
        this.stateEditorService.getActiveStateName() ===
       this.explorationInitStateNameService.savedMemento) {
        return (
          'This is the first card of your exploration. Use this space ' +
         'to introduce your topic and engage the learner, then ask ' +
         'them a question.');
      } else {
        return (
          'You can speak to the learner here, then ask them a question.');
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

    initStateEditor(): void {
      this.stateName = this.stateEditorService.getActiveStateName();
      this.stateEditorService.setStateNames(
        this.explorationStatesService.getStateNames());
      this.stateEditorService.setCorrectnessFeedbackEnabled(
       this.explorationCorrectnessFeedbackService.isEnabled() as boolean);
      this.stateEditorService.setInQuestionMode(false);

      let stateData = this.explorationStatesService.getState(this.stateName);

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
       this.explorationStatesService.isInitialized()) {
          let stateData = (
            this.explorationStatesService.getState(this.stateName));
          this.stateEditorService.onStateEditorInitialized.emit(stateData);
        }

        let content = this.explorationStatesService.getStateContentMemento(
          this.stateName);
        if (content.html || stateData.interaction.id) {
          this.interactionIsShown = true;
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
        cloneDeep(displayedValue));
      // Show the interaction when the text content is saved, even if no
      // content is entered.
      this.interactionIsShown = true;
    }

    saveLinkedSkillId(displayedValue: string): void {
      this.explorationStatesService.saveLinkedSkillId(
        this.stateEditorService.getActiveStateName(),
        cloneDeep(displayedValue));

      this.stateEditorService.setLinkedSkillId(cloneDeep(displayedValue));
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
            this.explorationStatesService.getStateNames());
        }
      });

      this.interactionIsShown = false;
      this.removeTutorialSaveButtonIfNoPermissions();
    }

    ngOnDestroy(): void {
      this.directiveSubscriptions.unsubscribe();
    }
}

angular.module('oppia').directive('oppiaExplorationEditorTab',
   downgradeComponent({
     component: ExplorationEditorTabComponent
   }) as angular.IDirectiveFactory);
