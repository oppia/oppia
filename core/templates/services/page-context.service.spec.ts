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
 * @fileoverview Unit tests for the PageContextService.
 */

import {TestBed} from '@angular/core/testing';
import {PageContextService} from 'services/page-context.service';
import {UrlService} from 'services/contextual/url.service';
import {BlogPostPageService} from 'pages/blog-post-page/services/blog-post-page.service';
import {AppConstants} from 'app.constants';
import {ServicesConstants} from 'services/services.constants';

describe('PageContext service', () => {
  let ecs: PageContextService;
  let urlService: UrlService;
  let blogPostPageService: BlogPostPageService;
  let pathSpy: jasmine.Spy;
  let hashSpy: jasmine.Spy;

  beforeEach(() => {
    ecs = TestBed.inject(PageContextService);
    urlService = TestBed.inject(UrlService);
    blogPostPageService = TestBed.inject(BlogPostPageService);

    pathSpy = spyOn(urlService, 'getPathname');
    hashSpy = spyOn(urlService, 'getHash');
    hashSpy.and.returnValue('');

    ecs.removeCustomEntityContext();
    ecs.clearQuestionPlayerIsOpen();
    ecs.setSubtopicPreviewIsClosed();
    ecs.resetImageSaveDestination();

    (
      PageContextService as unknown as {customEntityContext: null}
    ).customEntityContext = null;
    (ecs as unknown as {pageContext: string | null}).pageContext = null;
    (ecs as unknown as {explorationId: string | null}).explorationId = null;
    (ecs as unknown as {learnerGroupId: string | null}).learnerGroupId = null;
  });

  describe('getPageContext methods', () => {
    it('should correctly retrieve the page context for all page types', () => {
      const testCases = [
        {
          path: '/explore/123',
          expected: ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER,
        },
        {
          path: '/lesson/123',
          expected: ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER,
        },
        {
          path: '/embed/exploration/123',
          expected: ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER,
        },
        {
          path: '/create/123',
          expected: ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR,
        },
        {
          path: '/question_editor/123',
          expected: ServicesConstants.PAGE_CONTEXT.QUESTION_EDITOR,
        },
        {
          path: '/topic_editor/123',
          expected: ServicesConstants.PAGE_CONTEXT.TOPIC_EDITOR,
        },
        {
          path: '/story_editor/123',
          expected: ServicesConstants.PAGE_CONTEXT.STORY_EDITOR,
        },
        {
          path: '/skill_editor/123',
          expected: ServicesConstants.PAGE_CONTEXT.SKILL_EDITOR,
        },
        {
          path: '/collection_editor/123',
          expected: ServicesConstants.PAGE_CONTEXT.COLLECTION_EDITOR,
        },
        {
          path: '/topics-and-skills-dashboard/',
          expected: ServicesConstants.PAGE_CONTEXT.TOPICS_AND_SKILLS_DASHBOARD,
        },
        {
          path: '/contributor-dashboard/',
          expected: ServicesConstants.PAGE_CONTEXT.CONTRIBUTOR_DASHBOARD,
        },
        {
          path: '/blog-dashboard',
          expected: ServicesConstants.PAGE_CONTEXT.BLOG_DASHBOARD,
        },
        {
          path: '/edit-learner-group/123',
          expected: ServicesConstants.PAGE_CONTEXT.LEARNER_GROUP_EDITOR,
        },
        {
          path: '/diagnostic-test-player/',
          expected: ServicesConstants.PAGE_CONTEXT.DIAGNOSTIC_TEST_PLAYER,
        },
        {
          path: '/session/123',
          expected: ServicesConstants.PAGE_CONTEXT.QUESTION_PLAYER,
        },
        {path: '/studyguide/123', expected: 'studyguide'},
        {path: '/unknown/path', expected: ServicesConstants.PAGE_CONTEXT.OTHER},
      ];

      testCases.forEach(testCase => {
        pathSpy.and.returnValue(testCase.path);
        (ecs as unknown as {pageContext: string | null}).pageContext = null;
        expect(ecs.getPageContext()).toBe(testCase.expected);
      });
    });
  });

  describe('getEditorTabContext', () => {
    it('should correctly retrieve the editor tab context', () => {
      hashSpy.and.returnValue('#/gui');
      expect(ecs.getEditorTabContext()).toBe(
        ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR
      );

      hashSpy.and.returnValue('#/preview');
      expect(ecs.getEditorTabContext()).toBe(
        ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW
      );

      hashSpy.and.returnValue('#/settings');
      expect(ecs.getEditorTabContext()).toBeNull();
    });
  });

  describe('getEntityType and Entity ID', () => {
    it('should retrieve entity ID/Type for Custom Context', () => {
      ecs.setCustomEntityContext('custom_type', 'cid');
      expect(ecs.getEntityType()).toBe('custom_type');
      expect(ecs.getEntityId()).toBe('cid');
      ecs.removeCustomEntityContext();
    });

    it('should retrieve entity ID/Type for Embed Pages', () => {
      pathSpy.and.returnValue('/embed/exploration/123');
      expect(ecs.getEntityId()).toBe('123');
      expect(ecs.getEntityType()).toBe(AppConstants.ENTITY_TYPE.EXPLORATION);
    });

    it('should retrieve entity ID/Type for Question in Editors', () => {
      pathSpy.and.returnValue('/topic_editor/123');
      hashSpy.and.returnValue('#/questions#q123');
      expect(ecs.getEntityType()).toBe(AppConstants.ENTITY_TYPE.QUESTION);
      expect(ecs.getEntityId()).toBe('q123');

      pathSpy.and.returnValue('/skill_editor/123');
      hashSpy.and.returnValue('#/questions#q456');
      expect(ecs.getEntityType()).toBe(AppConstants.ENTITY_TYPE.QUESTION);
    });

    it('should retrieve entity ID/Type for Blog Home', () => {
      pathSpy.and.returnValue('/blog');
      blogPostPageService.blogPostId = 'bp_id';
      expect(ecs.getEntityType()).toBe(AppConstants.ENTITY_TYPE.BLOG_POST);
      expect(ecs.getEntityId()).toBe('bp_id');
    });

    it('should retrieve entity ID/Type for Blog Dashboard', () => {
      pathSpy.and.returnValue('/blog-dashboard');
      spyOn(urlService, 'getBlogPostIdFromUrl').and.returnValue('bp_dash_id');
      expect(ecs.getEntityType()).toBe(AppConstants.ENTITY_TYPE.BLOG_POST);
      expect(ecs.getEntityId()).toBe('bp_dash_id');
    });

    it('should retrieve entity ID/Type for standard Editors', () => {
      hashSpy.and.returnValue('');

      pathSpy.and.returnValue('/story_editor/s1');
      expect(ecs.getEntityType()).toBe(AppConstants.ENTITY_TYPE.STORY);
      expect(ecs.getEntityId()).toBe('s1');

      pathSpy.and.returnValue('/skill_editor/sk1');
      expect(ecs.getEntityType()).toBe(AppConstants.ENTITY_TYPE.SKILL);
      expect(ecs.getEntityId()).toBe('sk1');

      pathSpy.and.returnValue('/topic_editor/t1');
      expect(ecs.getEntityType()).toBe(AppConstants.ENTITY_TYPE.TOPIC);
      expect(ecs.getEntityId()).toBe('t1');
    });
  });

  describe('getExplorationId', () => {
    it('should handle cached ID, manual player mode, and URL parsing', () => {
      (ecs as unknown as {explorationId: string | null}).explorationId =
        'cached_id';
      expect(ecs.getExplorationId()).toBe('cached_id');
      (ecs as unknown as {explorationId: string | null}).explorationId = null;

      pathSpy.and.returnValue('/explore/exp1');
      ecs.setQuestionPlayerIsOpen();
      expect(ecs.getExplorationId()).toBe('exp1');
      ecs.clearQuestionPlayerIsOpen();

      (ecs as unknown as {explorationId: string | null}).explorationId = null;
      pathSpy.and.returnValue('/embed/exploration/embed_id');
      expect(ecs.getExplorationId()).toBe('embed_id');

      (ecs as unknown as {explorationId: string | null}).explorationId = null;
      pathSpy.and.returnValue('/about');
      expect(ecs.getExplorationId()).toBe('');
    });
  });

  describe('getLearnerGroupId', () => {
    it('should handle cached ID and URL parsing', () => {
      (ecs as unknown as {learnerGroupId: string | null}).learnerGroupId =
        'cached_group';
      expect(ecs.getLearnerGroupId()).toBe('cached_group');
      (ecs as unknown as {learnerGroupId: string | null}).learnerGroupId = null;

      pathSpy.and.returnValue('/edit-learner-group/g123');
      expect(ecs.getLearnerGroupId()).toBe('g123');

      pathSpy.and.returnValue('/about');
      (ecs as unknown as {learnerGroupId: string | null}).learnerGroupId = null;
      expect(() => ecs.getLearnerGroupId()).toThrowError();
    });
  });

  describe('Boolean Page Checks & Helpers', () => {
    it('should correctly identify page modes', () => {
      pathSpy.and.returnValue('/diagnostic-test-player/');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.isInDiagnosticTestPlayerPage()).toBe(true);

      pathSpy.and.returnValue('/create/123');
      hashSpy.and.returnValue('#/gui');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.isInExplorationEditorPage()).toBe(true);
      expect(ecs.isInExplorationEditorMode()).toBe(true);

      pathSpy.and.returnValue('/explore/123');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.isInExplorationPlayerPage()).toBe(true);

      pathSpy.and.returnValue('/blog-dashboard');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.isInBlogPostEditorPage()).toBe(true);
    });

    it('should check question player mode manually', () => {
      pathSpy.and.returnValue('/about');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.isInQuestionPlayerMode()).toBe(false);

      ecs.setQuestionPlayerIsOpen();
      expect(ecs.isInQuestionPlayerMode()).toBe(true);
      expect(ecs.getQuestionPlayerIsManuallySet()).toBe(true);
    });

    it('should manage image save destination', () => {
      expect(ecs.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER
      );
      ecs.setImageSaveDestinationToLocalStorage();
      expect(ecs.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_LOCAL_STORAGE
      );
      ecs.resetImageSaveDestination();
      expect(ecs.getImageSaveDestination()).toBe(
        AppConstants.IMAGE_SAVE_DESTINATION_SERVER
      );
    });

    it('should check component editing permissions', () => {
      pathSpy.and.returnValue('/create/123');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.canAddOrEditComponents()).toBe(true);

      pathSpy.and.returnValue('/explore/123');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.canAddOrEditComponents()).toBe(false);
    });

    it('should check exploration context', () => {
      pathSpy.and.returnValue('/explore/123');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.isInExplorationContext()).toBe(true);

      pathSpy.and.returnValue('/about');
      (ecs as unknown as {pageContext: string | null}).pageContext = null;
      expect(ecs.isInExplorationContext()).toBe(false);
    });

    it('should manage general getters/setters', () => {
      ecs.setExplorationVersion(10);
      expect(ecs.getExplorationVersion()).toBe(10);

      ecs.setExplorationIsLinkedToStory();
      expect(ecs.isExplorationLinkedToStory()).toBe(true);

      ecs.setSubtopicPreviewIsOpen();
      expect(ecs.getSubtopicPreviewIsOpen()).toBe(true);

      ecs.init('my_context');
      expect(ecs.getEditorContext()).toBe('my_context');
    });
  });
});
