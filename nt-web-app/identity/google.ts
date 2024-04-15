// =====================
//  Imports and Globals
// =====================
import axios, { AxiosResponse } from "axios";
import { UserData } from "../entity/identity";
import { google } from 'googleapis';
import jwt from "jsonwebtoken";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string

const GOOGLE_USERINFO_ENDPOINT = process.env.GOOGLE_USERINFO_ENDPOINT as string
const GOOGLE_AUTHORIZATION_ENDPOINT = process.env.GOOGLE_AUTHORIZATION_ENDPOINT as string
const GOOGLE_GETUSER_ENDPOINT = process.env.GOOGLE_GETUSER_ENDPOINT as string
const GOOGLE_ACCESSTOKEN_ENDPOINT = process.env.GOOGLE_ACCESSTOKEN_ENDPOINT as string

const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI as string;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OAUTH_REDIRECT_URI + "/api/auth/code",
);

const scopes = [
  'email',
  'profile',

];

// ========================
//  Interfaces and Helpers
// ========================

// ====================
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

const provider = "google";

export {
  getUser,
  getUsersById,
  getRedirectURL,
  handleRedirectResponse,
  validateAuthServer,

  provider,
}
