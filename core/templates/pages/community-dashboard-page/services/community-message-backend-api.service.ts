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
 * @fileoverview Backend API service for community message.
 */

angular.module('oppia').factory('CommunityMessageBackendApiService', [
  '$http', function($http) {
    return {
      getCommunityMessageData: function() {
        var communityMessageData = {
          communityMessageEnabled: false,
          communityMessage: ''
        };

        return $http.get('/community_message_handler', {}).then(
          function(response) {
            communityMessageData.communityMessageEnabled = (
              response.data.community_message_enabled);
            communityMessageData.communityMessage = (
              response.data.community_message);
            return communityMessageData;
          }
        );
      }
    };
  }
]);
