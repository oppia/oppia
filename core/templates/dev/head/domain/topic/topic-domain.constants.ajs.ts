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
 * @fileoverview Constants for topic domain.
 */

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { TopicDomainConstants } from 'domain/topic/topic-domain.constants';

angular.module('oppia').constant(
  'TOPIC_EDITOR_STORY_URL_TEMPLATE',
  TopicDomainConstants.TOPIC_EDITOR_STORY_URL_TEMPLATE);

angular.module('oppia').constant(
  'TOPIC_EDITOR_QUESTION_URL_TEMPLATE',
  TopicDomainConstants.TOPIC_EDITOR_QUESTION_URL_TEMPLATE);

angular.module('oppia').constant(
  'TOPIC_MANAGER_RIGHTS_URL_TEMPLATE',
  TopicDomainConstants.TOPIC_MANAGER_RIGHTS_URL_TEMPLATE);
angular.module('oppia').constant(
  'TOPIC_RIGHTS_URL_TEMPLATE', TopicDomainConstants.TOPIC_RIGHTS_URL_TEMPLATE);

// These should match the constants defined in core.domain.topic_domain.
angular.module('oppia').constant(
  'CMD_ADD_SUBTOPIC', TopicDomainConstants.CMD_ADD_SUBTOPIC);
angular.module('oppia').constant(
  'CMD_DELETE_ADDITIONAL_STORY',
  TopicDomainConstants.CMD_DELETE_ADDITIONAL_STORY);
angular.module('oppia').constant(
  'CMD_DELETE_CANONICAL_STORY',
  TopicDomainConstants.CMD_DELETE_CANONICAL_STORY);
angular.module('oppia').constant(
  'CMD_DELETE_SUBTOPIC', TopicDomainConstants.CMD_DELETE_SUBTOPIC);
angular.module('oppia').constant(
  'CMD_REMOVE_UNCATEGORIZED_SKILL_ID',
  TopicDomainConstants.CMD_REMOVE_UNCATEGORIZED_SKILL_ID);
angular.module('oppia').constant(
  'CMD_MOVE_SKILL_ID_TO_SUBTOPIC',
  TopicDomainConstants.CMD_MOVE_SKILL_ID_TO_SUBTOPIC);
angular.module('oppia').constant(
  'CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC',
  TopicDomainConstants.CMD_REMOVE_SKILL_ID_FROM_SUBTOPIC);

angular.module('oppia').constant(
  'CMD_UPDATE_TOPIC_PROPERTY', TopicDomainConstants.CMD_UPDATE_TOPIC_PROPERTY);
angular.module('oppia').constant(
  'CMD_UPDATE_SUBTOPIC_PROPERTY',
  TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PROPERTY);
angular.module('oppia').constant(
  'CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY',
  TopicDomainConstants.CMD_UPDATE_SUBTOPIC_PAGE_PROPERTY);

angular.module('oppia').constant(
  'TOPIC_PROPERTY_NAME', TopicDomainConstants.TOPIC_PROPERTY_NAME);
angular.module('oppia').constant(
  'TOPIC_PROPERTY_DESCRIPTION',
  TopicDomainConstants.TOPIC_PROPERTY_DESCRIPTION);
angular.module('oppia').constant(
  'TOPIC_PROPERTY_LANGUAGE_CODE',
  TopicDomainConstants.TOPIC_PROPERTY_LANGUAGE_CODE);

angular.module('oppia').constant(
  'SUBTOPIC_PROPERTY_TITLE', TopicDomainConstants.SUBTOPIC_PROPERTY_TITLE);

angular.module('oppia').constant(
  'SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML',
  TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_HTML);
angular.module('oppia').constant(
  'SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO',
  TopicDomainConstants.SUBTOPIC_PAGE_PROPERTY_PAGE_CONTENTS_AUDIO);
