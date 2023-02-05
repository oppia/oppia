// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Topic update service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// topic-update.service.ts is upgraded to Angular 8.
import { ShortSkillSummary } from
  'domain/skill/short-skill-summary.model';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';
// ^^^ This block is to be removed.
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { Topic, TopicBackendDict} from 'domain/topic/topic-object.model';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { TestBed } from '@angular/core/testing';
import { SubtopicPage } from './subtopic-page.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';

describe('Topic update service', function() {
  let topicUpdateService: TopicUpdateService;
  let undoRedoService: UndoRedoService = null;
  let _sampleTopic = null;
  let _firstSkillSummary = null;
  let _secondSkillSummary = null;
  let _thirdSkillSummary = null;
  let _sampleSubtopicPage = null;

  let sampleTopicBackendObject = {
    topicDict: {
      id: 'sample_topic_id',
      name: 'Topic name',
      description: 'Topic description',
      version: 1,
      uncategorized_skill_ids: ['skill_1'],
      canonical_story_references: [{
        story_id: 'story_1',
        story_is_published: true
      }, {
        story_id: 'story_2',
        story_is_published: true
      }, {
        story_id: 'story_3',
        story_is_published: true
      }],
      additional_story_references: [{
        story_id: 'story_2',
        story_is_published: true
      }],
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_2']
      }],
      next_subtopic_id: 2,
      language_code: 'en',
      skill_ids_for_diagnostic_test: []
    },
    skillIdToDescriptionDict: {
      skill_1: 'Description 1',
      skill_2: 'Description 2'
    }
  };
  let sampleSubtopicPageObject = {
    id: 'topic_id-1',
    topic_id: 'topic_id',
    page_contents: {
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    },
    language_code: 'en'
  };

  beforeEach(() => {
    topicUpdateService = TestBed.get(TopicUpdateService);
    undoRedoService = TestBed.get(UndoRedoService);

    _firstSkillSummary = ShortSkillSummary.create(
      'skill_1', 'Description 1');
    _secondSkillSummary = ShortSkillSummary.create(
      'skill_2', 'Description 2');
    _thirdSkillSummary = ShortSkillSummary.create(
      'skill_3', 'Description 3');

    _sampleSubtopicPage = SubtopicPage.createFromBackendDict(
      sampleSubtopicPageObject);
    _sampleTopic = Topic.create(
      sampleTopicBackendObject.topicDict as TopicBackendDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
  });

  it('should remove/add an additional story id from/to a topic', () => {
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
    topicUpdateService.removeAdditionalStory(_sampleTopic, 'story_2');
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual([]);

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
  }
  );

  it('should create a proper backend change dict for removing an additional ' +
    'story id', () => {
    topicUpdateService.removeAdditionalStory(_sampleTopic, 'story_2');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'delete_additional_story',
      story_id: 'story_2'
    }]);
  });

  it('should not create a backend change dict for removing an additional ' +
    'story id when an error is encountered', () => {
    expect(() => {
      topicUpdateService.removeAdditionalStory(_sampleTopic, 'story_5');
    }).toThrowError('Given story id not present in additional story ids.');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add a canonical story id from/to a topic', () => {
    let canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds).toEqual(
      ['story_1', 'story_2', 'story_3']);
    topicUpdateService.removeCanonicalStory(_sampleTopic, 'story_1');
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds).toEqual(['story_2', 'story_3']);

    undoRedoService.undoChange(_sampleTopic);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds).toEqual(
      ['story_2', 'story_3', 'story_1']);
  });

  it('should create a proper backend change dict for removing a canonical ' +
    'story id', () => {
    topicUpdateService.removeCanonicalStory(_sampleTopic, 'story_1');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'delete_canonical_story',
      story_id: 'story_1'
    }]);
  });

  it('should not create a backend change dict for removing a canonical ' +
    'story id when an error is encountered', () => {
    expect(() => {
      topicUpdateService.removeCanonicalStory(_sampleTopic, 'story_10');
    }).toThrowError('Given story id not present in canonical story ids.');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add an uncategorized skill id from/to a topic', () => {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    topicUpdateService.removeUncategorizedSkill(
      _sampleTopic, _firstSkillSummary
    );
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
  }
  );

  it('should create a proper backend change dict for removing an ' +
    'uncategorized skill id', () => {
    topicUpdateService.removeUncategorizedSkill(
      _sampleTopic, _firstSkillSummary);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_uncategorized_skill_id',
      uncategorized_skill_id: 'skill_1'
    }]);
  });

  it('should not create a backend change dict for removing an uncategorized ' +
    'skill id when an error is encountered', () => {
    expect(() => {
      topicUpdateService.removeUncategorizedSkill(
        _sampleTopic, _thirdSkillSummary);
    }).toThrowError('Given skillId is not an uncategorized skill.');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should create a proper backend change dict for updating the skill Ids ' +
     'for diagnostic test', function() {
    _sampleTopic.setSkillSummariesForDiagnosticTest([_secondSkillSummary]);
    topicUpdateService.updateDiagnosticTestSkills(
      _sampleTopic, [_firstSkillSummary]);
    expect(_sampleTopic.getSkillSummariesForDiagnosticTest()).toEqual(
      [_firstSkillSummary]);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'skill_ids_for_diagnostic_test',
      new_value: ['skill_1'],
      old_value: ['skill_2']
    }]);
    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSkillSummariesForDiagnosticTest()).toEqual(
      [_secondSkillSummary]);
  });

  it('should set/unset changes to a topic\'s name', () => {
    expect(_sampleTopic.getName()).toEqual('Topic name');

    topicUpdateService.setTopicName(_sampleTopic, 'new unique value');
    expect(_sampleTopic.getName()).toEqual('new unique value');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getName()).toEqual('Topic name');
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s name', () => {
    topicUpdateService.setTopicName(_sampleTopic, 'new unique value');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'name',
      new_value: 'new unique value',
      old_value: 'Topic name'
    }]);
  });

  it('should set/unset changes to a topic\'s description', () => {
    expect(_sampleTopic.getDescription()).toEqual('Topic description');

    topicUpdateService.setTopicDescription(_sampleTopic, 'new unique value');
    expect(_sampleTopic.getDescription()).toEqual('new unique value');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getDescription()).toEqual('Topic description');
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s description', () => {
    topicUpdateService.setTopicDescription(_sampleTopic, 'new unique value');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'description',
      new_value: 'new unique value',
      old_value: 'Topic description'
    }]);
  });

  it('should set/unset changes to a topic\'s abbreviated name', () => {
    expect(_sampleTopic.getAbbreviatedName()).toEqual(undefined);

    topicUpdateService.setAbbreviatedTopicName(
      _sampleTopic, 'new unique value');
    expect(_sampleTopic.getAbbreviatedName()).toEqual('new unique value');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getAbbreviatedName()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s abbreviated name', () => {
    topicUpdateService.setAbbreviatedTopicName(
      _sampleTopic, 'new unique value');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'abbreviated_name',
      new_value: 'new unique value',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s meta tag content', () => {
    expect(_sampleTopic.getMetaTagContent()).toEqual(undefined);

    topicUpdateService.setMetaTagContent(
      _sampleTopic, 'new meta tag content');
    expect(_sampleTopic.getMetaTagContent()).toEqual('new meta tag content');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getMetaTagContent()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s meta tag content', () => {
    topicUpdateService.setMetaTagContent(
      _sampleTopic, 'new meta tag content');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'meta_tag_content',
      new_value: 'new meta tag content',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s page title', function() {
    expect(_sampleTopic.getPageTitleFragmentForWeb()).toBeUndefined();
    topicUpdateService.setPageTitleFragmentForWeb(
      _sampleTopic, 'new page title');
    expect(_sampleTopic.getPageTitleFragmentForWeb()).toEqual(
      'new page title');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getPageTitleFragmentForWeb()).toBeUndefined();
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s page title', function() {
    topicUpdateService.setPageTitleFragmentForWeb(
      _sampleTopic, 'new page title');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'page_title_fragment_for_web',
      new_value: 'new page title',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s practice tab is ' +
    'displayed property', () => {
    expect(_sampleTopic.getPracticeTabIsDisplayed()).toBeUndefined();

    topicUpdateService.setPracticeTabIsDisplayed(_sampleTopic, true);
    expect(_sampleTopic.getPracticeTabIsDisplayed()).toEqual(true);

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getPracticeTabIsDisplayed()).toBeUndefined();
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s practice tab is displayed property', () => {
    topicUpdateService.setPracticeTabIsDisplayed(_sampleTopic, true);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'practice_tab_is_displayed',
      new_value: true,
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s url fragment', () => {
    expect(_sampleTopic.getUrlFragment()).toEqual(undefined);

    topicUpdateService.setTopicUrlFragment(_sampleTopic, 'new-unique-value');
    expect(_sampleTopic.getUrlFragment()).toEqual('new-unique-value');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUrlFragment()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s url fragment', () => {
    topicUpdateService.setTopicUrlFragment(_sampleTopic, 'new-unique-value');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'url_fragment',
      new_value: 'new-unique-value',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s thumbnail filename', () => {
    expect(_sampleTopic.getThumbnailFilename()).toEqual(undefined);

    topicUpdateService.setTopicThumbnailFilename(
      _sampleTopic, 'new unique value');
    expect(_sampleTopic.getThumbnailFilename()).toEqual('new unique value');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getThumbnailFilename()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s thumbnail filename', () => {
    topicUpdateService.setTopicThumbnailFilename(
      _sampleTopic, 'new unique value');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'thumbnail_filename',
      new_value: 'new unique value',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s thumbnail bg color', () => {
    expect(_sampleTopic.getThumbnailBgColor()).toEqual(undefined);

    topicUpdateService.setTopicThumbnailBgColor(
      _sampleTopic, '#ffffff');
    expect(_sampleTopic.getThumbnailBgColor()).toEqual('#ffffff');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getThumbnailBgColor()).toEqual(undefined);
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s thumbnail bg color', () => {
    topicUpdateService.setTopicThumbnailBgColor(
      _sampleTopic, 'new unique value');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'thumbnail_bg_color',
      new_value: 'new unique value',
      old_value: null
    }]);
  });

  it('should set/unset changes to a topic\'s language code', () => {
    expect(_sampleTopic.getLanguageCode()).toEqual('en');

    topicUpdateService.setTopicLanguageCode(_sampleTopic, 'fr');
    expect(_sampleTopic.getLanguageCode()).toEqual('fr');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict ' +
    'for changing a topic\'s language code', () => {
    topicUpdateService.setTopicLanguageCode(_sampleTopic, 'fr');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'language_code',
      new_value: 'fr',
      old_value: 'en'
    }]);
  });

  it('should not create a backend change dict for changing subtopic title ' +
    'when the subtopic does not exist', () => {
    expect(() => {
      topicUpdateService.setSubtopicTitle(_sampleTopic, 10, 'whatever');
    }).toThrowError('Subtopic with id 10 doesn\'t exist');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a subtopic\'s title', () => {
    expect(_sampleTopic.getSubtopics()[0].getTitle())
      .toEqual('Title');
    topicUpdateService.setSubtopicTitle(_sampleTopic, 1, 'new unique value');
    expect(_sampleTopic.getSubtopics()[0].getTitle())
      .toEqual('new unique value');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getTitle())
      .toEqual('Title');
  });

  it('should create a proper backend change dict for changing subtopic ' +
    'title', () => {
    topicUpdateService.setSubtopicTitle(_sampleTopic, 1, 'new unique value');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_property',
      subtopic_id: 1,
      property_name: 'title',
      new_value: 'new unique value',
      old_value: 'Title'
    }]);
  }
  );

  it('should not create a backend change dict for changing subtopic ' +
    'thumbnail filename when the subtopic does not exist', () => {
    expect(() => {
      topicUpdateService
        .setSubtopicThumbnailFilename(_sampleTopic, 10, 'whatever');
    }).toThrowError('Subtopic with id 10 doesn\'t exist');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a subtopic\'s thumbnail' +
    'filename', () => {
    expect(_sampleTopic.getSubtopics()[0].getThumbnailFilename())
      .toEqual(undefined);

    topicUpdateService
      .setSubtopicThumbnailFilename(_sampleTopic, 1, 'filename');
    expect(_sampleTopic.getSubtopics()[0].getThumbnailFilename())
      .toEqual('filename');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getThumbnailFilename())
      .toEqual(undefined);
  });

  it('should create a proper backend change dict for changing subtopic ' +
    'thumbnail filename', () => {
    topicUpdateService
      .setSubtopicThumbnailFilename(_sampleTopic, 1, 'filename');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_property',
      subtopic_id: 1,
      property_name: 'thumbnail_filename',
      new_value: 'filename',
      old_value: undefined
    }]);
  }
  );

  it('should not create a backend change dict for changing subtopic ' +
    'thumbnail bg color when the subtopic does not exist', () => {
    expect(() => {
      topicUpdateService
        .setSubtopicThumbnailBgColor(_sampleTopic, 10, 'whatever');
    }).toThrowError('Subtopic with id 10 doesn\'t exist');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should create a proper backend change dict for changing subtopic ' +
    'url fragment', () => {
    topicUpdateService.setSubtopicUrlFragment(_sampleTopic, 1, 'subtopic-url');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_property',
      subtopic_id: 1,
      property_name: 'url_fragment',
      new_value: 'subtopic-url',
      old_value: undefined
    }]);
  });

  it('should not create a backend change dict for changing subtopic ' +
    'url fragment when the subtopic does not exist', () => {
    expect(() => {
      topicUpdateService.setSubtopicUrlFragment(_sampleTopic, 10, 'whatever');
    }).toThrowError('Subtopic with id 10 doesn\'t exist');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a subtopic\'s url fragment', () => {
    expect(_sampleTopic.getSubtopics()[0].getUrlFragment()).toEqual(undefined);

    topicUpdateService.setSubtopicUrlFragment(_sampleTopic, 1, 'test-url');
    expect(_sampleTopic.getSubtopics()[0].getUrlFragment()).toEqual(
      'test-url');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getUrlFragment())
      .toEqual(undefined);
  });

  it('should set/unset changes to a subtopic\'s thumbnail bg ' +
    'color', () => {
    expect(_sampleTopic.getSubtopics()[0].getThumbnailBgColor())
      .toEqual(undefined);

    topicUpdateService
      .setSubtopicThumbnailBgColor(_sampleTopic, 1, '#ffffff');
    expect(_sampleTopic.getSubtopics()[0].getThumbnailBgColor())
      .toEqual('#ffffff');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getThumbnailBgColor())
      .toEqual(undefined);
  });

  it('should create a proper backend change dict for changing subtopic ' +
    'thumbnail bg color', () => {
    topicUpdateService
      .setSubtopicThumbnailBgColor(_sampleTopic, 1, '#ffffff');
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_property',
      subtopic_id: 1,
      property_name: 'thumbnail_bg_color',
      new_value: '#ffffff',
      old_value: undefined
    }]);
  });

  it('should add/remove a subtopic', () => {
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
    topicUpdateService.addSubtopic(_sampleTopic, 'Title2', 'frag-two');
    expect(_sampleTopic.getSubtopics().length).toEqual(2);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(3);
    expect(_sampleTopic.getSubtopics()[1].getTitle()).toEqual('Title2');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
  });

  it('should rearrange a canonical story', () => {
    let canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds.length).toEqual(3);
    expect(canonicalStoryIds[0]).toEqual('story_1');
    expect(canonicalStoryIds[1]).toEqual('story_2');
    expect(canonicalStoryIds[2]).toEqual('story_3');

    topicUpdateService.rearrangeCanonicalStory(_sampleTopic, 1, 0);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_2');
    expect(canonicalStoryIds[1]).toEqual('story_1');
    expect(canonicalStoryIds[2]).toEqual('story_3');

    topicUpdateService.rearrangeCanonicalStory(_sampleTopic, 2, 1);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_2');
    expect(canonicalStoryIds[1]).toEqual('story_3');
    expect(canonicalStoryIds[2]).toEqual('story_1');

    topicUpdateService.rearrangeCanonicalStory(_sampleTopic, 2, 0);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_1');
    expect(canonicalStoryIds[1]).toEqual('story_2');
    expect(canonicalStoryIds[2]).toEqual('story_3');

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getCanonicalStoryIds().length).toEqual(3);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_2');
    expect(canonicalStoryIds[1]).toEqual('story_3');
    expect(canonicalStoryIds[2]).toEqual('story_1');

    topicUpdateService.rearrangeCanonicalStory(_sampleTopic, 2, 0);
    canonicalStoryIds = _sampleTopic.getCanonicalStoryIds();
    expect(canonicalStoryIds[0]).toEqual('story_1');
    expect(canonicalStoryIds[1]).toEqual('story_2');
    expect(canonicalStoryIds[2]).toEqual('story_3');
  });

  it('should rearrange a skill in a subtopic', () => {
    sampleTopicBackendObject.topicDict.subtopics[0].skill_ids = [
      'skill_id_1', 'skill_id_2', 'skill_id_3'];
    _sampleTopic = Topic.create(
      sampleTopicBackendObject.topicDict as TopicBackendDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
    let skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills.length).toEqual(3);
    expect(skills[0].getId()).toEqual('skill_id_1');
    expect(skills[1].getId()).toEqual('skill_id_2');
    expect(skills[2].getId()).toEqual('skill_id_3');

    topicUpdateService.rearrangeSkillInSubtopic(_sampleTopic, 1, 1, 0);
    skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills[0].getId()).toEqual('skill_id_2');
    expect(skills[1].getId()).toEqual('skill_id_1');
    expect(skills[2].getId()).toEqual('skill_id_3');

    topicUpdateService.rearrangeSkillInSubtopic(_sampleTopic, 1, 2, 1);
    skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills[0].getId()).toEqual('skill_id_2');
    expect(skills[1].getId()).toEqual('skill_id_3');
    expect(skills[2].getId()).toEqual('skill_id_1');

    topicUpdateService.rearrangeSkillInSubtopic(_sampleTopic, 1, 2, 0);
    skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills[0].getId()).toEqual('skill_id_1');
    expect(skills[1].getId()).toEqual('skill_id_2');
    expect(skills[2].getId()).toEqual('skill_id_3');

    undoRedoService.undoChange(_sampleTopic);
    skills = _sampleTopic.getSubtopicById(1).getSkillSummaries();
    expect(skills[0].getId()).toEqual('skill_id_2');
    expect(skills[1].getId()).toEqual('skill_id_3');
    expect(skills[2].getId()).toEqual('skill_id_1');
    sampleTopicBackendObject.topicDict.subtopics[0].skill_ids = ['skill_2'];
  });

  it('should rearrange a subtopic', () => {
    var subtopicsDict = [{id: 2, title: 'Title2', skill_ids: []},
      {id: 3, title: 'Title3', skill_ids: []}];
    sampleTopicBackendObject.topicDict.subtopics.push(...subtopicsDict);

    _sampleTopic = Topic.create(
      sampleTopicBackendObject.topicDict as TopicBackendDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
    var subtopics = _sampleTopic.getSubtopics();
    expect(subtopics.length).toEqual(3);
    expect(subtopics[0].getId()).toEqual(1);
    expect(subtopics[1].getId()).toEqual(2);
    expect(subtopics[2].getId()).toEqual(3);

    topicUpdateService.rearrangeSubtopic(_sampleTopic, 1, 0);
    subtopics = _sampleTopic.getSubtopics();
    expect(subtopics[0].getId()).toEqual(2);
    expect(subtopics[1].getId()).toEqual(1);
    expect(subtopics[2].getId()).toEqual(3);

    topicUpdateService.rearrangeSubtopic(_sampleTopic, 2, 1);
    subtopics = _sampleTopic.getSubtopics();
    expect(subtopics[0].getId()).toEqual(2);
    expect(subtopics[1].getId()).toEqual(3);
    expect(subtopics[2].getId()).toEqual(1);

    topicUpdateService.rearrangeSubtopic(_sampleTopic, 2, 0);
    subtopics = _sampleTopic.getSubtopics();
    expect(subtopics[0].getId()).toEqual(1);
    expect(subtopics[1].getId()).toEqual(2);
    expect(subtopics[2].getId()).toEqual(3);

    undoRedoService.undoChange(_sampleTopic);
    subtopics = _sampleTopic.getSubtopics();
    expect(subtopics[0].getId()).toEqual(2);
    expect(subtopics[1].getId()).toEqual(3);
    expect(subtopics[2].getId()).toEqual(1);
    sampleTopicBackendObject.topicDict.subtopics = [{
      id: 1,
      title: 'Title',
      skill_ids: ['skill_2']
    }];
  });

  it('should create a proper backend change dict for adding a subtopic',
    () => {
      topicUpdateService.addSubtopic(_sampleTopic, 'Title2', 'frag-two');
      expect(undoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_subtopic',
        subtopic_id: 2,
        title: 'Title2',
        url_fragment: 'frag-two'
      }]);
    }
  );

  it('should remove/add a subtopic', () => {
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
    topicUpdateService.deleteSubtopic(_sampleTopic, 1);
    expect(_sampleTopic.getSubtopics()).toEqual([]);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary, _secondSkillSummary
    ]);

    expect(() => {
      undoRedoService.undoChange(_sampleTopic);
    }).toThrowError('A deleted subtopic cannot be restored');
  });

  it('should properly remove/add a newly created subtopic', () => {
    topicUpdateService.addSubtopic(_sampleTopic, 'Title2', 'frag-two');
    topicUpdateService.addSubtopic(_sampleTopic, 'Title3', 'frag-three');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);
    expect(_sampleTopic.getSubtopics()[2].getId()).toEqual(3);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(4);

    topicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(_sampleTopic.getSubtopics().length).toEqual(2);
    expect(_sampleTopic.getSubtopics()[1].getTitle()).toEqual('Title3');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(3);

    expect(undoRedoService.getChangeCount()).toEqual(1);
  });

  it('should create a proper backend change dict for deleting ' +
    'a subtopic', () => {
    topicUpdateService.deleteSubtopic(_sampleTopic, 1);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'delete_subtopic',
      subtopic_id: 1
    }]);
  }
  );

  it('should not create a backend change dict for deleting a subtopic ' +
    'when an error is encountered', () => {
    expect(() => {
      topicUpdateService.deleteSubtopic(_sampleTopic, 10);
    }).toThrowError('Subtopic with id 10 doesn\'t exist');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should not create a backend change dict for moving subtopic' +
    'when error is thrown', () => {
    expect(() => {
      topicUpdateService.moveSkillToSubtopic(_sampleTopic, 1, null, undefined);
    }).toThrowError('New subtopic cannot be null');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should move/undo move a skill id to a subtopic', () => {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary, _firstSkillSummary
    ]);

    /** Undo back to uncategorized */
    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);

    /**
     * Undo back to old subtopic
     *  Move to _sampleTopic, move to _sampleTopic2, then undo
     */
    topicUpdateService.addSubtopic(_sampleTopic, 'Title 2', 'frag-two');

    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary, _firstSkillSummary
    ]);

    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _firstSkillSummary);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual(
      [_secondSkillSummary]);
    expect(_sampleTopic.getSubtopics()[1].getSkillSummaries()).toEqual(
      [_firstSkillSummary]);

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary, _firstSkillSummary
    ]);
  });

  it('should correctly create changelists when moving a skill to a newly ' +
    'created subtopic that has since been deleted', () => {
    topicUpdateService.addSubtopic(_sampleTopic, 'Title 2', 'frag-two');
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 2, _firstSkillSummary
    );
    topicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 2, _firstSkillSummary
    );
    topicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);

    topicUpdateService.addSubtopic(_sampleTopic, 'Title 2', 'frag-two');
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _secondSkillSummary
    );
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 2, 1, _secondSkillSummary
    );
    topicUpdateService.deleteSubtopic(_sampleTopic, 2);

    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      skill_id: 'skill_2',
      subtopic_id: 1
    }, {
      cmd: 'move_skill_id_to_subtopic',
      skill_id: 'skill_2',
      new_subtopic_id: 1,
      old_subtopic_id: null
    }]);
    undoRedoService.clearChanges();

    topicUpdateService.addSubtopic(_sampleTopic, 'Title 2', 'frag-two');
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 2, _firstSkillSummary
    );
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _secondSkillSummary
    );
    topicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      skill_id: 'skill_2',
      subtopic_id: 1
    }]);
  });

  it('should create properly decrement subtopic ids of later subtopics when ' +
    'a newly created subtopic is deleted', () => {
    topicUpdateService.addSubtopic(_sampleTopic, 'Title 2', 'frag-two');
    topicUpdateService.addSubtopic(_sampleTopic, 'Title 3', 'frag-three');
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 3, _secondSkillSummary
    );
    topicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_subtopic',
      title: 'Title 3',
      subtopic_id: 2,
      url_fragment: 'frag-three'
    }, {
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: 1,
      new_subtopic_id: 2,
      skill_id: 'skill_2'
    }]);
  });

  it('should properly decrement subtopic ids of moved subtopics ' +
    'when a newly created subtopic is deleted', () => {
    topicUpdateService.addSubtopic(_sampleTopic, 'Title 2', 'frag-two');
    topicUpdateService.addSubtopic(_sampleTopic, 'Title 3', 'frag-three');
    topicUpdateService.addSubtopic(_sampleTopic, 'Title 4', 'frag-four');

    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 3, _secondSkillSummary
    );
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 3, 4, _secondSkillSummary
    );
    topicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_subtopic',
      title: 'Title 3',
      subtopic_id: 2,
      url_fragment: 'frag-three'
    }, {
      cmd: 'add_subtopic',
      title: 'Title 4',
      subtopic_id: 3,
      url_fragment: 'frag-four'
    }, {
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: 1,
      new_subtopic_id: 2,
      skill_id: 'skill_2'
    }, {
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: 2,
      new_subtopic_id: 3,
      skill_id: 'skill_2'
    }]);
  });

  it('should create a proper backend change dict for moving a skill id to a ' +
    'subtopic', () => {
    topicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: null,
      new_subtopic_id: 1,
      skill_id: 'skill_1'
    }]);
  });

  it('should not create a backend change dict for moving a skill id to a' +
    'subtopic when an error is encountered', () => {
    expect(() => {
      topicUpdateService.moveSkillToSubtopic(
        _sampleTopic, null, 1, _secondSkillSummary);
    }).toThrowError('Given skillId is not an uncategorized skill.');
    expect(() => {
      topicUpdateService.moveSkillToSubtopic(
        _sampleTopic, 1, 2, _secondSkillSummary);
    }).toThrowError(
      'Cannot read properties of null (reading \'addSkill\')');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove a skill id from a subtopic', () => {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
    topicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 1, _secondSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary, _secondSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([]);

    undoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
  });

  it('should create a proper backend change dict for removing a skill id ' +
    'from a subtopic', () => {
    topicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 1, _secondSkillSummary);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      subtopic_id: 1,
      skill_id: 'skill_2'
    }]);
  });

  it('should not create a backend change dict for removing a skill id from a' +
    'subtopic when an error is encountered', () => {
    expect(() => {
      topicUpdateService.removeSkillFromSubtopic(
        _sampleTopic, 1, _firstSkillSummary);
    }).toThrowError('The given skill doesn\'t exist in the subtopic');
    expect(undoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a subtopic page\'s page content', () => {
    var newSampleSubtitledHtmlDict = {
      html: 'new content',
      content_id: 'content'
    };
    var newSampleSubtitledHtml =
      SubtitledHtml.createFromBackendDict(
        newSampleSubtitledHtmlDict);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });
    topicUpdateService.setSubtopicPageContentsHtml(
      _sampleSubtopicPage, 1, newSampleSubtitledHtml);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'new content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });

    undoRedoService.undoChange(_sampleSubtopicPage);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });
  });

  it('should create a proper backend change dict for changing ' +
    'html data', () => {
    let newSampleSubtitledHtmlDict = {
      html: 'new content',
      content_id: 'content'
    };
    let newSampleSubtitledHtml =
      SubtitledHtml.createFromBackendDict(
        newSampleSubtitledHtmlDict);
    topicUpdateService.setSubtopicPageContentsHtml(
      _sampleSubtopicPage, 1, newSampleSubtitledHtml);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_page_property',
      property_name: 'page_contents_html',
      subtopic_id: 1,
      new_value: newSampleSubtitledHtml.toBackendDict(),
      old_value: {
        html: 'test content',
        content_id: 'content'
      }
    }]);
  }
  );

  it('should set/unset changes to a subtopic page\'s audio data', () => {
    var newRecordedVoiceoversDict = {
      voiceovers_mapping: {
        content: {
          en: {
            filename: 'test_2.mp3',
            file_size_bytes: 1000,
            needs_update: false,
            duration_secs: 1.0
          }
        }
      }
    };
    let newVoiceovers = RecordedVoiceovers.createFromBackendDict(
      newRecordedVoiceoversDict);

    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });

    topicUpdateService.setSubtopicPageContentsAudio(
      _sampleSubtopicPage, 1, newVoiceovers);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: newRecordedVoiceoversDict
    });

    undoRedoService.undoChange(_sampleSubtopicPage);
    expect(_sampleSubtopicPage.getPageContents().toBackendDict()).toEqual({
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    });
  });

  it('should create a proper backend change dict for changing subtopic ' +
     'page audio data', () => {
    var newRecordedVoiceoversDict = {
      voiceovers_mapping: {
        content: {
          en: {
            filename: 'test_2.mp3',
            file_size_bytes: 1000,
            needs_update: false,
            duration_secs: 1.0
          }
        }
      }
    };
    var newVoiceovers = RecordedVoiceovers.createFromBackendDict(
      newRecordedVoiceoversDict);
    topicUpdateService.setSubtopicPageContentsAudio(
      _sampleSubtopicPage, 1, newVoiceovers);
    expect(undoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_subtopic_page_property',
      property_name: 'page_contents_audio',
      subtopic_id: 1,
      new_value: newVoiceovers.toBackendDict(),
      old_value: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false,
              duration_secs: 0.1
            }
          }
        }
      }
    }]);
  });
});
