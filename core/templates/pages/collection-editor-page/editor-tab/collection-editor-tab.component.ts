// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the main tab of the collection editor.
 */

import { Component } from '@angular/core';
import { CollectionNode } from 'domain/collection/collection-node.model';
import { Collection } from 'domain/collection/collection.model';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionLinearizerService } from '../services/collection-linearizer.service';

@Component({
  selector: 'oppia-collection-editor-tab',
  templateUrl: './collection-editor-tab.component.html'
})
export class CollectionEditorTabComponent {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  collection!: Collection;

  constructor(
    private collectionEditorStateService: CollectionEditorStateService,
    private collectionLinearizerService: CollectionLinearizerService
  ) {}

  ngOnInit(): void {
    this.collection = this.collectionEditorStateService.getCollection();
  }

  getLinearlySortedNodes(): CollectionNode[] {
    return this.collectionLinearizerService.getCollectionNodesInPlayableOrder(
      this.collection);
  }

  hasLoadedCollection(): boolean {
    return this.collectionEditorStateService.hasLoadedCollection();
  }
}
