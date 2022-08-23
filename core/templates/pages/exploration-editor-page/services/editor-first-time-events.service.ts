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
 * @fileoverview A Service registering analytics events for the editor
 * for events which are  only logged when they happen after the editor
 * is opened for the first time for an exploration.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { SiteAnalyticsService } from 'services/site-analytics.service';

@Injectable({
  providedIn: 'root'
})
export class EditorFirstTimeEventsService {
  constructor(private siteAnalyticsService: SiteAnalyticsService) {}
  // The other functions cannot be called until 'initRegisterEvents'
  // is called, 'initRegisterEvents' initializes 'explorationId'.
  explorationId: string = '';
  shouldRegisterEvents: boolean = false;
  alreadyRegisteredEvents = {
    EditorFirstEntryEvent: false,
    FirstOpenContentBoxEvent: false,
    FirstSaveContentEvent: false,
    FirstClickAddInteractionEvent: false,
    FirstSelectInteractionTypeEvent: false,
    FirstSaveInteractionEvent: false,
    FirstSaveRuleEvent: false,
    FirstCreateSecondStateEvent: false
  };

  initRegisterEvents(expId: string): void {
    this.shouldRegisterEvents = true;
    this.explorationId = expId;
  }

  registerEditorFirstEntryEvent(): void {
    if (this.shouldRegisterEvents &&
          !this.alreadyRegisteredEvents.EditorFirstEntryEvent) {
      this.siteAnalyticsService.registerEditorFirstEntryEvent(
        this.explorationId);
      this.alreadyRegisteredEvents.EditorFirstEntryEvent = true;
    }
  }

  registerFirstOpenContentBoxEvent(): void {
    if (this.shouldRegisterEvents &&
          !this.alreadyRegisteredEvents.FirstOpenContentBoxEvent) {
      this.siteAnalyticsService.registerFirstOpenContentBoxEvent(
        this.explorationId);
      this.alreadyRegisteredEvents.FirstOpenContentBoxEvent = true;
    }
  }

  registerFirstSaveContentEvent(): void {
    if (this.shouldRegisterEvents &&
          !this.alreadyRegisteredEvents.FirstSaveContentEvent) {
      this.siteAnalyticsService.registerFirstSaveContentEvent(
        this.explorationId);
      this.alreadyRegisteredEvents.FirstSaveContentEvent = true;
    }
  }

  registerFirstClickAddInteractionEvent(): void {
    if (this.shouldRegisterEvents &&
          !this.alreadyRegisteredEvents.FirstClickAddInteractionEvent) {
      this.siteAnalyticsService.registerFirstClickAddInteractionEvent(
        this.explorationId);
      this.alreadyRegisteredEvents.FirstClickAddInteractionEvent = true;
    }
  }

  registerFirstSelectInteractionTypeEvent(): void {
    if (this.shouldRegisterEvents &&
          !this.alreadyRegisteredEvents.FirstSelectInteractionTypeEvent) {
      this.siteAnalyticsService.registerFirstSelectInteractionTypeEvent(
        this.explorationId);
      this.alreadyRegisteredEvents.FirstSelectInteractionTypeEvent = true;
    }
  }

  registerFirstSaveInteractionEvent(): void {
    if (this.shouldRegisterEvents &&
          !this.alreadyRegisteredEvents.FirstSaveInteractionEvent) {
      this.siteAnalyticsService.registerFirstSaveInteractionEvent(
        this.explorationId);
      this.alreadyRegisteredEvents.FirstSaveInteractionEvent = true;
    }
  }

  registerFirstSaveRuleEvent(): void {
    if (this.shouldRegisterEvents &&
          !this.alreadyRegisteredEvents.FirstSaveRuleEvent) {
      this.siteAnalyticsService.registerFirstSaveRuleEvent(this.explorationId);
      this.alreadyRegisteredEvents.FirstSaveRuleEvent = true;
    }
  }

  registerFirstCreateSecondStateEvent(): void {
    if (this.shouldRegisterEvents &&
          !this.alreadyRegisteredEvents.FirstCreateSecondStateEvent) {
      this.siteAnalyticsService.registerFirstCreateSecondStateEvent(
        this.explorationId);
      this.alreadyRegisteredEvents.FirstCreateSecondStateEvent = true;
    }
  }
}

angular.module('oppia').factory(
  'EditorFirstTimeEventsService',
  downgradeInjectable(EditorFirstTimeEventsService));
