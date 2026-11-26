// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Chooses the Angular bootstrap module for a page load.
 */

/** Paths served by the lightweight Angular bootstrap. */
export const LITE_APP_PATHS: readonly string[] = ['/terms', '/maintenance'];

/**
 * Returns whether the given pathname should use the lightweight module.
 */
export const shouldUseLiteAppModule = (pathname: string): boolean => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return LITE_APP_PATHS.includes(normalizedPath);
};

/**
 * Reveals the Angular-rendered page and hides the prerendered shell.
 *
 * This must run from the route component's AfterViewInit hook so the router
 * has rendered the replacement content and the browser has laid it out.
 */
export const markAngularContentReady = (): void => {
  const document = window.document;
  document.documentElement.classList.add('oppia-angular-ready');
  const prerenderShell = document.getElementById('oppia-prerender-shell');
  if (prerenderShell) {
    // Keep the shell in the layout but invisible so its removal is not
    // recorded as a layout shift while the live page takes its place.
    prerenderShell.style.visibility = 'hidden';
  }
};
