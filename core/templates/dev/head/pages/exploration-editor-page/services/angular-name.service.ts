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
 * @fileoverview A service that maps IDs to Angular names.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class AngularNameService {
  static angularName: string = null;

  getNameOfInteractionRulesService(interactionId: string): string {
    AngularNameService.angularName = interactionId.charAt(0) +
    interactionId.slice(1) + 'RulesService';
    return AngularNameService.angularName;
  }
}

angular.module('oppia').factory(
  'AngularNameService', downgradeInjectable(AngularNameService));
