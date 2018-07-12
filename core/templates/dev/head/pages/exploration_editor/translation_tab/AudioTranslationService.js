// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that maintains a record of which language
 * in the translation tab is currently active.
 */

oppia.factory('AudioTranslationService', [
  '$q', 'AssetsBackendApiService', 'ExplorationContextService',
  function($q, AssetsBackendApiService, ExplorationContextService){
  var _load = function(filename, successCallback, errorCallback) {
    AssetsBackendApiService.loadAudio(
      ExplorationContextService.getExplorationId(), filename)
        .then(function(loadedAudiofile) {
          successCallback(loadedAudiofile);
        }, function(reason) {
            errorCallback(reason);
        });
   };

  var _upload = function(filename, audioFile, successCallback, errorCallback) {
    console.log("asdasdasdasd", audioFile);
   AssetsBackendApiService.saveAudio(
     ExplorationContextService.getExplorationId(), filename, audioFile)
      .then(function(){
        successCallback();
      }, function(errorResponse) {
        errorCallback();
      });
  };

  return {
    load: function(filename) {
      return $q(function(resolve, reject) {
        _load(filename, resolve, reject);
      });
    },
    upload: function(filename, audioFile) {
      return $q(function(resolve, reject) {
        _upload(filename, audioFile, resolve, reject);
      });
    }
  }
}]);
