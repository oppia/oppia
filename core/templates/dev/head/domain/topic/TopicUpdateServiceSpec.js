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
 * @fileoverview Tests for Topic update service.
 */

describe('Topic update service', function() {
  var TopicUpdateService = null;
  var TopicObjectFactory = null;
  var SubtopicObjectFactory = null;
  var SkillSummaryObjectFactory = null;
  var SubtopicPageObjectFactory = null;
  var UndoRedoService = null;
  var _sampleTopic = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    TopicUpdateService = $injector.get('TopicUpdateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    SubtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');
    SkillSummaryObjectFactory = $injector.get('SkillSummaryObjectFactory');

    var sampleTopicBackendObject = {
      topicDict: {
        id: 'sample_topic_id',
        name: 'Topic name',
        description: 'Topic description',
        version: 1,
        uncategorized_skill_ids: ['skill_1'],
        canonical_story_ids: ['story_1'],
        additional_story_ids: ['story_2'],
        subtopics: [{
          id: 1,
          title: 'Title',
          skill_ids: ['skill_2']
        }],
        next_subtopic_id: 2,
        language_code: 'en'
      },
      skillIdToDescriptionDict: {
        skill_1: 'Description 1',
        skill_2: 'Description 2'
      }
    };
    var sampleSubtopicPageObject = {
      id: 'topic_id-1',
      topic_id: 'topic_id',
      html_data: '<p>Data</p>',
      language_code: 'en'
    };
    _firstSkillSummary = SkillSummaryObjectFactory.create(
      'skill_1', 'Description 1');
    _secondSkillSummary = SkillSummaryObjectFactory.create(
      'skill_2', 'Description 2');
    _thirdSkillSummary = SkillSummaryObjectFactory.create(
      'skill_3', 'Description 3');

    _sampleSubtopicPage = SubtopicPageObjectFactory.createFromBackendDict(
      sampleSubtopicPageObject);
    _sampleTopic = TopicObjectFactory.create(
      sampleTopicBackendObject.topicDict,
      sampleTopicBackendObject.skillIdToDescriptionDict);
  }));

  it('should add/remove an additional story id to/from a topic',
    function() {
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
      TopicUpdateService.addAdditionalStoryId(_sampleTopic, 'story_3');
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual([
        'story_2', 'story_3'
      ]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
    }
  );

  it('should create a proper backend change dict for adding an additional ' +
    'story id',
  function() {
    TopicUpdateService.addAdditionalStoryId(_sampleTopic, 'story_3');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'additional_story_ids',
      new_value: ['story_2', 'story_3'],
      old_value: ['story_2'],
      change_affects_subtopic_page: false
    }]);
  });

  it('should not create a backend change dict for adding an additional ' +
    'story id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.addAdditionalStoryId(_sampleTopic, 'story_2');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add an additional story id from/to a topic',
    function() {
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
      TopicUpdateService.removeAdditionalStoryId(_sampleTopic, 'story_2');
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual([]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getAdditionalStoryIds()).toEqual(['story_2']);
    }
  );

  it('should create a proper backend change dict for removing an additional ' +
    'story id',
  function() {
    TopicUpdateService.removeAdditionalStoryId(_sampleTopic, 'story_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'additional_story_ids',
      new_value: [],
      old_value: ['story_2'],
      change_affects_subtopic_page: false
    }]);
  });

  it('should not create a backend change dict for removing an additional ' +
    'story id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.removeAdditionalStoryId(_sampleTopic, 'story_5');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should add/remove a canonical story id to/from a topic',
    function() {
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1']);
      TopicUpdateService.addCanonicalStoryId(_sampleTopic, 'story_3');
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual([
        'story_1', 'story_3'
      ]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1']);
    }
  );

  it('should create a proper backend change dict for adding a canonical ' +
    'story id',
  function() {
    TopicUpdateService.addCanonicalStoryId(_sampleTopic, 'story_3');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'canonical_story_ids',
      new_value: ['story_1', 'story_3'],
      old_value: ['story_1'],
      change_affects_subtopic_page: false
    }]);
  });

  it('should not create a backend change dict for adding a canonical ' +
    'story id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.addCanonicalStoryId(_sampleTopic, 'story_1');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add a canonical story id from/to a topic',
    function() {
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1']);
      TopicUpdateService.removeCanonicalStoryId(_sampleTopic, 'story_1');
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual([]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getCanonicalStoryIds()).toEqual(['story_1']);
    }
  );

  it('should create a proper backend change dict for removing a canonical ' +
    'story id',
  function() {
    TopicUpdateService.removeCanonicalStoryId(_sampleTopic, 'story_1');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'update_topic_property',
      property_name: 'canonical_story_ids',
      new_value: [],
      old_value: ['story_1'],
      change_affects_subtopic_page: false
    }]);
  });

  it('should not create a backend change dict for removing a canonical ' +
    'story id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.removeCanonicalStoryId(_sampleTopic, 'story_10');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should add/remove an uncategorized skill id to/from a topic',
    function() {
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary
      ]);
      TopicUpdateService.addUncategorizedSkill(
        _sampleTopic, _thirdSkillSummary);
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary, _thirdSkillSummary
      ]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary
      ]);
    }
  );

  it('should create a proper backend change dict for adding an uncategorized ' +
    'skill id',
  function() {
    TopicUpdateService.addUncategorizedSkill(
      _sampleTopic, _thirdSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_uncategorized_skill_id',
      new_uncategorized_skill_id: 'skill_3',
      change_affects_subtopic_page: false
    }]);
  });

  it('should not create a backend change dict for adding an uncategorized ' +
    'skill id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.addUncategorizedSkill(
        _sampleTopic, _firstSkillSummary);
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove/add an uncategorized skill id from/to a topic',
    function() {
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary
      ]);
      TopicUpdateService.removeUncategorizedSkill(
        _sampleTopic, _firstSkillSummary
      );
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
        _firstSkillSummary
      ]);
    }
  );

  it('should create a proper backend change dict for removing an ' +
    'uncategorized skill id',
  function() {
    TopicUpdateService.removeUncategorizedSkill(
      _sampleTopic, _firstSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_uncategorized_skill_id',
      uncategorized_skill_id: 'skill_1',
      change_affects_subtopic_page: false
    }]);
  });

  it('should not create a backend change dict for removing an uncategorized ' +
    'skill id when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.removeUncategorizedSkill(_sampleTopic, 'skill_10');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a topic\'s name', function() {
    expect(_sampleTopic.getName()).toEqual('Topic name');
    TopicUpdateService.setTopicName(_sampleTopic, 'new name');
    expect(_sampleTopic.getName()).toEqual('new name');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getName()).toEqual('Topic name');
  });

  it('should create a proper backend change dict for changing names',
    function() {
      TopicUpdateService.setTopicName(_sampleTopic, 'new name');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_topic_property',
        property_name: 'name',
        new_value: 'new name',
        old_value: 'Topic name',
        change_affects_subtopic_page: false
      }]);
    }
  );

  it('should set/unset changes to a topic\'s description', function() {
    expect(_sampleTopic.getDescription()).toEqual('Topic description');
    TopicUpdateService.setTopicDescription(_sampleTopic, 'new description');
    expect(_sampleTopic.getDescription()).toEqual('new description');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getDescription()).toEqual('Topic description');
  });

  it('should create a proper backend change dict for changing descriptions',
    function() {
      TopicUpdateService.setTopicDescription(_sampleTopic, 'new description');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_topic_property',
        property_name: 'description',
        new_value: 'new description',
        old_value: 'Topic description',
        change_affects_subtopic_page: false
      }]);
    }
  );

  it('should set/unset changes to a subtopic\'s title', function() {
    expect(_sampleTopic.getSubtopics()[0].getTitle()).toEqual('Title');
    TopicUpdateService.setSubtopicTitle(_sampleTopic, 1, 'new title');
    expect(_sampleTopic.getSubtopics()[0].getTitle()).toEqual('new title');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics()[0].getTitle()).toEqual('Title');
  });

  it('should create a proper backend change dict for changing subtopic title',
    function() {
      TopicUpdateService.setSubtopicTitle(_sampleTopic, 1, 'new title');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_subtopic_property',
        subtopic_id: 1,
        property_name: 'title',
        new_value: 'new title',
        old_value: 'Title',
        change_affects_subtopic_page: false
      }]);
    }
  );

  it('should not create a backend change dict for changing subtopic title ' +
    'when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.setSubtopicTitle(_sampleTopic, 10, 'title2');
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should add/remove a subtopic', function() {
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
    expect(_sampleTopic.getSubtopics().length).toEqual(2);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(3);
    expect(_sampleTopic.getSubtopics()[1].getTitle()).toEqual('Title2');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
  });

  it('should create a proper backend change dict for adding a subtopic',
    function() {
      TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'add_subtopic',
        subtopic_id: 2,
        title: 'Title2',
        change_affects_subtopic_page: false
      }]);
    }
  );

  it('should remove/add a subtopic', function() {
    expect(_sampleTopic.getSubtopics().length).toEqual(1);
    TopicUpdateService.deleteSubtopic(_sampleTopic, 1);
    expect(_sampleTopic.getSubtopics()).toEqual([]);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary, _secondSkillSummary
    ]);

    expect(function() {
      UndoRedoService.undoChange(_sampleTopic);
    }).toThrow();
  });

  it('should properly remove/add a newly created subtopic', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title2');
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title3');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);
    expect(_sampleTopic.getSubtopics()[2].getId()).toEqual(3);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(4);

    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(_sampleTopic.getSubtopics().length).toEqual(2);
    expect(_sampleTopic.getSubtopics()[1].getTitle()).toEqual('Title3');
    expect(_sampleTopic.getSubtopics()[1].getId()).toEqual(2);
    expect(_sampleTopic.getNextSubtopicId()).toEqual(3);

    expect(UndoRedoService.getChangeCount()).toEqual(1);
  });

  it('should create a proper backend change dict for deleting a subtopic',
    function() {
      TopicUpdateService.deleteSubtopic(_sampleTopic, 1);
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'delete_subtopic',
        subtopic_id: 1,
        change_affects_subtopic_page: false
      }]);
    }
  );

  it('should not create a backend change dict for deleting a subtopic ' +
    'when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.deleteSubtopic(_sampleTopic, 10);
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should move a skill id to a subtopic', function() {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary, _firstSkillSummary
    ]);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
  });

  it('should correctly create changelists when moving a skill to a newly ' +
    'created subtopic that has since been deleted', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 2, _firstSkillSummary
    );
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 2, _firstSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);

    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _secondSkillSummary
    );
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 2, 1, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      skill_id: 'skill_2',
      subtopic_id: 1,
      change_affects_subtopic_page: false
    }, {
      cmd: 'move_skill_id_to_subtopic',
      skill_id: 'skill_2',
      new_subtopic_id: 1,
      old_subtopic_id: null,
      change_affects_subtopic_page: false
    }]);
    UndoRedoService.clearChanges();

    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 2, _firstSkillSummary
    );
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 2, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      skill_id: 'skill_2',
      subtopic_id: 1,
      change_affects_subtopic_page: false
    }]);
  });

  it('should create properly decrement subtopic ids of later subtopics when ' +
    'a newly created subtopic is deleted', function() {
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 2');
    TopicUpdateService.addSubtopic(_sampleTopic, 'Title 3');
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, 1, 3, _secondSkillSummary
    );
    TopicUpdateService.deleteSubtopic(_sampleTopic, 2);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_subtopic',
      title: 'Title 3',
      change_affects_subtopic_page: false,
      subtopic_id: 2
    }, {
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: 1,
      new_subtopic_id: 2,
      skill_id: 'skill_2',
      change_affects_subtopic_page: false
    }]);
  });

  it('should create a proper backend change dict for moving a skill id to a ' +
    'subtopic',
  function() {
    TopicUpdateService.moveSkillToSubtopic(
      _sampleTopic, null, 1, _firstSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'move_skill_id_to_subtopic',
      old_subtopic_id: null,
      new_subtopic_id: 1,
      skill_id: 'skill_1',
      change_affects_subtopic_page: false
    }]);
  });

  it('should not create a backend change dict for moving a skill id to a' +
    'subtopic when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.moveSkillToSubtopic(
        _sampleTopic, null, 1, _secondSkillSummary);
    }).toThrow();
    expect(function() {
      TopicUpdateService.moveSkillToSubtopic(
        _sampleTopic, 1, 2, _secondSkillSummary);
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should remove a skill id from a subtopic', function() {
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 1, _secondSkillSummary);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary, _secondSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([]);

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getUncategorizedSkillSummaries()).toEqual([
      _firstSkillSummary
    ]);
    expect(_sampleTopic.getSubtopics()[0].getSkillSummaries()).toEqual([
      _secondSkillSummary
    ]);
  });

  it('should create a proper backend change dict for removing a skill id ' +
    'from a subtopic',
  function() {
    TopicUpdateService.removeSkillFromSubtopic(
      _sampleTopic, 1, _secondSkillSummary);
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_skill_id_from_subtopic',
      subtopic_id: 1,
      skill_id: 'skill_2',
      change_affects_subtopic_page: false
    }]);
  });

  it('should not create a backend change dict for removing a skill id from a' +
    'subtopic when an error is encountered',
  function() {
    expect(function() {
      TopicUpdateService.removeSkillFromSubtopic(
        _sampleTopic, 1, _firstSkillSummary);
    }).toThrow();
    expect(UndoRedoService.getCommittableChangeList()).toEqual([]);
  });

  it('should set/unset changes to a topic\'s language code', function() {
    expect(_sampleTopic.getLanguageCode()).toEqual('en');
    TopicUpdateService.setTopicLanguageCode(_sampleTopic, 'fi');
    expect(_sampleTopic.getLanguageCode()).toEqual('fi');

    UndoRedoService.undoChange(_sampleTopic);
    expect(_sampleTopic.getLanguageCode()).toEqual('en');
  });

  it('should create a proper backend change dict for changing language codes',
    function() {
      TopicUpdateService.setTopicLanguageCode(_sampleTopic, 'fi');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_topic_property',
        property_name: 'language_code',
        new_value: 'fi',
        old_value: 'en',
        change_affects_subtopic_page: false
      }]);
    }
  );

  it('should set/unset changes to a subtopic page\'s html data', function() {
    expect(_sampleSubtopicPage.getHtmlData()).toEqual('<p>Data</p>');
    TopicUpdateService.setSubtopicPageHtmlData(
      _sampleSubtopicPage, 1, '<p>New Data</p>');
    expect(_sampleSubtopicPage.getHtmlData()).toEqual('<p>New Data</p>');

    UndoRedoService.undoChange(_sampleSubtopicPage);
    expect(_sampleSubtopicPage.getHtmlData()).toEqual('<p>Data</p>');
  });

  it('should create a proper backend change dict for changing html data',
    function() {
      TopicUpdateService.setSubtopicPageHtmlData(
        _sampleSubtopicPage, 1, '<p>New Data</p>');
      expect(UndoRedoService.getCommittableChangeList()).toEqual([{
        cmd: 'update_subtopic_page_property',
        property_name: 'html_data',
        subtopic_id: 1,
        new_value: '<p>New Data</p>',
        old_value: '<p>Data</p>',
        change_affects_subtopic_page: true
      }]);
    }
  );
});
