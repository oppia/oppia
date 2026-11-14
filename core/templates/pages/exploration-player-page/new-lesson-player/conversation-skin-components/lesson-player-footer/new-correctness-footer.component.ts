// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the correctness footer in the exploration player.
 */

import {Component} from '@angular/core';

// The look of each piece (shape, colour, direction, speed...) is derived in the
// stylesheet from its position among its siblings, so this only controls how
// many pieces are rendered.
const CONFETTI_PIECE_COUNT = 100;

@Component({
  selector: 'oppia-new-correctness-footer',
  templateUrl: './new-correctness-footer.component.html',
  styleUrls: ['./new-correctness-footer.component.css'],
})
export class NewCorrectnessFooterComponent {
  confettiPieces: number[] = Array.from(
    {length: CONFETTI_PIECE_COUNT},
    (_, index) => index
  );
}
