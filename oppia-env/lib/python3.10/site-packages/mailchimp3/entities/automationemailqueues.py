# coding=utf-8
"""
The Automation Email Queue endpoint

Note: This is a paid feature

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/automations/emails/queue/
Schema: https://api.mailchimp.com/schema/3.0/Automations/Emails/Queue/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_email, check_subscriber_hash


class AutomationEmailQueues(BaseApi):
    """
    Manage list member queues for Automation emails.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(AutomationEmailQueues, self).__init__(*args, **kwargs)
        self.endpoint = 'automations'
        self.workflow_id = None
        self.email_id = None
        self.subscriber_hash = None

    # Paid feature
    def create(self, workflow_id, email_id, data):
        """
        Manually add a subscriber to a workflow, bypassing the default trigger
        settings. You can also use this endpoint to trigger a series of
        automated emails in an API 3.0 workflow type or add subscribers to an
        automated email queue that uses the API request delay type.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param email_id: The unique id for the Automation workflow email.
        :type email_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "email_address": string*
        }
        """
        self.workflow_id = workflow_id
        self.email_id = email_id
        if 'email_address' not in data:
            raise KeyError('The automation email queue must have an email_address')
        check_email(data['email_address'])
        response = self._mc_client._post(
            url=self._build_path(workflow_id, 'emails', email_id, 'queue'),
            data=data
        )
        if response is not None:
            self.subscriber_hash = response['id']
        else:
            self.subscriber_hash = None
        return response


    # Paid feature
    def all(self, workflow_id, email_id):
        """
        Get information about an Automation email queue.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param email_id: The unique id for the Automation workflow email.
        :type email_id: :py:class:`str`
        """
        self.workflow_id = workflow_id
        self.email_id = email_id
        self.subscriber_hash = None
        return self._mc_client._get(url=self._build_path(workflow_id, 'emails', email_id, 'queue'))


    # Paid feature
    def get(self, workflow_id, email_id, subscriber_hash):
        """
        Get information about a specific subscriber in an Automation email
        queue.

        :param workflow_id: The unique id for the Automation workflow.
        :type workflow_id: :py:class:`str`
        :param email_id: The unique id for the Automation workflow email.
        :type email_id: :py:class:`str`
        :param subscriber_hash: The MD5 hash of the lowercase version of the
          list member’s email address.
        :type subscriber_hash: :py:class:`str`
        """
        subscriber_hash = check_subscriber_hash(subscriber_hash)
        self.workflow_id = workflow_id
        self.email_id = email_id
        self.subscriber_hash = subscriber_hash
        return self._mc_client._get(url=self._build_path(workflow_id, 'emails', email_id, 'queue', subscriber_hash))

