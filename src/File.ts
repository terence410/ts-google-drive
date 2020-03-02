import {OAuth2Client} from "google-auth-library";
import {FIELDS, GOOGLE_DRIVE_API} from "./TsGooleDrive";
import {IUpdateMetaOptions} from "./types";

export class File {
  public id: string = "";
  public name: string = "";
  public mimeType: string = "";
  public kind: string = "";
  public modifiedTime: string = "";
  public createdTime: string = "";
  public size: number = 0;
  public parents: string[] = [];

  constructor(oAuth2Client: OAuth2Client) {
    // hide it from printing
    Object.defineProperty(this, "oAuth2Client", {
      enumerable: false,
      value: oAuth2Client,
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

  // https://developers.google.com/drive/api/v3/reference/files/update
  public async update(options: IUpdateMetaOptions = {}) {
    const client = this._getClient();
    const url = `/files/${this.id}`;
    const params = {fields: FIELDS, addParents: options.parent, description: options.description};
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

  private _getClient(): OAuth2Client {
    return (this as any).oAuth2Client as OAuth2Client;
  }
}
