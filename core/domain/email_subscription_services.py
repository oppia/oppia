from core.domain import email_manager
from core.domain import exp_services

def inform_subscribers(creator_id, exploration_id):
    exploration = exp_services.get_exploration_by_id(exploration_id)
    email_manager.send_emails_to_subscribers(
        creator_id, exploration.id, exploration.title)
