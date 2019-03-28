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

oppia.factory('EditorFirstTimeEventsService', [
  'SiteAnalyticsService',
  function(SiteAnalyticsService) {
    var explorationId = null;
    var shouldRegisterEvents = false;
    var alreadyRegisteredEvents = {};
    return {
      initRegisterEvents: function(expId) {
        shouldRegisterEvents = true;
        explorationId = expId;
      },
      registerEditorFirstEntryEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty('EditorFirstEntryEvent')) {
          SiteAnalyticsService.registerEditorFirstEntryEvent(explorationId);
          alreadyRegisteredEvents.EditorFirstEntryEvent = true;
        }
      },
      registerFirstOpenContentBoxEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstOpenContentBoxEvent')) {
          SiteAnalyticsService.registerFirstOpenContentBoxEvent(explorationId);
          alreadyRegisteredEvents.FirstOpenContentBoxEvent = true;
        }
      },
      registerFirstSaveContentEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty('FirstSaveContentEvent')) {
          SiteAnalyticsService.registerFirstSaveContentEvent(explorationId);
          alreadyRegisteredEvents.FirstSaveContentEvent = true;
        }
      },
      registerFirstClickAddInteractionEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstClickAddInteractionEvent')) {
          SiteAnalyticsService.registerFirstClickAddInteractionEvent(
            explorationId);
          alreadyRegisteredEvents.FirstClickAddInteractionEvent = true;
        }
      },
      registerFirstSelectInteractionTypeEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstSelectInteractionTypeEvent')) {
          SiteAnalyticsService.registerFirstSelectInteractionTypeEvent(
            explorationId);
          alreadyRegisteredEvents.FirstSelectInteractionTypeEvent = true;
        }
      },
      registerFirstSaveInteractionEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstSaveInteractionEvent')) {
          SiteAnalyticsService.registerFirstSaveInteractionEvent(explorationId);
          alreadyRegisteredEvents.FirstSaveInteractionEvent = true;
        }
      },
      registerFirstSaveRuleEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty('FirstSaveRuleEvent')) {
          SiteAnalyticsService.registerFirstSaveRuleEvent(explorationId);
          alreadyRegisteredEvents.FirstSaveRuleEvent = true;
        }
      },
      registerFirstCreateSecondStateEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstCreateSecondStateEvent')) {
          SiteAnalyticsService.registerFirstCreateSecondStateEvent(
            explorationId);
          alreadyRegisteredEvents.FirstCreateSecondStateEvent = true;
        }
      }
    };
  }
]);
