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
 * @fileoverview Standalone services for the general state editor page.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';

import { AlertsService } from 'services/alerts.service';
import { UtilsService } from 'services/utils.service';

@Injectable({
  providedIn: 'root'
})
export class StatePropertyService {
  // The name of the setter method in ExplorationStatesService for this
  // property. THIS MUST BE SPECIFIED BY SUBCLASSES.
  setterMethodKey: string;
  // TODO(#7165): Replace 'any' with the exact type. This has been kept
  // as any since type of displayed depends on the property for which the
  // value is provided. We need to create different domain objects for
  // various properties and decide type of displayed according to that.
  displayed: any;
  stateName: string;
  // TODO(#7165): Replace 'any' with the exact type. This has been kept
  // as any since type of savedMemento depends on the property for which the
  // value is provided. We need to create different domain objects for
  // various properties and decide type of savedMemento according to that.
  savedMemento: any;

  constructor(private alertsService: AlertsService,
    private utilsService: UtilsService) {
    this.setterMethodKey = null;
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept
  // as any since type of value depends on the property for which the
  // value is provided. We need to create different domain objects for
  // various properties and decide type of value according to that.
  init(stateName: string, value: any): void {
    if (this.setterMethodKey === null) {
      throw 'State property setter method key cannot be null.';
    }
    // The name of the state.
    this.stateName = stateName;
    // The current value of the property (which may not have been saved to
    // the frontend yet). In general, this will be bound directly to the UI.
    this.displayed = cloneDeep(value);
    // The previous (saved-in-the-frontend) value of the property. Here,
    // 'saved' means that this is the latest value of the property as
    // determined by the frontend change list.
    this.savedMemento = cloneDeep(value);
  }

  // Returns whether the current value has changed from the memento.
  hasChanged(): boolean {
    return !this.utilsService.isEquivalent(this.savedMemento, this.displayed);
  }

  // Transforms the given value into a normalized form. THIS CAN BE
  // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
  // TODO(#7165): Replace 'any' with the exact type. This has been kept
  // as any since type of value depends on the property for which the
  // value is provided. We need to create different domain objects for
  // various properties and decide type of value according to that.
  _normalize(value: any): any {
    return value;
  }

  // Validates the given value and returns a boolean stating whether it
  // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
  // behavior is to always return true.
  // TODO(#7165): Replace 'any' with the exact type. This has been kept
  // as any since type of value depends on the property for which the
  // value is provided. We need to create different domain objects for
  // various properties and decide type of value according to that.
  _isValid(value: any): boolean {
    return true;
  }

  saveDisplayedValue(): void {
    if (this.setterMethodKey === null) {
      throw 'State property setter method key cannot be null.';
    }

    this.displayed = this._normalize(this.displayed);
    if (!this._isValid(this.displayed) || !this.hasChanged()) {
      this.restoreFromMemento();
      return;
    }

    if (this.utilsService.isEquivalent(this.displayed, this.savedMemento)) {
      return;
    }

    this.alertsService.clearWarnings();

    this.savedMemento = cloneDeep(this.displayed);
  }

  // Reverts the displayed value to the saved memento.
  restoreFromMemento(): void {
    this.displayed = cloneDeep(this.savedMemento);
  }
}

angular.module('oppia').factory(
  'StatePropertyService', downgradeInjectable(
    StatePropertyService));
