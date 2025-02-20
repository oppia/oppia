/**
 * @fileoverview Converts HTML to Unicode Pipe.
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'convertHtmlToUnicode' })
export class ConvertHtmlToUnicodePipe implements PipeTransform {
  transform(html: string): string {
    const domparser = new DOMParser();
    const dom = domparser.parseFromString(html, 'text/html');
    return dom.querySelector('body')?.innerText || '';
  }
}
