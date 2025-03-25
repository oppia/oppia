from __future__ import annotations

import apache_beam as beam
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

(classroom_models,) = models.Registry.import_models(
    [models.Names.CLASSROOM]
)
(topic_models,) = models.Registry.import_models([models.Names.TOPIC])


class GetClassroomsWithInvalidTopicIdJob(base_jobs.JobBase):
    """Validates that classrooms must have valid topic ids in topic_id_to_prerequisite_topic_ids."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        classroom_topic_id_collections = (
            self.pipeline
            | 'Get all ClassroomModels' >> ndb_io.GetModels(classroom_models.ClassroomModel.get_all())
            | 'Extract topic ids from model' >> beam.Map(
                lambda classroom: classroom.topic_id_to_prerequisite_topic_ids
            )
        )
        topic_ids = (
            self.pipeline
            | 'Get all TopicModels' >> ndb_io.GetModels(topic_models.TopicModel.get_all())
            | 'Extract topic ids' >> beam.Map(lambda topic: topic.id)
        )
        def has_invalid_topics(topic_ids_collection, valid_topic_ids):
            return any(
                topic_id not in valid_topic_ids 
                for topic_id in topic_ids_collection
            )

        classrooms_with_invalid_topics = (
            classroom_topic_id_collections
            | 'Identify classrooms with invalid topic ids' >> beam.Filter(
                has_invalid_topics,
                beam.pvalue.AsIter(topic_ids)
            )
        )

        invalid_count_report = (
            classrooms_with_invalid_topics
            | 'Report count of classrooms with invalid topic ids' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'CountClassroomsWithInvalidTopicIds'
                )
            )
        )

        invalid_topics_details_report = (
            classrooms_with_invalid_topics
            | 'Report details of invalid classroom topics' >> beam.Map(
                lambda invalid_topics:
                    job_run_result.JobRunResult.as_stderr(
                    'Classroom has invalid topic ids: "%s"'
                    % (invalid_topics)
                )
            )
        )

        # Combine and return reports
        return (
            (invalid_count_report, invalid_topics_details_report)
            | 'Combine all reports' >> beam.Flatten()
        )
