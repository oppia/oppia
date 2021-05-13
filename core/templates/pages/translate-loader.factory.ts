import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export class TranslateLoaderFactory {
  static createHttpLoader(httpClient: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(httpClient);
  }
}
