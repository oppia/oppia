class FeedbackThread(object):
    """Domain object for an FeedbackThreadModel."""
    def __init__(self, thread_id, exploration_id, state_name,
                 original_author_id, status, subject, summary, has_suggestion,
                 created_on, last_updated):
        self.id = thread_id
        self.exploration_id = exploration_id
        self.state_name = state_name
        self.original_author_id = original_author_id
        self.status = status
        self.subject = subject
        self.summary = summary
        self.has_suggestion = has_suggestion

        self.created_on = created_on
        self.last_updated = last_updated
