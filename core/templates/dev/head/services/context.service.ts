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
 * @fileoverview Service for returning information about a page's
 * context.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { EntityContextObjectFactory } from
  'domain/utilities/EntityContextObjectFactory.ts';
import { ServicesConstants } from 'services/services.constants';
import { UrlService } from 'services/contextual/url.service';

@Injectable({
  providedIn: 'root'
})
export class ContextService {
  constructor(
    private urlService: UrlService,
    private entityContextObjectFactory: EntityContextObjectFactory) {}

  pageContext = null;
  explorationId = null;
  questionId = null;
  editorContext = null;
  customEntityContext = null;

  init(editorName: string): void {
    this.editorContext = editorName;
  }
  // Following method helps to know the whether the context of editor is
  // question editor or exploration editor. The variable editorContext is
  // set from the init function that is called upon initialization in the
  // respective editors.
  getEditorContext(): string {
    return this.editorContext;
  }
  // Returns a string representing the current tab of the editor (either
  // 'editor' or 'preview'), or null if the current tab is neither of these,
  // or the current page is not the editor.
  getEditorTabContext(): string | null {
    let hash = this.urlService.getHash();
    if (hash.indexOf('#/gui') === 0) {
      return ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR;
    } else if (hash.indexOf('#/preview') === 0) {
      return ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW;
    } else {
      return null;
    }
  }
  // Returns a string representing the context of the current page.
  // This is PAGE_CONTEXT.EXPLORATION_EDITOR or
  // PAGE_CONTEXT.EXPLORATION_PLAYER or PAGE_CONTEXT.QUESTION_EDITOR.
  // If the current page is not one in either EXPLORATION_EDITOR or
  // EXPLORATION_PLAYER or QUESTION_EDITOR then return PAGE_CONTEXT.OTHER
  getPageContext(): string {
    if (this.pageContext) {
      return this.pageContext;
    } else {
      let pathnameArray = this.urlService.getPathname().split('/');
      for (let i = 0; i < pathnameArray.length; i++) {
        if (pathnameArray[i] === 'explore' ||
            (pathnameArray[i] === 'embed' &&
                pathnameArray[i + 1] === 'exploration')) {
          this.pageContext = ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER;
          return ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER;
        } else if (pathnameArray[i] === 'create') {
          this.pageContext = ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR;
          return ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR;
        } else if (pathnameArray[i] === 'question_editor') {
          this.pageContext = ServicesConstants.PAGE_CONTEXT.QUESTION_EDITOR;
          return ServicesConstants.PAGE_CONTEXT.QUESTION_EDITOR;
        } else if (pathnameArray[i] === 'topic_editor') {
          this.pageContext = ServicesConstants.PAGE_CONTEXT.TOPIC_EDITOR;
          return ServicesConstants.PAGE_CONTEXT.TOPIC_EDITOR;
        } else if (pathnameArray[i] === 'story_editor') {
          this.pageContext = ServicesConstants.PAGE_CONTEXT.STORY_EDITOR;
          return ServicesConstants.PAGE_CONTEXT.STORY_EDITOR;
        } else if (pathnameArray[i] === 'skill_editor') {
          this.pageContext = ServicesConstants.PAGE_CONTEXT.SKILL_EDITOR;
          return ServicesConstants.PAGE_CONTEXT.SKILL_EDITOR;
        } else if (
          pathnameArray[i] === 'practice_session' ||
            pathnameArray[i] === 'review_test') {
          this.pageContext = ServicesConstants.PAGE_CONTEXT.QUESTION_PLAYER;
          return ServicesConstants.PAGE_CONTEXT.QUESTION_PLAYER;
        } else if (pathnameArray[i] === 'collection_editor') {
          this.pageContext = ServicesConstants.PAGE_CONTEXT.COLLECTION_EDITOR;
          return ServicesConstants.PAGE_CONTEXT.COLLECTION_EDITOR;
        }
      }

      return ServicesConstants.PAGE_CONTEXT.OTHER;
    }
  }

  isInExplorationContext(): boolean {
    return (this.getPageContext() ===
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR ||
        this.getPageContext() ===
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_PLAYER);
  }

  // This function is used in cases where the URL does not specify the
  // correct context for some case. eg: Viewing a skill's concept card on
  // any page via the RTE.
  setCustomEntityContext(entityType: string, entityId: string): void {
    this.customEntityContext = this.entityContextObjectFactory.create(
      entityId, entityType);
  }

  removeCustomEntityContext(): void {
    this.customEntityContext = null;
  }

  getEntityId(): string {
    if (this.customEntityContext !== null) {
      return this.customEntityContext.getId();
    }
    let pathnameArray = this.urlService.getPathname().split('/');
    let hashValues = this.urlService.getHash().split('#');
    for (let i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'embed') {
        return decodeURI(pathnameArray[i + 2]);
      }
      if (hashValues.length === 3 && hashValues[1] === '/questions') {
        return decodeURI(hashValues[2]);
      }
    }
    return decodeURI(pathnameArray[2]);
  }

  // add constants for entity type
  getEntityType(): string {
    if (this.customEntityContext !== null) {
      return this.customEntityContext.getType();
    }
    let pathnameArray = this.urlService.getPathname().split('/');
    let hashValues = this.urlService.getHash().split('#');
    for (let i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'create' || pathnameArray[i] === 'explore' ||
          (pathnameArray[i] === 'embed' &&
              pathnameArray[i + 1] === 'exploration')) {
        return AppConstants.ENTITY_TYPE.EXPLORATION;
      }
      if (pathnameArray[i] === 'topic_editor') {
        if (hashValues.length === 3 && hashValues[1] === '/questions') {
          return AppConstants.ENTITY_TYPE.QUESTION;
        }
        return AppConstants.ENTITY_TYPE.TOPIC;
      }
      if (pathnameArray[i] === 'subtopic') {
        return AppConstants.ENTITY_TYPE.SUBTOPIC;
      }
      if (pathnameArray[i] === 'story_editor') {
        return AppConstants.ENTITY_TYPE.STORY;
      }
      if (pathnameArray[i] === 'skill_editor') {
        if (hashValues.length === 3 && hashValues[1] === '/questions') {
          return AppConstants.ENTITY_TYPE.QUESTION;
        }
        return AppConstants.ENTITY_TYPE.SKILL;
      }
    }
  }

  // Returns a string representing the explorationId (obtained from the
  // URL).
  getExplorationId(): string {
    if (this.explorationId) {
      return this.explorationId;
    } else if (!this.isInQuestionPlayerMode()) {
      // The pathname should be one of /explore/{exploration_id} or
      // /create/{exploration_id} or /embed/exploration/{exploration_id}.
      let pathnameArray = this.urlService.getPathname().split('/');
      for (let i = 0; i < pathnameArray.length; i++) {
        if (pathnameArray[i] === 'explore' ||
            pathnameArray[i] === 'create') {
          this.explorationId = pathnameArray[i + 1];
          return pathnameArray[i + 1];
        }
        if (pathnameArray[i] === 'embed') {
          this.explorationId = pathnameArray[i + 2];
          return this.explorationId;
        }
      }

      throw Error(
        'ERROR: ContextService should not be used outside the ' +
          'context of an exploration or a question.');
    }
  }

  // Following method helps to know whether exploration editor is
  // in main editing mode or preview mode.
  isInExplorationEditorMode(): boolean {
    return (this.getPageContext() ===
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR &&
        this.getEditorTabContext() === (
          ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR));
  }

  isInQuestionPlayerMode(): boolean {
    return (
      this.getPageContext() === ServicesConstants.PAGE_CONTEXT.QUESTION_PLAYER);
  }

  isInExplorationEditorPage(): boolean {
    return (
      this.getPageContext() ===
        ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR);
  }

  canAddOrEditComponents(): boolean {
    var currentPageContext = this.getPageContext();
    var allowedPageContext = [
      ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR,
      ServicesConstants.PAGE_CONTEXT.QUESTION_EDITOR,
      ServicesConstants.PAGE_CONTEXT.COLLECTION_EDITOR,
      ServicesConstants.PAGE_CONTEXT.TOPIC_EDITOR,
      ServicesConstants.PAGE_CONTEXT.STORY_EDITOR,
      ServicesConstants.PAGE_CONTEXT.SKILL_EDITOR
    ];
    return (allowedPageContext.includes(currentPageContext));
  }
}

angular.module('oppia').factory(
  'ContextService', downgradeInjectable(ContextService));
