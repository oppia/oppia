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
 * @fileoverview Unit tests for the services and controllers of the exploration
 *   editor page.
 */

describe('Exploration context service', function() {
  beforeEach(module('oppia'));

  describe('behavior in the learner view', function() {
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

    it('should correctly retrieve the exploration id', function() {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the page context', function() {
      expect(ecs.getPageContext()).toBe('learner');
    });
  });

  describe('behavior in the editor view', function() {
    var ecs = null;

    beforeEach(function() {
      module(function($provide) {
        $provide.value('UrlService', {
          getPathname: function() {
            return '/create/123';
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

    it('should retrieve other as page context',
      function() {
        expect(ecs.getPageContext()).toBe('other');
      }
    );
  });
});
