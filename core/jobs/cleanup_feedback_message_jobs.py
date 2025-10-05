from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models
import apache_beam as beam

(feedback_models,) = models.Registry.import_models([models.Names.FEEDBACK])

class RemoveInvalidFeedbackMessagesJob(base_jobs.JobBase):
    """Beam job that removes invalid GeneralFeedbackMessageModel entries."""

    def _is_invalid_message(self, msg: feedback_models.GeneralFeedbackMessageModel) -> bool:
        """Returns True if the message has empty or missing author_id."""
        return not msg.author_id or msg.author_id.strip() == ""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        all_messages = (
            self.pipeline
            | "Get all Feedback Messages" >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackMessageModel.get_all()
            )
        )

        invalid_messages = (
            all_messages
            | "Filter invalid messages" >> beam.Filter(self._is_invalid_message)
        )

        invalid_message_keys = (
            invalid_messages
            | "Get keys of invalid messages" >> beam.Map(lambda msg: msg.key)
        )

        _ = (
            invalid_message_keys
            | "Delete invalid messages" >> ndb_io.DeleteModels()
        )

        count_deleted_messages = (
            invalid_messages
            | "Count deleted messages" >> beam.combiners.Count.Globally()
            | "Format output" >> beam.Map(
                lambda count: job_run_result.JobRunResult(
                    stdout=f"INVALID FEEDBACK MESSAGES DELETED: {count}"
                )
            )
        )

        return count_deleted_messages
