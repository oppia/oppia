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
 * @fileoverview Tests for Topic.
 */

import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { Topic } from 'domain/topic/topic-object.model';
import { StoryReference } from './story-reference-object.model';
import { Subtopic } from './subtopic.model';

describe('Topic object factory', () => {
  let _sampleTopic: Topic;
  let skillSummary1: ShortSkillSummary;
  let skillSummary2: ShortSkillSummary;
  let skillSummary3: ShortSkillSummary;

  beforeEach(() => {
    let sampleTopicBackendObject = {
      id: 'sample_topic_id',
      name: 'Topic name',
      abbreviated_name: 'abbrev',
      url_fragment: 'topic-one',
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      description: 'Topic description',
      version: 1,
      uncategorized_skill_ids: ['skill_1', 'skill_2'],
      canonical_story_references: [{
        story_id: 'story_1',
        story_is_published: true
      }, {
        story_id: 'story_4',
        story_is_published: false
      }],
      additional_story_references: [{
        story_id: 'story_2',
        story_is_published: true
      }, {
        story_id: 'story_3',
        story_is_published: false
      }],
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_3'],
        thumbnail_filename: 'img.png',
        thumbnail_bg_color: '#a33f40',
        url_fragment: 'title'
      }],
      next_subtopic_id: 1,
      language_code: 'en',
      meta_tag_content: 'topic meta tag content',
      practice_tab_is_displayed: false,
      page_title_fragment_for_web: 'topic page title',
      skill_ids_for_diagnostic_test: ['skill_1']
    };
    let skillIdToDescriptionDict = {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      skill_3: 'Description 3'
    };
    skillSummary1 = ShortSkillSummary.create(
      'skill_1', 'Description 1');
    skillSummary2 = ShortSkillSummary.create(
      'skill_2', 'Description 2');
    skillSummary3 = ShortSkillSummary.create(
      'skill_3', 'Description 3');

    _sampleTopic = Topic.create(
      sampleTopicBackendObject, skillIdToDescriptionDict);
  });

  it('should not find issues with a valid topic', () => {
    expect(_sampleTopic.validate()).toEqual([]);
  });

  it('should validate the topic', () => {
    _sampleTopic.setName('');
    _sampleTopic.setAbbreviatedName(''),
    _sampleTopic.addCanonicalStory('story_2');
    _sampleTopic.getSubtopics()[0].addSkill('skill_1', '');

    expect(_sampleTopic.validate()).toEqual([
      'Topic name should not be empty.',
      'The story with id story_2 is present in both canonical ' +
      'and additional stories.',
      'The skill with id skill_1 is duplicated in the topic'
    ]);
  });

  it('should warn user if url is in the incorrect format', () => {
    _sampleTopic._urlFragment = '?asd?';
    expect(_sampleTopic.validate()).toEqual([
      'Topic url fragment is not valid.'
    ]);
  });

  it('should warn user when url entered by the user execceds specified' +
  ' limit', () => {
    _sampleTopic._urlFragment = Array(22).join('x');
    expect(_sampleTopic.validate()).toEqual([
      'Topic url fragment should not be longer than 20 characters.'
    ]);
  });

  it('should warn user when no skills were added for the diagnostic test',
    () => {
      _sampleTopic._skillSummariesForDiagnosticTest = [];
      expect(_sampleTopic.prepublishValidate()).toEqual([
        'The diagnostic test for the topic should test at least one skill.'
      ]);
    });

  it('should warn user when more than 3 skills were added for the ' +
    'diagnostic test', () => {
    var shortSkillSummaries = [
      ShortSkillSummary.create('skill 1', 'description 1'),
      ShortSkillSummary.create('skill 2', 'description 2'),
      ShortSkillSummary.create('skill 3', 'description 3'),
      ShortSkillSummary.create('skill 4', 'description 4'),
    ];
    _sampleTopic._skillSummariesForDiagnosticTest = shortSkillSummaries;
    expect(_sampleTopic.prepublishValidate()).toEqual([
      'The diagnostic test for the topic should test at most 3 skills.'
    ]);
  });

  it('should warn user if duplicate stories are present', () => {
    _sampleTopic._canonicalStoryReferences = [
      StoryReference.createFromBackendDict({
        story_id: 'story_1',
        story_is_published: true
      }),
      StoryReference.createFromBackendDict({
        story_id: 'story_1',
        story_is_published: true
      })];

    _sampleTopic._additionalStoryReferences = [
      StoryReference.createFromBackendDict({
        story_id: 'story_4',
        story_is_published: true
      }),
      StoryReference.createFromBackendDict({
        story_id: 'story_4',
        story_is_published: true
      })];

    expect(_sampleTopic.validate()).toEqual([
      'The canonical story with id story_1 is duplicated in the topic.',
      'The canonical story with id story_1 is duplicated in the topic.',
      'The additional story with id story_4 is duplicated in the topic.',
      'The additional story with id story_4 is duplicated in the topic.'
    ]);
  });

  it('should be able to create an interstitial topic object', () => {
    let topic = new Topic(
      'id', 'Topic name loading', 'Abbrev. name loading',
      'Url Fragment loading', 'Topic description loading', 'en',
      [], [], [], 1, 1, [], 'str', '', {}, false, '', '', []
    );
    expect(topic.getId()).toEqual('id');
    expect(topic.getName()).toEqual('Topic name loading');
    expect(topic.getDescription()).toEqual('Topic description loading');
    expect(topic.getLanguageCode()).toBe('en');
    expect(topic.getSubtopics()).toEqual([]);
    expect(topic.getAdditionalStoryReferences()).toEqual([]);
    expect(topic.getCanonicalStoryReferences()).toEqual([]);
    expect(topic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(topic.getSkillSummariesForDiagnosticTest()).toEqual([]);
  });

  it('should be able to correctly update skill Ids for the diagnostic test',
    () => {
      expect(_sampleTopic.getSkillSummariesForDiagnosticTest()).toEqual(
        [skillSummary1]);

      _sampleTopic.setSkillSummariesForDiagnosticTest([skillSummary2]);
      expect(_sampleTopic.getSkillSummariesForDiagnosticTest()).toEqual(
        [skillSummary2]);
    });

  it(
    'should show no available skill summaries when no skill is ' +
    'assigned to the topic', () => {
      _sampleTopic._uncategorizedSkillSummaries = [];
      _sampleTopic._subtopics = [];

      expect(
        _sampleTopic.getAvailableSkillSummariesForDiagnosticTest()
      ).toEqual([]);
    });

  it(
    'should show no available skill summaries when all skills are ' +
    'assigned to the diagnostic test', () => {
      expect(_sampleTopic._uncategorizedSkillSummaries).toEqual(
        [skillSummary1, skillSummary2]);
      expect(_sampleTopic._subtopics[0].getSkillSummaries()).toEqual(
        [skillSummary3]);

      _sampleTopic._skillSummariesForDiagnosticTest = (
        [skillSummary1, skillSummary2, skillSummary3]);

      expect(
        _sampleTopic.getAvailableSkillSummariesForDiagnosticTest()
      ).toEqual([]);
    });

  it(
    'should be able to get all available skill summaries when no skill is ' +
    'assigned to the diagnostic test', () => {
      expect(_sampleTopic._uncategorizedSkillSummaries).toEqual(
        [skillSummary1, skillSummary2]);
      expect(_sampleTopic._subtopics[0].getSkillSummaries()).toEqual(
        [skillSummary3]);

      _sampleTopic._skillSummariesForDiagnosticTest = [];

      expect(
        _sampleTopic.getAvailableSkillSummariesForDiagnosticTest()
      ).toEqual([skillSummary1, skillSummary2, skillSummary3]);
    });

  it(
    'should be able to get available skill summaries when a skill is ' +
    'assigned to the diagnostic test', () => {
      expect(_sampleTopic._uncategorizedSkillSummaries).toEqual(
        [skillSummary1, skillSummary2]);
      expect(_sampleTopic._subtopics[0].getSkillSummaries()).toEqual(
        [skillSummary3]);

      _sampleTopic._skillSummariesForDiagnosticTest = [skillSummary1];

      expect(
        _sampleTopic.getAvailableSkillSummariesForDiagnosticTest()
      ).toEqual([skillSummary2, skillSummary3]);
    });

  it('should correctly remove the various array elements', () => {
    _sampleTopic.removeCanonicalStory('story_1');
    _sampleTopic.removeAdditionalStory('story_2');
    _sampleTopic.removeUncategorizedSkill('skill_1');
    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_3']);
    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_4']);
    expect(_sampleTopic.getUncategorizedSkillSummaries().length).toEqual(1);
    expect(
      _sampleTopic.getUncategorizedSkillSummaries()[0].getId()
    ).toEqual('skill_2');
    expect(
      _sampleTopic.getUncategorizedSkillSummaries()[0].getDescription()
    ).toEqual('Description 2');
  });

  it('should be able to copy from another topic', () => {
    let secondTopic: Topic;
    secondTopic = Topic.create({
      id: 'topic_id_2',
      name: 'Another name',
      abbreviated_name: 'abbrev',
      url_fragment: 'topic-two',
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      description: 'Another description',
      language_code: 'en',
      version: 15,
      canonical_story_references: [{
        story_id: 'story_10',
        story_is_published: true
      }],
      additional_story_references: [{
        story_id: 'story_5',
        story_is_published: true
      }],
      uncategorized_skill_ids: ['skill_2', 'skill_3'],
      next_subtopic_id: 2,
      subtopics: [{
        id: 1,
        title: 'Title',
        skill_ids: ['skill_1'],
        thumbnail_filename: 'img.png',
        thumbnail_bg_color: '#a33f40',
        url_fragment: 'title'
      }],
      practice_tab_is_displayed: false,
      meta_tag_content: 'second topic meta tag content',
      page_title_fragment_for_web: 'topic page title',
      skill_ids_for_diagnostic_test: []
    }, {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      skill_3: 'Description 3'
    });

    expect(_sampleTopic).not.toBe(secondTopic);
    expect(_sampleTopic).not.toEqual(secondTopic);

    _sampleTopic = secondTopic.createCopyFromTopic();
    expect(_sampleTopic).not.toBe(secondTopic);
    expect(_sampleTopic).toEqual(secondTopic);
  });

  it('should warn user when topic has no thumbnail', () => {
    _sampleTopic._thumbnailFilename = '';
    let issue = _sampleTopic.prepublishValidate();

    expect(issue).toEqual(['Topic should have a thumbnail.']);
  });

  it('should warn user when subtopic has no thumbnail', () => {
    spyOn(Subtopic.prototype, 'getSkillSummaries').and.returnValue([]);
    let issue = _sampleTopic.prepublishValidate();

    expect(issue).toEqual(
      ['Subtopic with title Title ' +
      'does not have any skill IDs linked.']);
  });

  it('should warn user when page title is empty', () => {
    _sampleTopic._pageTitleFragmentForWeb = '';
    let issue = _sampleTopic.prepublishValidate();

    expect(issue).toEqual(['Topic should have page title fragment.']);
  });

  it('should warn user when page title length is less than the' +
  ' allowed limit', () => {
    _sampleTopic._pageTitleFragmentForWeb = Array(3).join('a');
    let issue = _sampleTopic.prepublishValidate();

    expect(issue).toEqual(
      ['Topic page title fragment should not be shorter than ' +
      '5 characters.']);
  });

  it('should warn user when page title length is more than the' +
  ' allowed limit', () => {
    _sampleTopic._pageTitleFragmentForWeb = Array(52).join('a');
    let issue = _sampleTopic.prepublishValidate();

    expect(issue).toEqual(
      ['Topic page title fragment should not be longer than ' +
      '50 characters.']);
  });

  it('should warn user when meta tag content is empty', () => {
    _sampleTopic._metaTagContent = '';
    let issue = _sampleTopic.prepublishValidate();

    expect(issue).toEqual(['Topic should have meta tag content.']);
  });

  it('should warn user when meta tag content length is more than the' +
  ' allowed limit', () => {
    _sampleTopic._metaTagContent = Array(162).join('a');
    let issue = _sampleTopic.prepublishValidate();

    expect(issue).toEqual(
      ['Topic meta tag content should not be longer than ' +
      '160 characters.']);
  });

  it('should warn user when no subtopic is assigned', () => {
    _sampleTopic._subtopics = [];
    let issue = _sampleTopic.prepublishValidate();

    expect(issue).toEqual(['Topic should have at least 1 subtopic.']);
  });

  it('should return skill Ids when called', () => {
    expect(_sampleTopic.getSkillIds())
      .toEqual(['skill_1', 'skill_2', 'skill_3']);
  });

  it('should return subtopic when called', () => {
    let subtopic = _sampleTopic.getSubtopicById(1);

    expect(subtopic).toEqual(Subtopic.create({
      id: 1,
      title: 'Title',
      skill_ids: ['skill_3'],
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      url_fragment: 'title'
    }, {
      skill_3: 'Description 3'
    }));
  });

  it('should return null if subtopic id does not exist when called', () => {
    expect(_sampleTopic.getSubtopicById(0)).toBeNull();
  });

  it('should add subtopic when user creates a new subtopic', () => {
    expect(_sampleTopic.getSubtopics()).toEqual([Subtopic.create({
      id: 1,
      title: 'Title',
      skill_ids: ['skill_3'],
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      url_fragment: 'title'
    }, {
      skill_3: 'Description 3'
    })]);

    _sampleTopic.addSubtopic('new subtopic');

    expect(_sampleTopic.getSubtopics()).toEqual([Subtopic.create({
      id: 1,
      title: 'Title',
      skill_ids: ['skill_3'],
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      url_fragment: 'title'
    }, {
      skill_3: 'Description 3'
    }),
    Subtopic.createFromTitle(
      1, 'new subtopic')]);
  });

  it('should throw error when user deletes a subtopic that does' +
  ' not exist', () => {
    expect(_sampleTopic.getSubtopics()).toEqual([Subtopic.create({
      id: 1,
      title: 'Title',
      skill_ids: ['skill_3'],
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      url_fragment: 'title'
    }, {
      skill_3: 'Description 3'
    })]);

    expect(() => {
      _sampleTopic.deleteSubtopic(2, true);
    }).toThrowError('Subtopic to delete does not exist');
  });

  it('should delete subtopic when user deletes a subtopic', () => {
    _sampleTopic._nextSubtopicId = 2;
    _sampleTopic.addSubtopic('new subtopic');
    expect(_sampleTopic.getSubtopics()).toEqual([Subtopic.create({
      id: 1,
      title: 'Title',
      skill_ids: ['skill_3'],
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      url_fragment: 'title'
    }, {
      skill_3: 'Description 3'
    }), Subtopic.createFromTitle(
      2, 'new subtopic')]);

    _sampleTopic.deleteSubtopic(1, true);

    expect(_sampleTopic.getSubtopics()).toEqual([Subtopic.createFromTitle(
      1, 'new subtopic')]);
  });

  it('should rearrange stories when user drags them', () => {
    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1', 'story_4']);

    _sampleTopic.rearrangeCanonicalStory(0, 1);

    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_4', 'story_1']);
  });

  it('should rearrange skills when user drags them', () => {
    _sampleTopic._subtopics = [Subtopic.create({
      id: 1,
      title: 'Title',
      skill_ids: ['skill_1', 'skill_2', 'skill_3'],
      thumbnail_filename: 'img.png',
      thumbnail_bg_color: '#a33f40',
      url_fragment: 'title'
    }, {
      skill_1: 'Description 1',
      skill_2: 'Description 2',
      skill_3: 'Description 3'
    })];

    expect(_sampleTopic._subtopics[0]._skillSummaries).toEqual(
      [ShortSkillSummary.create('skill_1', 'Description 1'),
        ShortSkillSummary.create('skill_2', 'Description 2'),
        ShortSkillSummary.create('skill_3', 'Description 3')]);

    _sampleTopic.rearrangeSkillInSubtopic(1, 0, 1);

    expect(_sampleTopic._subtopics[0]._skillSummaries).toEqual(
      [ShortSkillSummary.create('skill_2', 'Description 2'),
        ShortSkillSummary.create('skill_1', 'Description 1'),
        ShortSkillSummary.create('skill_3', 'Description 3')]);
  });

  it('should rearrange subtopics when user drags them', () => {
    _sampleTopic._nextSubtopicId = 2;
    _sampleTopic.addSubtopic('subtopic2');
    _sampleTopic.addSubtopic('subtopic3');

    expect(_sampleTopic.getSubtopics()).toEqual([
      Subtopic.create({
        id: 1,
        title: 'Title',
        skill_ids: ['skill_3'],
        thumbnail_filename: 'img.png',
        thumbnail_bg_color: '#a33f40',
        url_fragment: 'title'
      }, {
        skill_3: 'Description 3'
      }),
      Subtopic.createFromTitle(2, 'subtopic2'),
      Subtopic.createFromTitle(3, 'subtopic3')]);

    _sampleTopic.rearrangeSubtopic(0, 2);

    expect(_sampleTopic.getSubtopics()).toEqual([
      Subtopic.createFromTitle(2, 'subtopic2'),
      Subtopic.createFromTitle(3, 'subtopic3'),
      Subtopic.create({
        id: 1,
        title: 'Title',
        skill_ids: ['skill_3'],
        thumbnail_filename: 'img.png',
        thumbnail_bg_color: '#a33f40',
        url_fragment: 'title'
      }, {
        skill_3: 'Description 3'
      })]);
  });

  it('should add an uncategorized skill when user creates a skill', () => {
    _sampleTopic.addUncategorizedSkill('skill_4', 'Description 4');

    expect(_sampleTopic._uncategorizedSkillSummaries).toEqual(
      [ShortSkillSummary.create('skill_1', 'Description 1'),
        ShortSkillSummary.create('skill_2', 'Description 2'),
        ShortSkillSummary.create('skill_4', 'Description 4')]);
  });

  it('should warn user if skill is present in a subtopic', () => {
    expect(() => {
      _sampleTopic.addUncategorizedSkill('skill_3', 'Description 3');
    })
      .toThrowError('Given skillId is already present in a subtopic.');
  });

  it('should warn user if skill is created', () => {
    expect(() => {
      _sampleTopic.addUncategorizedSkill('skill_2', 'Description 2');
    })
      .toThrowError('Given skillId is already an uncategorized skill.');
  });

  it('should add Canonical story when user adds it', () => {
    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1', 'story_4']);

    _sampleTopic.addCanonicalStory('story_5');

    expect(_sampleTopic.getCanonicalStoryIds())
      .toEqual(['story_1', 'story_4', 'story_5']);
  });

  it('should not add Canonical story if already present', () => {
    expect(() => {
      _sampleTopic.addCanonicalStory('story_1');
    }).toThrowError('Given story id already present in canonical story ids.');
  });

  it('should remove Canonical story when user deletes story', () => {
    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1', 'story_4']);

    _sampleTopic.removeCanonicalStory('story_1');

    expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_4']);
  });

  it('should throw error when user deletes a Canonical story that' +
  ' does not exist', () => {
    expect(() => {
      _sampleTopic.removeCanonicalStory('story_2');
    }).toThrowError('Given story id not present in canonical story ids.');
  });

  it('should add Additional story when user adds it', () => {
    expect(_sampleTopic.getAdditionalStoryIds())
      .toEqual(['story_2', 'story_3']);

    _sampleTopic.addAdditionalStory('story_5');

    expect(_sampleTopic.getAdditionalStoryIds())
      .toEqual(['story_2', 'story_3', 'story_5']);
  });

  it('should not add Additional story if already present', () => {
    expect(() => {
      _sampleTopic.addAdditionalStory('story_2');
    }).toThrowError('Given story id already present in additional story ids.');
  });

  it('should remove Additional story when user deletes story', () => {
    expect(_sampleTopic.getAdditionalStoryIds())
      .toEqual(['story_2', 'story_3']);

    _sampleTopic.removeAdditionalStory('story_2');

    expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_3']);
  });

  it('should throw error when user deletes a Additional story that' +
  ' does not exist', () => {
    expect(() => {
      _sampleTopic.removeAdditionalStory('story_4');
    }).toThrowError('Given story id not present in additional story ids.');
  });

  it('should remove Uncategorised skill when user deletes a skill', () => {
    expect(_sampleTopic.hasUncategorizedSkill('skill_1')).toBeTrue();

    _sampleTopic.removeUncategorizedSkill('skill_1');

    expect(_sampleTopic.hasUncategorizedSkill('skill_1')).toBeFalse();
  });

  it('should throw error when user deletes Uncategorized skill that' +
  ' does not exist', () => {
    expect(() => {
      _sampleTopic.removeUncategorizedSkill('skill_4');
    }).toThrowError('Given skillId is not an uncategorized skill.');
  });
});
