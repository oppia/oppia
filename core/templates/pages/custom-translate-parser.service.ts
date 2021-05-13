import { Injectable } from '@angular/core';
import { TranslateParser } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class CustomTranslateParser extends TranslateParser {
  interpolate(expr: string | Function, params): string {

  }
  getValue(target, key: string) {

  }
}
