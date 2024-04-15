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


// ========================
//  Interfaces and Helpers
// ========================

// ====================
//  Exported Functions
// ====================

const getUser = async (accessToken: string): Promise<UserData> => {
  return axios.get(FORGEJO_USERINFO_ENDPOINT, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
    .then((res) => {
      console.log(res.data);
      return res.data
    })
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

const provider = "forgejo";

export {
  getUser,
  getUsersById,
  getRedirectURL,
  handleRedirectResponse,
  validateAuthServer,

  provider,
}
