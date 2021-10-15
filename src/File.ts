import {BaseExternalAccountClient, OAuth2Client} from "google-auth-library";
import {AuthClient} from "google-auth-library/build/src/auth/authclient";
import {FILE_FIELDS, GOOGLE_DRIVE_API, IUpdateMetaOptions} from "./types";

export class File {
  public id: string = "";
  public name: string = "";
  public mimeType: string = "";
  public kind: string = "";
  public modifiedTime: string = "";
  public createdTime: string = "";
  public size: number = 0;
  public parents: string[] = [];

  constructor(public client: OAuth2Client | BaseExternalAccountClient) {
    // hide the property from printing
    Object.defineProperty(this, "client", {
      enumerable: false,
      writable: false,
      value: client,
    });
  }

  public get modifiedAt() {
    return new Date(this.modifiedTime);
  }

  public get createdAt() {
    return new Date(this.createdTime);
  }

  public get isFolder() {
    return this.mimeType === "application/vnd.google-apps.folder";
  }

  // https://developers.google.com/drive/api/v3/manage-downloads
  public async download(): Promise<Buffer> {
    const client = this._getClient();
    const url = `/files/${this.id}`;
    const params = {alt: "media"};

    const res = await client.request({baseURL: GOOGLE_DRIVE_API, url, params, responseType: "arraybuffer"});
    return Buffer.from(res.data as any);
  }

  // https://developers.google.com/drive/api/v3/manage-downloads
  public async createStream(): Promise<Buffer> {
    const client = this._getClient();
    const url = `/files/${this.id}`;
    const params = {alt: "media"};

    const res = await client.request({baseURL: GOOGLE_DRIVE_API, url, params, responseType: "arraybuffer"});
    return Buffer.from(res.data as any);
  }

  // https://developers.google.com/drive/api/v3/reference/files/update
  public async update(options: IUpdateMetaOptions = {}) {
    const client = this._getClient();
    const url = `/files/${this.id}`;
    const params = {fields: FILE_FIELDS, addParents: options.parent, description: options.description};
    const body: any = options;

    const res = await client.request({baseURL: GOOGLE_DRIVE_API, url, method: "PATCH", params, data: body});
    Object.assign(this, res.data);
  }

  // https://developers.google.com/drive/api/v3/reference/files/delete
  public async delete() {
    const client = this._getClient();
    const url = `/files/${this.id}`;
    const params = {};

    const res = await client.request({baseURL: GOOGLE_DRIVE_API, url, method: "DELETE", params});
    return true;
  }

  private _getClient(): AuthClient {
    return this.client;
  }
}
