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
 * @fileoverview Component for the exploration preview in the
 * editor page.
 */

import {Component, OnInit, OnDestroy} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import isEqual from 'lodash/isEqual';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {ParamChange} from 'domain/exploration/param-change.model';
import {ParamChanges} from 'domain/exploration/param-changes.model';
import {ExplorationEngineService} from 'pages/exploration-player-page/services/exploration-engine.service';
import {
  ExplorationParams,
  LearnerParamsService,
} from 'pages/exploration-player-page/services/learner-params.service';
import {NumberAttemptsService} from 'pages/exploration-player-page/services/number-attempts.service';
import {Subscription} from 'rxjs';
import {PageContextService} from 'services/page-context.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {ExplorationDataService} from '../services/exploration-data.service';
import {ExplorationInitStateNameService} from '../services/exploration-init-state-name.service';
import {ExplorationParamChangesService} from '../services/exploration-param-changes.service';
import {ExplorationStatesService} from '../services/exploration-states.service';
import {GraphDataService} from '../services/graph-data.service';
import {ConversationFlowService} from 'pages/exploration-player-page/services/conversation-flow.service';
import {ParameterMetadataService} from '../services/parameter-metadata.service';
import {RouterService} from '../services/router.service';
import {PreviewSetParametersModalComponent} from './templates/preview-set-parameters-modal.component';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ExplorationChangeEditVoiceovers} from 'domain/exploration/exploration-draft.model';
import {ChangeListService} from '../services/change-list.service';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';
import {Voiceover} from 'domain/exploration/voiceover.model';

@Component({
  selector: 'oppia-preview-tab',
  templateUrl: './preview-tab.component.html',
})
export class PreviewTabComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  previewWarning!: string;
  isExplorationPopulated!: boolean;
  allParams: ExplorationParams | object = {};
  voiceoversAreLoaded: boolean = false;

  constructor(
    private pageContextService: PageContextService,
    private editableExplorationBackendApiService: EditableExplorationBackendApiService,
    private explorationDataService: ExplorationDataService,
    private explorationEngineService: ExplorationEngineService,
    private explorationFeaturesService: ExplorationFeaturesService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationParamChangesService: ExplorationParamChangesService,
    private explorationStatesService: ExplorationStatesService,
    private platformFeatureService: PlatformFeatureService,
    private graphDataService: GraphDataService,
    private learnerParamsService: LearnerParamsService,
    private ngbModal: NgbModal,
    private numberAttemptsService: NumberAttemptsService,
    private parameterMetadataService: ParameterMetadataService,
    private routerService: RouterService,
    private stateEditorService: StateEditorService,
    private entityVoiceoversService: EntityVoiceoversService,
    private conversationFlowService: ConversationFlowService,
    private changeListService: ChangeListService
  ) {}

  getManualParamChanges(
    initStateNameForPreview: string
  ): Promise<ParamChange[]> {
    let unsetParametersInfo =
      this.parameterMetadataService.getUnsetParametersInfo([
        initStateNameForPreview,
      ]);

    let manualParamChanges: ParamChange[] = [];
    for (let i = 0; i < unsetParametersInfo.length; i++) {
      let newParamChange = ParamChange.createEmpty(
        unsetParametersInfo[i].paramName
      );
      manualParamChanges.push(newParamChange);
    }

    if (manualParamChanges.length > 0) {
      this.showSetParamsModal(manualParamChanges, () => {
        return Promise.resolve(manualParamChanges);
      });
    }

    return Promise.resolve([]);
  }

  showParameterSummary(): boolean {
    return (
      this.explorationFeaturesService.areParametersEnabled() &&
      !isEqual({}, this.allParams)
    );
  }

  showSetParamsModal(
    manualParamChanges: ParamChange[],
    callback: Function
  ): void {
    const modalRef = this.ngbModal.open(PreviewSetParametersModalComponent, {
      backdrop: 'static',
      windowClass: 'oppia-preview-set-params-modal',
    });
    modalRef.componentInstance.manualParamChanges = manualParamChanges;
    modalRef.result.then(
      () => {
        if (callback) {
          callback();
        }
      },
      () => {
        this.routerService.navigateToMainTab(null);
      }
    );
  }

  loadPreviewState(
    stateName: string[] | string,
    manualParamChanges: ParamChange[] | string[] | string
  ): void {
    this.explorationEngineService.initSettingsFromEditor(
      stateName as string,
      manualParamChanges as ParamChange[]
    );
    this.isExplorationPopulated = true;
  }

  resetPreview(): void {
    this.previewWarning = '';
    this.isExplorationPopulated = false;
    const initStateNameForPreview =
      this.explorationInitStateNameService.savedMemento;
    setTimeout(() => {
      const explorationId = this.pageContextService.getExplorationId();

      this.editableExplorationBackendApiService
        .fetchApplyDraftExplorationAsync(explorationId)
        .then(returnDict => {
          this.explorationEngineService.init(
            returnDict,
            0,
            null,
            false,
            [],
            [],
            () => {
              this.loadPreviewState(initStateNameForPreview, []);
            }
          );
          this.numberAttemptsService.reset();
        });
    }, 200);
  }

  ngOnInit(): void {
    // This allows the active state to be kept up-to-date whilst
    // navigating in preview mode, ensuring that the state does not
    // change when toggling between editor and preview.
    this.directiveSubscriptions.add(
      this.stateEditorService.onUpdateActiveStateIfInEditor.subscribe(
        stateName => {
          this.stateEditorService.setActiveStateName(stateName);
        }
      )
    );

    this.directiveSubscriptions.add(
      this.conversationFlowService.onPlayerStateChange.subscribe(() => {
        this.allParams = this.learnerParamsService.getAllParams();
      })
    );

    this.isExplorationPopulated = false;

    this.explorationDataService
      .getDataAsync(() => {})
      .then(async explorationData => {
        // TODO(#13564): Remove this part of code and make sure that this
        // function is executed only after the Promise in initExplorationPage
        // is fully finished.
        if (!this.explorationParamChangesService.savedMemento) {
          this.explorationParamChangesService.init(
            ParamChanges.createFromBackendList(explorationData.param_changes)
          );
          this.explorationStatesService.init(explorationData.states, false);
          this.explorationInitStateNameService.init(
            explorationData.init_state_name
          );
          this.graphDataService.recompute();
          let stateName = this.stateEditorService.getActiveStateName();
          if (
            !stateName ||
            !this.explorationStatesService.getState(stateName)
          ) {
            this.stateEditorService.setActiveStateName(
              this.explorationInitStateNameService.displayed as string
            );
          }
        }
        let initStateNameForPreview =
          this.stateEditorService.getActiveStateName();

        // Show a warning message if preview doesn't start from the first
        // state.
        if (
          initStateNameForPreview &&
          initStateNameForPreview !==
            this.explorationInitStateNameService.savedMemento
        ) {
          this.previewWarning =
            'Preview started from "' + initStateNameForPreview + '"';
        } else {
          this.previewWarning = '';
        }

        if (initStateNameForPreview) {
          // Prompt user to enter any unset parameters, then populate
          // exploration.
          this.getManualParamChanges(initStateNameForPreview).then(
            manualParamChanges => {
              if (initStateNameForPreview) {
                this.loadPreviewState(
                  initStateNameForPreview,
                  manualParamChanges
                );
              }
            }
          );
        }

        this.entityVoiceoversService.init(
          this.pageContextService.getExplorationId(),
          'exploration',
          explorationData.version as number,
          explorationData.language_code
        );

        this.entityVoiceoversService.fetchEntityVoiceovers().then(() => {
          this.updateManualVoiceoverWithChangeList();
          this.voiceoversAreLoaded = true;
        });
      });
  }

  updateManualVoiceoverWithChangeList(): void {
    this.changeListService.getVoiceoverChangeList().forEach(changeDict => {
      changeDict = changeDict as ExplorationChangeEditVoiceovers;
      let contentId = changeDict.content_id;
      let voiceovers = changeDict.voiceovers;
      let languageAccentCode = changeDict.language_accent_code;

      let entityVoiceovers =
        this.entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode(
          languageAccentCode
        );
      if (entityVoiceovers === undefined) {
        entityVoiceovers = new EntityVoiceovers(
          this.entityVoiceoversService.entityId,
          this.entityVoiceoversService.entityType,
          this.entityVoiceoversService.entityVersion,
          languageAccentCode,
          {},
          {}
        );
      }

      if (!entityVoiceovers.voiceoversMapping.hasOwnProperty(contentId)) {
        entityVoiceovers.voiceoversMapping[contentId] = {};
      }

      if (voiceovers.hasOwnProperty('manual')) {
        let manualVoiceover = Voiceover.createFromBackendDict(
          voiceovers.manual
        );
        entityVoiceovers.voiceoversMapping[contentId].manual = manualVoiceover;
      } else {
        entityVoiceovers.voiceoversMapping[contentId].manual = undefined;
        if (entityVoiceovers.voiceoversMapping[contentId].auto === undefined) {
          delete entityVoiceovers.voiceoversMapping[contentId];
        }
      }

      this.entityVoiceoversService.addEntityVoiceovers(
        languageAccentCode,
        entityVoiceovers
      );
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  isNewLessonPlayerEnabled(): boolean {
    return this.platformFeatureService.status.NewLessonPlayer.isEnabled;
  }
}
