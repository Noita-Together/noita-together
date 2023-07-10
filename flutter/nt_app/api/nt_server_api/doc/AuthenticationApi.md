# nt_server_api.api.AuthenticationApi

## Load the API package
```dart
import 'package:nt_server_api/api.dart';
```

All URIs are relative to *https://noita-together.skyefullofbreeze.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**authCode**](AuthenticationApi.md#authcode) | **GET** /auth/code | 
[**authLogin**](AuthenticationApi.md#authlogin) | **GET** /auth/login | 
[**authRefreshPost**](AuthenticationApi.md#authrefreshpost) | **POST** /auth/refresh | Refresh Access Token


# **authCode**
> String authCode(code, state)



Authorization Grant Flow Code endpoint from twitch

### Example
```dart
import 'package:nt_server_api/api.dart';

final api_instance = AuthenticationApi();
final code = code_example; // String | Authorization Grant Code
final state = state_example; // String | Authorization flow state, sometimes is our device authorization code passed via login

try {
    final result = api_instance.authCode(code, state);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->authCode: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **code** | **String**| Authorization Grant Code | [optional] 
 **state** | **String**| Authorization flow state, sometimes is our device authorization code passed via login | [optional] 

### Return type

**String**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, text/html

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authLogin**
> authLogin(deviceCode)



Redirects the user to twitch authentication via OIDC

### Example
```dart
import 'package:nt_server_api/api.dart';

final api_instance = AuthenticationApi();
final deviceCode = 8.14; // num | 8 digit device code for device authorization

try {
    api_instance.authLogin(deviceCode);
} catch (e) {
    print('Exception when calling AuthenticationApi->authLogin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deviceCode** | **num**| 8 digit device code for device authorization | [optional] 

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authRefreshPost**
> AuthRefreshPost200Response authRefreshPost(authorization)

Refresh Access Token

### Example
```dart
import 'package:nt_server_api/api.dart';

final api_instance = AuthenticationApi();
final authorization = authorization_example; // String | Refresh token, as 'Bearer $token'

try {
    final result = api_instance.authRefreshPost(authorization);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->authRefreshPost: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **authorization** | **String**| Refresh token, as 'Bearer $token' | [optional] 

### Return type

[**AuthRefreshPost200Response**](AuthRefreshPost200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, text/plain

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

