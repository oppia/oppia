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
 * @fileoverview Component for the conversation skin embed view.
 */

import { Component, ViewEncapsulation } from '@angular/core';
import { ConversationSkinComponent } from './conversation-skin.component';

@Component({
  selector: 'oppia-conversation-skin-embed',
  templateUrl: './conversation-skin-embed.component.html',
  encapsulation: ViewEncapsulation.None
})
export class ConversationSkinEmbedComponent extends ConversationSkinComponent {}
