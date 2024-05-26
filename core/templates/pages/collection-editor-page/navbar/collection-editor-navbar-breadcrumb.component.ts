// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar breadcrumb of the collection editor.
 */

import {Component} from '@angular/core';
import {Collection} from 'domain/collection/collection.model';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {CollectionEditorPageConstants} from '../collection-editor-page.constants';
import {CollectionEditorRoutingService} from '../services/collection-editor-routing.service';
import {CollectionEditorStateService} from '../services/collection-editor-state.service';

// TODO(bhenning): After the navbar is moved to a directive, this directive
// should be updated to say 'Loading...' if the collection editor's controller
// is not yet finished loading the collection. Also, this directive should
// support both displaying the current title of the collection (or untitled if
// it does not yet have one) or setting a new title in the case of an untitled
// collection.

@Component({
  selector: 'collection-editor-navbar-breadcrumb',
  templateUrl: './collection-editor-navbar-breadcrumb.component.html',
})
export class CollectionEditorNavbarBreadcrumbComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeTabName!: string;
  collection!: Collection;

  _TAB_NAMES_TO_HUMAN_READABLE_NAMES: Record<string, string> = {
    edit: 'Edit',
    settings: 'Settings',
    stats: 'Statistics',
    history: 'History',
  };

  constructor(
    private collectionEditorStateService: CollectionEditorStateService,
    private focusManagerService: FocusManagerService,
    private collectionEditorRoutingService: CollectionEditorRoutingService
  ) {}

  getCurrentTabName(): string {
    return this._TAB_NAMES_TO_HUMAN_READABLE_NAMES[this.activeTabName];
  }

  editCollectionTitle(): void {
    this.activeTabName = this._TAB_NAMES_TO_HUMAN_READABLE_NAMES.settings;
    this.focusManagerService.setFocus(
      CollectionEditorPageConstants.COLLECTION_TITLE_INPUT_FOCUS_LABEL
    );
  }

  ngOnInit(): void {
    this.collection = this.collectionEditorStateService.getCollection();
    this.activeTabName = this.collectionEditorRoutingService.getActiveTabName();
  }
}
