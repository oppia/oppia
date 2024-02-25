# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""File for compiling and checking typescript."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

from typing import List, Optional, Sequence

# TODO(#15567): This can be removed after Literal in utils.py is loaded
# from typing instead of typing_extensions, this will be possible after
# we migrate to Python 3.8.
from scripts import common  # isort:skip pylint: disable=wrong-import-position, unused-import
from . import build # isort:skip  pylint: disable=wrong-import-position, wrong-import-order

from core import utils # isort:skip

import yaml # isort:skip


# Contains the name of all files that are not strictly typed.
# This list must be kept up-to-date; the changes (only remove) should be done
# manually.
# Please keep the list in alphabetical order.
# NOTE TO DEVELOPERS: do not add any new files to this list without asking
# @vojtechjelinek first.
# pylint: disable=line-too-long, single-line-pragma
TS_STRICT_EXCLUDE_PATHS = [
    'core/templates/App.ts',
    'core/templates/AppSpec.ts',
    'core/templates/Polyfills.ts',
    'core/templates/app.constants.ajs.ts',
    'core/templates/components/ck-editor-helpers/ck-editor-4-rte.component.ts',
    'core/templates/components/ck-editor-helpers/ck-editor-4-widgets.initializer.ts',
    'core/templates/components/common-layout-directives/common-elements/answer-content-modal.component.spec.ts',
    'core/templates/components/common-layout-directives/common-elements/confirm-or-cancel-modal.controller.spec.ts',
    'core/templates/components/entity-creation-services/story-creation.service.spec.ts',
    'core/templates/components/entity-creation-services/story-creation.service.ts',
    'core/templates/components/entity-creation-services/story-creation-backend-api.service.spec.ts',
    'core/templates/components/entity-creation-services/story-creation-backend-api.service.ts',
    'core/templates/components/forms/custom-forms-directives/apply-validation.directive.ts',
    'core/templates/components/forms/custom-forms-directives/object-editor.directive.ts',
    'core/templates/components/forms/validators/is-float.filter.spec.ts',
    'core/templates/components/forms/validators/schema-validators.spec.ts',
    'core/templates/components/interaction-display/interaction-display.component.spec.ts',
    'core/templates/components/interaction-display/interaction-display.component.ts',
    'core/templates/components/oppia-angular-root.component.spec.ts',
    'core/templates/components/oppia-angular-root.component.ts',
    'core/templates/components/question-directives/question-editor/question-editor.component.ts',
    'core/templates/components/question-directives/questions-list/questions-list.component.spec.ts',
    'core/templates/components/question-directives/questions-list/questions-list.component.ts',
    'core/templates/components/shared-component.module.ts',
    'core/templates/components/skills-mastery-list/skills-mastery-list-concept-card-modal.controller.spec.ts',
    'core/templates/components/state-directives/answer-group-editor/answer-group-editor.component.spec.ts',
    'core/templates/components/state-directives/answer-group-editor/answer-group-editor.component.ts',
    'core/templates/components/state-directives/rule-editor/rule-editor.component.spec.ts',
    'core/templates/components/state-directives/rule-editor/rule-editor.component.ts',
    'core/templates/components/state-editor/state-editor.component.ts',
    'core/templates/components/state-editor/state-interaction-editor/state-interaction-editor.component.spec.ts',
    'core/templates/components/state-editor/state-interaction-editor/state-interaction-editor.component.ts',
    'core/templates/directives/mathjax-bind.directive.ts',
    'core/templates/domain/editor/undo_redo/undo-redo.service.spec.ts',
    'core/templates/domain/exploration/StatesObjectFactorySpec.ts',
    'core/templates/domain/exploration/editable-exploration-backend-api.service.spec.ts',
    'core/templates/domain/question/QuestionObjectFactorySpec.ts',
    'core/templates/domain/question/editable-question-backend-api.service.spec.ts',
    'core/templates/domain/question/question-update.service.spec.ts',
    'core/templates/domain/question/question-update.service.ts',
    'core/templates/domain/statistics/learner-answer-info.model.ts',
    'core/templates/domain/topic/topic-update.service.spec.ts',
    'core/templates/domain/topic/topic-update.service.ts',
    'core/templates/filters/truncate-input-based-on-interaction-answer-type.pipe.spec.ts',
    'core/templates/filters/truncate-input-based-on-interaction-answer-type.pipe.ts',
    'core/templates/karma.module.ts',
    'core/templates/pages/Base.ts',
    'core/templates/pages/admin-page/admin-blog-admin-common.module.ts',
    'core/templates/pages/admin-page/admin-page.import.ts',
    'core/templates/pages/blog-dashboard-page/shared-blog-components.module.ts',
    'core/templates/pages/classroom-page/classroom-page.module.ts',
    'core/templates/pages/collection-editor-page/editor-tab/collection-node-creator.component.ts',
    'core/templates/pages/collection-player-page/collection-player-page.component.spec.ts',
    'core/templates/pages/collection-player-page/collection-player-page.component.ts',
    'core/templates/pages/collection-player-page/collection-player-page.import.ts',
    'core/templates/pages/contributor-dashboard-admin-page/contributor-dashboard-admin-page.component.spec.ts',
    'core/templates/pages/contributor-dashboard-admin-page/contributor-dashboard-admin-page.component.ts',
    'core/templates/pages/contributor-dashboard-page/contributions-and-review/contributions-and-review.component.spec.ts',
    'core/templates/pages/contributor-dashboard-page/contributions-and-review/contributions-and-review.component.ts',
    'core/templates/pages/contributor-dashboard-page/contributor-dashboard-page.constants.ajs.spec.ts',
    'core/templates/pages/contributor-dashboard-page/contributor-dashboard-page.import.ts',
    'core/templates/pages/contributor-dashboard-page/services/translate-text.service.ts',
    'core/templates/pages/creator-dashboard-page/creator-dashboard-page.import.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/exploration-editor-tab.component.spec.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/exploration-editor-tab.component.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/graph-directives/state-graph-visualization.component.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/services/solution-verification.service.spec.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/add-answer-group-modal.component.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component.spec.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-data.service.spec.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-modal.component.spec.ts',
    'core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-modal.component.ts',
    'core/templates/pages/exploration-editor-page/exploration-editor-page.component.spec.ts',
    'core/templates/pages/exploration-editor-page/exploration-editor-page.component.ts',
    'core/templates/pages/exploration-editor-page/exploration-editor-page.import.ts',
    'core/templates/pages/exploration-editor-page/exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.component.spec.ts',
    'core/templates/pages/exploration-editor-page/exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.component.ts',
    'core/templates/pages/exploration-editor-page/feedback-tab/feedback-tab.component.spec.ts',
    'core/templates/pages/exploration-editor-page/feedback-tab/feedback-tab.component.ts',
    'core/templates/pages/exploration-editor-page/history-tab/history-tab.component.spec.ts',
    'core/templates/pages/exploration-editor-page/history-tab/history-tab.component.ts',
    'core/templates/pages/exploration-editor-page/improvements-tab/improvements-tab.component.spec.ts',
    'core/templates/pages/exploration-editor-page/improvements-tab/improvements-tab.component.ts',
    'core/templates/pages/exploration-editor-page/param-changes-editor/param-changes-editor.component.spec.ts',
    'core/templates/pages/exploration-editor-page/param-changes-editor/param-changes-editor.component.ts',
    'core/templates/pages/exploration-editor-page/param-changes-editor/value-generator-editor.component.spec.ts',
    'core/templates/pages/exploration-editor-page/param-changes-editor/value-generator-editor.component.ts',
    'core/templates/pages/exploration-editor-page/services/exploration-states.service.ts',
    'core/templates/pages/exploration-editor-page/services/router.service.spec.ts',
    'core/templates/pages/exploration-editor-page/services/router.service.ts',
    'core/templates/pages/exploration-editor-page/translation-tab/audio-translation-bar/audio-translation-bar.component.spec.ts',
    'core/templates/pages/exploration-editor-page/translation-tab/audio-translation-bar/audio-translation-bar.component.ts',
    'core/templates/pages/exploration-editor-page/translation-tab/state-translation/state-translation.component.spec.ts',
    'core/templates/pages/exploration-editor-page/translation-tab/state-translation/state-translation.component.ts',
    'core/templates/pages/exploration-player-page/layout-directives/exploration-footer.component.spec.ts',
    'core/templates/pages/exploration-player-page/layout-directives/exploration-footer.component.ts',
    'core/templates/pages/exploration-player-page/learner-experience/conversation-skin.component.spec.ts',
    'core/templates/pages/exploration-player-page/learner-experience/conversation-skin.component.ts',
    'core/templates/pages/exploration-player-page/services/answer-classification.service.spec.ts',
    'core/templates/pages/exploration-player-page/services/exploration-engine.service.spec.ts',
    'core/templates/pages/exploration-player-page/services/exploration-engine.service.ts',
    'core/templates/pages/exploration-player-page/services/exploration-player-state.service.ts',
    'core/templates/pages/exploration-player-page/services/question-player-engine.service.spec.ts',
    'core/templates/pages/exploration-player-page/services/question-player-engine.service.ts',
    'core/templates/pages/facilitator-dashboard-page/facilitator-dashboard-page.import.ts',
    'core/templates/pages/learner-dashboard-page/learner-dashboard-page.component.spec.ts',
    'core/templates/pages/learner-dashboard-page/learner-dashboard-page.import.ts',
    'core/templates/pages/learner-group-pages/create-group/create-learner-group-page.import.ts',
    'core/templates/pages/learner-group-pages/edit-group/edit-learner-group-page.import.ts',
    'core/templates/pages/learner-group-pages/shared-learner-group-component.module.ts',
    'core/templates/pages/learner-group-pages/view-group/view-learner-group-page.import.ts',
    'core/templates/pages/library-page/search-bar/search-bar.component.spec.ts',
    'core/templates/pages/oppia-root/app-error-handler.ts',
    'core/templates/pages/oppia-root/routing/app.routing.module.ts',
    'core/templates/pages/practice-session-page/practice-session-page.import.ts',
    'core/templates/pages/review-test-page/review-test-page.import.ts',
    'core/templates/pages/skill-editor-page/skill-editor-page.component.ts',
    'core/templates/pages/skill-editor-page/skill-editor-page.import.ts',
    'core/templates/pages/splash-page/splash-page.module.ts',
    'core/templates/pages/story-editor-page/chapter-editor/chapter-editor-tab.component.spec.ts',
    'core/templates/pages/story-editor-page/chapter-editor/chapter-editor-tab.component.ts',
    'core/templates/pages/story-editor-page/editor-tab/story-editor.component.spec.ts',
    'core/templates/pages/story-editor-page/editor-tab/story-editor.component.ts',
    'core/templates/pages/story-editor-page/editor-tab/story-node-editor.component.spec.ts',
    'core/templates/pages/story-editor-page/editor-tab/story-node-editor.component.ts',
    'core/templates/pages/story-editor-page/modal-templates/new-chapter-title-modal.controller.spec.ts',
    'core/templates/pages/story-editor-page/modal-templates/new-chapter-title-modal.controller.ts',
    'core/templates/pages/story-editor-page/story-editor-page.component.spec.ts',
    'core/templates/pages/story-editor-page/story-editor-page.component.ts',
    'core/templates/pages/story-editor-page/story-editor-page.import.ts',
    'core/templates/pages/topic-editor-page/editor-tab/topic-editor-stories-list.component.spec.ts',
    'core/templates/pages/topic-editor-page/editor-tab/topic-editor-stories-list.component.ts',
    'core/templates/pages/topic-editor-page/editor-tab/topic-editor-tab.directive.spec.ts',
    'core/templates/pages/topic-editor-page/editor-tab/topic-editor-tab.directive.ts',
    'core/templates/pages/topic-editor-page/modal-templates/create-new-story-modal.controller.spec.ts',
    'core/templates/pages/topic-editor-page/navbar/topic-editor-navbar.component.spec.ts',
    'core/templates/pages/topic-editor-page/navbar/topic-editor-navbar.component.ts',
    'core/templates/pages/topic-editor-page/modal-templates/rearrange-skills-in-subtopics-modal.component.spec.ts',
    'core/templates/pages/topic-editor-page/modal-templates/rearrange-skills-in-subtopics-modal.component.ts',
    'core/templates/pages/topic-editor-page/subtopic-editor/subtopic-editor-tab.component.spec.ts',
    'core/templates/pages/topic-editor-page/subtopic-editor/subtopic-editor-tab.component.ts',
    'core/templates/pages/topic-editor-page/topic-editor-page.component.spec.ts',
    'core/templates/pages/topic-editor-page/topic-editor-page.component.ts',
    'core/templates/pages/topic-editor-page/topic-editor-page.import.ts',
    'core/templates/pages/topic-viewer-page/topic-viewer-page.import.ts',
    'core/templates/pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.import.ts',
    'core/templates/services/UpgradedServices.ts',
    'core/templates/services/angular-services.index.ts',
    'core/templates/services/exploration-improvements-task-registry.service.ts',
    'core/templates/services/nested-directives-recursion-timeout-prevention.service.spec.ts',
    'core/templates/services/nested-directives-recursion-timeout-prevention.service.ts',
    'core/templates/services/oppia-rte-parser.service.spec.ts',
    'core/templates/services/oppia-rte-parser.service.ts',
    'core/templates/services/rte-helper-modal.controller.spec.ts',
    'core/templates/services/rte-helper-modal.controller.ts',
    'core/templates/services/rte-helper.service.spec.ts',
    'core/templates/services/rte-helper.service.ts',
    'core/templates/services/translation-file-hash-loader-backend-api.service.ts',
    'core/templates/tests/unit-test-utils.ajs.ts',
    'core/tests/build_sources/templates/pages/Base.ts',
    'core/tests/karma.conf.ts',
    'core/tests/services_sources/ATestFactory.ts',
    'core/tests/services_sources/BTestService.ts',
    'core/tests/services_sources/CTest.service.ts',
    'core/tests/services_sources/DTest.service.ts',
    'core/tests/services_sources/ETestFactory.ts',
    'core/tests/services_sources/F.directive.ts',
    'extensions/interactions/CodeRepl/directives/oppia-interactive-code-repl.component.spec.ts',
    'extensions/interactions/CodeRepl/directives/oppia-interactive-code-repl.component.ts',
    'extensions/interactions/DragAndDropSortInput/drag-and-drop-sort-input-interactions.module.ts',
    'extensions/interactions/GraphInput/directives/graph-viz.component.spec.ts',
    'extensions/interactions/GraphInput/directives/graph-viz.component.ts',
    'extensions/interactions/ImageClickInput/directives/oppia-interactive-image-click-input.component.spec.ts',
    'extensions/interactions/ImageClickInput/directives/oppia-interactive-image-click-input.component.ts',
    'extensions/interactions/ItemSelectionInput/item-selection-input-interactions.module.ts',
    'extensions/interactions/MultipleChoiceInput/directives/oppia-interactive-multiple-choice-input.component.spec.ts',
    'extensions/interactions/MultipleChoiceInput/directives/oppia-interactive-multiple-choice-input.component.ts',
    'extensions/interactions/MultipleChoiceInput/multiple-choice-input-interactions.module.ts',
    'extensions/interactions/MusicNotesInput/directives/music-notes-input.spec.ts',
    'extensions/interactions/MusicNotesInput/directives/oppia-interactive-music-notes-input.component.ts',
    'extensions/interactions/MusicNotesInput/directives/oppia-response-music-notes-input.component.ts',
    'extensions/interactions/MusicNotesInput/directives/oppia-short-response-music-notes-input.component.ts',
    'extensions/interactions/PencilCodeEditor/directives/oppia-response-pencil-code-editor.component.ts',
    'extensions/interactions/PencilCodeEditor/directives/oppia-short-response-pencil-code-editor.component.ts',
    'extensions/interactions/base-validator.spec.ts',
    'extensions/interactions/rules.spec.ts',
    'extensions/objects/object-components.module.ts',
    'extensions/objects/templates/graph-property-editor.component.spec.ts',
    'extensions/objects/templates/graph-property-editor.component.ts',
    'extensions/objects/templates/image-editor.component.spec.ts',
    'extensions/objects/templates/image-editor.component.ts',
    'extensions/objects/templates/parameter-name-editor.component.ts',
    'extensions/objects/templates/svg-editor.component.spec.ts',
    'extensions/objects/templates/svg-editor.component.ts',
    'extensions/rich_text_components/rte-output-display.component.ts',
    'extensions/visualizations/oppia-visualization-click-hexbins.directive.spec.ts',
    'extensions/visualizations/oppia-visualization-click-hexbins.directive.ts',
]
# pylint: enable=line-too-long, single-line-pragma

_PARSER = argparse.ArgumentParser(
    description="""
Run the script from the oppia root folder:
    python -m scripts.run_typescript_checks
Note that the root folder MUST be named 'oppia'.
""")

_PARSER.add_argument(
    '--strict_checks',
    help='optional; if specified, compiles typescript using strict config.',
    action='store_true')

COMPILED_JS_DIR = os.path.join('local_compiled_js_for_test', '')
TSCONFIG_FILEPATH = 'tsconfig.json'
STRICT_TSCONFIG_FILEPATH = 'tsconfig-strict.json'
TEMP_STRICT_TSCONFIG_FILEPATH = 'temp-tsconfig-strict.json'
PREFIXES = ('core', 'extensions', 'typings')


def validate_compiled_js_dir() -> None:
    """Validates that compiled JS dir matches out dir in tsconfig."""
    with utils.open_file(TSCONFIG_FILEPATH, 'r') as f:
        config_data = json.load(f)
        out_dir = os.path.join(config_data['compilerOptions']['outDir'], '')
    if out_dir != COMPILED_JS_DIR:
        raise Exception(
            'COMPILED_JS_DIR: %s does not match the output directory '
            'in %s: %s' % (COMPILED_JS_DIR, TSCONFIG_FILEPATH, out_dir))


def compile_temp_strict_tsconfig(
    config_path: str, error_messages: List[str]
) -> None:
    """Compiles temporary strict TS config with files those are neither
    strictly typed nor present in TS_STRICT_EXCLUDE_PATHS. If there are any
    errors, we restores the original config.

    Args:
        config_path: str. The config that should be used to run the typescript
            checks.
        error_messages: List[str]. A list of error messages produced by
            compiling the strict typescript config.
    """
    # Generate file names from the error messages.
    errors = [x.strip() for x in error_messages]
    # Remove the empty lines and error explanation lines.
    errors = [x for x in errors if x.startswith(PREFIXES)]
    # Remove error explanation lines.
    errors = [x.split('(', 1)[0] for x in errors]
    # Remove the duplicate occurrences of the file names.
    files_with_errors = sorted(set(errors))

    # List of missing files that are neither strictly typed nor present in
    # TS_STRICT_EXCLUDE_PATHS.
    files_not_type_strict = []
    for filename in files_with_errors:
        if filename not in TS_STRICT_EXCLUDE_PATHS:
            files_not_type_strict.append(filename)

    # Add "typings" folder to get global imports while compiling.
    files_not_type_strict.append('typings')

    # Update "include" field of temp-tsconfig-strict.json with files those
    # are neither strict typed nor present in TS_STRICT_EXCLUDE_PATHS.
    # Example: List "files_not_type_strict".
    with utils.open_file(STRICT_TSCONFIG_FILEPATH, 'r') as f:
        strict_ts_config = yaml.safe_load(f)
        strict_ts_config['include'] = files_not_type_strict

    with utils.open_file(TEMP_STRICT_TSCONFIG_FILEPATH, 'w') as f:
        json.dump(strict_ts_config, f, indent=2, sort_keys=True)
        f.write('\n')

    # Compile temp-tsconfig-strict.json with files those are neither strictly
    # typed nor present in TS_STRICT_EXCLUDE_PATHS. All those files
    # present inside include property.
    os.environ['PATH'] = '%s/bin:' % common.NODE_PATH + os.environ['PATH']
    validate_compiled_js_dir()

    if os.path.exists(COMPILED_JS_DIR):
        shutil.rmtree(COMPILED_JS_DIR)

    cmd = ['./node_modules/typescript/bin/tsc', '--project', config_path]
    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, encoding='utf-8')

    # The value of `process.stdout` should not be None since we passed
    # the `stdout=subprocess.PIPE` argument to `Popen`.
    assert process.stdout is not None
    error_messages = list(iter(process.stdout.readline, ''))

    # Remove temporary strict TS config.
    if os.path.exists(TEMP_STRICT_TSCONFIG_FILEPATH):
        os.remove(TEMP_STRICT_TSCONFIG_FILEPATH)

    if error_messages:
        print('\n' + '\n'.join(error_messages))
        print(
            '%s Errors found during compilation.\n' % (
                len([x for x in error_messages if x.startswith(PREFIXES)]))
            )
        sys.exit(1)
    else:
        print('Compilation successful!')


def compile_and_check_typescript(config_path: str) -> None:
    """Compiles typescript files and checks the compilation errors.

    Args:
        config_path: str. The config that should be used to run the typescript
            checks.
    """
    # We need to create an empty hashes.json file for the build so that
    # we don't get the error "assets/hashes.json file doesn't exist".
    build.save_hashes_to_file({})
    # Set strict TS config include property to ["core", "extensions", "typings"]
    # This make sure to restore include property to its original value after the
    # checks get aborted mid-way.
    with utils.open_file(STRICT_TSCONFIG_FILEPATH, 'r') as f:
        strict_ts_config = yaml.safe_load(f)
        strict_ts_config['include'] = PREFIXES

    with utils.open_file(STRICT_TSCONFIG_FILEPATH, 'w') as f:
        json.dump(strict_ts_config, f, indent=2, sort_keys=True)
        f.write('\n')

    os.environ['PATH'] = '%s/bin:' % common.NODE_PATH + os.environ['PATH']
    validate_compiled_js_dir()

    if os.path.exists(COMPILED_JS_DIR):
        shutil.rmtree(COMPILED_JS_DIR)

    print('Compiling and testing typescript...')
    cmd = ['./node_modules/typescript/bin/tsc', '--project', config_path]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, encoding='utf-8')

    # The value of `process.stdout` should not be None since we passed
    # the `stdout=subprocess.PIPE` argument to `Popen`.
    assert process.stdout is not None
    error_messages = list(iter(process.stdout.readline, ''))

    if config_path == STRICT_TSCONFIG_FILEPATH:
        compile_temp_strict_tsconfig(
            TEMP_STRICT_TSCONFIG_FILEPATH, error_messages)
    else:
        if error_messages:
            print('Errors found during compilation\n')
            print('\n'.join(error_messages))
            sys.exit(1)
        else:
            print('Compilation successful!')


def main(args: Optional[Sequence[str]] = None) -> None:
    """Run the typescript checks."""
    parsed_args = _PARSER.parse_args(args=args)
    compile_and_check_typescript(
        STRICT_TSCONFIG_FILEPATH
        if parsed_args.strict_checks else
        TSCONFIG_FILEPATH)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when run_typescript_checks.py is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
