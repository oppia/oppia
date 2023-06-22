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
 * @fileoverview Model class for creating and mutating instances of frontend
 * change domain objects. This frontend object represents both CollectionChange
 * and ExplorationChange backend domain objects.
 */

// TODO(bhenning): Consolidate the backend ExplorationChange and
// CollectionChange domain objects.

import cloneDeep from 'lodash/cloneDeep';

import { MisconceptionBackendDict } from
  'domain/skill/MisconceptionObjectFactory';
import { RecordedVoiceOverBackendDict } from
  'domain/exploration/recorded-voiceovers.model';
import { StateBackendDict } from
  'domain/state/StateObjectFactory';
import { SubtitledHtmlBackendDict } from
  'domain/exploration/subtitled-html.model';
import { WorkedExampleBackendDict } from
  'domain/skill/worked-example.model';
import { Collection } from 'domain/collection/collection.model';
import { Question } from 'domain/question/QuestionObjectFactory';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { Story } from 'domain/story/story.model';
import { Topic } from 'domain/topic/topic-object.model';
import { SubtopicPage } from 'domain/topic/subtopic-page.model';

interface CollectionTitleChange {
  'cmd': 'edit_collection_property';
  'property_name': 'title';
  'new_value': string;
  'old_value': string;
}

interface CollectionCategoryChange {
  'cmd': 'edit_collection_property';
  'property_name': 'category';
  'new_value': string;
  'old_value': string;
}

interface CollectionObjectiveChange {
  'cmd': 'edit_collection_property';
  'property_name': 'objective';
  'new_value': string;
  'old_value': string;
}

interface CollectionLanguageCodeChange {
  'cmd': 'edit_collection_property';
  'property_name': 'language_code';
  'new_value': string;
  'old_value': string;
}

interface CollectionTagsChange {
  'cmd': 'edit_collection_property';
  'property_name': 'tags';
  'new_value': string[];
  'old_value': string[];
}

type CollectionPropertyChange = (
  CollectionTitleChange |
  CollectionCategoryChange |
  CollectionObjectiveChange |
  CollectionLanguageCodeChange |
  CollectionTagsChange);

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

export type CollectionChange = (
  CollectionPropertyChange |
  CollectionAddNodeChange |
  CollectionSwapNodeChange |
  CollectionDeleteNodeChange);

interface QuestionLanguageCodeChange {
  'cmd': 'update_question_property';
  'property_name': 'language_code';
  'new_value': string;
  'old_value': string;
}

interface QuestionStateDataChange {
  'cmd': 'update_question_property';
  'property_name': 'question_state_data';
  'new_value': StateBackendDict;
  'old_value': StateBackendDict;
}

type QuestionPropertyChange = (
  QuestionLanguageCodeChange |
  QuestionStateDataChange);

type QuestionChange = QuestionPropertyChange;

interface SkillDescriptionChange {
  'cmd': 'update_skill_property';
  'property_name': 'description';
  'new_value': string;
  'old_value': string;
}

type SkillPropertyChange = SkillDescriptionChange;

interface SkillMisconceptionNameChange {
  'cmd': 'update_skill_misconceptions_property';
  'property_name': 'name';
  'new_value': string;
  'old_value': string;
  'misconception_id': number;
}

interface SkillMisconceptionMustBeAddressedChange {
  'cmd': 'update_skill_misconceptions_property';
  'property_name': 'must_be_addressed';
  'new_value': boolean;
  'old_value': boolean;
  'misconception_id': number;
}

interface SkillMisconceptionsNotesChange {
  'cmd': 'update_skill_misconceptions_property';
  'property_name': 'notes';
  'new_value': string;
  'old_value': string;
  'misconception_id': number;
}

interface SkillMisconceptionsFeedbackChange {
  'cmd': 'update_skill_misconceptions_property';
  'property_name': 'feedback';
  'new_value': string;
  'old_value': string;
  'misconception_id': number;
}

type SkillMisconceptionPropertyChange = (
  SkillMisconceptionNameChange |
  SkillMisconceptionMustBeAddressedChange |
  SkillMisconceptionsNotesChange |
  SkillMisconceptionsFeedbackChange);

interface SkillRubricsChange {
  'cmd': 'update_rubrics';
  'difficulty': string;
  'explanations': string[];
}

interface SkillContentsExplanationChange {
  'cmd': 'update_skill_contents_property';
  'property_name': 'explanation';
  'new_value': SubtitledHtmlBackendDict;
  'old_value': SubtitledHtmlBackendDict;
}

export interface SkillContentsWorkedExamplesChange {
  'cmd': 'update_skill_contents_property';
  'property_name': 'worked_examples';
  'new_value': WorkedExampleBackendDict[];
  'old_value': WorkedExampleBackendDict[];
}

type SkillContentsChange = (
  SkillContentsExplanationChange |
  SkillContentsWorkedExamplesChange);

interface SkillAddMisconceptionChange {
  'cmd': 'add_skill_misconception';
  'new_misconception_dict': MisconceptionBackendDict;
}

interface SkillDeleteMisconceptionChange {
  'cmd': 'delete_skill_misconception';
  'misconception_id': number;
}

interface SkillAddPrerequisiteChange {
  'cmd': 'add_prerequisite_skill';
  'skill_id': string;
}

interface SkillDeletePrerequisiteChange {
  'cmd': 'delete_prerequisite_skill';
  'skill_id': string;
}

export type SkillChange = (
  SkillPropertyChange |
  SkillMisconceptionPropertyChange |
  SkillRubricsChange |
  SkillContentsChange |
  SkillAddMisconceptionChange |
  SkillDeleteMisconceptionChange |
  SkillAddPrerequisiteChange |
  SkillDeletePrerequisiteChange);

interface StoryTitleChange {
  'cmd': 'update_story_property';
  'property_name': 'title';
  'new_value': string;
  'old_value': string;
}

interface StoryUrlFragmentChange {
  'cmd': 'update_story_property';
  'property_name': 'url_fragment';
  'new_value': string;
  'old_value': string;
}

interface StoryThumbnailFilenameChange {
  'cmd': 'update_story_property';
  'property_name': 'thumbnail_filename';
  'new_value': string;
  'old_value': string;
}

interface StoryThumbnailBgColorChange {
  'cmd': 'update_story_property';
  'property_name': 'thumbnail_bg_color';
  'new_value': string;
  'old_value': string;
}

interface StoryDescriptionChange {
  'cmd': 'update_story_property';
  'property_name': 'description';
  'new_value': string;
  'old_value': string;
}

interface StoryNotesChange {
  'cmd': 'update_story_property';
  'property_name': 'notes';
  'new_value': string;
  'old_value': string;
}

interface StoryLanguageCodeChange {
  'cmd': 'update_story_property';
  'property_name': 'language_code';
  'new_value': string;
  'old_value': string;
}

type StoryPropertyChange = (
  StoryTitleChange |
  StoryUrlFragmentChange |
  StoryThumbnailFilenameChange |
  StoryThumbnailBgColorChange |
  StoryDescriptionChange |
  StoryNotesChange |
  StoryLanguageCodeChange);

interface StoryInitialNodeIdChange {
  'cmd': 'update_story_contents_property';
  'property_name': 'initial_node_id';
  'new_value': string;
  'old_value': string;
}

interface StoryNodesChange {
  'cmd': 'update_story_contents_property';
  'property_name': 'node';
  'new_value': number;
  'old_value': number;
}

type StoryContentsChange = (
  StoryInitialNodeIdChange |
  StoryNodesChange);

interface StoryNodeOutlineChange {
  'cmd': 'update_story_node_property';
  'property_name': 'outline';
  'new_value': string;
  'old_value': string;
  'node_id': string;
}

interface StoryNodeTitleChange {
  'cmd': 'update_story_node_property';
  'property_name': 'title';
  'new_value': string;
  'old_value': string;
  'node_id': string;
}

interface StoryNodeDescriptionChange {
  'cmd': 'update_story_node_property';
  'property_name': 'description';
  'new_value': string;
  'old_value': string;
  'node_id': string;
}

interface StoryNodeThumbnailFilenameChange {
  'cmd': 'update_story_node_property';
  'property_name': 'thumbnail_filename';
  'new_value': string;
  'old_value': string;
  'node_id': string;
}

interface StoryNodeThumbnailBgColorChange {
  'cmd': 'update_story_node_property';
  'property_name': 'thumbnail_bg_color';
  'new_value': string;
  'old_value': string;
  'node_id': string;
}

interface StoryNodeExplorationIdChange {
  'cmd': 'update_story_node_property';
  'property_name': 'exploration_id';
  'new_value': string;
  'old_value': string;
  'node_id': string;
}

interface StoryNodeDestinationIdsChange {
  'cmd': 'update_story_node_property';
  'property_name': 'destination_node_ids';
  'new_value': string[];
  'old_value': string[];
  'node_id': string;
}

interface StoryNodeStatusChange {
  'cmd': 'update_story_node_property';
  'property_name': 'status';
  'new_value': string;
  'old_value': string;
  'node_id': string;
}

interface StoryNodePlannedPublicationDateMsecsChange {
  'cmd': 'update_story_node_property';
  'property_name': 'planned_publication_date_msecs';
  'new_value': number;
  'old_value': number;
  'node_id': string;
}

interface StoryNodeLastModifiedMsecsChange {
  'cmd': 'update_story_node_property';
  'property_name': 'last_modified_msecs';
  'new_value': number;
  'old_value': number;
  'node_id': string;
}

interface StoryNodeFirstPublicationDateMsecsChange {
  'cmd': 'update_story_node_property';
  'property_name': 'first_publication_date_msecs';
  'new_value': number;
  'old_value': number;
  'node_id': string;
}

interface StoryNodeUnpublishingReasonChange {
  'cmd': 'update_story_node_property';
  'property_name': 'unpublishing_reason';
  'new_value': string;
  'old_value': string;
  'node_id': string;
}

interface StoryNodePrerequisiteSkillsChange {
  'cmd': 'update_story_node_property';
  'property_name': 'prerequisite_skill_ids';
  'new_value': string[];
  'old_value': string[];
  'node_id': string;
}

interface StoryNodeAcequiredSkillsChange {
  'cmd': 'update_story_node_property';
  'property_name': 'acquired_skill_ids';
  'new_value': string[];
  'old_value': string[];
  'node_id': string;
}

type StoryNodePropertyChange = (
  StoryNodeOutlineChange |
  StoryNodeTitleChange |
  StoryNodeDescriptionChange |
  StoryNodeThumbnailFilenameChange |
  StoryNodeThumbnailBgColorChange |
  StoryNodeExplorationIdChange |
  StoryNodeDestinationIdsChange |
  StoryNodePrerequisiteSkillsChange |
  StoryNodeAcequiredSkillsChange |
  StoryNodeStatusChange |
  StoryNodePlannedPublicationDateMsecsChange |
  StoryNodeLastModifiedMsecsChange |
  StoryNodeFirstPublicationDateMsecsChange |
  StoryNodeUnpublishingReasonChange
  );

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

export type StoryChange = (
  StoryPropertyChange |
  StoryContentsChange |
  StoryNodePropertyChange |
  StoryAddNodeChange |
  StoryDeleteNodeChange |
  StoryNodeOutlineStatusChange);

interface TopicNameChange {
  'cmd': 'update_topic_property';
  'property_name': 'name';
  'new_value': string;
  'old_value': string;
}

interface TopicAbbreviatedNameChange {
  'cmd': 'update_topic_property';
  'property_name': 'abbreviated_name';
  'new_value': string;
  'old_value': string;
}
interface TopicPracticeTabChange {
  'cmd': 'update_topic_property';
  'property_name': 'practice_tab_is_displayed';
  'new_value': boolean;
  'old_value': boolean;
}

interface TopicThumbnailFilenameChange {
  'cmd': 'update_topic_property';
  'property_name': 'thumbnail_filename';
  'new_value': string;
  'old_value': string;
}

interface TopicThumbnailBgColorChange {
  'cmd': 'update_topic_property';
  'property_name': 'thumbnail_bg_color';
  'new_value': string;
  'old_value': string;
}

interface TopicDescriptionChange {
  'cmd': 'update_topic_property';
  'property_name': 'description';
  'new_value': string;
  'old_value': string;
}

interface TopicUrlFragmentChange {
  'cmd': 'update_topic_property';
  'property_name': 'url_fragment';
  'new_value': string;
  'old_value': string;
}

interface TopicMetaTagContentChange {
  'cmd': 'update_topic_property';
  'property_name': 'meta_tag_content';
  'new_value': string;
  'old_value': string;
}

interface TopicLanguageCodeChange {
  'cmd': 'update_topic_property';
  'property_name': 'language_code';
  'new_value': string;
  'old_value': string;
}

interface TopicPageTitleFragmentForWebChange {
  'cmd': 'update_topic_property';
  'property_name': 'page_title_fragment_for_web';
  'new_value': string;
  'old_value': string;
}

interface TopicSkillForDiagnosticTestChange {
  'cmd': 'update_topic_property';
  'property_name': 'skill_ids_for_diagnostic_test';
  'new_value': string[];
  'old_value': string[];
}

type TopicPropertyChange = (
  TopicNameChange |
  TopicAbbreviatedNameChange |
  TopicThumbnailFilenameChange |
  TopicThumbnailBgColorChange |
  TopicDescriptionChange |
  TopicPracticeTabChange |
  TopicUrlFragmentChange |
  TopicMetaTagContentChange |
  TopicLanguageCodeChange |
  TopicPageTitleFragmentForWebChange |
  TopicSkillForDiagnosticTestChange);

interface TopicSubtopicThumbnailFilenameChange {
  'cmd': 'update_subtopic_property';
  'property_name': 'thumbnail_filename';
  'new_value': string;
  'old_value': string;
  'subtopic_id': number;
}

interface TopicSubtopicThumbnailBgColorChange {
  'cmd': 'update_subtopic_property';
  'property_name': 'thumbnail_bg_color';
  'new_value': string;
  'old_value': string;
  'subtopic_id': number;
}

interface TopicSubtopicTitleChange {
  'cmd': 'update_subtopic_property';
  'property_name': 'title';
  'new_value': string;
  'old_value': string;
  'subtopic_id': number;
}

interface TopicSubtopicUrlFragmentChange {
  'cmd': 'update_subtopic_property';
  'property_name': 'url_fragment';
  'new_value': string;
  'old_value': string;
  'subtopic_id': number;
}

export type TopicSubtopicPropertyChange = (
  TopicSubtopicThumbnailFilenameChange |
  TopicSubtopicThumbnailBgColorChange |
  TopicSubtopicTitleChange |
  TopicSubtopicUrlFragmentChange);

interface TopicSubtopicPageHtmlChange {
  'cmd': 'update_subtopic_page_property';
  'property_name': 'page_contents_html';
  'new_value': SubtitledHtmlBackendDict;
  'old_value': SubtitledHtmlBackendDict;
  'subtopic_id': number;
}

interface TopicSubtopicPageAudioChange {
  'cmd': 'update_subtopic_page_property';
  'property_name': 'page_contents_audio';
  'new_value': RecordedVoiceOverBackendDict;
  'old_value': RecordedVoiceOverBackendDict;
  'subtopic_id': number;
}

type TopicSubtopicPagePropertyChange = (
  TopicSubtopicPageHtmlChange |
  TopicSubtopicPageAudioChange);

interface TopicAddSubtopicChange {
  'cmd': 'add_subtopic';
  'subtopic_id': number;
  'title': string;
  'url_fragment': string;
}

interface TopicAddUncategorizedSkillId {
  'cmd': 'add_uncategorized_skill_id';
  'new_uncategorized_skill_id': string;
}

interface TopicDeleteSubtopicChange {
  'cmd': 'delete_subtopic';
  'subtopic_id': number;
}

export interface TopicMoveSkillToSubtopicChange {
  'cmd': 'move_skill_id_to_subtopic';
  'old_subtopic_id': number;
  'new_subtopic_id': number;
  'skill_id': string;
}

export interface TopicRemoveSkillFromSubtopicChange {
  'cmd': 'remove_skill_id_from_subtopic';
  'subtopic_id': number;
  'skill_id': string;
}

export interface TopicDeleteAdditionalStoryChange {
  'cmd': 'delete_additional_story';
  'story_id': string;
}

export interface TopicDeleteCanonicalStoryChange {
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
  'subtopic_id': number;
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

export type TopicChange = (
  TopicPropertyChange |
  TopicSubtopicPropertyChange |
  TopicSubtopicPagePropertyChange |
  TopicAddSubtopicChange |
  TopicAddUncategorizedSkillId |
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

export type DomainObject = (
  Collection |
  Question |
  Skill |
  Story |
  Topic |
  SubtopicPage);

export class Change {
  _backendChangeObject: BackendChangeObject;
  _applyChangeToObject: (
    backendChangeObject: BackendChangeObject,
    domainObject: DomainObject) => void;

  _reverseChangeToObject: (
    backendChangeObject: BackendChangeObject,
    domainObject: DomainObject) => void;

  constructor(
      backendChangeObject: BackendChangeObject,
      applyChangeToObject: (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject) => void,
      reverseChangeToObject: (
        backendChangeObject: BackendChangeObject,
        domainObject: DomainObject) => void) {
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
  applyChange(domainObject: DomainObject): void {
    this._applyChangeToObject(this._backendChangeObject, domainObject);
  }

  // Reverse-applies this change to the related object (such as a frontend
  // collection domain object). This method should only be used to reverse a
  // change that was previously applied by calling the applyChange() method.
  reverseChange(domainObject: DomainObject): void {
    this._reverseChangeToObject(this._backendChangeObject, domainObject);
  }
}
