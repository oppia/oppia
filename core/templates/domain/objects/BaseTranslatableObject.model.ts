import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { TranslatedContent } from 'domain/exploration/TranslatedContentObjectFactory';
import { EntityTranslation } from 'domain/translation/EntityTranslationObjectFactory';

export class BaseTranslatableObject {
  _translatableFields: SubtitledHtml[];
  _translatableObjects: BaseTranslatableObject[] | null[];

  constructor() {
    this._translatableFields = [];
    this._translatableObjects = [];
  }

  _isString(translation: string|string[]): translation is string {
    return (typeof translation === 'string');
  }

  _isValidStringTranslation(writtenTranslation: TranslatedContent): boolean {
    return (
      writtenTranslation !== undefined &&
      this._isString(writtenTranslation.translation) &&
      writtenTranslation.translation !== '' &&
      writtenTranslation.needsUpdate === false);
  }

  swapContentsWithTranslation(entityTranslations: EntityTranslation): void {
    this._translatableFields.forEach((translatableField) => {
      const contentId = translatableField.contentId;
      if (entityTranslations.hasWrittenTranslation(contentId)) {
        let writtenTranslation = entityTranslations.getWrittenTranslation(
          contentId);
        if (this._isValidStringTranslation(writtenTranslation)) {
          translatableField.html = writtenTranslation.translation as string;
        }
      }
    });

    this._translatableObjects.forEach((translatableObject) => {
      translatableObject.swapContentsWithTranslation(entityTranslations);
    });
  }

  getAllContents(): SubtitledHtml[] {
    let translatableFields = this._translatableFields;

    this._translatableObjects.forEach((translatableObject) => {
      translatableFields = translatableFields.concat(
        translatableObject.getAllContents());
    });

    return translatableFields;
  }

  getAllHTMLs(): SubtitledHtml[] {
    return this.getAllContents().map((content) => {
      if (content instanceof SubtitledHtml) {
        return content;
      }
    });
  }

  getAllContentIds(): string[] {
    return this.getAllContents().map((content) => {
      return content.contentId;
    });
  }
}
