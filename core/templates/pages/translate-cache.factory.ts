import { TranslateService } from '@ngx-translate/core';
import { TranslateCacheService, TranslateCacheSettings } from 'ngx-translate-cache';

export class TranslateCacheFactory {
  static createTranslateCacheService(
      translateService: TranslateService,
      translateCacheSettings: TranslateCacheSettings): TranslateCacheService {
    return new TranslateCacheService(translateService, translateCacheSettings);
  }
}
