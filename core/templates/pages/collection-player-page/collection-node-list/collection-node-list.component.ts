// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for creating a list of collection nodes which link to
 * playing the exploration in each node.
 */
import {Component, Input} from '@angular/core';

import {CollectionNode} from 'domain/collection/collection-node.model';

@Component({
  selector: 'collection-node-list',
  templateUrl: './collection-node-list.component.html',
  styleUrls: [],
})
export class CollectionNodeListComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() collectionId!: string;
  @Input() collectionNodes!: CollectionNode[];
  constructor() {}
}
