import os


def replace_in_file(path, old, new):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


# 1. collection-player-page.component.spec.ts
replace_in_file(
    'core/templates/pages/collection-player-page/collection-player-page.component.spec.ts',
    'component.collectionPlaythrough = undefined as any;',
    'component.collectionPlaythrough = undefined as unknown as CollectionPlaythrough;',
)
replace_in_file(
    'core/templates/pages/collection-player-page/collection-player-page.component.spec.ts',
    '} as any);',
    '} as unknown as CollectionBackendDict);',
)

# 2. contributions-and-review.component.spec.ts
replace_in_file(
    'core/templates/pages/contributor-dashboard-page/contributions-and-review/contributions-and-review.component.spec.ts',
    "import { Suggestion, Opportunity } from 'domain/opportunity/opportunity.model';",
    "import { Suggestion } from 'domain/opportunity/opportunity.model';",
)
replace_in_file(
    'core/templates/pages/contributor-dashboard-page/contributions-and-review/contributions-and-review.component.spec.ts',
    '} as any;',
    '} as unknown as Suggestion;',
)

# 3. translation-modal.component.spec.ts
replace_in_file(
    'core/templates/pages/contributor-dashboard-page/modal-templates/translation-modal.component.spec.ts',
    '// @ts-ignore',
    '// @ts-ignore This throws "Type null is not assignable to type". We need to suppress this error because we are testing the null case.',
)

# 4. translation-suggestion-review-modal.component.spec.ts
import re

path = 'core/templates/pages/contributor-dashboard-page/modal-templates/translation-suggestion-review-modal.component.spec.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('(val?: any)', '(val?: unknown)')
content = re.sub(
    r'component\.contentPanel = new RteOutputDisplayComponent\([^;]+;',
    '// @ts-ignore This throws "Expected 12 arguments". We need to suppress this error because we pass nulls for testing.\n    component.contentPanel = new RteOutputDisplayComponent(\n      null,\n      null,\n      new ElementRef({offsetHeight: 200}),\n      null,\n      null,\n      null,\n      null,\n      null,\n      null,\n      null,\n      null,\n      null\n    );',
    content,
)
content = re.sub(
    r'component\.translationPanel = new RteOutputDisplayComponent\([^;]+;',
    '// @ts-ignore This throws "Expected 12 arguments". We need to suppress this error because we pass nulls for testing.\n    component.translationPanel = new RteOutputDisplayComponent(\n      null,\n      null,\n      new ElementRef({offsetHeight: 200}),\n      null,\n      null,\n      null,\n      null,\n      null,\n      null,\n      null,\n      null,\n      null\n    );',
    content,
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# 5. rte-helper-modal.component.spec.ts
replace_in_file(
    'core/templates/services/rte-helper-modal.component.spec.ts',
    '] as any;',
    '] as unknown as CustomizationArgsSpecsType;',
)
replace_in_file(
    'core/templates/services/rte-helper-modal.component.spec.ts',
    '} as any;',
    '} as unknown as CustomizationArgsForRteType;',
)

# 6. rte-output-display.component.ts
replace_in_file(
    'extensions/rich_text_components/rte-output-display.component.ts',
    'if (!className) return null;',
    'if (!className) {\n      return null;\n    }',
)
replace_in_file(
    'extensions/rich_text_components/rte-output-display.component.ts',
    '(this as any)[',
    '(this as unknown as Record<string, TemplatePortal<unknown>>)[',
)

print('Replacements done.')
