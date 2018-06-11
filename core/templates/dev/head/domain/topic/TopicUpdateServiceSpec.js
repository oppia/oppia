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
  var UndoRedoService = null;
  var _sampleTopic = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    TopicUpdateService = $injector.get('TopicUpdateService');
    TopicObjectFactory = $injector.get('TopicObjectFactory');
    UndoRedoService = $injector.get('UndoRedoService');

    var sampleTopicBackendObject = {
      id: 'sample_topic_id',
      name: 'Topic name',
      description: 'Topic description',
      version: 1,
      uncategorized_skill_ids: ['skill_1'],
      canonical_story_ids: ['story_1'],
      additional_story_ids: ['story_2'],
      subtopics: [],
      language_code: 'en'
    };
    _sampleTopic = TopicObjectFactory.create(sampleTopicBackendObject);
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
      old_value: ['story_2']
    }]);
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
      old_value: ['story_2']
    }]);
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
      old_value: ['story_1']
    }]);
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
      old_value: ['story_1']
    }]);
  });

  it('should add/remove an uncategorized skill id to/from a topic',
    function() {
      expect(_sampleTopic.getUncategorizedSkillIds()).toEqual(['skill_1']);
      TopicUpdateService.addUncategorizedSkillId(_sampleTopic, 'skill_2');
      expect(_sampleTopic.getUncategorizedSkillIds()).toEqual([
        'skill_1', 'skill_2'
      ]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getUncategorizedSkillIds()).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for adding an uncategorized ' +
    'skill id',
  function() {
    TopicUpdateService.addUncategorizedSkillId(_sampleTopic, 'skill_2');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'add_uncategorized_skill_id',
      new_uncategorized_skill_id: 'skill_2'
    }]);
  });

  it('should remove/add an uncategorized skill id from/to a topic',
    function() {
      expect(_sampleTopic.getUncategorizedSkillIds()).toEqual(['skill_1']);
      TopicUpdateService.removeUncategorizedSkillId(_sampleTopic, 'skill_1');
      expect(_sampleTopic.getUncategorizedSkillIds()).toEqual([]);

      UndoRedoService.undoChange(_sampleTopic);
      expect(_sampleTopic.getUncategorizedSkillIds()).toEqual(['skill_1']);
    }
  );

  it('should create a proper backend change dict for removing an ' +
    'uncategorized skill id',
  function() {
    TopicUpdateService.removeUncategorizedSkillId(_sampleTopic, 'skill_1');
    expect(UndoRedoService.getCommittableChangeList()).toEqual([{
      cmd: 'remove_uncategorized_skill_id',
      uncategorized_skill_id: 'skill_1'
    }]);
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
        old_value: 'Topic name'
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
        old_value: 'Topic description'
      }]);
    }
  );

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
        old_value: 'en'
      }]);
    }
  );
});
