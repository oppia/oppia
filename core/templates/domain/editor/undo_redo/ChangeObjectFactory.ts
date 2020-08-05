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
 * @fileoverview Factory for creating and mutating instances of frontend change
 * domain objects. This frontend object represents both CollectionChange and
 * ExplorationChange backend domain objects.
 */

// TODO(bhenning): Consolidate the backend ExplorationChange and
// CollectionChange domain objects.

import cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { MisconceptionBackendDict } from
  'domain/skill/MisconceptionObjectFactory';

interface CollectionPropertyChange {
  'cmd': 'edit_collection_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
}

interface CollectionNodePropertyChange {
  'cmd': 'edit_collection_node_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
  'exploration_id': string;
}

interface CollectionAddNodeChange {
  'cmd': 'add_collection_node';
  'exploration_id': string;
}

interface CollectionSwapNodeChange {
  'cmd': 'swap_nodes';
  'first_index': number;
  'second_index': number;
}

interface CollectionDeleteNodeChange {
  'cmd': 'delete_collection_node';
  'exploration_id': string;
}

type CollectionChange = (
  CollectionPropertyChange |
  CollectionNodePropertyChange |
  CollectionAddNodeChange |
  CollectionSwapNodeChange |
  CollectionDeleteNodeChange);

interface QuestionPropertyChange {
  'cmd': 'update_question_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
}

type QuestionChange = QuestionPropertyChange;

interface SkillPropertyChange {
  'cmd': 'update_skill_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
}

interface SkillMisconceptionPropertyChange {
  'cmd': 'update_skill_misconceptions_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
  'misconception_id': string;
}

interface SkillRubricsChange {
  cmd: 'update_rubrics';
  difficulty: string;
  explanations: string[];
}

interface SkillContentsChange {
  'cmd': 'update_skill_contents_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
}

interface SkillAddMisconceptionChange {
  'cmd': 'add_skill_misconception';
  'new_misconception_dict': MisconceptionBackendDict;
}

interface SkillDeleteMisconceptionChange {
  'cmd': 'delete_skill_misconception';
  'misconception_id': string;
}

interface SkillAddPrerequisiteChange {
  'cmd': 'add_prerequisite_skill';
  'skill_id': string;
}

interface SkillDeletePrerequisiteChange {
  'cmd': 'delete_prerequisite_skill';
  'skill_id': string;
}

type SkillChange = (
  SkillPropertyChange |
  SkillMisconceptionPropertyChange |
  SkillRubricsChange |
  SkillContentsChange |
  SkillAddMisconceptionChange |
  SkillDeleteMisconceptionChange |
  SkillAddPrerequisiteChange |
  SkillDeletePrerequisiteChange);

interface StoryPropertyChange {
  'cmd': 'update_story_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
}

interface StoryContentsChange {
  'cmd': 'update_story_contents_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
}

interface StoryNodePropertyChange {
  'cmd': 'update_story_node_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
  'node_id': string;
}

interface StoryAddNodeChange {
  'cmd': 'add_story_node';
  'node_id': string;
  'title': string;
}

interface StoryDeleteNodeChange {
  'cmd': 'delete_story_node';
  'node_id': string;
}

interface StoryNodeOutlineStatusChange {
  'cmd': 'update_story_node_outline_status';
  'node_id': string;
  'old_value': boolean;
  'new_value': boolean;
}

type StoryChange = (
  StoryPropertyChange |
  StoryContentsChange |
  StoryNodePropertyChange |
  StoryAddNodeChange |
  StoryDeleteNodeChange |
  StoryNodeOutlineStatusChange);

interface TopicPropertyChange {
  'cmd': 'update_topic_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
}

interface TopicSubtopicPropertyChange {
  'cmd': 'update_subtopic_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
  'subtopic_id': string;
}

interface TopicSubtopicPagePropertyChange {
  'cmd': 'update_subtopic_page_property';
  'property_name': string;
  'new_value': Object;
  'old_value': Object;
  'subtopic_id': string;
}

interface TopicAddSubtopicChange {
  'cmd': 'add_subtopic';
  'subtopic_id': string;
  'title': string;
}

interface TopicDeleteSubtopicChange {
  'cmd': 'delete_subtopic';
  'subtopic_id': string;
}

interface TopicMoveSkillToSubtopicChange {
  'cmd': 'move_skill_id_to_subtopic';
  'old_subtopic_id': string;
  'new_subtopic_id': string;
  'skill_id': string;
}

interface TopicRemoveSkillFromSubtopicChange {
  'cmd': 'remove_skill_id_from_subtopic';
  'subtopic_id': string;
  'skill_id': string;
}

interface TopicDeleteAdditionalStoryChange {
  'cmd': 'delete_additional_story';
  'story_id': string;
}

interface TopicDeleteCanonicalStoryChange {
  'cmd': 'delete_canonical_story';
  'story_id': string;
}

interface TopicRearrangeCanonicalStoryChange {
  'cmd': 'rearrange_canonical_story';
  'from_index': number;
  'to_index': number;
}

interface TopicRearrangeSkillInSubtopicChange {
  'cmd': 'rearrange_skill_in_subtopic';
  'subtopic_id': string;
  'from_index': number;
  'to_index': number;
}

interface TopicRearrangeSubtopicChange {
  'cmd': 'rearrange_subtopic';
  'from_index': number;
  'to_index': number;
}

interface TopicRemoveUncategorizedSkillChange {
  'cmd': 'remove_uncategorized_skill_id';
  'uncategorized_skill_id': string;
}

type TopicChange = (
  TopicPropertyChange |
  TopicSubtopicPropertyChange |
  TopicSubtopicPagePropertyChange |
  TopicAddSubtopicChange |
  TopicDeleteSubtopicChange |
  TopicMoveSkillToSubtopicChange |
  TopicRemoveSkillFromSubtopicChange |
  TopicDeleteAdditionalStoryChange |
  TopicDeleteCanonicalStoryChange |
  TopicRearrangeCanonicalStoryChange |
  TopicRearrangeSkillInSubtopicChange |
  TopicRearrangeSubtopicChange |
  TopicRemoveUncategorizedSkillChange);

export type BackendChangeObject = (
  CollectionChange |
  QuestionChange |
  SkillChange |
  StoryChange |
  TopicChange);

export class Change {
  _backendChangeObject: BackendChangeObject;
  _applyChangeToObject: Function;
  _reverseChangeToObject: Function;

  constructor(
      backendChangeObject: BackendChangeObject, applyChangeToObject: Function,
      reverseChangeToObject: Function) {
    this._backendChangeObject = cloneDeep(backendChangeObject);
    this._applyChangeToObject = applyChangeToObject;
    this._reverseChangeToObject = reverseChangeToObject;
  }

  // Returns the JSON object which represents a backend python dict of this
  // change. Changes to this object are not reflected in this domain object.
  getBackendChangeObject(): BackendChangeObject {
    return cloneDeep(this._backendChangeObject);
  }

  setBackendChangeObject(
      backendChangeObject: BackendChangeObject): BackendChangeObject {
    return this._backendChangeObject = cloneDeep(backendChangeObject);
  }

  // Applies this change to the related object (such as a frontend collection
  // domain object).
  applyChange(domainObject: BackendChangeObject): void {
    this._applyChangeToObject(this._backendChangeObject, domainObject);
  }

  // Reverse-applies this change to the related object (such as a frontend
  // collection domain object). This method should only be used to reverse a
  // change that was previously applied by calling the applyChange() method.
  reverseChange(domainObject: BackendChangeObject): void {
    this._reverseChangeToObject(this._backendChangeObject, domainObject);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ChangeObjectFactory {
  // Static class methods. Note that "this" is not available in static
  // contexts. The first parameter is a JSON representation of a backend
  // python dict for the given change. The second parameter is a callback
  // which will receive both the backend change object dictionary (as
  // read-only) and the domain object in which to apply the change. The third
  // parameter is a callback which behaves in the same way as the second
  // parameter and takes the same inputs, except it should reverse the change
  // for the provided domain object.
  create(
      backendChangeObject: BackendChangeObject, applyChangeToObject: Function,
      reverseChangeToObject: Function): Change {
    return new Change(
      backendChangeObject, applyChangeToObject, reverseChangeToObject);
  }
}

angular.module('oppia').factory(
  'ChangeObjectFactory', downgradeInjectable(ChangeObjectFactory));
