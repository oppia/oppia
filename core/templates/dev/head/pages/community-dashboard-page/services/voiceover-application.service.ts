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
 * @fileoverview A service for handling contribution opportunities in different
 * fields.
 */

angular.module('oppia').factory('VoiceoverApplicationService', [
  '$http', '$q', 'CsrfTokenService', 'UrlInterpolationService',
  function($http, $q, CsrfTokenService, UrlInterpolationService) {
    return {
      getTextToVoiceover: function(expId, languageCode) {
        var urlTemplate = '/voiceoverapplicationtext/<target_type>/<target_id>';
        var url = UrlInterpolationService.interpolateUrl(
          urlTemplate, {
            target_type: 'exploration',
            target_id: expId
          });
        return $http.get(
          url, {
            params: {
              language_code: languageCode
            }
          }).then(function(response) {
          return response.data.text;
        });
      },
      submitApplication: function(
          targetType, targetId, voiceoverContent, languageCode, audioFile) {
        var url = '/createvoiceoverapplicationhandler';
        var form = new FormData();
        form.append('raw_audio_file', audioFile);
        form.append('payload', JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          voiceover_content: voiceoverContent,
          language_code: languageCode,
        }));
        return $q(function(resolve, reject) {
          CsrfTokenService.getTokenAsync().then(function(token) {
            form.append('csrf_token', token);
            $.ajax({
              url: url,
              data: form,
              processData: false,
              contentType: false,
              type: 'POST',
              dataType: 'text',
              dataFilter: function(data) {
                // Remove the XSSI prefix.
                var transformedData = data.substring(5);
                return JSON.parse(transformedData);
              },
            }).done(function(response) {
              if (resolve) {
                resolve(response);
              }
            }).fail(function(data) {
              // Remove the XSSI prefix.
              var transformedData = data.responseText.substring(5);
              var parsedResponse = angular.fromJson(transformedData);
              if (reject) {
                reject(parsedResponse);
              }
            });
          });
        });
      }
    };
  }]);
