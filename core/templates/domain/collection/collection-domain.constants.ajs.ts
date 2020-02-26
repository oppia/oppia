// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Constants for collection domain services.
 */

// These should match the constants defined in core.domain.collection_domain.
// TODO(bhenning): The values of these constants should be provided by the
// backend.
// NOTE TO DEVELOPERS: the properties 'prerequisite_skills' and
// 'acquired_skills' are deprecated. Do not use them.

// TODO(#7092): Delete this file once migration is complete and these AngularJS
// equivalents of the Angular constants are no longer needed.
import { CollectionDomainConstants } from
  'domain/collection/collection-domain.constants';

angular.module('oppia').constant(
  'CMD_ADD_COLLECTION_NODE',
  CollectionDomainConstants.CMD_ADD_COLLECTION_NODE);
angular.module('oppia').constant(
  'CMD_SWAP_COLLECTION_NODES',
  CollectionDomainConstants.CMD_SWAP_COLLECTION_NODES);
angular.module('oppia').constant(
  'CMD_DELETE_COLLECTION_NODE',
  CollectionDomainConstants.CMD_DELETE_COLLECTION_NODE);
angular.module('oppia').constant(
  'CMD_EDIT_COLLECTION_PROPERTY',
  CollectionDomainConstants.CMD_EDIT_COLLECTION_PROPERTY);
angular.module('oppia').constant(
  'CMD_EDIT_COLLECTION_NODE_PROPERTY',
  CollectionDomainConstants.CMD_EDIT_COLLECTION_NODE_PROPERTY);
angular.module('oppia').constant(
  'COLLECTION_PROPERTY_TITLE',
  CollectionDomainConstants.COLLECTION_PROPERTY_TITLE);
angular.module('oppia').constant(
  'COLLECTION_PROPERTY_CATEGORY',
  CollectionDomainConstants.COLLECTION_PROPERTY_CATEGORY);
angular.module('oppia').constant(
  'COLLECTION_PROPERTY_OBJECTIVE',
  CollectionDomainConstants.COLLECTION_PROPERTY_OBJECTIVE);
angular.module('oppia').constant(
  'COLLECTION_PROPERTY_LANGUAGE_CODE',
  CollectionDomainConstants.COLLECTION_PROPERTY_LANGUAGE_CODE);
angular.module('oppia').constant(
  'COLLECTION_PROPERTY_TAGS',
  CollectionDomainConstants.COLLECTION_PROPERTY_TAGS);
angular.module('oppia').constant(
  'CMD_ADD_COLLECTION_SKILL',
  CollectionDomainConstants.CMD_ADD_COLLECTION_SKILL);
angular.module('oppia').constant(
  'CMD_DELETE_COLLECTION_SKILL',
  CollectionDomainConstants.CMD_DELETE_COLLECTION_SKILL);
angular.module('oppia').constant(
  'COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS',
  CollectionDomainConstants.COLLECTION_NODE_PROPERTY_PREREQUISITE_SKILL_IDS);
angular.module('oppia').constant(
  'COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS',
  CollectionDomainConstants.COLLECTION_NODE_PROPERTY_ACQUIRED_SKILL_IDS);
