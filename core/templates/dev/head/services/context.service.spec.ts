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

import { TestBed } from '@angular/core/testing';

import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';

describe('Context service', () => {
  let ecs: ContextService = null;
  let urlService: UrlService = null;

  describe('behavior in the exploration learner view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/explore/123');
    });

    it('should correctly set editor context to exploration editor', () => {
      ecs.init('exploration_editor');
      expect(ecs.getEditorContext()).toBe('exploration_editor');
    });

    it('should correctly retrieve the exploration id', () => {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('learner');
    });

    it('should correctly retrieve the correct entity type', () => {
      expect(ecs.getEntityType()).toBe('exploration');
    });
  });

  describe('behavior in the exploration learner embed view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and
        .returnValue('/embed/exploration/123');
    });

    it('should correctly set editor context to exploration editor', () => {
      ecs.init('exploration_editor');
      expect(ecs.getEditorContext()).toBe('exploration_editor');
    });

    it('should correctly retrieve the exploration id', () => {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the entity id', () => {
      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('learner');
    });

    it('should correctly retrieve the correct entity type', () => {
      expect(ecs.getEntityType()).toBe('exploration');
    });
  });

  describe('behavior in the exploration editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/create/123');
      spyOn(urlService, 'getHash').and.returnValue('#/gui');
    });

    it('should correctly retrieve the exploration id', () => {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('editor');
    });

    it('should correctly retrieve exploration editor mode', () => {
      expect(ecs.isInExplorationEditorMode()).toBe(true);
    });

    it('should correctly retrieve the correct entity type', () => {
      expect(ecs.getEntityType()).toBe('exploration');
    });
  });

  describe('behavior in the question editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/question_editor/123');
    });

    it('should correctly set editor context to question editor', () => {
      ecs.init('question_editor');
      expect(ecs.getEditorContext()).toBe('question_editor');
    });

    it('should correctly retrieve the question id', () => {
      expect(ecs.getQuestionId()).toBe('123');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('question_editor');
    });

    it('should correctly tell the question editor context', () => {
      expect(ecs.isInQuestionContext()).toBe(true);
    });
  });

  describe('behavior in the topic editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/topic_editor/123');
    });

    it('should correctly set editor context to topic editor', () => {
      ecs.init('topic_editor');
      expect(ecs.getEditorContext()).toBe('topic_editor');
    });

    it('should correctly retrieve the topic id', () => {
      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBe('topic');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('topic_editor');
    });
  });

  describe('behavior in the subtopic viewer view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/subtopic/topic_id/1');
    });

    it('should correctly retrieve the topic id', () => {
      expect(ecs.getEntityId()).toBe('topic_id');
    });

    it('should correctly retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBe('subtopic');
    });
  });

  describe('behavior in the story editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/story_editor/123');
    });

    it('should correctly set editor context to story editor', () => {
      ecs.init('story_editor');
      expect(ecs.getEditorContext()).toBe('story_editor');
    });

    it('should correctly retrieve the story id', () => {
      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBe('story');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('story_editor');
    });
  });

  describe('behavior in the skill editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/skill_editor/123');
    });

    it('should correctly set editor context to skill editor', () => {
      ecs.init('skill_editor');
      expect(ecs.getEditorContext()).toBe('skill_editor');
    });

    it('should correctly retrieve the skill id', () => {
      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBe('skill');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('skill_editor');
    });
  });

  describe('behavior in other pages', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/about');
    });

    it('should throw an error when trying to retrieve the exploration id',
      () => {
        expect(ecs.getExplorationId).toThrow();
      }
    );

    it('should throw an error when trying to retrieve the question id', () => {
      expect(ecs.getQuestionId).toThrow();
    }
    );

    it('should retrieve other as page context', () => {
      expect(ecs.getPageContext()).toBe('other');
    }
    );
  });
});
