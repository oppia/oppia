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
 * @fileoverview Component for the state name editor section of the state
 * editor.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {AppConstants} from 'app.constants';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateNameService} from 'components/state-editor/state-editor-properties-services/state-name.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {ExternalSaveService} from 'services/external-save.service';
import {RouterService} from 'pages/exploration-editor-page/services/router.service';
import {NormalizeWhitespacePipe} from 'filters/string-utility-filters/normalize-whitespace.pipe';
import {EditabilityService} from 'services/editability.service';

@Component({
  selector: 'oppia-state-name-editor',
  templateUrl: './state-name-editor.component.html',
})
export class StateNameEditorComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  maxLen!: number;
  tmpStateName!: string;
  stateNameEditorIsShown!: boolean;

  constructor(
    public editabilityService: EditabilityService,
    private explorationStatesService: ExplorationStatesService,
    private externalSaveService: ExternalSaveService,
    private focusManagerService: FocusManagerService,
    private normalizeWhitespacePipe: NormalizeWhitespacePipe,
    private routerService: RouterService,
    private stateEditorService: StateEditorService,
    private stateNameService: StateNameService
  ) {}

  openStateNameEditor(): void {
    let stateName = this.stateEditorService.getActiveStateName();
    if (stateName === null) {
      throw new Error('Cannot open state name editor for null state.');
    }
    this.stateNameService.setStateNameEditorVisibility(true);
    this.stateNameService.setStateNameSavedMemento(stateName);
    this.maxLen = AppConstants.MAX_STATE_NAME_LENGTH;
    this.tmpStateName = stateName;
    this.focusManagerService.setFocus('stateNameEditorOpened');
  }

  saveStateName(newStateName: string): boolean {
    let normalizedNewName = this._getNormalizedStateName(newStateName);
    let savedMemento = this.stateNameService.getStateNameSavedMemento();
    if (!this._isNewStateNameValid(normalizedNewName)) {
      return false;
    }
    if (savedMemento === normalizedNewName) {
      this.stateNameService.setStateNameEditorVisibility(false);
      return false;
    } else {
      let stateName = this.stateEditorService.getActiveStateName();
      if (stateName) {
        this.explorationStatesService.renameState(stateName, normalizedNewName);
      }
      this.stateNameService.setStateNameEditorVisibility(false);
      // Save the contents of other open fields.
      this.externalSaveService.onExternalSave.emit();
      this.initStateNameEditor();
      return true;
    }
  }

  saveStateNameAndRefresh(newStateName: string): void {
    const normalizedStateName = this._getNormalizedStateName(newStateName);
    const valid = this.saveStateName(normalizedStateName);

    if (valid) {
      this.routerService.navigateToMainTab(normalizedStateName);
    }
  }

  _isNewStateNameValid(stateName: string): boolean {
    if (stateName === this.stateEditorService.getActiveStateName()) {
      return true;
    }

    return this.explorationStatesService.isNewStateNameValid(stateName, true);
  }

  initStateNameEditor(): void {
    this.stateNameService.init();
  }

  _getNormalizedStateName(newStateName: string): string {
    return this.normalizeWhitespacePipe.transform(newStateName);
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(() => {
        if (
          this.stateNameService.isStateNameEditorShown() &&
          !this.explorationStatesService.isNewStateNameDuplicate(
            this.tmpStateName
          )
        ) {
          this.saveStateName(this.tmpStateName);
        }
      })
    );

    this.stateNameService.init();
    this.stateNameEditorIsShown = false;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
