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

describe('Context service', function() {
  beforeEach(module('oppia'));

  describe('behavior in the exploration learner view', function() {
    var ecs = null;

    beforeEach(function() {
      module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/explore/123';
          }
        });
      });
    });

    beforeEach(module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

    beforeEach(inject(function($injector) {
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
  });

  describe('behavior in the exploration editor view', function() {
    var ecs = null;

    beforeEach(function() {
      module(function($provide) {
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

    beforeEach(inject(function($injector) {
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
  });

  describe('behavior in the question editor view', function() {
    var ecs = null;

    beforeEach(function() {
      module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/question_editor/123';
          }
        });
      });
    });

    beforeEach(inject(function($injector) {
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

  describe('behavior in other pages', function() {
    var ecs = null;

    beforeEach(function() {
      module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/about';
          }
        });
      });
    });

    beforeEach(inject(function($injector) {
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
