# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Job that removes hanging story references from TopicModel canonical_story_references and logs removed ones only."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Iterable, List, Optional, Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import story_models, topic_models

(topic_models, story_models) = models.Registry.import_models(
    [models.Names.TOPIC, models.Names.STORY]
)


class RemoveHangingStoryReferencesJob(base_jobs.JobBase):
    """Removes canonical story references in TopicModel which no longer exist."""

    # TODO(#15613): Here we use MyPy ignore because the incomplete typing of
    # apache_beam library and absences of stubs in Typeshed, forces MyPy to
    # assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
    # cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
    class RemoveHangingStoriesDoFn(beam.DoFn):  # type: ignore[misc]
        """DoFn to remove invalid story references and log only if something was removed."""

        def process(
            self, topic_model: topic_models.TopicModel, all_story_ids: List[str]
        ) -> Iterable[
            Tuple[
                topic_models.TopicModel, Optional[job_run_result.JobRunResult]
            ]
        ]:
            all_story_ids_set = set(all_story_ids)
            original_refs = topic_model.canonical_story_references
            cleaned_refs = []
            removed_refs = []

            for ref in original_refs:
                if not isinstance(ref, dict) or 'story_id' not in ref:
                    removed_refs.append('INVALID_REFERENCE')
                    continue
                story_id = ref['story_id']
                if isinstance(story_id, str) and story_id in all_story_ids_set:
                    cleaned_refs.append(ref)
                else:
                    removed_refs.append(story_id)

            # Only log if there were removed references.
            if removed_refs:
                topic_model.canonical_story_references = cleaned_refs
                topic_model.update_timestamps()
                log = job_run_result.JobRunResult.as_stdout(
                    f'Topic with ID {topic_model.id} removed hanging story references: {", ".join(removed_refs)}'
                )
                yield topic_model, log
            else:
                # No hanging story references were found, so we skip logging and just return the model unchanged.
                yield topic_model, None

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        topic_models_pcoll = (
            self.pipeline
            | 'Load all TopicModels'
            >> ndb_io.GetModels(
                topic_models.TopicModel.get_all(include_deleted=False)
            )
        )

        all_story_ids_pcoll = (
            self.pipeline
            | 'Load all StoryModels'
            >> ndb_io.GetModels(
                story_models.StoryModel.get_all(include_deleted=False)
            )
            | 'Extract Story IDs' >> beam.Map(lambda m: m.id)
        )

        cleaned_and_logged = (
            topic_models_pcoll
            | 'Remove Hanging Story References'
            >> beam.ParDo(
                self.RemoveHangingStoriesDoFn(),
                all_story_ids=beam.pvalue.AsList(all_story_ids_pcoll),
            )
        )

        cleaned_topics = cleaned_and_logged | beam.Map(lambda t: t[0])
        logs = (
            cleaned_and_logged
            | beam.Map(lambda t: t[1])
            | beam.Filter(lambda log: log is not None)
        )

        _ = cleaned_topics | 'Save Updated Topics' >> ndb_io.PutModels()

        _ = (
            logs
            | 'Count Topics with Removed References'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'TOPICS WITH HANGING STORY REFERENCES REMOVED'
            )
        )

        return logs
