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
 * @fileoverview Service for initializing guppy instances.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

class GuppyObject {
  divId = null;
  guppyInstance = null;
  constructor(divId: string, guppyInstance: Guppy) {
    this.divId = divId;
    this.guppyInstance = guppyInstance;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GuppyInitializationService {
  private guppyInstances: Array<GuppyObject> = [];

  init(guppyDivClassName: string): void {
    let guppyDivs = document.querySelectorAll('.' + guppyDivClassName);
    let divId, guppyInstance;
    for (let i = 0; i < guppyDivs.length; i++) {
      divId = 'guppy_' + Math.floor(Math.random() * 100000000);
      // Dynamically assigns a unique id to the guppy div.
      guppyDivs[i].setAttribute('id', divId);
      // Create a new guppy instance for that div.
      guppyInstance = new Guppy(divId, {});
      this.guppyInstances.push(new GuppyObject(divId, guppyInstance));
    }
  }

  findActiveGuppyObject(): GuppyObject | undefined {
    let activeId = $('.guppy_active').attr('id');
    for (let guppyObject of this.guppyInstances) {
      if (guppyObject.divId === activeId) {
        return guppyObject;
      }
    }
  }
}

angular.module('oppia').factory(
  'GuppyInitializationService',
  downgradeInjectable(GuppyInitializationService));
