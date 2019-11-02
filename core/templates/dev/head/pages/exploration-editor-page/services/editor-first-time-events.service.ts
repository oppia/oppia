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

import {SiteAnalyticsService} from '../../../services/SiteAnalyticsService';
import {downgradeInjectable} from '@angular/upgrade/static';
import {WindowDimensionsService} from '../../../services/contextual/WindowDimensionsService';

/**
 * @fileoverview A Service registering analytics events for the editor
 * for events which are  only logged when they happen after the editor
 * is opened for the first time for an exploration.
 */

require('services/SiteAnalyticsService.ts');


export class EditorFirstTimeEventsService {
  constructor(private siteAnalyticsService: SiteAnalyticsService) {}

    explorationId = null;
    shouldRegisterEvents = false;
    alreadyRegisteredEvents = {
      EditorFirstEntryEvent: null,
      FirstOpenContentBoxEvent: null,
      FirstSaveContentEvent: null,
      FirstClickAddInteractionEvent: null,
      FirstSelectInteractionTypeEvent: null,
      FirstSaveInteractionEvent: null,
      FirstSaveRuleEvent: null,
      FirstCreateSecondStateEvent: null
    };

    initRegisterEvents(expId) {
      this.shouldRegisterEvents = true;
      this.explorationId = expId;
    }

    registerEditorFirstEntryEvent() {
      if (this.shouldRegisterEvents &&
            this.alreadyRegisteredEvents.EditorFirstEntryEvent === null) {
        this.siteAnalyticsService.registerEditorFirstEntryEvent(
          this.explorationId);
        this.alreadyRegisteredEvents.EditorFirstEntryEvent = true;
      }
    }

    registerFirstOpenContentBoxEvent() {
      if (this.shouldRegisterEvents &&
            this.alreadyRegisteredEvents.FirstOpenContentBoxEvent === null) {
        this.siteAnalyticsService.registerFirstOpenContentBoxEvent(
          this.explorationId);
        this.alreadyRegisteredEvents.FirstOpenContentBoxEvent = true;
      }
    }

    registerFirstSaveContentEvent() {
      if (this.shouldRegisterEvents &&
            this.alreadyRegisteredEvents.FirstSaveContentEvent === null) {
        this.siteAnalyticsService.registerFirstSaveContentEvent(explorationId);
        this.alreadyRegisteredEvents.FirstSaveContentEvent = true;
      }
    }

    registerFirstClickAddInteractionEvent() {
      if (this.shouldRegisterEvents &&
            this.alreadyRegisteredEvents.FirstClickAddInteractionEvent ===
          null) {
        this.siteAnalyticsService.registerFirstClickAddInteractionEvent(
          this.explorationId);
        this.alreadyRegisteredEvents.FirstClickAddInteractionEvent = true;
      }
    }

    registerFirstSelectInteractionTypeEvent() {
      if (this.shouldRegisterEvents &&
            this.alreadyRegisteredEvents.FirstSelectInteractionTypeEvent ===
          null) {
        this.siteAnalyticsService.registerFirstSelectInteractionTypeEvent(
          this.explorationId);
        this.alreadyRegisteredEvents.FirstSelectInteractionTypeEvent = true;
      }
    }

    registerFirstSaveInteractionEvent() {
      if (this.shouldRegisterEvents &&
            this.alreadyRegisteredEvents.FirstSaveInteractionEvent === null) {
        this.siteAnalyticsService.registerFirstSaveInteractionEvent(
          this.explorationId);
        this.alreadyRegisteredEvents.FirstSaveInteractionEvent = true;
      }
    }

    registerFirstSaveRuleEvent() {
      if (this.shouldRegisterEvents &&
            this.alreadyRegisteredEvents.FirstSaveRuleEvent === null) {
        this.siteAnalyticsService.registerFirstSaveRuleEvent(
          this.explorationId);
        this.alreadyRegisteredEvents.FirstSaveRuleEvent = true;
      }
    }

    registerFirstCreateSecondStateEvent() {
      if (this.shouldRegisterEvents &&
            this.alreadyRegisteredEvents.FirstCreateSecondStateEvent === null) {
        this.siteAnalyticsService.registerFirstCreateSecondStateEvent(
          this.explorationId);
        this.alreadyRegisteredEvents.FirstCreateSecondStateEvent = true;
      }
    }
}

angular.module('oppia').factory(
  'EditorFirstTimeEventsService',
  downgradeInjectable(EditorFirstTimeEventsService));
