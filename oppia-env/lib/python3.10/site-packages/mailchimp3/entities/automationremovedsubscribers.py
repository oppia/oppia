# coding=utf-8
"""
The Automation Removed Subscribers endpoint

Note: This is a paid feature

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/automations/removed-subscribers/
Schema: https://api.mailchimp.com/schema/3.0/Automations/RemovedSubscribers/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_email

class AutomationRemovedSubscribers(BaseApi):
    """
    Remove subscribers from an Automation workflow.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(AutomationRemovedSubscribers, self).__init__(*args, **kwargs)
        self.endpoint = 'automations'
        self.workflow_id = None


    # Paid feature
    def create(self, workflow_id, data):
        """
        Remove a subscriber from a specific Automation workflow. You can
        remove a subscriber at any point in an Automation workflow, regardless
        of how many emails they’ve been sent from that workflow. Once they’re
        removed, they can never be added back to the same workflow.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "email_address": string*
        }
        """
        self.workflow_id = workflow_id
        if 'email_address' not in data:
            raise KeyError('The automation removed subscriber must have an email_address')
        check_email(data['email_address'])
        return self._mc_client._post(url=self._build_path(workflow_id, 'removed-subscribers'), data=data)


    # Paid feature
    def all(self, workflow_id):
        """
        Get information about subscribers who were removed from an Automation
        workflow.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        """
        self.workflow_id = workflow_id
        return self._mc_client._get(url=self._build_path(workflow_id, 'removed-subscribers'))

