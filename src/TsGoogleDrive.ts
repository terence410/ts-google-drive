import * as fs from "fs";
import * as path from "path";
import {AuthClientBase} from "./AuthClientBase";
import {File} from "./File";
import {Query} from "./Query";
import {
  FILE_FIELDS,
  GOOGLE_DRIVE_API,
  GOOGLE_DRIVE_UPLOAD_API,
  ICreateFolderOptions,
  ITsGoogleDriveOptions,
  IUpdateMetaOptions
} from "./types";

export class TsGoogleDrive extends AuthClientBase {
  constructor(options: ITsGoogleDriveOptions) {
    super(options);
  }

  public query() {
    return new Query(this.options);
  }

  // https://developers.google.com/drive/api/v3/reference/files/get
  public async getFile(id: string) {
    const client = await this._getClient();
    const url = `/files/${id}`;
    const params = {fields: FILE_FIELDS};

    try {
      const res = await client.request({baseURL: GOOGLE_DRIVE_API, url, params});
      const file = new File(client);
      Object.assign(file, res.data);
      return file;
    } catch (err) {
      if (typeof err === "object" && (err as any)?.code === 404) {
        return undefined;
      }

      throw err;
    }
  }

  // https://developers.google.com/drive/api/v3/reference/files/create
  public async createFolder(options: ICreateFolderOptions = {}) {
    const client = await this._getClient();
    const url = `/files`;
    const params = {fields: FILE_FIELDS};
    const data: any = {mimeType: "application/vnd.google-apps.folder", name: options.name, description: options.description};
    if (options.parent) {
      data.parents = [options.parent];
    }

    const res = await client.request({baseURL: GOOGLE_DRIVE_API, url, params, data, method: "POST"});
    const file = new File(client);
    Object.assign(file, res.data);
    return file;
  }

  // https://developers.google.com/drive/api/v3/reference/files/create
  public async upload(filename: string, options: IUpdateMetaOptions = {}) {
    const client = await this._getClient();
    const params = {uploadType: "media", fields: FILE_FIELDS};

    // upload
    const buffer = fs.readFileSync(filename);
    const res = await client.request({url: GOOGLE_DRIVE_UPLOAD_API, method: "POST", params, body: buffer});

    // create file
    const file = new File(client);
    Object.assign(file, res.data);

    // update meta
    if (!options.name) {
      options.name = path.basename(filename);
    }
    await file.update(options);

    return file;
  }

  // https://developers.google.com/drive/api/v3/reference/files/emptyTrash
  public async emptyTrash() {
    const client = await this._getClient();
    const url = `/files/trash`;
    const params = {};
    const res = await client.request({baseURL: GOOGLE_DRIVE_API, url, method: "DELETE", params});
    return true;
  }
}
