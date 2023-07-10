//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AuthRefreshPost200Response {
  /// Returns a new [AuthRefreshPost200Response] instance.
  AuthRefreshPost200Response({
    this.token,
    this.expiresIn,
  });

  /// Access token
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? token;

  /// Token expiration in seconds from now
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? expiresIn;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AuthRefreshPost200Response &&
     other.token == token &&
     other.expiresIn == expiresIn;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (token == null ? 0 : token!.hashCode) +
    (expiresIn == null ? 0 : expiresIn!.hashCode);

  @override
  String toString() => 'AuthRefreshPost200Response[token=$token, expiresIn=$expiresIn]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.token != null) {
      json[r'token'] = this.token;
    } else {
      json[r'token'] = null;
    }
    if (this.expiresIn != null) {
      json[r'expires_in'] = this.expiresIn;
    } else {
      json[r'expires_in'] = null;
    }
    return json;
  }

  /// Returns a new [AuthRefreshPost200Response] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AuthRefreshPost200Response? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AuthRefreshPost200Response[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AuthRefreshPost200Response[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AuthRefreshPost200Response(
        token: mapValueOfType<String>(json, r'token'),
        expiresIn: mapValueOfType<String>(json, r'expires_in'),
      );
    }
    return null;
  }

  static List<AuthRefreshPost200Response>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AuthRefreshPost200Response>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AuthRefreshPost200Response.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AuthRefreshPost200Response> mapFromJson(dynamic json) {
    final map = <String, AuthRefreshPost200Response>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AuthRefreshPost200Response.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AuthRefreshPost200Response-objects as value to a dart map
  static Map<String, List<AuthRefreshPost200Response>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AuthRefreshPost200Response>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AuthRefreshPost200Response.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

