# coding=utf-8
"""
The Batch Webhooks API Endpoint

Documentation: https://developer.mailchimp.com/documentation/mailchimp/reference/batch-webhooks/
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class BatchWebhooks(BaseApi):
    """
    Manage webhooks for batch operations.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(BatchWebhooks, self).__init__(*args, **kwargs)
        self.endpoint = 'batch-webhooks'
        self.batch_webhook_id = None


    def create(self, data):
        """
        Configure a webhook that will fire whenever any batch request
        completes processing.

        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "url": string*
        }
        """
        if 'url' not in data:
            raise KeyError('The batch webhook must have a valid url')
        response = self._mc_client._post(url=self._build_path(), data=data)
        if response is not None:
            self.batch_webhook_id = response['id']
        else:
            self.batch_webhook_id = None
        return response


    def all(self, get_all=False, **queryparams):
        """
        Get all webhooks that have been configured for batches.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.batch_webhook_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, batch_webhook_id, **queryparams):
        """
        Get information about a specific batch webhook.

        :param batch_webhook_id: The unique id for the batch webhook.
        :type batch_webhook_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.batch_webhook_id = batch_webhook_id
        return self._mc_client._get(url=self._build_path(batch_webhook_id), **queryparams)


    def update(self, batch_webhook_id, data):
        """
        Update a webhook that will fire whenever any batch request completes
        processing.

        :param batch_webhook_id: The unique id for the batch webhook.
        :type batch_webhook_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "url": string*
        }
        """
        self.batch_webhook_id = batch_webhook_id
        if 'url' not in data:
            raise KeyError('The batch webhook must have a valid url')
        return self._mc_client._patch(url=self._build_path(batch_webhook_id), data=data)


    def delete(self, batch_webhook_id):
        """
        Remove a batch webhook. Webhooks will no longer be sent to the given
        URL.

        :param batch_webhook_id: The unique id for the batch webhook.
        :type batch_webhook_id: :py:class:`str`
        """
        self.batch_webhook_id = batch_webhook_id
        return self._mc_client._delete(url=self._build_path(batch_webhook_id))
