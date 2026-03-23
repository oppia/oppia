# coding=utf-8
"""
The List Growth History API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/growth-history/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Growth/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ListGrowthHistory(BaseApi):
    """
    View a summary of the month-by-month growth activity for a specific list.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListGrowthHistory, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.month = None


    def all(self, list_id, get_all=False, **queryparams):
        """
        Get a month-by-month summary of a specific list’s growth activity.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.list_id = list_id
        self.month = None
        if get_all:
            return self._iterate(url=self._build_path(list_id, 'growth-history'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(list_id, 'growth-history'), **queryparams)


    def get(self, list_id, month, **queryparams):
        """
        Get a summary of a specific list’s growth activity for a specific month and year.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param month: A specific month of list growth history.
        :type month: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.list_id = list_id
        self.month = month
        return self._mc_client._get(url=self._build_path(list_id, 'growth-history', month), **queryparams)
