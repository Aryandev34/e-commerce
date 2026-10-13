from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class InventoryConflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'There is not enough stock available for that quantity.'
    default_code = 'inventory_conflict'


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None and isinstance(exc, APIException) and not isinstance(response.data, dict):
        response.data = {'detail': response.data}
    return response
