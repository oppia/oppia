# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Rejecting suggestions whose content_id no longer exists and
updating the translation content.
"""

from __future__ import annotations

from core import feconf
from core import utils
from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import bs4
import json

from typing import List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.SUGGESTION
])

datastore_services = models.Registry.import_datastore_services()


class RejectSuggestionWithMissingContentIdMigrationJob(base_jobs.JobBase):
    """Job that rejects the suggestions for missing content ids and
    updates the RTE content.
    """

    empty_values = [
        '&quot;&quot;', '\\"&quot;&quot;\\"', '', '\'\'', '\"\"', '<p></p>']

    @staticmethod
    def _is_tag_removed_with_invalid_attributes(
        tag: bs4.BeautifulSoup, attr: str
    ) -> bool:
        """Returns True when the tag is removed due to invalid attribute.

        Args:
            tag: bs4.BeautifulSoup. The RTE tag.
            attr: str. The attribute that needs to be checked.

        Returns:
            bool. Returns True when the tag has been deleted.
        """
        if not tag.has_attr(attr):
            tag.decompose()
            return True

        if (
            tag[attr].strip() in
            RejectSuggestionWithMissingContentIdMigrationJob.empty_values
        ):
            tag.decompose()
            return True

        return False

    @staticmethod
    def fix_rte_tags(
        html: str,
        *,
        is_tags_nested_inside_tabs_or_collapsible: bool = False
    ) -> str:
        """Handles all the invalid RTE tags, performs the following:
            - `oppia-noninteractive-image`
                - If `alt-with-value` attribute not in the image tag,
                introduces the attribute and assign empty value
                - If `filepath-with-value` attribute not in image tag,
                removes the tag
                - If `filepath-with-value` attribute empty then removes
                the tag
                - If `caption-with-value` attribute not in the image tag,
                introduces the attribute and assign empty value
            - `oppia-noninteractive-skillreview`
                - If `text-with-value` attribute is not present or empty or
                None, removes the tag
                - If `skill_id-with-value` attribute is not present or empty or
                None, removes the tag
            - `oppia-noninteractive-math`
                - If `math_content-with-value` attribute not in math tag,
                removes the tag
                - If `raw_latex` is not present or empty or None, removes
                the tag
            - `oppia-noninteractive-video`
                - If `start-with-value` or `end-with-value` is not present,
                introduce them to the tag and assign 0 to them
                - If `autoplay-with-value` is not present or is not boolean,
                introduce it to the tag and assign `false` to them
                - If `video_id-with-value` is not present or empty, removes
                the tag
                - If `start-with-value` > `end-with-value`, set both to '0'
            - `oppia-noninteractive-link`
                - If `text-with-value` or `url-with-value` is not present,
                or is empty simply removes the tag
            - `oppia-noninteractive-tabs` and `oppia-noninteractive-collapsible`
                - If these tags are nested inside tabs and collapsible tag, we
                will simply remove the tag

        Args:
            html: str. The RTE tags.
            is_tags_nested_inside_tabs_or_collapsible: bool. If the tag is
                present inside the tabs or collapsible tag.

        Returns:
            str. Returns the updated html value.
        """
        soup = bs4.BeautifulSoup(html, 'html.parser')

        for tag in soup.find_all('oppia-noninteractive-image'):
            if not tag.has_attr('alt-with-value'):
                tag['alt-with-value'] = '&quot;&quot;'

            if (
                RejectSuggestionWithMissingContentIdMigrationJob.
                _is_tag_removed_with_invalid_attributes(
                    tag, 'filepath-with-value')
            ):
                continue

            if not tag.has_attr('caption-with-value'):
                tag['caption-with-value'] = '&quot;&quot;'

        for tag in soup.find_all('oppia-noninteractive-skillreview'):
            if (
                RejectSuggestionWithMissingContentIdMigrationJob.
                _is_tag_removed_with_invalid_attributes(tag, 'text-with-value')
            ):
                continue

            if (
                RejectSuggestionWithMissingContentIdMigrationJob.
                _is_tag_removed_with_invalid_attributes(
                tag, 'skill_id-with-value')
            ):
                continue

        for tag in soup.find_all('oppia-noninteractive-video'):
            if not tag.has_attr('start-with-value'):
                tag['start-with-value'] = '0'
            else:
                if not tag['start-with-value'].isdigit():
                    tag['start-with-value'] = '0'

            if not tag.has_attr('end-with-value'):
                tag['end-with-value'] = '0'
            else:
                if not tag['end-with-value'].isdigit():
                    tag['end-with-value'] = '0'

            if not tag.has_attr('autoplay-with-value'):
                tag['autoplay-with-value'] = 'false'
            else:
                if tag['autoplay-with-value'].strip() not in (
                    'true', 'false', '\'true\'', '\'false\'',
                    '\"true\"', '\"false\"', True, False
                ):
                    tag['autoplay-with-value'] = 'false'

            if (
                RejectSuggestionWithMissingContentIdMigrationJob.
                _is_tag_removed_with_invalid_attributes(
                tag, 'video_id-with-value')
            ):
                continue

            start_value = float(tag['start-with-value'])
            end_value = float(tag['end-with-value'])
            if (
                start_value > end_value and
                start_value != 0 and
                end_value != 0
            ):
                tag['end-with-value'] = '0'
                tag['start-with-value'] = '0'

        for tag in soup.find_all('oppia-noninteractive-link'):
            if (
                RejectSuggestionWithMissingContentIdMigrationJob.
                _is_tag_removed_with_invalid_attributes(
                    tag, 'url-with-value')
            ):
                continue

            if not tag.has_attr('text-with-value'):
                tag['text-with-value'] = tag['url-with-value']
            else:
                if (
                    tag['text-with-value'].strip() in
                    RejectSuggestionWithMissingContentIdMigrationJob.
                    empty_values
                ):
                    tag['text-with-value'] = tag['url-with-value']

        for tag in soup.find_all('oppia-noninteractive-math'):
            if (
                RejectSuggestionWithMissingContentIdMigrationJob.
                _is_tag_removed_with_invalid_attributes(
                    tag, 'math_content-with-value')
            ):
                continue

            math_content_json = utils.unescape_html(
                tag['math_content-with-value'])
            math_content_list = json.loads(math_content_json)
            if 'raw_latex' not in math_content_list:
                tag.decompose()
                continue
            if (
                math_content_list['raw_latex'].strip() in
                RejectSuggestionWithMissingContentIdMigrationJob.empty_values
            ):
                tag.decompose()
                continue

        if is_tags_nested_inside_tabs_or_collapsible:
            tabs_tags = soup.find_all('oppia-noninteractive-tabs')
            if len(tabs_tags) > 0:
                for tabs_tag in tabs_tags:
                    tabs_tag.decompose()
                    continue
            collapsible_tags = soup.find_all('oppia-noninteractive-collapsible')
            if len(collapsible_tags) > 0:
                for collapsible_tag in collapsible_tags:
                    collapsible_tag.decompose()
                    continue

        return str(soup).replace('<br/>', '<br>')

    @staticmethod
    def _is_tag_removed_with_empty_content(
        tag: bs4.BeautifulSoup,
        content: Union[str, List[str]],
        *,
        is_collapsible: bool = False
    ) -> bool:
        """Returns True when the tag is removed for having empty content.

        Args:
            tag: bs4.BeautifulSoup. The RTE tag.
            content: Union[str, List[str]]. The content that needs to be
                checked.
            is_collapsible: bool. True if the tag is collapsible tag.

        Returns:
            bool. Returns True when the tag has been deleted.
        """
        if is_collapsible:
            assert isinstance(content, str)
            if (
                content.strip() in
                RejectSuggestionWithMissingContentIdMigrationJob.empty_values
            ):
                tag.decompose()
                return True
        else:
            if len(content) == 0:
                tag.decompose()
                return True

        return False

    @staticmethod
    def fix_tabs_and_collapsible_tags(html: str) -> str:
        """Fixes all tabs and collapsible tags, performs the following:
        - `oppia-noninteractive-tabs`
            - If no `tab_contents-with-value` attribute, tag will be removed
            - If `tab_contents-with-value` is empty then the tag will be removed
        - `oppia-noninteractive-collapsible`
            - If no `content-with-value` attribute, tag will be removed
            - If `content-with-value` is empty then the tag will be removed
            - If no `heading-with-value` attribute, tag will be removed
            - If `heading-with-value` is empty then the tag will be removed

        Args:
            html: str. The RTE tags.

        Returns:
            str. Returns the updated html value.
        """
        soup = bs4.BeautifulSoup(html, 'html.parser')
        tabs_tags = soup.find_all('oppia-noninteractive-tabs')
        for tag in tabs_tags:
            if tag.has_attr('tab_contents-with-value'):
                tab_content_json = utils.unescape_html(
                    tag['tab_contents-with-value'])
                tab_content_list = json.loads(tab_content_json)
                if (
                    RejectSuggestionWithMissingContentIdMigrationJob.
                    _is_tag_removed_with_empty_content(
                    tag, tab_content_list, is_collapsible=False)
                ):
                    continue

                empty_tab_contents = []
                for tab_content in tab_content_list:
                    tab_content['content'] = (
                        RejectSuggestionWithMissingContentIdMigrationJob.
                        fix_rte_tags(
                            tab_content['content'],
                            is_tags_nested_inside_tabs_or_collapsible=True)
                    )
                    if (
                        tab_content['content'].strip() in
                        RejectSuggestionWithMissingContentIdMigrationJob.
                        empty_values
                    ):
                        empty_tab_contents.append(tab_content)

                # Remove empty tab content from the tag.
                for empty_content in empty_tab_contents:
                    tab_content_list.remove(empty_content)

                if (
                    RejectSuggestionWithMissingContentIdMigrationJob.
                    _is_tag_removed_with_empty_content(
                        tag, tab_content_list, is_collapsible=False)
                ):
                    continue

                tab_content_json = json.dumps(tab_content_list)
                tag['tab_contents-with-value'] = utils.escape_html(
                    tab_content_json)

            else:
                tag.decompose()
                continue

        collapsibles_tags = soup.find_all(
            'oppia-noninteractive-collapsible')
        for tag in collapsibles_tags:
            if tag.has_attr('content-with-value'):
                collapsible_content_json = (
                    utils.unescape_html(tag['content-with-value'])
                )
                collapsible_content = json.loads(
                    collapsible_content_json)
                if (
                    RejectSuggestionWithMissingContentIdMigrationJob.
                    _is_tag_removed_with_empty_content(
                        tag, collapsible_content, is_collapsible=True)
                ):
                    continue

                collapsible_content = (
                    RejectSuggestionWithMissingContentIdMigrationJob.
                    fix_rte_tags(
                        collapsible_content,
                        is_tags_nested_inside_tabs_or_collapsible=True)
                )
                if (
                    RejectSuggestionWithMissingContentIdMigrationJob.
                    _is_tag_removed_with_empty_content(
                        tag, collapsible_content, is_collapsible=True)
                ):
                    continue

                collapsible_content_json = json.dumps(collapsible_content)
                tag['content-with-value'] = utils.escape_html(
                    collapsible_content_json)

            else:
                tag.decompose()
                continue

            if (
                RejectSuggestionWithMissingContentIdMigrationJob.
                _is_tag_removed_with_invalid_attributes(
                    tag, 'heading-with-value')
            ):
                continue

        return str(soup).replace('<br/>', '<br>')

    @staticmethod
    def _fix_content(html: str) -> str:
        """Helper function to fix the html.

        Args:
            html: str. The html data to fix.

        Returns:
            html: str. The fixed html data.
        """
        html = RejectSuggestionWithMissingContentIdMigrationJob.fix_rte_tags(
            html, is_tags_nested_inside_tabs_or_collapsible=False)
        html = (
            RejectSuggestionWithMissingContentIdMigrationJob.
            fix_tabs_and_collapsible_tags(html))
        return html

    @staticmethod
    def _update_suggestion_model(
        suggestions: List[suggestion_models.GeneralSuggestionModel],
        exp_model: exp_models.ExplorationModel
    ) -> None:
        """Updates the translation suggestion. The translation whose
        content_id no longer exists, the suggestion status will be marked
        as `rejected`. The RTE content of the suggestion will be updated
        in case invalid data is present.

        Args:
            suggestions: list(GeneralSuggestionModel). A list of translation
                suggestion models corresponding to the given exploration.
            exp_model: ExplorationModel. The exploration model.

        Returns:
            suggestions. List[GeneralSuggestionModel]. Result containing the
            list of updated suggestion models.
        """
        exp_domain = exp_fetchers.get_exploration_from_model(exp_model)
        exp_translatable_contents = (
            exp_domain.get_translatable_contents_collection())

        translatable_content_ids = []
        for content_id in (
            exp_translatable_contents.content_id_to_translatable_content.keys()
        ):
            translatable_content_ids.append(content_id)

        for suggestion in suggestions:
            suggestion_change = suggestion.change_cmd
            if not suggestion_change['content_id'] in translatable_content_ids:
                suggestion.status = 'rejected'

            html = suggestion_change['translation_html']
            suggestion_change['translation_html'] = (
                RejectSuggestionWithMissingContentIdMigrationJob._fix_content(
                    html))

        return suggestions

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the suggestion updation.

        Returns:
            PCollection. A PCollection of results from the suggestion
            migration.
        """
        target_id_to_suggestion_models = (
            self.pipeline
            | 'Get translation suggestion models in review' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False).filter(
                        (
                            suggestion_models
                            .GeneralSuggestionModel.suggestion_type
                        ) == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                    ).filter(
                        suggestion_models.GeneralSuggestionModel.status == (
                            suggestion_models.STATUS_IN_REVIEW
                        )
                    )
            )
            | 'Add target id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.target_id)
            | 'Group exploration suggestions' >> beam.GroupByKey()
        )

        exploration_models = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Add exploration id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        updated_suggestion_results = (
            {
                'suggestions': target_id_to_suggestion_models,
                'exploration': exploration_models
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Remove keys' >> beam.Values()
            | 'Filter unwanted exploration' >> beam.Filter(
                lambda objects: len(objects['suggestions']) != 0)
            | 'Transform and migrate model' >> beam.Map(
                lambda objects: (
                    self._update_suggestion_model(
                        objects['suggestions'][0],
                        objects['exploration'][0]
                    )
                ))
            | 'Flatten suggestion models' >> beam.FlatMap(lambda x: x)
        )

        updated_suggestions_count_job_run_results = (
            updated_suggestion_results
            | 'Transform suggestion objects into job run results' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'SUGGESTION ITERATED'))
        )

        unused_put_results = (
            updated_suggestion_results
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return updated_suggestions_count_job_run_results


class AuditRejectSuggestionWithMissingContentIdMigrationJob(base_jobs.JobBase):
    """"""

    @staticmethod
    def _report_errors_from_suggestion_models():
        """"""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the suggestion updation.

        Returns:
            PCollection. A PCollection of results from the suggestion
            migration.
        """
        target_id_to_suggestion_models = (
            self.pipeline
            | 'Get translation suggestion models in review' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False).filter(
                        (
                            suggestion_models
                            .GeneralSuggestionModel.suggestion_type
                        ) == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                    ).filter(
                        suggestion_models.GeneralSuggestionModel.status == (
                            suggestion_models.STATUS_IN_REVIEW
                        )
                    )
            )
            | 'Add target id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.target_id)
            | 'Group exploration suggestions' >> beam.GroupByKey()
        )

        exploration_models = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Add exploration id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        errored_suggestion_results = (
            {
                'suggestions': target_id_to_suggestion_models,
                'exploration': exploration_models
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Remove keys' >> beam.Values()
            | 'Filter unwanted exploration' >> beam.Filter(
                lambda objects: len(objects['suggestions']) != 0)
            | 'Transform and migrate model' >> beam.Map(
                lambda objects: (
                    self._report_errors_from_suggestion_models(
                        objects['suggestions'][0],
                        objects['exploration'][0]
                    )
                ))
            | 'Flatten suggestion models' >> beam.FlatMap(lambda x: x)
        )
