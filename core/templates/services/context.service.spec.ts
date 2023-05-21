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
import { BlogPostPageService } from 'pages/blog-post-page/services/blog-post-page.service';

import { WindowRef } from 'services/contextual/window-ref.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

class MockWindowRef {
  _window = {
    location: {
      _pathname: '/explore/123',
      _href: '',
      get pathname(): string {
        return this._pathname;
      },
      set pathname(val: string) {
        this._pathname = val;
      },
      get href(): string {
        return this._href;
      },
      set href(val) {
        this._href = val;
      }
    }
  };

  get nativeWindow() {
    return this._window;
  }
}

describe('Context service', () => {
  let ecs: ContextService;
  let urlService: UrlService;
  let windowRef: MockWindowRef;
  let blogPostPageService: BlogPostPageService;

  describe('behavior in the exploration learner view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/explore/123');
      spyOn(urlService, 'getHash').and.returnValue('');
      ecs.removeCustomEntityContext();
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

    it('should check if exploration is linked to a story', () => {
      expect(ecs.isExplorationLinkedToStory()).toBe(false);
      ecs.setExplorationIsLinkedToStory();
      expect(ecs.isExplorationLinkedToStory()).toBe(true);
    });
  });

  describe('behavior in the exploration learner embed view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue(
        '/embed/exploration/123');
      spyOn(urlService, 'getHash').and.returnValue('');
      ecs.removeCustomEntityContext();
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
      ecs.removeCustomEntityContext();
    });

    it('should correctly retrieve the exploration id', () => {
      expect(ecs.getExplorationId()).toBe('123');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('editor');
    });

    it('should correctly retrieve the story context', () => {
      expect(ecs.isExplorationLinkedToStory()).toBe(false);
      ecs.setExplorationIsLinkedToStory();
      expect(ecs.isExplorationLinkedToStory()).toBe(true);
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
      ecs.removeCustomEntityContext();
    });

    it('should correctly set editor context to topic editor', () => {
      ecs.init('topic_editor');
      expect(ecs.getEditorContext()).toBe('topic_editor');
    });

    it('should correctly set and retrieve the topic id', () => {
      expect(ecs.getEntityId()).toBe('undefined');

      spyOn(urlService, 'getPathname').and.returnValue('/topic_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('');

      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly set and retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBeUndefined();
      spyOn(urlService, 'getPathname').and.returnValue('/topic_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('');
      expect(ecs.getEntityType()).toBe('topic');
    });

    it('should correctly set and retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('other');
      spyOn(urlService, 'getPathname').and.returnValue('/topic_editor/123');
      expect(ecs.getPageContext()).toBe('topic_editor');
    });

    it('should correctly check that page allows editing of RTE components',
      () => {
        expect(ecs.canAddOrEditComponents()).toBe(false);
        spyOn(urlService, 'getPathname').and.returnValue('/topic_editor/123');
        expect(ecs.canAddOrEditComponents()).toBe(true);
      });

    it('should not report exploration context when the context' +
      ' is not related to editor or player', ()=> {
      expect(ecs.getPageContext()).toBe('other');
      spyOn(urlService, 'getPathname').and.returnValue('/topic_editor/123');
      expect(ecs.isInExplorationContext()).toBe(false);
    });
  });

  describe('behavior in question editor modal', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      ecs.removeCustomEntityContext();
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

    it('should affirm the exploration context for exploration player',
      ()=> {
        expect(ecs.isInExplorationContext()).toBe(false);
        spyOn(urlService, 'getPathname').and.returnValue('/explore/123');
        expect(ecs.isInExplorationContext()).toBe(true);
      });

    it('should affirm the exploration context for exploration editor',
      ()=> {
        expect(ecs.isInExplorationContext()).toBe(false);
        spyOn(urlService, 'getPathname').and.returnValue('/create/123');
        expect(ecs.isInExplorationContext()).toBe(true);
      });
  });

  describe('behavior in the story editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      ecs.removeCustomEntityContext();
    });

    it('should correctly set editor context to story editor', () => {
      ecs.init('story_editor');
      expect(ecs.getEditorContext()).toBe('story_editor');
    });

    it('should correctly retrieve the story id', () => {
      expect(ecs.getEntityId()).toBe('undefined');

      spyOn(urlService, 'getPathname').and.returnValue('/story_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('');

      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBeUndefined();
      spyOn(urlService, 'getPathname').and.returnValue('/story_editor/123');
      expect(ecs.getEntityType()).toBe('story');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('other');
      spyOn(urlService, 'getPathname').and.returnValue('/story_editor/123');
      expect(ecs.getPageContext()).toBe('story_editor');
    });

    it('should correctly check that page allows editing of RTE components',
      () => {
        expect(ecs.canAddOrEditComponents()).toBe(false);
        spyOn(urlService, 'getPathname').and.returnValue('/story_editor/123');
        expect(ecs.canAddOrEditComponents()).toBe(true);
      });
  });

  describe('behavior in the skill editor view', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      ecs.removeCustomEntityContext();
    });

    it('should correctly set editor context to skill editor', () => {
      ecs.init('skill_editor');
      expect(ecs.getEditorContext()).toBe('skill_editor');
    });

    it('should correctly retrieve the skill id', () => {
      expect(ecs.getEntityId()).toBe('undefined');

      spyOn(urlService, 'getPathname').and.returnValue('/skill_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('');

      expect(ecs.getEntityId()).toBe('123');
    });

    it('should correctly retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBeUndefined();
      spyOn(urlService, 'getPathname').and.returnValue('/skill_editor/123');
      spyOn(urlService, 'getHash').and.returnValue('');
      expect(ecs.getEntityType()).toBe('skill');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('other');
      spyOn(urlService, 'getPathname').and.returnValue('/skill_editor/123');
      expect(ecs.getPageContext()).toBe('skill_editor');
    });

    it('should correctly check that page allows editing of RTE components',
      () => {
        expect(ecs.canAddOrEditComponents()).toBe(false);
        spyOn(urlService, 'getPathname').and.returnValue('/skill_editor/123');
        expect(ecs.canAddOrEditComponents()).toBe(true);
      });
  });

  describe('behavior in the blog dashboard page', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      ecs.removeCustomEntityContext();
    });

    it('should correctly retrieve the blog post id', () => {
      expect(ecs.getEntityId()).toBe('undefined');

      spyOn(urlService, 'getPathname').and.returnValue(
        '/blog-dashboard');
      spyOn(urlService, 'getHash').and.returnValue('');
      spyOn(urlService, 'getBlogPostIdFromUrl').and.returnValue(
        'sample123456');

      expect(ecs.getEntityId()).toBe('sample123456');
    });

    it('should correctly retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBeUndefined();

      spyOn(urlService, 'getPathname').and.returnValue(
        '/blog-dashboard');

      expect(ecs.getEntityType()).toBe('blog_post');
    });

    it('should correctly retrieve the page context', () => {
      expect(ecs.getPageContext()).toBe('other');

      spyOn(urlService, 'getPathname').and.returnValue(
        '/blog-dashboard');

      expect(ecs.getPageContext()).toBe('blog_dashboard');
    });

    it('should correctly check that page allows editing of RTE components',
      () => {
        expect(ecs.canAddOrEditComponents()).toBe(false);

        spyOn(urlService, 'getPathname').and.returnValue(
          '/blog-dashboard');

        expect(ecs.canAddOrEditComponents()).toBe(true);
      });

    it('should check if rte is in blog post editor', () => {
      expect(ecs.isInBlogPostEditorPage()).toBe(false);

      spyOn(urlService, 'getPathname').and.returnValue(
        '/blog-dashboard');

      expect(ecs.isInBlogPostEditorPage()).toBe(true);
    });
  });

  describe('behavior in the blog home pages', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      blogPostPageService = TestBed.get(BlogPostPageService);
      ecs.removeCustomEntityContext();
    });

    it('should correctly retrieve the entity type', () => {
      expect(ecs.getEntityType()).toBeUndefined();

      spyOn(urlService, 'getPathname').and.returnValue(
        '/blog');

      expect(ecs.getEntityType()).toBe('blog_post');
    });

    it('should correctly retrieve the blog post id', () => {
      expect(ecs.getEntityId()).toBe('undefined');

      spyOn(urlService, 'getPathname').and.returnValue(
        '/blog');
      spyOn(urlService, 'getHash').and.returnValue('');
      blogPostPageService.blogPostId = 'sample123456';

      expect(ecs.getEntityId()).toBe('sample123456');
    });
  });

  describe('behavior in the edit learner group page', () => {
    beforeEach(() => {
      windowRef = new MockWindowRef();
      TestBed.configureTestingModule({
        providers: [
          UrlInterpolationService,
          { provide: WindowRef, useValue: windowRef },
        ],
      });
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      ecs.removeCustomEntityContext();
    });

    it('should correctly retrieve the learner group id', () => {
      spyOn(urlService, 'getPathname').and.returnValue(
        '/edit-learner-group/groupId');
      expect(ecs.getLearnerGroupId()).toBe('groupId');
    });

    it('should correctly retrieve the page context', () => {
      spyOn(urlService, 'getPathname').and.returnValue(
        '/edit-learner-group/groupId');
      expect(ecs.getPageContext()).toBe('learner_group_editor');
    });

    it('should retrieve the learner group id cached before', () => {
      windowRef.nativeWindow.location.pathname = '/edit-learner-group/groupId1';
      expect(ecs.getLearnerGroupId()).toBe('groupId1');
      windowRef.nativeWindow.location.pathname = '/edit-learner-group/groupId2';
      expect(ecs.getLearnerGroupId()).toBe('groupId1');
    });
  });

  describe('behavior in the learner group viewer page', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue(
        '/learner-group/groupId');
      ecs.removeCustomEntityContext();
    });

    it('should correctly retrieve the learner group id', () => {
      expect(ecs.getLearnerGroupId()).toBe('groupId');
    });
  });

  describe('behavior in different pages', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      ecs.removeCustomEntityContext();
    });

    it('should correctly retrieve the page context as question editor', () => {
      expect(ecs.getPageContext()).toBe('other');
      spyOn(urlService, 'getPathname').and.returnValue('/question_editor/123');
      expect(ecs.getPageContext()).toBe('question_editor');
    });

    it('should correctly retrieve the page context as question player', () => {
      expect(ecs.getPageContext()).toBe('other');
      spyOn(urlService, 'getPathname').and.returnValue('/session/123');
      expect(ecs.getPageContext()).toBe('question_player');
    });

    it('should correctly retrieve the page context as collection editor',
      () => {
        expect(ecs.getPageContext()).toBe('other');
        spyOn(urlService, 'getPathname').and.returnValue(
          '/collection_editor/123');
        expect(ecs.getPageContext()).toBe('collection_editor');
      });

    it('should correctly retrieve the page context as ' +
      'topics and skills dashboard', () => {
      expect(ecs.getPageContext()).toBe('other');
      spyOn(urlService, 'getPathname').and.returnValue(
        '/topics-and-skills-dashboard/123');
      expect(ecs.getPageContext()).toBe('topics_and_skills_dashboard');
    });

    it('should correctly retrieve the page context as contributor dashboard',
      () => {
        expect(ecs.getPageContext()).toBe('other');
        spyOn(urlService, 'getPathname').and.returnValue(
          '/contributor-dashboard/123');
        expect(ecs.getPageContext()).toBe('contributor_dashboard');
      });
  });

  describe('behavior in other pages', () => {
    beforeEach(() => {
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      spyOn(urlService, 'getPathname').and.returnValue('/about');
      ecs.removeCustomEntityContext();
    });

    it('should throw an error when trying to retrieve the exploration id',
      () => {
        expect(() => ecs.getExplorationId()).toThrowError(
          'ContextService should not be used outside the ' +
          'context of an exploration or a question.');
      }
    );

    it('should throw an error when trying to retrieve the learner group id',
      () => {
        expect(() => ecs.getLearnerGroupId()).toThrowError(
          'ContextService should not be used outside the ' +
          'context of a learner group.');
      }
    );

    it('should retrieve other as page context', () => {
      expect(ecs.getPageContext()).toBe('other');
    }
    );

    it('should detect editor tab context is preview', () => {
      let urlServiceGetHash = spyOn(urlService, 'getHash');
      urlServiceGetHash.and.returnValue('#/settings');
      expect(ecs.getEditorTabContext()).toBeNull();

      urlServiceGetHash.and.returnValue('#/preview');
      expect(ecs.getEditorTabContext()).toBe('preview');
    });

    it('should set and get custom entity id and type', () => {
      expect(ecs.getEntityId()).toBe('undefined');
      expect(ecs.getEntityType()).toBeUndefined();
      ecs.setCustomEntityContext('other', '100');
      expect(ecs.getEntityId()).toBe('100');
      expect(ecs.getEntityType()).toBe('other');
    });

    it('should remove custom entity id', () => {
      ecs.setCustomEntityContext('other', '100');
      expect(ecs.getEntityId()).toBe('100');
      expect(ecs.getEntityType()).toBe('other');
      ecs.removeCustomEntityContext();
      expect(ContextService.customEntityContext).toBeNull();
    });
  });

  describe('behavior in exploration edge cases', () => {
    beforeEach(() => {
      windowRef = new MockWindowRef();
      TestBed.configureTestingModule({
        providers: [
          UrlInterpolationService,
          { provide: WindowRef, useValue: windowRef },
        ],
      });
      ecs = TestBed.get(ContextService);
      urlService = TestBed.get(UrlService);
      ecs.removeCustomEntityContext();
    });

    it('should retrieve the exploration id cached before', () => {
      windowRef.nativeWindow.location.pathname = '/explore/456';
      expect(ecs.getExplorationId()).toBe('456');
      windowRef.nativeWindow.location.pathname = '/explore/789';
      expect(ecs.getExplorationId()).toBe('456');
    });
  });
});
