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
 * @fileoverview Service to hold title info to be displayed on the subtopic
 * page.
 */

oppia.factory('SubtopicPageTitleService', [
  function() {
    var _subtopicTitle = null;
    var _topicName = null;
    return {
      setSubtopicTitle: function(subtopicTitle) {
        _subtopicTitle = subtopicTitle;
      },
      setTopicName: function(topicName) {
        _topicName = topicName;
      },
      getSubtopicTitle: function() {
        return _subtopicTitle;
      },
      getTopicName: function() {
        return _topicName;
      }
    };
  }
]);
