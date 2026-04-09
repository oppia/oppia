# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Jobs used for regenerating voiceovers for all the curated explorations by
language accent."""

from __future__ import annotations

import collections
import logging
import traceback

from core import feconf
from core.domain import (
    exp_fetchers,
    opportunity_services,
    translation_fetchers,
    voiceover_domain,
    voiceover_regeneration_services,
    voiceover_services,
)
from core.jobs import base_jobs, job_options
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Dict, Iterator, Optional, Sequence, Tuple, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        datastore_services,
        exp_models,
        translation_models,
        voiceover_models,
    )

(exp_models, translation_models, voiceover_models) = (
    models.Registry.import_models(
        [
            models.Names.EXPLORATION,
            models.Names.TRANSLATION,
            models.Names.VOICEOVER,
        ]
    )
)
datastore_services = models.Registry.import_datastore_services()


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class GenerateVoiceoversFn(beam.DoFn):  # type: ignore[misc]
    """A DoFn that generates voiceovers for a given exploration."""

    def __init__(
        self,
        oppia_project_id: Optional[str] = None,
        language_accent_code: Optional[str] = None,
    ) -> None:
        super().__init__()
        logging.info(
            'Voiceover synthesis log: Initializing GenerateVoiceoversFn.'
        )

        self.oppia_project_id = oppia_project_id
        logging.info(
            'Voiceover synthesis log: Setting oppia project ID from args: %s'
            % self.oppia_project_id,
        )

        self.language_accent_code = language_accent_code
        logging.info(
            'Voiceover synthesis log: Setting language accent code from args: %s'
            % self.language_accent_code,
        )

    def process(
        self,
        combined_models: Tuple[
            str,
            Dict[
                str,
                Sequence[exp_models.ExplorationModel]
                | Sequence[voiceover_models.EntityVoiceoversModel]
                | Sequence[translation_models.EntityTranslationsModel],
            ],
        ],
        autogeneration_policy_model: (
            voiceover_models.VoiceoverAutogenerationPolicyModel
        ),
    ) -> Iterator[
        Union[
            voiceover_models.EntityVoiceoversModel,
            beam.pvalue.TaggedOutput[str],
        ]
    ]:
        """Method to process each element in the PCollection.

        Args:
            combined_models: tuple(str, dict). A tuple where the first element
                is the exploration ID and the second element is a dictionary
                with keys 'exploration', 'translations' and 'voiceovers' mapping
                to a list of corresponding models.
            autogeneration_policy_model: VoiceoverAutogenerationPolicyModel.
                The voiceover autogeneration policy model.

        Yields:
            EntityVoiceoversModel. The generated entity voiceover models.
            str. The status string for the voiceover generation process.
        """
        entity_id = combined_models[0]
        logging.info(
            'Voiceover synthesis log: Processing exploration with ID: %s'
            % entity_id
        )
        # Here we use cast because we are narrowing down the type of
        # exploration field in combined_models to Exploration model.
        exploration_model = cast(
            exp_models.ExplorationModel, combined_models[1]['exploration'][0]
        )
        # Here we use cast because we are narrowing down the type of
        # translations field in combined_models to Sequence of
        # EntityTranslationsModel.
        entity_translation_models = cast(
            Sequence[translation_models.EntityTranslationsModel],
            combined_models[1]['translations'],
        )
        # Here we use cast because we are narrowing down the type of
        # voiceovers field in combined_models to Sequence of EntityVoiceoversModel.
        entity_voiceover_models = cast(
            Sequence[voiceover_models.EntityVoiceoversModel],
            combined_models[1]['voiceovers'],
        )

        entity_voiceovers, status_string = (
            VoiceoverSynthesisByAccentJob.generate_voiceovers_for_exploration(
                exploration_model=exploration_model,
                entity_translation_models=entity_translation_models,
                entity_voiceover_models=entity_voiceover_models,
                voiceover_policy_model=autogeneration_policy_model,
                language_accent_code_to_generate=self.language_accent_code,
                oppia_project_id=self.oppia_project_id,
            )
        )

        logging.info(
            'Voiceover synthesis log: Completed generating voiceovers for exploration ID: %s'
            % entity_id
        )

        # Yield entity voiceovers to main output.
        yield entity_voiceovers

        # Yield status string to tagged side output.
        yield beam.pvalue.TaggedOutput('status', status_string)


class VoiceoverSynthesisByAccentJob(base_jobs.JobBase):
    """A one-off job to generate voiceovers for all curated explorations in
    English and other supported translated languages.
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def is_exploration_curated(exploration_id: str) -> Optional[bool]:
        """Checks whether the provided exploration ID belongs to a curated
        exploration or not.

        Args:
            exploration_id: str. The given exploration ID.

        Returns:
            bool. A boolean value indicating if the exploration is curated
            or not.
        """
        with datastore_services.get_ndb_context():
            return (
                opportunity_services.is_exploration_available_for_contribution(
                    exploration_id
                )
            )

    @classmethod
    def generate_voiceovers_for_exploration(
        cls,
        exploration_model: exp_models.ExplorationModel,
        entity_translation_models: Sequence[
            translation_models.EntityTranslationsModel
        ],
        entity_voiceover_models: Sequence[
            voiceover_models.EntityVoiceoversModel
        ],
        voiceover_policy_model: voiceover_models.VoiceoverAutogenerationPolicyModel,
        language_accent_code_to_generate: Optional[str] = None,
        oppia_project_id: Optional[str] = None,
    ) -> Tuple[Optional[voiceover_models.EntityVoiceoversModel], str]:
        """Generates voiceovers in English and all translated languages,
        covering every supported accent for the given exploration.

        Args:
            exploration_model: ExplorationModel. The exploration model for which
                to generate voiceovers.
            entity_translation_models: list(EntityTranslationsModel). The
                existing entity translation models related to the exploration.
            entity_voiceover_models: list(EntityVoiceoversModel). The existing
                entity voiceover models related to the exploration.
            voiceover_policy_model: VoiceoverAutogenerationPolicyModel. The
                voiceover autogeneration policy model.
            language_accent_code_to_generate: str. The language accent code for which to
                generate voiceovers.
            oppia_project_id: Optional[str]. The Google Cloud Project ID.
                Explicitly required when running on Beam Dataflow, as workers
                cannot retrieve the ID from environment variables.

        Returns:
            Tuple[Optional[EntityVoiceoversModel], str]. A tuple containing the
            EntityVoiceoversModel that was updated or created (or None if no
            voiceovers were generated) and a string with logs during voiceover
            generation.
        """
        if language_accent_code_to_generate is None:
            message = (
                'Not generating voiceovers for exploration ID: %s since language accent code is None.'
                % exploration_model.id
            )
            return (None, message)

        assert isinstance(language_accent_code_to_generate, str)

        logs_during_voiceover_generation = ''

        logs_during_voiceover_generation += (
            'Exploration ID: %s.\n' % exploration_model.id
        )

        entity_translations_list = []
        required_entity_voiceovers_for_update = None

        with datastore_services.get_ndb_context():
            # Converting exploration model to domain object.
            exploration = exp_fetchers.get_exploration_from_model(
                exploration_model, False
            )
            logging.info(
                'Voiceover synthesis log: Converted exploration model to exploration domain object.'
            )

            # Converting EntityTranslationsModels to domain objects.
            for entity_translation_model in list(entity_translation_models):
                entity_translations_list.append(
                    translation_fetchers.get_entity_translation_from_model(
                        entity_translation_model
                    )
                )
            logging.info(
                'Voiceover synthesis log: Converted entity translation models to '
                'entity translation domain objects.'
            )

            # Converting EntityVoiceoversModels to domain objects.
            for entity_voiceover_model in list(entity_voiceover_models):
                # Filtering out EntityVoiceoversModels that match the current
                # exploration version and the language accent code for which
                # we want to generate voiceovers.
                if (
                    entity_voiceover_model.entity_version == exploration.version
                    and entity_voiceover_model.language_accent_code
                    == language_accent_code_to_generate
                ):
                    required_entity_voiceovers_for_update = (
                        voiceover_services.get_entity_voiceovers_from_model(
                            entity_voiceover_model
                        )
                    )
                    break

            logging.info(
                'Voiceover synthesis log: Converted entity voiceover model to '
                'entity voiceover domain object.'
            )

            # Extracting language codes mapping from the autogeneration policy
            # model.
            language_codes_mapping = (
                voiceover_policy_model.language_codes_mapping
            )

        entity_type = feconf.ENTITY_TYPE_EXPLORATION
        entity_id = exploration.id
        entity_version = exploration.version

        language_code_to_generate = ''

        for language_code, accent_mapping in language_codes_mapping.items():
            for accent_code, is_autogeneratable in accent_mapping.items():

                # Getting the language code for which to generate voiceovers.
                if (
                    is_autogeneratable
                    and accent_code == language_accent_code_to_generate
                ):
                    language_code_to_generate = language_code
                    break

        # A dictionary where each key is a language code, and each value is a
        # content mapping dictionary. The content mapping dictionary contains
        # content IDs as keys and their corresponding HTML content as values.
        language_code_to_contents_mapping = {}

        language_code_to_contents_mapping.update(
            voiceover_services.extract_english_voiceover_texts_from_exploration(
                exploration
            )
        )
        language_code_to_contents_mapping.update(
            voiceover_services.extract_translated_voiceover_texts_from_entity_translations(
                entity_translations_list
            )
        )

        content_ids_to_content_values = language_code_to_contents_mapping.get(
            language_code_to_generate, {}
        )
        logging.info(
            'Voiceover synthesis log: language code %s'
            % language_code_to_generate
        )
        logging.info(
            'Voiceover synthesis log: language_code_to_contents_mapping: %s'
            % language_code_to_contents_mapping,
        )

        # Skip voiceover generation for this exploration if its curated contents
        # do not include any content in the target language code.
        if not content_ids_to_content_values:
            logs_during_voiceover_generation += (
                'No content found for language code: %s.'
                % language_code_to_generate
            )
            return (None, logs_during_voiceover_generation)

        entity_voiceovers_id = '%s-%s-%s-%s' % (
            entity_type,
            entity_id,
            str(entity_version),
            language_accent_code_to_generate,
        )

        # If no existing EntityVoiceovers domain object is found for the current
        # exploration version and specified language accent, an empty object can
        # be created and later populated by the job.
        if required_entity_voiceovers_for_update is None:
            required_entity_voiceovers_for_update = (
                voiceover_domain.EntityVoiceovers.create_empty(
                    entity_id,
                    entity_type,
                    entity_version,
                    language_accent_code_to_generate,
                )
            )

        error_message_to_content_ids_dict = collections.defaultdict(list)

        logging.info(
            'Voiceover synthesis log: Generating voiceovers for Entityvoiceover with ID: %s.',
            entity_voiceovers_id,
        )
        logs_during_voiceover_generation += (
            'EntityVoiceovers ID: %s.\n' % entity_voiceovers_id
        )

        number_of_content_ids = len(content_ids_to_content_values)
        number_of_characters = 0

        logging.info(
            'Voiceover synthesis log: number_of_content_ids: %s.',
            number_of_content_ids,
        )

        for content_id, content_html in content_ids_to_content_values.items():
            try:
                voiceover_filename = voiceover_regeneration_services.generate_new_voiceover_filename(
                    content_id, language_accent_code_to_generate
                )
                logging.info(
                    'Voiceover synthesis log: Generated new voiceover filename: %s for content_id: %s, content_html: %s.'
                    % (voiceover_filename, content_id, content_html)
                )

                with datastore_services.get_ndb_context():
                    sentence_tokens_with_durations = voiceover_regeneration_services.synthesize_voiceover_for_html_string(
                        entity_id,
                        content_html,
                        language_accent_code_to_generate,
                        voiceover_filename,
                        oppia_project_id,
                    )

                    if not sentence_tokens_with_durations:
                        continue

                    voiceover = voiceover_regeneration_services.fetch_voiceover_by_filename(
                        entity_id, voiceover_filename, oppia_project_id
                    )

                number_of_characters += len(content_html)

                required_entity_voiceovers_for_update.add_voiceover(
                    content_id, feconf.VoiceoverType.AUTO, voiceover
                )
                required_entity_voiceovers_for_update.add_automated_voiceovers_audio_offsets(
                    content_id, sentence_tokens_with_durations
                )

                logging.info(
                    'Voiceover synthesis log: Generated voiceover for content_id: %s.',
                    content_id,
                )
            except Exception as error:
                error_message_to_content_ids_dict[str(error)].append(content_id)
                stack_trace = traceback.format_exc()
                logging.error(
                    'Voiceover synthesis log: Stack trace: %s',
                    stack_trace,
                )
                logging.error(
                    'Voiceover synthesis log: Error generating voiceover for exploration ID: %s, language_accent_code: %s, content_id: %s. Error: %s'
                    % (
                        entity_id,
                        language_accent_code_to_generate,
                        content_id,
                        str(error),
                    )
                )

        for (
            error_message,
            content_ids,
        ) in error_message_to_content_ids_dict.items():
            comma_separated_content_ids = ', '.join(content_ids)
            logs_during_voiceover_generation += (
                'Content IDs failed: [%s]. Error message: %s\n'
                % (comma_separated_content_ids, error_message)
            )

        final_report_logs = (
            'Total content IDs processed: %d. '
            'Total characters processed: %d.\n'
            % (
                number_of_content_ids,
                number_of_characters,
            )
        )
        logging.info('Voiceover synthesis log: %s.' % final_report_logs)
        logs_during_voiceover_generation += final_report_logs
        logging.info(
            'Voiceover synthesis log: Completed voiceover generation for entity ID: %s.'
            % entity_voiceovers_id
        )

        # EntityVoiceoversModel instance to be stored in the datastore.
        with datastore_services.get_ndb_context():
            required_entity_voiceovers_for_update.validate()
            updated_entity_voiceovers_model = (
                voiceover_services.create_entity_voiceovers_model(
                    required_entity_voiceovers_for_update
                )
            )

        return (
            updated_entity_voiceovers_model,
            logs_during_voiceover_generation,
        )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of job run results for EntityVoiceoversModels
        that were updated after voiceover synthesis.

        Returns:
            beam.PCollection[job_run_result.JobRunResult]. A PCollection
            containing job run results with the IDs of the
            EntityVoiceoversModels that were updated or created.
        """
        exploration_models = (
            self.pipeline
            | 'Get exploration models'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
            | 'Filter out curated explorations'
            >> beam.Filter(
                lambda model: self.is_exploration_curated(
                    exploration_id=model.id
                )
            )
        )

        entity_translation_models = (
            self.pipeline
            | 'Get all entity translation models'
            >> ndb_io.GetModels(
                translation_models.EntityTranslationsModel.get_all()
            )
            | 'Filter out entity translations for curated explorations'
            >> beam.Filter(
                lambda model: self.is_exploration_curated(
                    exploration_id=model.entity_id
                )
            )
        )

        entity_voiceovers_models = (
            self.pipeline
            | 'Get all entity voiceover models'
            >> ndb_io.GetModels(
                voiceover_models.EntityVoiceoversModel.get_all()
            )
            | 'Filter out entity voiceovers for curated explorations'
            >> beam.Filter(
                lambda model: self.is_exploration_curated(
                    exploration_id=model.entity_id
                )
            )
        )

        exploration_id_to_exploration = (
            exploration_models
            | 'Map exploration ID to exploration model'
            >> beam.Map(lambda model: (model.id, model))
        )

        entity_id_to_translation_models = (
            entity_translation_models
            | 'Map entity ID to translation model'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        entity_id_to_voiceover_models = (
            entity_voiceovers_models
            | 'Map entity ID to voiceover model'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        combined_models = {
            'exploration': exploration_id_to_exploration,
            'translations': entity_id_to_translation_models,
            'voiceovers': entity_id_to_voiceover_models,
        } | 'Join all by entity ID' >> beam.CoGroupByKey()

        voiceover_policy_model = (
            self.pipeline
            | 'Get all voiceover autogeneration policy models'
            >> ndb_io.GetModels(
                voiceover_models.VoiceoverAutogenerationPolicyModel.get_all()
            )
        )

        custom_options = self.pipeline.options.view_as(job_options.JobOptions)
        oppia_project_id = custom_options.oppia_project_id
        language_accent_code = custom_options.language_accent_code

        voiceovers_and_status = (
            combined_models
            | 'Generate voiceovers for each exploration'
            >> beam.ParDo(
                GenerateVoiceoversFn(
                    oppia_project_id=oppia_project_id,
                    language_accent_code=language_accent_code,
                ),
                beam.pvalue.AsSingleton(voiceover_policy_model),
            ).with_outputs('status', main='voiceovers')
        )

        entity_voiceovers_models = voiceovers_and_status.voiceovers
        status_strings = voiceovers_and_status.status

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                entity_voiceovers_models
                | 'Filter out None results'
                >> beam.Filter(lambda model: model is not None)
                | 'Put models into datastore' >> ndb_io.PutModels()
            )

        return status_strings | 'Format results' >> beam.Map(
            job_run_result.JobRunResult.as_stdout
        )
