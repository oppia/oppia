# coding=utf-8
"""
The E-commerce Stores API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/ecommerce/stores/
Schema: https://api.mailchimp.com/schema/3.0/Ecommerce/Stores/Instance.json
"""
from __future__ import unicode_literals

import re

from mailchimp3.baseapi import BaseApi
from mailchimp3.entities.storecarts import StoreCarts
from mailchimp3.entities.storecustomers import StoreCustomers
from mailchimp3.entities.storeorders import StoreOrders
from mailchimp3.entities.storeproducts import StoreProducts


class Stores(BaseApi):
    """
    Connect your E-commerce Store to MailChimp to take advantage of powerful
    reporting and personalization features and to learn more about your
    customers.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(Stores, self).__init__(*args, **kwargs)
        self.endpoint = 'ecommerce/stores'
        self.store_id = None
        self.carts = StoreCarts(self)
        self.customers = StoreCustomers(self)
        self.orders = StoreOrders(self)
        self.products = StoreProducts(self)

    def create(self, data):
        """
        Add a new store to your MailChimp account.

        Error checking on the currency code verifies that it is in the correct
        three-letter, all-caps format as specified by ISO 4217 but does not
        check that it is a valid code as the list of valid codes changes over
        time.

        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "id": string*,
            "list_id": string*,
            "name": string*,
            "currency_code": string*
        }
        """
        if 'id' not in data:
            raise KeyError('The store must have an id')
        if 'list_id' not in data:
            raise KeyError('The store must have a list_id')
        if 'name' not in data:
            raise KeyError('The store must have a name')
        if 'currency_code' not in data:
            raise KeyError('The store must have a currency_code')
        if not re.match(r"^[A-Z]{3}$", data['currency_code']):
            raise ValueError('The currency_code must be a valid 3-letter ISO 4217 currency code')
        response = self._mc_client._post(url=self._build_path(), data=data)
        if response is not None:
            self.store_id = response['id']
        else:
            self.store_id = None
        return response


    def all(self, get_all=False, **queryparams):
        """
        Get information about all stores in the account.

        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        queryparams['count'] = integer
        queryparams['offset'] = integer
        """
        self.store_id = None
        if get_all:
            return self._iterate(url=self._build_path(), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(), **queryparams)


    def get(self, store_id, **queryparams):
        """
        Get information about a specific store.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.store_id = store_id
        return self._mc_client._get(url=self._build_path(store_id), **queryparams)


    def update(self, store_id, data):
        """
        Update a store.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.store_id = store_id
        return self._mc_client._patch(url=self._build_path(store_id), data=data)


    def delete(self, store_id):
        """
        Delete a store. Deleting a store will also delete any associated
        subresources, including Customers, Orders, Products, and Carts.

        :param store_id: The store id.
        :type store_id: :py:class:`str`
        """
        self.store_id = store_id
        return self._mc_client._delete(url=self._build_path(store_id))
