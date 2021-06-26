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
 * @fileoverview Services for storing exploration properties for
 * displaying and editing them in multiple places in the UI,
 * with base class as ExplorationPropertyService.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Output } from '@angular/core';
import { Injectable } from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';

import { ChangeListService } from 'pages/exploration-editor-page/services/change-list.service';
import { AlertsService } from 'services/alerts.service';
import { LoggerService } from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationPropertyService {
  displayed: string;
  savedMemento: string;

  // The backend name for this property. THIS MUST BE SPECIFIED BY
  // SUBCLASSES.
  propertyName: string = null;

  @Output() _explorationPropertyChangedEventEmitter = new EventEmitter();
  constructor(
    private alertsService: AlertsService,
    private changeListService: ChangeListService,
    private loggerService: LoggerService,
  ) {}

  private BACKEND_CONVERSIONS = {
    param_changes: (paramChanges) => {
      return paramChanges.map(paramChange => {
        return paramChange.toBackendDict();
      });
    },
    param_specs: (paramSpecs) => {
      return paramSpecs.toBackendDict();
    },
  };

  init(value: string): void {
    if (!this.propertyName) {
      throw new Error('Exploration property name cannot be null.');
    }

    this.loggerService.info(
      'Initializing exploration ' + this.propertyName + ': ' + value);

    // The current value of the property (which may not have been saved to
    // the frontend yet). In general, this will be bound directly to the UI.
    this.displayed = cloneDeep(value);

    // The previous (saved-in-the-frontend) value of the property. Here,
    // 'saved' means that this is the latest value of the property as
    // determined by the frontend change list.
    this.savedMemento = cloneDeep(value);

    this._explorationPropertyChangedEventEmitter.emit();
  }

  // Returns whether the current value has changed from the memento.
  hasChanged(): boolean {
    return !angular.equals(this.savedMemento, this.displayed);
  }

  // Transforms the given value into a normalized form. THIS CAN BE
  // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
  _normalize(value: string): string {
    return value;
  }

  // Validates the given value and returns a boolean stating whether it
  // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
  // behavior is to always return true.
  _isValid(value: string): boolean {
    return true;
  }

  // Normalizes the displayed value. Then, if the memento and the displayed
  // value are the same, does nothing. Otherwise, creates a new entry in the
  // change list, and updates the memento to the displayed value.
  saveDisplayedValue(): void {
    if (this.propertyName === null) {
      throw new Error('Exploration property name cannot be null.');
    }

    this.displayed = this._normalize(this.displayed);

    if (!this._isValid(this.displayed) || !this.hasChanged()) {
      this.restoreFromMemento();
      return;
    }

    this.alertsService.clearWarnings();

    let newBackendValue = cloneDeep(this.displayed);
    let oldBackendValue = cloneDeep(this.savedMemento);

    if (this.BACKEND_CONVERSIONS.hasOwnProperty(this.propertyName)) {
      newBackendValue =
        this.BACKEND_CONVERSIONS[this.propertyName](this.displayed);
      oldBackendValue =
        this.BACKEND_CONVERSIONS[this.propertyName](this.savedMemento);
    }

    this.changeListService.editExplorationProperty(
      this.propertyName, newBackendValue, oldBackendValue);
    this.savedMemento = cloneDeep(this.displayed);

    this._explorationPropertyChangedEventEmitter.emit();
  }

  // Reverts the displayed value to the saved memento.
  restoreFromMemento(): void {
    this.displayed = cloneDeep(this.savedMemento);
  }

  get onExplorationPropertyChanged(): EventEmitter<void> {
    return this._explorationPropertyChangedEventEmitter;
  }
}

angular.module('oppia').factory(
  'ExplorationPropertyService', downgradeInjectable(
    ExplorationPropertyService));
