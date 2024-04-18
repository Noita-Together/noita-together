/* =======
 *  NOTES
 * =======
 *
 * Scope:
 *  This implementation should be a pretty cut and dry OIDC
 *  integration, very little should need to be changed to 
 *  interface with any other standard oidc provider. It was
 *  developed against forgejo since it's the oidc provider
 *  I had available locally.
 *
 * Documentation Referenced In Implementation
 *   https://forgejo.org/docs/v1.19/user/oauth2-provider/
 *   https://forgejo.org/docs/v1.19/user/api-usage/
 *
 * Vars
 *   FORGEJO_API_KEY: Key for general api, needs access to read users
 *   FORGEJO_CLIENT_SECRET: OIDC Client Secret, generated in /user/settings/applications
 *   FORGEJO_CLIENT_ID: OIDC Client id, generated in /user/settings/applications
 *  
 *   FORGEJO_GETUSER_ENDPOINT: Forgejo Static API endpoint that uses general API key to get user info by id
 *                                                                                         
 *   The following vars are all ripped from https://[YOUR-FORGEJO-URL]/.well-known/openid-configuration
 *   This likely could be used to automatically grab the appropriate url, it simply isn't in this 
 *   implementation for convenience.
 *
 *   FORGEJO_USERINFO_ENDPOINT 
 *   FORGEJO_AUTHORIZATION_ENDPOINT 
 *   FORGEJO_ACCESSTOKEN_ENDPOINT 
 *
 */

// =====================
//  Imports and Globals
// =====================
import axios, { AxiosResponse } from "axios";
import { UserData } from "../entity/identity";

const FORGEJO_API_KEY = process.env.FORGEJO_API_KEY as string
const FORGEJO_CLIENT_SECRET = process.env.FORGEJO_CLIENT_SECRET as string
const FORGEJO_CLIENT_ID = process.env.FORGEJO_CLIENT_ID as string

const FORGEJO_USERINFO_ENDPOINT = process.env.FORGEJO_USERINFO_ENDPOINT as string
const FORGEJO_AUTHORIZATION_ENDPOINT = process.env.FORGEJO_AUTHORIZATION_ENDPOINT as string
const FORGEJO_GETUSER_ENDPOINT = process.env.FORGEJO_GETUSER_ENDPOINT as string
const FORGEJO_ACCESSTOKEN_ENDPOINT = process.env.FORGEJO_ACCESSTOKEN_ENDPOINT as string

const provider = "forgejo";

// ====================
//  Exported Functions
// ====================

const getUser = async (accessToken: string): Promise<UserData> => {
  return axios.get(FORGEJO_USERINFO_ENDPOINT, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
    .then((res) => res.data);
}

const getUsersById = async (userIds: string[]): Promise<UserData[] | null> => {
  const userDataPromises = userIds.map((userId) =>
    axios.get(`${FORGEJO_GETUSER_ENDPOINT}?access_token=${FORGEJO_API_KEY}&uid=${userId}`)
      .then(resp => resp.data)
      .then((data: UserData) => data)
  );
  return Promise.all(userDataPromises);
}

const validateAuthServer = async (): Promise<Boolean> => {
  return new Promise(() => true);
}

const getRedirectURL = (redirectURL: string, scope: string, state: string): string =>
  `${FORGEJO_AUTHORIZATION_ENDPOINT}?response_type=code&client_id=${FORGEJO_CLIENT_ID}&redirect_uri=${redirectURL}&scope=${scope}&state=${state}`;

const handleRedirectResponse = async (code: string, state: string, redirectUri: string, grantType: string): Promise<UserData> => {
  const response = await axios.post(FORGEJO_ACCESSTOKEN_ENDPOINT, {
    client_id: FORGEJO_CLIENT_ID,
    client_secret: FORGEJO_CLIENT_SECRET,
    code: code,
    grant_type: grantType,
    redirect_uri: redirectUri,
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const { access_token } = response.data;

  const userData = await getUser(access_token)

  return userData;
};

export {
  getUser,
  getUsersById,
  getRedirectURL,
  handleRedirectResponse,
  validateAuthServer,

  provider,
}
