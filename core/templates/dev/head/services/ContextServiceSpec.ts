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

/**
 * @fileoverview Unit tests for the services and controllers of the
 *   editor page.
 */

require('services/ContextService.ts');

describe('Context service', function() {
  beforeEach(angular.mock.module('oppia'));

  describe('behavior in the exploration learner view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/explore/123';
          }
        });
      });
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly set editor context to exploration editor', function() {
      ecs.init('exploration_editor');
      expect(ecs.getEditorContext()).toBe('exploration_editor');
    });

    it('should correctly retrieve the exploration id', function() {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('learner');
    });

    it('should correctly retrieve the correct entity type', function() {
      expect(ecs.getEntityType()).toBe('exploration');
    });
  });

  describe('behavior in the exploration learner embed view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/embed/exploration/123';
          }
        });
      });
    });

    beforeEach(
      angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly set editor context to exploration editor', function() {
      ecs.init('exploration_editor');
      expect(ecs.getEditorContext()).toBe('exploration_editor');
    });

    it('should correctly retrieve the exploration id', function() {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the entity id', function() {
      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('learner');
    });

    it('should correctly retrieve the correct entity type', function() {
      expect(ecs.getEntityType()).toBe('exploration');
    });
  });

  describe('behavior in the exploration editor view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/create/123';
          },
          getHash: function() {
            return '#/gui';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly retrieve the exploration id', function() {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('editor');
    });

    it('should correctly retrieve exploration editor mode', function() {
      expect(ecs.isInExplorationEditorMode()).toBe(true);
    });

    it('should correctly retrieve the correct entity type', function() {
      expect(ecs.getEntityType()).toBe('exploration');
    });
  });

  describe('behavior in the question editor view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/question_editor/123';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly set editor context to question editor', function() {
      ecs.init('question_editor');
      expect(ecs.getEditorContext()).toBe('question_editor');
    });

    it('should correctly retrieve the question id', function() {
      expect(ecs.getQuestionId()).toBe('123');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('question_editor');
    });

    it('should correctly tell the question editor context', function() {
      expect(ecs.isInQuestionContext()).toBe(true);
    });
  });

  describe('behavior in the topic editor view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/topic_editor/123';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly set editor context to topic editor', function() {
      ecs.init('topic_editor');
      expect(ecs.getEditorContext()).toBe('topic_editor');
    });

    it('should correctly retrieve the topic id', function() {
      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the entity type', function() {
      expect(ecs.getEntityType()).toBe('topic');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('topic_editor');
    });
  });

  describe('behavior in the story editor view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/story_editor/123';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly set editor context to story editor', function() {
      ecs.init('story_editor');
      expect(ecs.getEditorContext()).toBe('story_editor');
    });

    it('should correctly retrieve the story id', function() {
      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the entity type', function() {
      expect(ecs.getEntityType()).toBe('story');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('story_editor');
    });
  });

  describe('behavior in the skill editor view', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/skill_editor/123';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should correctly set editor context to skill editor', function() {
      ecs.init('skill_editor');
      expect(ecs.getEditorContext()).toBe('skill_editor');
    });

    it('should correctly retrieve the skill id', function() {
      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the entity type', function() {
      expect(ecs.getEntityType()).toBe('skill');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('skill_editor');
    });
  });

  describe('behavior in other pages', function() {
    var ecs = null;

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/about';
          }
        });
      });
    });

    beforeEach(angular.mock.inject(function($injector) {
      ecs = $injector.get('ContextService');
    }));

    it('should throw an error when trying to retrieve the exploration id',
      function() {
        expect(ecs.getExplorationId).toThrow();
      }
    );

    it('should throw an error when trying to retrieve the question id',
      function() {
        expect(ecs.getQuestionId).toThrow();
      }
    );

    it('should retrieve other as page context',
      function() {
        expect(ecs.getPageContext()).toBe('other');
      }
    );
  });
});
