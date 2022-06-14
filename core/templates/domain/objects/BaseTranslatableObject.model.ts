import { SubtitledHtml } from "domain/exploration/subtitled-html.model";
import { TranslatedContent } from "domain/exploration/TranslatedContentObjectFactory";
import { EntityTranslation } from "domain/translation/EntityTranslationObjectFactory";

export class BaseTranslatableObject {
  _translatableFields: any;
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

  swapContentsWithTranslation(entityTranslations: EntityTranslation) {
    this._translatableFields.forEach((translatableField) => {
      if (entityTranslations.hasWrittenTranslation(translatableField.contentId)) {
        let writtenTranslation = entityTranslations.getWrittenTranslation(
          translatableField.contentId);
        if (this._isValidStringTranslation(writtenTranslation)) {
          translatableField.html = writtenTranslation.translation;
        }
      }
    })

    this._translatableObjects.forEach((translatableObject) => {
      translatableObject.swapContentsWithTranslation(entityTranslations);
    });
  }

  getAllContents() {
    let translatableFields = this._translatableFields;

    this._translatableObjects.forEach((translatableObject) => {
      translatableFields = translatableFields.concat(
        translatableObject.getAllContents());
    })

    return translatableFields;
  }

  getAllHTMLs() {
    return this.getAllContents().map((content) => {
      if (content instanceof SubtitledHtml) {
        return content;
      }
    });
  }

  getAllContentIds() {
    return this.getAllContents().map((content) => {
      return content.contentId;
    })
  }
}