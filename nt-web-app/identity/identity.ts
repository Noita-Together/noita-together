import { getUser, getUsersById, getRedirectURL, handleRedirectResponse, validateAuthServer, provider } from './twitch';

export {
  getUser,
  getUsersById,
  getRedirectURL,
  handleRedirectResponse,
  provider,
  validateAuthServer,
}


/*
import { UserData } from '../entity/identity';

Potential IdentityProvider Interface to make sure identity providers are handled consistently

interface IdentityProvider {
  getUser(): Promise<UserData>;
  getUsersById(): Promise<UserData[]>;
  getRedirectURL(): string;
  handleRedirectResponse(): UserData;
  validateAuthServer(): Promise<Boolean>;

  provider: string;
}
*/

