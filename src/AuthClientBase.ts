import {BaseExternalAccountClient, GoogleAuth, OAuth2Client} from "google-auth-library";
import {AuthClient} from "google-auth-library/build/src/auth/authclient";
import {ITsGoogleDriveOptions} from "./types";

const scopes = ["https://www.googleapis.com/auth/drive"];

export class AuthClientBase {
  private _client?: OAuth2Client | BaseExternalAccountClient; // hide from the object

  constructor(public readonly options: ITsGoogleDriveOptions) {
    // hide the property from printing
    Object.defineProperty(this, "_client", {
      enumerable: false,
      writable: true,
      value: undefined,
    });
  }

  protected async _getClient(): Promise<OAuth2Client | BaseExternalAccountClient> {
    if (!this._client) {
      if ("oAuthCredentials" in this.options) {
        const oauth = new OAuth2Client(this.options.oauthClientOptions);
        oauth.setCredentials(this.options.oAuthCredentials);
        this._client = oauth;

      } else {
        const googleAuth = new GoogleAuth({...this.options, scopes});
        this._client = await googleAuth.getClient();
      }
    }

    return this._client!;
  }
}
