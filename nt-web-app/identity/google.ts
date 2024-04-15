/* =======
 *  NOTES
 * =======
 *
 * Scope:
 *  Simple plug and play usage of the google api library to run identity provider functions
 *  Currently lacks the ability to fetch a user by subscriber identifier, might not be possible
 *  with the tooling provided.
 *
 * Documentation Referenced In Implementation
 *  https://github.com/googleapis/google-api-nodejs-client?tab=readme-ov-file#oauth2-client 
 *
 * Vars
 *   GOOGLE_CLIENT_SECRET: OIDC Client Secret, accessed in google developer console
 *   GOOGLE_CLIENT_ID: OIDC Client id, accessed in google developer console
 *
 */

// =====================
//  Imports and Globals
// =====================
import axios, { AxiosResponse } from "axios";
import { UserData } from "../entity/identity";
import { google } from 'googleapis';
import jwt from "jsonwebtoken";

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string


const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI as string;

const provider = "google";

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OAUTH_REDIRECT_URI + "/api/auth/code",
);

const scopes = [
  'email',
  'profile',

];
// ====================
//
//  Exported Functions
// ====================

const getUser = async (id_token: string): Promise<UserData> => {
  try {
    const userData = jwt.decode(id_token, {
      json: true
    });

    if (userData) {
      return Promise.resolve({
        sub: userData.sub!,
        preferred_username: userData.name!,
        picture: userData.picture!,
        email: userData.email!,
      });
    }
  } catch (ex) {
    console.error(ex);
  }
  return new Promise(() => { });
}

//TODO ADAPT TO GOOGLE
const getUsersById = async (userIds: string[]): Promise<UserData[] | null> => {
  return null
}

const validateAuthServer = async (): Promise<Boolean> => {
  return new Promise(() => true);
}

const getRedirectURL = (redirectURL: string, scope: string, state: string): string => {
  const url = oauth2Client.generateAuthUrl({
    scope: scopes
  });

  return url;
}


const handleRedirectResponse = async (code: string, state: string, redirectUri: string, grantType: string): Promise<UserData> => {
  const response = await oauth2Client.getToken({
    client_id: GOOGLE_CLIENT_ID,
    code: code,
    codeVerifier: state,
    redirect_uri: redirectUri,
  });

  const access_token = response.tokens.id_token ?? "";

  const userData = await getUser(access_token);

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
