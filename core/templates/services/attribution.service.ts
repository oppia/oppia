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
 * @fileoverview Service to handle the attribution experience.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ContextService } from 'services/context.service';

@Injectable({
  providedIn: 'root'
})
export class AttributionService {
  attributionModalIsShown: boolean = false;
  constructor(private contextService: ContextService) {}

  isGenerateAttributionAllowed(): boolean {
    return this.contextService.isInExplorationPlayerPage();
  }

  showAttributionModal(): void {
    this.attributionModalIsShown = true;
    console.log('done');
  }

  hideAttributionModal(): void {
    this.attributionModalIsShown = false;
  }

  getAttributionInPrint(): void {
    
  }
}

angular.module('oppia').factory(
  'AttributionService', downgradeInjectable(AttributionService));
