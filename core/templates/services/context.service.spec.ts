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
      spyOn(urlService, 'getHash').and.returnValue('');
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

    it('should affirm that the page forbids editing of RTE components', () => {
      expect(ecs.canAddOrEditComponents()).toBe(false);
    });

    it('should correctly return if question player is manually set', () => {
      expect(ecs.isInQuestionPlayerMode()).toEqual(false);
      ecs.setQuestionPlayerIsOpen();
      expect(ecs.getQuestionPlayerIsManuallySet()).toEqual(true);
      expect(ecs.isInQuestionPlayerMode()).toEqual(true);
      ecs.clearQuestionPlayerIsOpen();
      expect(ecs.getQuestionPlayerIsManuallySet()).toEqual(false);
      expect(ecs.isInQuestionPlayerMode()).toEqual(false);
    });
  });

  describe('behavior in the exploration learner embed view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue(
        '/embed/exploration/123');
      spyOn(urlService, 'getHash').and.returnValue('');
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

    it('should affirm that the page forbids editing of RTE components', () => {
      expect(ecs.canAddOrEditComponents()).toBe(false);
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

    it('should correctly check that page allows editing of RTE components',
      () => {
        expect(ecs.canAddOrEditComponents()).toBe(true);
      });
  });

  describe('behavior in the topic editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/topic_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('');
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

    it('should correctly check that page allows editing of RTE components',
      () => {
        expect(ecs.canAddOrEditComponents()).toBe(true);
      });
  });

  describe('behavior in question editor modal', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
    });

    it('should correctly retrieve the values in topic editor', () => {
      spyOn(urlService, 'getPathname').and.returnValue('/topic_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('#/questions#questionId');

      expect(ecs.getEntityType()).toBe('question');
      expect(ecs.getEntityId()).toBe('questionId');
    });

    it('should correctly retrieve the values in skill editor', () => {
      spyOn(urlService, 'getPathname').and.returnValue('/skill_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('#/questions#questionId');

      expect(ecs.getEntityType()).toBe('question');
      expect(ecs.getEntityId()).toBe('questionId');
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

    it('should correctly check that page allows editing of RTE components',
      () => {
        expect(ecs.canAddOrEditComponents()).toBe(true);
      });
  });

  describe('behavior in the skill editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/skill_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('');
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

    it('should correctly check that page allows editing of RTE components',
      () => {
        expect(ecs.canAddOrEditComponents()).toBe(true);
      });
  });

  describe('behavior in other pages', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/about');
      spyOn(urlService, 'getHash').and.returnValue('');
    });

    it('should check that the community dashboard question editor is open',
      () => {
        expect(ecs.getContributorDashboardQuestionEditorIsOpen()).toBeFalse();
        ecs.setContributorDashboardQuestionEditorIsOpen();
        expect(ecs.getContributorDashboardQuestionEditorIsOpen()).toBeTrue();
      }
    );

    it('should check that the community dashboard question editor is closed',
      () => {
        expect(ecs.getContributorDashboardQuestionEditorIsOpen()).toBeFalse();
        ecs.setContributorDashboardQuestionEditorIsOpen();
        expect(ecs.getContributorDashboardQuestionEditorIsOpen()).toBeTrue();
        ecs.clearContributorDashboardQuestionEditorIsOpen();
        expect(ecs.getContributorDashboardQuestionEditorIsOpen()).toBeFalse();
      }
    );

    it('should throw an error when trying to retrieve the exploration id',
      () => {
        expect(() => ecs.getExplorationId()).toThrowError(
          'ContextService should not be used outside the ' +
          'context of an exploration or a question.');
      }
    );

    it('should retrieve other as page context', () => {
      expect(ecs.getPageContext()).toBe('other');
    }
    );
  });
});
