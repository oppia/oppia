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
 * @fileoverview Service to get and set active content id in translation tab.
 */

import { EventEmitter } from '@angular/core';

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-recorded-voiceovers.service.ts');

angular.module('oppia').factory('TranslationTabActiveContentIdService', [
  'StateRecordedVoiceoversService',
  function(StateRecordedVoiceoversService) {
    var activeContentId = null;
    var activeDataFormat = null;
    var _activeContentIdChangedEventEmitter = new EventEmitter();
    return {
      getActiveContentId: function() {
        return activeContentId;
      },
      getActiveDataFormat: function() {
        return activeDataFormat;
      },
      setActiveContent: function(contentId, dataFormat) {
        var allContentIds = (
          StateRecordedVoiceoversService.displayed.getAllContentIds());
        if (allContentIds.indexOf(contentId) === -1) {
          throw new Error('Invalid active content id: ' + contentId);
        }
        activeContentId = contentId;
        activeDataFormat = dataFormat;
        _activeContentIdChangedEventEmitter.emit(dataFormat);
      },
      get onActiveContentIdChanged() {
        return _activeContentIdChangedEventEmitter;
      }
    };
  }]);
