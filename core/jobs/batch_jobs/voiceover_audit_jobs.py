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

"""Apache Beam jobs for auditing missing voiceovers in curated lessons."""

from __future__ import annotations

import apache_beam as beam

from core import feconf
from core.domain import state_domain
from core.jobs import base_jobs, job_run_result
from core.jobs.io import ndb_io
from core.platform import models

from typing import Dict, List, Optional, Tuple, Any

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import (
        classroom_models, exp_models, story_models, topic_models, voiceover_models)

(
    classroom_models, exp_models, story_models, topic_models, voiceover_models
) = models.Registry.import_models([
    models.Names.CLASSROOM, models.Names.EXPLORATION, models.Names.STORY,
    models.Names.TOPIC, models.Names.VOICEOVER
])


class AuditMissingVoiceoversJob(base_jobs.JobBase):
    """Job that identifies missing voiceovers in curated lessons."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of audit results.

        Returns:
            PCollection[JobRunResult]. A PCollection of audit results.
        """
        all_published_classroom_topic_ids = (
            self.pipeline
            | 'Get all ClassroomModels' >> ndb_io.GetModels(
                classroom_models.ClassroomModel.get_all())
            | 'Filter published Classrooms' >> beam.Filter(
                lambda m: m.is_published)
            | 'Extract topic IDs from Classrooms' >> beam.FlatMap(
                lambda m: [tid for tid in m.topic_id_to_prerequisite_topic_ids])
            | 'Map Classroom topic ID' >> beam.Map(lambda tid: (tid, True))
        )

        all_published_topic_rights = (
            self.pipeline
            | 'Get all TopicRightsModels' >> ndb_io.GetModels(
                topic_models.TopicRightsModel.get_all())
            | 'Filter published Topics' >> beam.Filter(
                lambda m: m.topic_is_published)
            | 'Map Topic ID for Rights' >> beam.Map(lambda m: (m.id, True))
        )

        curated_topic_ids = (
            {'cl': all_published_classroom_topic_ids,
             'tr': all_published_topic_rights}
            | 'Join Classroom and Topic Rights' >> beam.CoGroupByKey()
            | 'Filter Curated Topic IDs' >> beam.Filter(
                lambda t: len(t[1]['cl']) > 0 and len(t[1]['tr']) > 0)
            | 'Extract Topic ID' >> beam.Map(lambda t: (t[0], True))
        )

        all_topic_ids_to_stories = (
            self.pipeline
            | 'Get all TopicModels' >> ndb_io.GetModels(
                topic_models.TopicModel.get_all())
            | 'Map Topic to Stories' >> beam.Map(
                lambda m: (m.id, (m.name, m.canonical_story_ids)))
        )

        curated_stories = (
            {'topic_ids': curated_topic_ids,
             'stories': all_topic_ids_to_stories}
            | 'Join Topics and Stories' >> beam.CoGroupByKey()
            | 'Filter Curated Stories' >> beam.Filter(
                lambda t: len(t[1]['topic_ids']) > 0 and len(t[1]['stories']) > 0)
            | 'Extract Story ID to Topic Name' >> beam.FlatMap(
                lambda t: [(sid, t[1]['stories'][0][0]) 
                            for sid in t[1]['stories'][0][1]])
        )

        all_story_ids_to_exps = (
            self.pipeline
            | 'Get all StoryModels' >> ndb_io.GetModels(
                story_models.StoryModel.get_all())
            | 'Map Story to Exps' >> beam.Map(
                lambda m: (m.id, [(node.exploration_id, node.title) 
                                 for node in m.story_contents.nodes]))
        )

        curated_exps_info = (
            {'story_info': curated_stories,
             'exps': all_story_ids_to_exps}
            | 'Join Stories and Exps' >> beam.CoGroupByKey()
            | 'Filter Curated Exps' >> beam.Filter(
                lambda t: len(t[1]['story_info']) > 0 and len(t[1]['exps']) > 0)
            | 'Extract Exp ID to Lesson Info' >> beam.FlatMap(
                lambda t: [(exp_id, (t[1]['story_info'][0], lesson_title)) 
                            for exp_id, lesson_title in t[1]['exps'][0]])
        )

        all_exp_models = (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Map Exp ID to Model' >> beam.Map(lambda m: (m.id, m))
        )

        all_voiceover_models = (
            self.pipeline
            | 'Get all EntityVoiceoversModels' >> ndb_io.GetModels(
                voiceover_models.EntityVoiceoversModel.get_all())
            | 'Filter Exploration Voiceovers' >> beam.Filter(
                lambda m: m.entity_type == feconf.ENTITY_TYPE_EXPLORATION)
            | 'Map Exp ID to Voiceover Model' >> beam.Map(
                lambda m: (m.entity_id, m))
            | 'Group Voiceovers by Exp ID' >> beam.GroupByKey()
        )

        voiceover_policy = (
            self.pipeline
            | 'Get VoiceoverAutogenerationPolicyModel' >> ndb_io.GetModels(
                voiceover_models.VoiceoverAutogenerationPolicyModel.get_all())
            | 'Extract Mapping' >> beam.Map(lambda m: m.language_codes_mapping)
            | 'To List' >> beam.combiners.ToList()
        )

        def audit_voiceovers(
            t: Tuple[str, Dict[str, List[Any]]], 
            policy_list: List[Dict[str, Dict[str, bool]]]
        ) -> List[str]:
            exp_id, data = t
            if not data['curated_info'] or not data['exp_model']:
                return []
            
            topic_name, lesson_name = data['curated_info'][0]
            exp_model = data['exp_model'][0]
            voc_models = data['voc_models'][0] if data['voc_models'] else []
            
            language_codes_mapping = policy_list[0] if policy_list else {}
            
            # Use current version voiceovers.
            latest_voc_models = [m for m in voc_models if m.entity_version == exp_model.version]
            lang_to_model = {m.language_accent_code: m for m in latest_voc_models}
            
            findings = []
            
            # Extract content IDs.
            for state_name, state_dict in exp_model.states.items():
                try:
                    state_obj = state_domain.State.from_dict(state_dict)
                    content_ids = state_obj.get_translatable_contents_collection().content_id_to_translatable_content.keys()
                except Exception:
                    # Fallback or log error.
                    continue
                
                for content_id in content_ids:
                    for language_code, accents in language_codes_mapping.items():
                        for accent_code in accents:
                            voc_model = lang_to_model.get(accent_code)
                            mapping = voc_model.voiceovers_mapping if voc_model else {}
                            
                            voc_dict = mapping.get(content_id)
                            if voc_dict is None:
                                voc_dict = {}
                            
                            auto_v = voc_dict.get(feconf.VoiceoverType.AUTO.value)
                            manual_v = voc_dict.get(feconf.VoiceoverType.MANUAL.value)
                            
                            no_auto = (auto_v is None)
                            no_manual_or_stale = (manual_v is None or manual_v.get('needs_update', False))
                            
                            if no_auto and no_manual_or_stale:
                                findings.append(
                                    f'{topic_name} > {lesson_name} > {accent_code} > {state_name} > {content_id}'
                                )
            
            return findings

        final_audit_results = (
            {'curated_info': curated_exps_info,
             'exp_model': all_exp_models,
             'voc_models': all_voiceover_models}
            | 'Join Content and Voiceover Info' >> beam.CoGroupByKey()
            | 'Extract Results' >> beam.FlatMap(
                audit_voiceovers,
                policy_list=beam.pvalue.AsSingleton(voiceover_policy))
        )

        total_findings_count = (
            final_audit_results
            | 'Count findings' >> beam.combiners.Count.Globally()
        )

        results_list = (
            final_audit_results
            | 'Sample findings' >> beam.transforms.combiners.Sample.FixedSizeSample(1000)
        )

        def format_results(t: Tuple[str, Dict[str, List[Any]]]) -> List[job_run_result.JobRunResult]:
            count = t[1]['count'][0] if t[1]['count'] else 0
            findings = t[1]['findings'][0] if t[1]['findings'] else []
            
            results = [job_run_result.JobRunResult.as_stdout(f'Total missing voiceovers found: {count}')]
            for f in findings:
                results.append(job_run_result.JobRunResult.as_stdout(f'Missing: {f}'))
            return results

        return (
            {'count': total_findings_count, 'findings': results_list}
            | 'Join Count and Findings' >> beam.CoGroupByKey()
            | 'Final Report' >> beam.FlatMap(format_results)
        )
