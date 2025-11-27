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
 * @fileoverview Service for extracting image filenames from HTML strings,
 * including images nested within RTE components like collapsible or tabs.
 */

import {Injectable} from '@angular/core';

interface RteComponent {
  id: string;
  customization_args: {[key: string]: unknown};
}

@Injectable({
  providedIn: 'root',
})
export class HtmlImageExtractorService {
  /**
   * Recursively extracts all image filenames from HTML, including those
   * nested inside RTE components (e.g., collapsible, tabs).
   * @param {string} html - The HTML string to scan.
   * @returns {string[]} - Array of unique image filenames found.
   */
  getAllImageFilenamesFromHtml(html: string): string[] {
    const filenames = new Set<string>();
    this._collectImageFilenames(html, filenames);
    return Array.from(filenames);
  }

  private _collectImageFilenames(html: string, filenames: Set<string>): void {
    // Extract direct RTE components from this HTML.
    const components = this._extractRteComponents(html);

    for (const component of components) {
      // Check if this is an image component.
      if (component.id === 'oppia-noninteractive-image') {
        const filename = component.customization_args[
          'filepath-with-value'
        ] as string;
        if (filename) {
          filenames.add(filename);
        }
      }
      // Check if this is a math component with SVG.
      else if (component.id === 'oppia-noninteractive-math') {
        const mathContent = component.customization_args[
          'math_content-with-value'
        ] as {svg_filename?: string};
        if (mathContent?.svg_filename) {
          filenames.add(mathContent.svg_filename);
        }
      }

      // Recursively check customization args for nested HTML.
      for (const key in component.customization_args) {
        const value = component.customization_args[key];
        this._collectFromValue(value, filenames);
      }
    }
  }

  private _collectFromValue(value: unknown, filenames: Set<string>): void {
    // If value is a string, it may contain nested HTML.
    if (typeof value === 'string') {
      if (
        value.includes('oppia-noninteractive-') ||
        (value.includes('<') && value.includes('>'))
      ) {
        this._collectImageFilenames(value, filenames);
      }
      return;
    }
    // If it's an array, recurse into each element.
    if (Array.isArray(value)) {
      for (const item of value) {
        this._collectFromValue(item, filenames);
      }
      return;
    }
    // If it's an object, recurse into its values.
    if (typeof value === 'object' && value !== null) {
      for (const nestedKey in value) {
        this._collectFromValue(
          (value as Record<string, unknown>)[nestedKey],
          filenames
        );
      }
    }
  }

  private _extractRteComponents(html: string): RteComponent[] {
    const components: RteComponent[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // List of known RTE component tag names.
    const rteTagNames = [
      'oppia-noninteractive-image',
      'oppia-noninteractive-math',
      'oppia-noninteractive-collapsible',
      'oppia-noninteractive-tabs',
      'oppia-noninteractive-link',
      'oppia-noninteractive-video',
      'oppia-noninteractive-skillreview',
      'oppia-noninteractive-workedexample',
    ];

    for (const tagName of rteTagNames) {
      const elements = doc.querySelectorAll(tagName);
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const customizationArgs: {[key: string]: unknown} = {};

        // Extract all attributes ending with '-with-value'.
        for (let j = 0; j < element.attributes.length; j++) {
          const attr = element.attributes[j];
          if (attr.name.endsWith('-with-value')) {
            try {
              // Decode HTML entities and parse JSON.
              const decodedValue = this._decodeHtmlEntities(attr.value);
              customizationArgs[attr.name] = JSON.parse(decodedValue);
            } catch (e) {
              // If parsing fails, store as string.
              customizationArgs[attr.name] = attr.value;
            }
          }
        }

        components.push({
          id: tagName,
          customization_args: customizationArgs,
        });
      }
    }

    return components;
  }

  private _decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.textContent = text;
    return textarea.value;
  }
}
