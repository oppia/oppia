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
 * @fileoverview This file imports the gif-frames library.
 */

import {Injectable} from '@angular/core';
import * as gifFrames from 'gif-frames';

// Define options and frame interface for gif-frames.
export type GifFramesOptions = Record<string, unknown>;

interface GifFrame {
  getImage: () => HTMLCanvasElement;
  frameInfo: {
    disposal: number;
  };
}

// Angular service that directly imports the gif-frames library.
// And utilize its functionality for use in the application.

@Injectable({
  providedIn: 'root',
})
export class GifFramesService {
  getFrames(options: GifFramesOptions): Promise<GifFrame[]> {
    return gifFrames(options);
  }
}
