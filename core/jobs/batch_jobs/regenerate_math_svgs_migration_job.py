# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

from __future__ import annotations

import json
import logging
import os
import re

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import bs4
import result

from typing import Dict, Iterator, List, Sequence, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])


_SVG_MAPPING_PATH = os.path.join(
    os.path.dirname(__file__), '..', '..', '..', 'svg_mapping.json'
)


def _load_svg_mapping() -> Dict[str, str]:
    """Loads the svg_mapping.json file and returns a dict of
    old_filename → new_filename.

    Returns:
        dict(str, str). Mapping from old SVG filename to new SVG filename.
    """
    if not os.path.exists(_SVG_MAPPING_PATH):
        raise FileNotFoundError(
            'svg_mapping.json not found at %s. '
            'Run bulk_generate_svgs.js first.' % _SVG_MAPPING_PATH
        )
    with open(_SVG_MAPPING_PATH, 'r', encoding='utf-8') as f:
        entries = json.load(f)

    mapping = {}
    for entry in entries:
        old = entry.get('old_filename', '')
        new = entry.get('new_filename', '')
        if old and new:
            mapping[old] = new
    return mapping


SVG_FILENAME_MAPPING: Dict[str, str] = _load_svg_mapping()


def _unescape_html(html_string: str) -> str:
    """Unescapes HTML entities in a string.

    Oppia stores math_content-with-value with HTML-escaped JSON, e.g.:
      {&quot;raw_latex&quot;: &quot;x=11&quot;, ...}

    Args:
        html_string: str. The HTML-escaped string.

    Returns:
        str. The unescaped string.
    """
    return (
        html_string.replace('&amp;quot;', '"')
        .replace('&quot;', '"')
        .replace('&amp;', '&')
        .replace('&lt;', '<')
        .replace('&gt;', '>')
    )


def _escape_html(plain_string: str) -> str:
    """Escapes a string for use as an HTML attribute value.

    This is the inverse of _unescape_html and matches Oppia's
    utils.escape_html() behaviour for math content attributes.

    Args:
        plain_string: str. The plain string.

    Returns:
        str. The HTML-escaped string.
    """
    return plain_string.replace('&', '&amp;').replace('"', '&quot;')


def _update_math_tags_in_html(
    html_string: str,
    svg_mapping: Dict[str, str],
) -> Tuple[str, int]:
    """Finds all oppia-noninteractive-math tags in an HTML string and
    replaces their svg_filename values using svg_mapping.

    Args:
        html_string: str. The HTML string to update.
        svg_mapping: dict(str, str). Mapping from old to new SVG filenames.

    Returns:
        tuple(str, int). The updated HTML string and the number of
        replacements made.
    """
    soup = bs4.BeautifulSoup(html_string, 'html.parser')
    replacements = 0

    for math_tag in soup.findAll(name='oppia-noninteractive-math'):
        if not math_tag.has_attr('math_content-with-value'):
            continue

        raw_attr = math_tag['math_content-with-value']
        try:
            math_content = json.loads(_unescape_html(raw_attr))
        except (json.JSONDecodeError, KeyError):
            logging.warning(
                'Could not parse math_content-with-value: %s', raw_attr
            )
            continue

        old_filename = math_content.get('svg_filename', '')
        if old_filename in svg_mapping:
            math_content['svg_filename'] = svg_mapping[old_filename]
            math_tag['math_content-with-value'] = _escape_html(
                json.dumps(math_content, sort_keys=True)
            )
            replacements += 1

    return str(soup), replacements


def _update_exploration_model(
    exp_model: exp_models.ExplorationModel,
    svg_mapping: Dict[str, str],
) -> result.Result[
    Tuple[exp_models.ExplorationModel, int], Tuple[str, Exception]
]:
    """Updates all math SVG filenames in a single ExplorationModel.

    Walks through every state's content and interaction HTML fields
    and replaces old SVG filenames with new ones from svg_mapping.

    Args:
        exp_model: ExplorationModel. The model to update.
        svg_mapping: dict(str, str). Mapping from old to new SVG filenames.

    Returns:
        Result(ExplorationModel, (str, Exception)). Ok with updated model,
        or Err with the exploration ID and exception on failure.
    """
    try:
        total_replacements = 0

        for state_name, state_dict in exp_model.states.items():
            # Update content HTML.
            content_html = state_dict.get('content', {}).get('html', '')
            if content_html:
                updated_html, count = _update_math_tags_in_html(
                    content_html, svg_mapping
                )
                if count:
                    state_dict['content']['html'] = updated_html
                    total_replacements += count

            # Update interaction customization args (may contain math HTML).
            interaction = state_dict.get('interaction', {})
            cust_args = interaction.get('customization_args', {})
            for arg_name, arg_value in cust_args.items():
                _update_html_in_dict(arg_value, svg_mapping, total_replacements)

            # Update answer groups' feedback HTML.
            for answer_group in interaction.get('answer_groups', []):
                feedback = answer_group.get('outcome', {}).get('feedback', {})
                feedback_html = feedback.get('html', '')
                if feedback_html:
                    updated_html, count = _update_math_tags_in_html(
                        feedback_html, svg_mapping
                    )
                    if count:
                        feedback['html'] = updated_html
                        total_replacements += count

            # Update default outcome feedback HTML.
            default_outcome = interaction.get('default_outcome')
            if default_outcome:
                feedback = default_outcome.get('feedback', {})
                feedback_html = feedback.get('html', '')
                if feedback_html:
                    updated_html, count = _update_math_tags_in_html(
                        feedback_html, svg_mapping
                    )
                    if count:
                        feedback['html'] = updated_html
                        total_replacements += count

            # Update hints HTML.
            for hint in state_dict.get('hints', []):
                hint_html = hint.get('hint_content', {}).get('html', '')
                if hint_html:
                    updated_html, count = _update_math_tags_in_html(
                        hint_html, svg_mapping
                    )
                    if count:
                        hint['hint_content']['html'] = updated_html
                        total_replacements += count

            # Update solution explanation HTML.
            solution = state_dict.get('solution')
            if solution:
                explanation = solution.get('explanation', {})
                explanation_html = explanation.get('html', '')
                if explanation_html:
                    updated_html, count = _update_math_tags_in_html(
                        explanation_html, svg_mapping
                    )
                    if count:
                        explanation['html'] = updated_html
                        total_replacements += count

        if total_replacements > 0:
            logging.info(
                'Exploration %s: updated %d math SVG filename(s).',
                exp_model.id,
                total_replacements,
            )

        return result.Ok((exp_model, total_replacements))

    except Exception as e:
        logging.exception(
            'Failed to migrate exploration %s: %s', exp_model.id, e
        )
        return result.Err((exp_model.id, e))


def _update_html_in_dict(
    obj: object,
    svg_mapping: Dict[str, str],
    total_replacements: int,
) -> None:
    """Recursively walks a dict/list structure and updates any HTML strings
    containing math tags.

    This handles deeply nested customization_args structures.

    Args:
        obj: object. The object to walk.
        svg_mapping: dict(str, str). Mapping from old to new SVG filenames.
        total_replacements: int. Running count (mutated by caller).
    """
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == 'html' and isinstance(value, str):
                updated, count = _update_math_tags_in_html(value, svg_mapping)
                if count:
                    obj[key] = updated
                    total_replacements += count
            else:
                _update_html_in_dict(value, svg_mapping, total_replacements)
    elif isinstance(obj, list):
        for item in obj:
            _update_html_in_dict(item, svg_mapping, total_replacements)


class RegenerateMathSvgsJob(base_jobs.JobBase):
    """Migrates math SVG filenames in all ExplorationModels.

    This is Part 2 of the math SVG regeneration process.
    Run bulk_generate_svgs.js first to produce svg_mapping.json
    and the new SVG files.
    """

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the migration.

        Returns:
            PCollection. A PCollection of JobRunResult objects.
        """
        svg_mapping = SVG_FILENAME_MAPPING

        migration_results = (
            self.pipeline
            | 'Get all ExplorationModels'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
            | 'Filter explorations with math content'
            >> beam.Filter(lambda model: _exploration_has_math_content(model))
            | 'Update math SVG filenames'
            >> beam.Map(
                lambda model: _update_exploration_model(model, svg_mapping)
            )
        )

        migrated_models = (
            migration_results
            | 'Filter ok results' >> beam.Filter(lambda r: r.is_ok())
            | 'Unwrap ok results' >> beam.Map(lambda r: r.unwrap())
        )

        # Split into actually-changed vs unchanged
        actually_migrated = (
            migrated_models
            | 'Filter actually migrated'
            >> beam.Filter(lambda pair: pair[1] > 0)
            | 'Unwrap model from pair' >> beam.Map(lambda pair: pair[0])
        )

        not_migrated = (
            migrated_models
            | 'Filter not migrated' >> beam.Filter(lambda pair: pair[1] == 0)
            | 'Unwrap unchanged model' >> beam.Map(lambda pair: pair[0])
        )

        migration_job_run_results = (
            migration_results
            | 'Generate migration results'
            >> job_result_transforms.ResultsToJobRunResults(
                'EXPLORATION PROCESSED'
            )
        )

        migrated_count_job_run_results = (
            actually_migrated
            | 'Count migrated explorations'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'EXPLORATION MIGRATED'
            )
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                actually_migrated
                | 'Write updated models to datastore' >> ndb_io.PutModels()
            )

        return (
            migration_job_run_results,
            migrated_count_job_run_results,
        ) | beam.Flatten()


class AuditRegenerateMathSvgsJob(RegenerateMathSvgsJob):
    """Audit job for RegenerateMathSvgsJob.

    Runs the full migration logic but does NOT write to the datastore.
    Use this first to verify the mapping and count affected explorations.
    """

    DATASTORE_UPDATES_ALLOWED = False


def _exploration_has_math_content(
    model: exp_models.ExplorationModel,
) -> bool:
    """Returns True if any state in the exploration contains a math tag.

    Used to filter out explorations that don't need migration, avoiding
    unnecessary datastore writes.

    Args:
        model: ExplorationModel. The exploration model to check.

    Returns:
        bool. Whether the model contains any math tags.
    """
    for state_dict in model.states.values():
        content_html = state_dict.get('content', {}).get('html', '')
        if 'oppia-noninteractive-math' in content_html:
            return True
        interaction = state_dict.get('interaction', {})
        for answer_group in interaction.get('answer_groups', []):
            feedback_html = (
                answer_group.get('outcome', {})
                .get('feedback', {})
                .get('html', '')
            )
            if 'oppia-noninteractive-math' in feedback_html:
                return True
        default_outcome = interaction.get('default_outcome')
        if default_outcome:
            feedback_html = default_outcome.get('feedback', {}).get('html', '')
            if 'oppia-noninteractive-math' in feedback_html:
                return True
        for hint in state_dict.get('hints', []):
            hint_html = hint.get('hint_content', {}).get('html', '')
            if 'oppia-noninteractive-math' in hint_html:
                return True
    return False
