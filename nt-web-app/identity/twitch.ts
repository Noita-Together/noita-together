/* =======
 *  NOTES
 * =======
 *
 * Scope:
 *  Interfaces with twitch API to provide identity services and user lookup
 *
 * Documentation Referenced In Implementation
 *  https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow 
 *
 * Vars
 *   TWITCH_API_KEY: OAuth Secret and API key, accessed in twitch developer dashboard
 *   TWITCH_CLIENT_ID: OAuth Client id, accessed in twitch developer dashboard
 *
 */

// =====================
//  Imports and Globals
// =====================
import axios, { AxiosResponse } from "axios";
import { UserData } from "../entity/identity";

const TWITCH_API_KEY = process.env.TWITCH_API_KEY as string
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID as string

// ========================
//  Interfaces and Helpers
// ========================

interface TwitchAppAccessToken {
  access_token: string,
  expires_in: number,
  acquired_at?: number,
  token_type: string
}

interface TwitchGetUsersResponse {
  data: TwitchUserData[]
}

interface TwitchUserData {
  id: string,
  login: string,
  display_name: string,
  type: string,
  broadcaster_type: string,
  description: string,
  profile_image_url: string,
  offline_image_url: string,
  view_count: number,
  email: string,
  created_at: string
}

const toUserData = (twitchUserData: TwitchUserData): UserData => ({
  sub: twitchUserData.id,
  preferred_username: twitchUserData.display_name,
  picture: twitchUserData.profile_image_url,
  email: twitchUserData.email,
});

const getServerAccessToken = async (): Promise<TwitchAppAccessToken | null> => {
  if (serverAccessToken) {
    let expiration = serverAccessToken.acquired_at!! + serverAccessToken.expires_in * 1000
    if (Date.now() - expiration <= 120000) { //if the expiration is within 2 minutes, lets refresh the token
      console.log('Tokens expired!')
      serverAccessToken = undefined
    }
    else return serverAccessToken
  }

  if (!serverAccessToken) {
    console.log('Fetching access token for Twitch API...')
    const access: TwitchAppAccessToken | null = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_API_KEY,
        grant_type: 'client_credentials',
      },
    })
      .then((res: AxiosResponse<TwitchAppAccessToken>) => res.data)
      .catch((e) => {
        console.log(e)
        return null
      })
    console.log('Fetched?')
    if (access) {
      access.acquired_at = Date.now()
      serverAccessToken = access
      console.log('Yes!')
    }
    else {
      console.log('Nope!')
    }
  }
  return serverAccessToken!!
}

// ====================
//  Exported Functions
// ====================

const getUser = async (accessToken: string): Promise<UserData> => {
  return axios.get("https://api.twitch.tv/helix/users", {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': TWITCH_CLIENT_ID
    }
  })
    .then((res: AxiosResponse<TwitchGetUsersResponse>) => res.data)
    .then(data => data.data[0])
    .then(toUserData);
}

const getUsersById = async (userIds: string[]): Promise<UserData[] | null> => {
  let tokens = await getServerAccessToken()
  if (!tokens) throw new Error("getUsersById: Unable to communicate with Twitch!")
  const query = userIds.map((userId) => `id=${userId}`).join('&')
  return axios.get(`https://api.twitch.tv/helix/users?${query}`, {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`,
      'Client-Id': TWITCH_CLIENT_ID
    }
  })
    .then((res: AxiosResponse<TwitchGetUsersResponse>) => res.data)
    .then(data => data.data)
    .then((twitchUsers: TwitchUserData[]) => twitchUsers.map(toUserData))
    .catch((e) => {
      console.log(e)
      return null
    })
}

const validateAuthServer = async (): Promise<Boolean> => {
  const token = getServerAccessToken();
  return !!token;
}

const getRedirectURL = (redirectURL: string, scope: string, state: string): string =>
  `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${TWITCH_CLIENT_ID}&redirect_uri=${redirectURL}&scope=${scope}&state=${state}`;

const handleRedirectResponse = async (code: string, state: string, redirectUri: string, grantType: string): Promise<UserData> => {
  const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_API_KEY,
      code: code,
      grant_type: grantType,
      redirect_uri: redirectUri,
    },
  });

  const { access_token } = response.data;

  const userData = await getUser(access_token)

  return userData;
};

let serverAccessToken: TwitchAppAccessToken | undefined = undefined

const provider = "twitch";

export {
  getUser,
  getUsersById,
  getRedirectURL,
  handleRedirectResponse,
  validateAuthServer,

  provider,
}
