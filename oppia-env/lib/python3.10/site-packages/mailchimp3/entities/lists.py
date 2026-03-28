# coding=utf-8
"""
The Lists API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/lists/
Schema: https://api.mailchimp.com/schema/3.0/Lists/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.listabusereports import ListAbuseReports
from mailchimp3.entities.listactivity import ListActivity
from mailchimp3.entities.listclients import ListClients
from mailchimp3.entities.listgrowthhistory import ListGrowthHistory
from mailchimp3.entities.listinterestcategories import ListInterestCategories
from mailchimp3.entities.listmembers import ListMembers
from mailchimp3.entities.listmergefields import ListMergeFields
from mailchimp3.entities.listsegments import ListSegments
from mailchimp3.entities.listsignupforms import ListSignupForms
from mailchimp3.entities.listwebhooks import ListWebhooks
from mailchimp3.helpers import check_email


class Lists(BaseApi):
    """
    A MailChimp list is a powerful and flexible tool that helps you manage your contacts.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Lists, self).__init__(*args, **kwargs)
        self.endpoint = 'lists'
        self.list_id = None
        self.abuse_reports = ListAbuseReports(self)
        self.activity = ListActivity(self)
        self.clients = ListClients(self)
        self.growth_history = ListGrowthHistory(self)
        self.interest_categories = ListInterestCategories(self)
        self.members = ListMembers(self)
        self.merge_fields = ListMergeFields(self)
        self.segments = ListSegments(self)
        self.signup_forms = ListSignupForms(self)
        self.webhooks = ListWebhooks(self)


    def create(self, data):
        """
        Create a new list in your MailChimp account.

        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*,
            "contact": object*
            {
                "company": string*,
                "address1": string*,
                "city": string*,
                "state": string*,
                "zip": string*,
                "country": string*
            },
            "permission_reminder": string*,
            "campaign_defaults": object*
            {
                "from_name": string*,
                "from_email": string*,
                "subject": string*,
                "language": string*
            },
            "email_type_option": boolean
        }
        """
        if 'name' not in data:
            raise KeyError('The list must have a name')
        if 'contact' not in data:
            raise KeyError('The list must have a contact')
        if 'company' not in data['contact']:
            raise KeyError('The list contact must have a company')
        if 'address1' not in data['contact']:
            raise KeyError('The list contact must have a address1')
        if 'city' not in data['contact']:
            raise KeyError('The list contact must have a city')
        if 'state' not in data['contact']:
            raise KeyError('The list contact must have a state')
        if 'zip' not in data['contact']:
            raise KeyError('The list contact must have a zip')
        if 'country' not in data['contact']:
            raise KeyError('The list contact must have a country')
        if 'permission_reminder' not in data:
            raise KeyError('The list must have a permission_reminder')
        if 'campaign_defaults' not in data:
            raise KeyError('The list must have a campaign_defaults')
        if 'from_name' not in data['campaign_defaults']:
            raise KeyError('The list campaign_defaults must have a from_name')
        if 'from_email' not in data['campaign_defaults']:
            raise KeyError('The list campaign_defaults must have a from_email')
        check_email(data['campaign_defaults']['from_email'])
        if 'subject' not in data['campaign_defaults']:
            raise KeyError('The list campaign_defaults must have a subject')
        if 'language' not in data['campaign_defaults']:
            raise KeyError('The list campaign_defaults must have a language')
        if 'email_type_option' not in data:
            raise KeyError('The list must have an email_type_option')
        if data['email_type_option'] not in [True, False]:
            raise TypeError('The list email_type_option must be True or False')
        response = self._mc_client._post(url=self._build_path(), data=data)
        if response is not None:
            self.list_id = response['id']
        else:
            self.list_id = None
        return response


    def update_members(self, list_id, data):
        """
        Batch subscribe or unsubscribe list members.

        Only the members array is required in the request body parameters.
        Within the members array, each member requires an email_address
        and either a status or status_if_new. The update_existing parameter
        will also be considered required to help prevent accidental updates
        to existing members and will default to false if not present.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "members": array*
            [
                {
                    "email_address": string*,
                    "status": string* (Must be one of 'subscribed', 'unsubscribed', 'cleaned', or 'pending'),
                    "status_if_new": string* (Must be one of 'subscribed', 'unsubscribed', 'cleaned', or 'pending')
                }
            ],
            "update_existing": boolean*
        }
        """
        self.list_id = list_id
        if 'members' not in data:
            raise KeyError('The update must have at least one member')
        else:
            if not len(data['members']) <= 500:
                raise ValueError('You may only batch sub/unsub 500 members at a time')
        for member in data['members']:
            if 'email_address' not in member:
                raise KeyError('Each list member must have an email_address')
            check_email(member['email_address'])
            if 'status' not in member and 'status_if_new' not in member:
                raise KeyError('Each list member must have either a status or a status_if_new')
            valid_statuses = ['subscribed', 'unsubscribed', 'cleaned', 'pending']
            if 'status' in member and member['status'] not in valid_statuses:
                raise ValueError('The list member status must be one of "subscribed", "unsubscribed", "cleaned", or '
                                 '"pending"')
            if 'status_if_new' in member and member['status_if_new'] not in valid_statuses:
                raise ValueError('The list member status_if_new must be one of "subscribed", "unsubscribed", '
                                 '"cleaned", or "pending"')
        if 'update_existing' not in data:
            data['update_existing'] = False
        return self._mc_client._post(url=self._build_path(list_id), data=data)


    def all(self, get_all=False, **queryparams):
        """
        Get information about all lists in the account.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        queryparams['before_date_created'] = string
        queryparams['since_date_created'] = string
        queryparams['before_campaign_last_sent'] = string
        queryparams['since_campaign_last_sent'] = string
        queryparams['email'] = string
        queryparams['sort_field'] = string (Must be 'date_created')
        queryparams['sort_dir'] = string (Must be one of 'ASC' or 'DESC')
        """
        self.list_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, list_id, **queryparams):
        """
        Get information about a specific list in your MailChimp account.
        Results include list members who have signed up but haven’t confirmed
        their subscription yet and unsubscribed or cleaned.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.list_id = list_id
        return self._mc_client._get(url=self._build_path(list_id), **queryparams)


    def update(self, list_id, data):
        """
        Update the settings for a specific list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "name": string*,
            "contact": object*
            {
                "company": string*,
                "address1": string*,
                "city": string*,
                "state": string*,
                "zip": string*,
                "country": string*
            },
            "permission_reminder": string*,
            "campaign_defaults": object*
            {
                "from_name": string*,
                "from_email": string*,
                "subject": string*,
                "language": string*
            },
            "email_type_option": boolean
        }
        """
        self.list_id = list_id
        if 'name' not in data:
            raise KeyError('The list must have a name')
        if 'contact' not in data:
            raise KeyError('The list must have a contact')
        if 'company' not in data['contact']:
            raise KeyError('The list contact must have a company')
        if 'address1' not in data['contact']:
            raise KeyError('The list contact must have a address1')
        if 'city' not in data['contact']:
            raise KeyError('The list contact must have a city')
        if 'state' not in data['contact']:
            raise KeyError('The list contact must have a state')
        if 'zip' not in data['contact']:
            raise KeyError('The list contact must have a zip')
        if 'country' not in data['contact']:
            raise KeyError('The list contact must have a country')
        if 'permission_reminder' not in data:
            raise KeyError('The list must have a permission_reminder')
        if 'campaign_defaults' not in data:
            raise KeyError('The list must have a campaign_defaults')
        if 'from_name' not in data['campaign_defaults']:
            raise KeyError('The list campaign_defaults must have a from_name')
        if 'from_email' not in data['campaign_defaults']:
            raise KeyError('The list campaign_defaults must have a from_email')
        check_email(data['campaign_defaults']['from_email'])
        if 'subject' not in data['campaign_defaults']:
            raise KeyError('The list campaign_defaults must have a subject')
        if 'language' not in data['campaign_defaults']:
            raise KeyError('The list campaign_defaults must have a language')
        if 'email_type_option' not in data:
            raise KeyError('The list must have an email_type_option')
        if data['email_type_option'] not in [True, False]:
            raise TypeError('The list email_type_option must be True or False')
        return self._mc_client._patch(url=self._build_path(list_id), data=data)


    def delete(self, list_id):
        """
        Delete a list from your MailChimp account. If you delete a list,
        you’ll lose the list history—including subscriber activity,
        unsubscribes, complaints, and bounces. You’ll also lose subscribers’
        email addresses, unless you exported and backed up your list.

        :param list_id: The unique id for the list.
        :type list_id: :py:class:`str`
        """
        self.list_id = list_id
        return self._mc_client._delete(url=self._build_path(list_id))

