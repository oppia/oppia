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

// About this service:
// In the exploration player, a video should only autoplay when it is first seen
// on a new card, and not when the learner clicks back to previous cards in
// their exploration playthrough. This service maintains a list of videos that
// have been played, so that we know not to autoplay them on a second pass.
//
// Caveat: if the same video is shown twice in the exploration, the second and
// subsequent instances of that video will not autoplay. We believe this
// occurrence is rare, and have not accounted for it here. If it turns out
// to be an issue, we may need to instead assign a unique id to each rich-text
// component and use that id instead to determine whether to suppress
// autoplaying.

oppia.factory('AutoplayedVideosService', [function() {
  var autoplayedVideosDict = {};
  return {
    addAutoplayedVideo: function(videoId) {
      autoplayedVideosDict[videoId] = true;
    },

    hasVideoBeenAutoplayed: function(videoId) {
      return Boolean(autoplayedVideosDict[videoId]);
    }
  };
}]);
