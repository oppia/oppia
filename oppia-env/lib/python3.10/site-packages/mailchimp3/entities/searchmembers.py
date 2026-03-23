# coding=utf-8
"""
The Search Members API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/search-members/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Members/Collection.json
Additional Data: http://kb.mailchimp.com/accounts/management/search-for-subscribers-and-campaigns-in-your-account
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class SearchMembers(BaseApi):
    """
    Manage campaign reports for your MailChimp account. All Reports endpoints
    are read-only. MailChimp’s campaign and Automation reports analyze clicks,
    opens, subscribers’ social activity, e-commerce data, and more.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(SearchMembers, self).__init__(*args, **kwargs)
        self.endpoint = 'search-members'
        self.list_id = None


    def get(self, **queryparams):
        """
        Search for list members. This search can be restricted to a specific
        list, or can be used to search across all lists in an account.

        :param queryparams: The query string parameters
        queryparams['fields'] = array
        queryparams['exclude_fields'] = array
        queryparams['query'] = string
        queryparams['list_id'] = string
        queryparams['offset'] = integer
        """
        if 'list_id' in queryparams:
            self.list_id = queryparams['list_id']
        else:
            self.list_id = None
        return self._mc_client._get(url=self._build_path(), **queryparams)
