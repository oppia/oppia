import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { TranslateCompiler, TranslateDefaultParser } from '@ngx-translate/core';
import * as MessageFormat from 'messageformat';

export const MESSAGE_FORMAT_CONFIG = new InjectionToken<MessageFormatConfig>(
  'MESSAGE_FORMAT_CONFIG'
);

export interface MessageFormatConfig {
  biDiSupport?: boolean;
  formatters?: {
    [name: string]: (val, lc: string, arg?: string) => string;
  };
  locales?: string | string[];
  strictNumberSign?: boolean;
  disablePluralKeyChecks?: boolean;
}

const defaultConfig: MessageFormatConfig = {
  biDiSupport: false,
  formatters: undefined,
  locales: undefined,
  strictNumberSign: false,
  disablePluralKeyChecks: false,
};

@Injectable()
export class TranslateMessageFormatCompiler extends TranslateCompiler {
  private messageFormat: MessageFormat;

  constructor(
    @Optional()
    @Inject(MESSAGE_FORMAT_CONFIG) config?: MessageFormatConfig,
    private translateDefaultParser: TranslateDefaultParser
  ) {
    super();

    const {
      locales,
      formatters,
      biDiSupport,
      strictNumberSign,
      disablePluralKeyChecks,
    } = {
      ...defaultConfig,
      ...config,
    };

    this.messageFormat = new MessageFormat(locales);
  }

  public compile(value: string, lang: string): (params) => string {
    console.log(value);
    return this.messageFormat.compile(value, lang);
  }

  public compileTranslations(
      translations, lang: string): MessageFormat.Msg {
    return this.messageFormat.compile(translations, lang);
  }
}
