import re

def strip_from_html():
    with open('core/templates/pages/contributor-dashboard-page/modal-templates/translation-modal.component.html', 'r') as f:
        html = f.read()

    # Remove the specific <p> tag with the image warning
    target_p = '''<p *ngIf="hasImageInAutoTranslation" class="oppia-auto-translate-red-text">\n              Edit alt text for the image(s) for visually impaired users\n            </p>'''
    if target_p in html:
        html = html.replace(target_p, '')

    # Also fix the ngClass on the next p tag which references hasImageInAutoTranslation
    # It was: [ngClass]="{'oppia-auto-translate-teal-text': isTranslationEdited(), 'oppia-auto-translate-red-text': hasImageInAutoTranslation && !isTranslationEdited(), 'oppia-auto-translate-grey-text': !hasImageInAutoTranslation && !isTranslationEdited()}"
    # Change to: [ngClass]="{'oppia-auto-translate-teal-text': isTranslationEdited(), 'oppia-auto-translate-grey-text': !isTranslationEdited()}"
    ng_class_target = "[ngClass]=\"{'oppia-auto-translate-teal-text': isTranslationEdited(), 'oppia-auto-translate-red-text': hasImageInAutoTranslation && !isTranslationEdited(), 'oppia-auto-translate-grey-text': !hasImageInAutoTranslation && !isTranslationEdited()}\""
    ng_class_replacement = "[ngClass]=\"{'oppia-auto-translate-teal-text': isTranslationEdited(), 'oppia-auto-translate-grey-text': !isTranslationEdited()}\""
    html = html.replace(ng_class_target, ng_class_replacement)

    with open('core/templates/pages/contributor-dashboard-page/modal-templates/translation-modal.component.html', 'w') as f:
        f.write(html)

def strip_from_ts():
    with open('core/templates/pages/contributor-dashboard-page/modal-templates/translation-modal.component.ts', 'r') as f:
        ts = f.read()

    ts = ts.replace("hasImageInAutoTranslation: boolean = false;\n", "")
    ts = ts.replace("hasAltTextModalBeenOpened: boolean = false;\n", "")
    
    # Remove assignments in generateTranslation
    ts = ts.replace("this.hasImageInAutoTranslation = translatedText.includes(\n          '<oppia-noninteractive-image'\n        );\n", "")
    ts = ts.replace("this.hasAltTextModalBeenOpened = false;\n", "")

    # Remove the block in canTranslatedTextBeSubmitted
    block = """    if (this.hasImageInAutoTranslation && !this.hasAltTextModalBeenOpened) {
      return true;
    }
"""
    ts = ts.replace(block, "")

    with open('core/templates/pages/contributor-dashboard-page/modal-templates/translation-modal.component.ts', 'w') as f:
        f.write(ts)

strip_from_html()
strip_from_ts()
print("Stripped image logic")
