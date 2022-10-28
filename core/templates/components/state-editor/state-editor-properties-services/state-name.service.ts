// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A data service that stores the current state name.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateNameService {
  private stateNameEditorIsShown: boolean = false;
  private savedMemento: string | null = null;

  /**
   * @return {boolean} Whether the state name editor is shown.
   */
  isStateNameEditorShown(): boolean {
    return this.stateNameEditorIsShown;
  }

  /**
   * @param {boolean} value - Visibility of the state name editor to be set to.
   */
  setStateNameEditorVisibility(value: boolean): void {
    this.stateNameEditorIsShown = value;
  }

  /**
   * @param {string} value - Memento of the state name to be set to.
   */
  setStateNameSavedMemento(stateName: string | null): void {
    this.savedMemento = stateName;
  }

  /**
   * @return {string} The state name's saved memento.
   */
  getStateNameSavedMemento(): string | null {
    return this.savedMemento;
  }

  init(): void {
    this.setStateNameSavedMemento(null);
    this.setStateNameEditorVisibility(false);
  }
}

angular.module('oppia').factory(
  'StateNameService', downgradeInjectable(StateNameService));
