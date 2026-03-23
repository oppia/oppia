# coding=utf-8
"""
The List Clients API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/clients/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Clients/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ListClients(BaseApi):
    """
    Get information about the most popular email clients for subscribers in a
    specific MailChimp list.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListClients, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None


    def all(self, list_id, **queryparams):
        """
        Get a list of the top email clients based on user-agent strings.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.list_id = list_id
        return self._mc_client._get(url=self._build_path(list_id, 'clients'), **queryparams)
