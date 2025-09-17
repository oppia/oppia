# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
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

"""Jobs for copying exploration images missing in translation suggestions."""

from __future__ import annotations

import html

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import gcs_io, ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import bs4
from typing import Dict, List, Tuple, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import suggestion_models

(suggestion_models, ) = models.Registry.import_models([
    models.Names.SUGGESTION])


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class CopyMissingTranslationImages(beam.PTransform):  # type: ignore[misc]
    """Plan the copy operation. This is a helper PTransform for
    CopyMissingTranslationImagesJob."""

    def expand(self, pipeline: beam.Pipeline) -> Tuple[
        beam.PCollection[Tuple[str, beam.PCollection[str]]],
        beam.PCollection[
            Tuple[str, Dict[str, beam.PCollection[Union[str, bool]]]]]
    ]:
        """Compute the copy operations to perform.

        Args:
            pipeline: Pipeline. Input beam pipeline.

        Returns:
            (PCollection, PCollection). Tuple of the copy operations to perform
            and debugging information for the audit job.
        """
        translation_suggestion_model_pcoll = (
            pipeline
            | 'Get all GeneralSuggestionModels' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all())
            | 'Keep only translation suggestions' >> beam.Filter(
                lambda model: model.suggestion_type ==
                feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
            )
        )

        translation_suggestion_models_by_suggestion_id = (
            translation_suggestion_model_pcoll
            | 'Group by suggestion id' >> beam.GroupBy(
                lambda model: model.id
            )
        )

        translation_suggestion_target_id_by_suggestion_id = (
            translation_suggestion_models_by_suggestion_id
            | 'Map each model to its target id' >> beam.Map(
                self._get_target_id_from_model
            )
        )

        translation_suggestion_image_names_by_suggestion_id = (
            translation_suggestion_models_by_suggestion_id
            | 'Map each model to image paths in its translation content'
            >> beam.Map(self._get_image_names_from_model)
        )

        translation_suggestion_info_by_suggestion_id = (
            {
                'target_id': translation_suggestion_target_id_by_suggestion_id,
                'image_names':
                    translation_suggestion_image_names_by_suggestion_id
            }
            | 'Group as (model_id: {target_id: [[str]], image_names: [[str]]})'
            >> beam.CoGroupByKey()
        )

        dst_path_by_src_path = (
            translation_suggestion_info_by_suggestion_id
            | 'Compute tentative destination paths keyed by source paths'
            >> beam.FlatMap(self._make_path_pairs)
        )

        src_path_by_src_path = (
            dst_path_by_src_path
            | 'Get source paths keyed by source paths'
            >> beam.Map(lambda group: (group[0], group[0]))
        )

        src_path_exist_by_src_path = (
            src_path_by_src_path | 'Check if source paths exist'
            >> gcs_io.IsFile()
        )

        dst_path_exist_by_src_path = (
            dst_path_by_src_path | 'Check if destination paths exist'
            >> gcs_io.IsFile()
        )

        copy_info_by_src_path = (
            {
                'dst': dst_path_by_src_path,
                'src_exist': src_path_exist_by_src_path,
                'dst_exist': dst_path_exist_by_src_path,
            }
            | (
                'Group as {src: {dst: [str], src_exist: [bool], '
                'dst_exist: [bool]}}'
            )
            >> beam.CoGroupByKey()
        )

        copy_info_to_copy_by_src_path = (
            copy_info_by_src_path
            | 'Filter out copy operations that should not happen'
            >> beam.Filter(self._filter_copy_ops)
        )

        dst_to_copy_by_src = (
            copy_info_to_copy_by_src_path
            | 'Extract only src and dst paths from copy operations info'
            >> beam.MapTuple(lambda src, info: (src, info['dst'][0]))
        )

        return dst_to_copy_by_src, copy_info_by_src_path

    def _get_target_id_from_model(
        self,
        group: Tuple[
            str, beam.PCollection[suggestion_models.GeneralSuggestionModel]]
    ) -> Tuple[str, List[str]]:
        """Extract the target ID from a GeneralSuggestionModel object.

        Args:
            group: tuple(str, PCollection(GeneralSuggestionModel)). Ordered pair
                of a GeneralSuggestionModel ID and a PCollection of model
                objects associated with the ID.

        Returns:
            tuple(str, list(str)). An ordered pair of the model ID and a list of
            the target ID associated with each model in the input list of
            models (in the same order).
        """
        model_id, model_pcoll = group
        return (model_id, [model.target_id for model in model_pcoll])

    def _get_image_names_from_model(
        self,
        group: Tuple[
            str, beam.PCollection[suggestion_models.GeneralSuggestionModel]]
    ) -> Tuple[str, List[str]]:
        """Extract image filenames from a GeneralSuggestionModel object.

        Args:
            group: tuple(str, PCollection(GeneralSuggestionModel)). Ordered pair
                of a GeneralSuggestionModel ID and a PCollection of model
                objects associated with the ID.

        Returns:
            tuple(str, list(str)). An ordered pair of the input
            GeneralSuggestionModel ID and a list of the filenames of all images
            in the translation suggestions represented by all models in the
            input.

        Raises:
            Exception. Raised for debugging if an exception is raised while
                parsing the translation html string.
        """
        model_id, model_pcoll = group
        image_filenames: List[str] = []
        for model in model_pcoll:
            translation_html = model.change_cmd['translation_html']
            if isinstance(translation_html, str):
                translation_html_lst: List[str] = [translation_html]
            else:
                translation_html_lst = translation_html
            for translation_html_str in translation_html_lst:
                assert isinstance(translation_html_str, str), (
                    'Unexpected translation_html_str type',
                    type(translation_html_str), translation_html_str
                )
                translation_tree = bs4.BeautifulSoup(
                    translation_html_str, 'html.parser')
                image_nodes = translation_tree.findAll(
                    name='oppia-noninteractive-image')
                image_filenames += [
                    html.unescape(
                        node.get('filepath-with-value')).strip('"')
                    for node in image_nodes]

        return (model_id, image_filenames)

    def _make_path_pairs(
        self,
        group: Tuple[str, Dict[str, beam.PCollection[beam.PCollection[str]]]]
    ) -> List[Tuple[str, str]]:
        """Construct (src, dst) path pairs representing the copy operations to
        be performed.

        Args:
            group: tuple(str, dict(str, PCollection(PCollection(str)))). An
                ordered pair of a GeneralSuggestionModel ID (which is ignored)
                and a dictionary that maps strings to PCollections. Each value
                PCollection contains one PCollection per target exploration, and
                each of these PCollections in turn contains a list of strings.
                For the target_id key, these strings are target exploration IDs.
                For the image_names key, these strings are filenames of images
                in the translation.  When flattened, the value of the target_id
                key must contain exactly one element, a string representing the
                ID of the exploration targeted by the GeneralSuggestionModel.

        Returns:
            list(tuple(str, str)). A list of ordered pairs (src, dst) specifying
            copy operations as source and destination filepaths. These paths are
            constructed solely based on the provided target IDs and filenames,
            with no regard to whether any files exist at either source or
            destination.
        """
        _, suggestion_info = group
        target_ids = [
            target_id
            for targets in suggestion_info['target_id']
            for target_id in targets
        ]
        assert len(target_ids) == 1
        target_id = target_ids[0]

        path_tuples: List[Tuple[str, str]] = [
            (
                f'exploration/{target_id}/assets/image/{fname}',
                f'exploration_suggestions/{target_id}/assets/image/{fname}',
            )
            for filenames in suggestion_info['image_names']
            for fname in filenames
        ]
        return path_tuples

    def _filter_copy_ops(
        self,
        group: Tuple[str, Dict[str, beam.PCollection[Union[str, bool]]]],
    ) -> bool:
        """Return whether a copy operation should proceed.

        Args:
            group: tuple(str, dict(str, beam.PCollection(str|bool))). Ordered
                pair of a source path and a dictionary with the following keys:
                * dst: list(str). Destination path
                * src_exist: list(str). Whether the source file exists.
                * dst_exist: list(str). Whether the destination file exists.
                Each value in the dictionary must be a list with exactly one
                element.

        Returns:
            bool. True if and only if the source file exists and the destination
            file does not exist.
        """
        key, copy_info = group
        # copy_info['src_exist'] and copy_info['dst_exist'] can have multiple
        # elements (possibly because src was found multiple times among the
        # translation suggestions). They all should be the same value because
        # dst is computed deterministically from src and a given file path will
        # always either exist or not exist regardless of when existence was
        # checked (ignoring race conditions). Therefore, we assert that the
        # contents of the lists are the same for each of src and dst, and then
        # we just use the first elements to represent the whole lists.
        src_exist_lst = copy_info['src_exist']
        assert any(src_exist_lst) == all(src_exist_lst), (key, src_exist_lst)
        src_exist = src_exist_lst[0]
        dst_exist_lst = copy_info['dst_exist']
        assert any(dst_exist_lst) == all(dst_exist_lst), (key, dst_exist_lst)
        dst_exist = dst_exist_lst[0]
        return src_exist and not dst_exist


class CopyMissingTranslationImagesJob(base_jobs.JobBase):
    """Job that fills missing translation suggestion images by copying from
    target explorations. PR #20188 ensured that new suggestions would
    automatically have these images copied, so this job is only needed to handle
    old suggestions from before the fix was deployed."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Perform the copy operation.

        Returns:
            PCollection. Job run results, with one element per copy operation.
            Each element contains an ordered triple of the source path,
            destination path, and status string.
        """
        dst_to_copy_by_src, _ = (
            self.pipeline
            | 'Plan copy operations'
            >> CopyMissingTranslationImages()
        )

        results = (
            dst_to_copy_by_src | 'Copy src to dst' >> gcs_io.CopyFile()
        )

        return (
            results
            | 'Map as stdout' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )


class DebugMissingTranslationImagesJob(base_jobs.JobBase):
    """Return debugging information about files to be copied without making any
    changes."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """List the copy operations to be performed along with debugging
        information.

        Output elements look like this:

            JobRunResult(stdout="(
                'exploration/e1/assets/image/image2.png',
                {
                    'dst': [],
                    'copy_info': [{
                        'dst': ['exploration_suggestions/.../image2.png'],
                        'src_exist': [False],
                        'dst_exist': [True]
                    }]
                }
            )")

        One element will be present for every image found in a translation
        suggestion. The first element in the tuple is the source path computed
        based on the translation suggestion HTML. Its value contains information
        about this image. The outer `dst` key will be mapped to a list
        containing a path if and only if the image is to be copied. `copy_info`
        always contains the computed destination path and whether the source and
        destination files exist.

        Returns:
            PCollection. Job run results describing an ordered pair of the copy
            operations to be performed and debugging information.
        """
        dst_to_copy_by_src, copy_info_by_src_path = (
            self.pipeline
            | 'Plan copy operations'
            >> CopyMissingTranslationImages()
        )

        return (
            {
                'dst': dst_to_copy_by_src,
                'copy_info': copy_info_by_src_path,
            }
            | 'Group outputs' >> beam.CoGroupByKey()
            | 'Map as stdout' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )


class AuditMissingTranslationImagesJob(base_jobs.JobBase):
    """Return planned copy operations without making any changes."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """List the copy operations to be performed.

        Returns:
            PCollection. Job run results describing an ordered pair of the
            source and destination files for each copy to be performed.
        """
        dst_to_copy_by_src, _ = (
            self.pipeline
            | 'Plan copy operations'
            >> CopyMissingTranslationImages()
        )

        return (
            dst_to_copy_by_src
            | 'Map as stdout' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )
