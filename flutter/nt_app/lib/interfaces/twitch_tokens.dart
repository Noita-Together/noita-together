class TwitchTokens {
  String? access;
  String? refresh;
  int? expiresIn;
  int? createdOn;

  TwitchTokens();

  factory TwitchTokens.fromJSON(Map<String, dynamic> json) {
    var tokens = TwitchTokens();
    tokens.access = json['access'];
    tokens.refresh = json['refresh'];
    tokens.expiresIn = json['expiresIn'];
    tokens.createdOn = json['createdOn'];
    return tokens;
  }

  Map<String, dynamic> toJson() => {
    'access': access,
    'refresh': refresh,
    'expiresIn': expiresIn,
    'createdOn': createdOn
  };

  Map<String, dynamic> toRefreshTokenJson() => {'refresh': refresh};
}