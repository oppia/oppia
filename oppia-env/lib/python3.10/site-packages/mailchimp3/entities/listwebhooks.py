# coding=utf-8
"""
The List Webhooks API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/webhooks/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Webhooks/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_url


class ListWebhooks(BaseApi):
    """
    Manage webhooks for a specific MailChimp list.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListWebhooks, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.webhook_id = None


    def create(self, list_id, data):
        """
        Create a new webhook for a specific list.

        The documentation does not include any required request body
        parameters but the url parameter is being listed here as a required
        parameter in documentation and error-checking based on the description
        of the method

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "url": string*
        }
        """
        self.list_id = list_id
        if 'url' not in data:
            raise KeyError('The list webhook must have a url')
        check_url(data['url'])
        response = self._mc_client._post(url=self._build_path(list_id, 'webhooks'), data=data)
        if response is not None:
            self.webhook_id = response['id']
        else:
            self.webhook_id = None
        return response


    def all(self, list_id):
        """
        Get information about all webhooks for a specific list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        """
        self.list_id = list_id
        self.webhook_id = None
        return self._mc_client._get(url=self._build_path(list_id, 'webhooks'))


    def get(self, list_id, webhook_id):
        """
        Get information about a specific webhook.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param webhook_id: The unique id for the webhook.
        :type webhook_id: :py:class:`str`
        """
        self.list_id = list_id
        self.webhook_id = webhook_id
        return self._mc_client._get(url=self._build_path(list_id, 'webhooks', webhook_id))


    def update(self, list_id, webhook_id, data):
        """
        Update the settings for an existing webhook.

        :param list_id: The unique id for the list
        :type list_id: :py:class:`str`
        :param webhook_id: The unique id for the webhook
        :type webhook_id: :py:class:`str`
        """
        self.list_id = list_id
        self.webhook_id = webhook_id
        return self._mc_client._patch(url=self._build_path(list_id, 'webhooks', webhook_id), data=data)


    def delete(self, list_id, webhook_id):
        """
        Delete a specific webhook in a list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param webhook_id: The unique id for the webhook.
        :type webhook_id: :py:class:`str`
        """
        self.list_id = list_id
        self.webhook_id = webhook_id
        return self._mc_client._delete(url=self._build_path(list_id, 'webhooks', webhook_id))
