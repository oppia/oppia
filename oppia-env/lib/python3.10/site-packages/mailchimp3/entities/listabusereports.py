# coding=utf-8
"""
The List Abuse Reports API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/abuse-reports/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Abuse/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ListAbuseReports(BaseApi):
    """
    Manage abuse complaints for a specific list. An abuse complaint occurs
    when your recipient reports an email as spam in their mail program.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ListAbuseReports, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.report_id = None


    def all(self, list_id, get_all=False, **queryparams):
        """
        Get all abuse reports for a specific list.

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
        self.report_id = None
        if get_all:
            return self._iterate(url=self._build_path(list_id, 'abuse-reports'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(list_id, 'abuse-reports'), **queryparams)


    def get(self, list_id, report_id, **queryparams):
        """
        Get details about a specific abuse report.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param report_id: The id for the abuse report.
        :type report_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.list_id = list_id
        self.report_id = report_id
        return self._mc_client._get(url=self._build_path(list_id, 'abuse-reports', report_id), **queryparams)
