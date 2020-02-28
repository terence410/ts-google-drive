import * as fs from "fs";
import {GoogleAuth, GoogleAuthOptions, JWT} from "google-auth-library";
import * as path from "path";
import {File} from "./File";
import {Query} from "./Query";
import {ICreateFolderOptions, IUpdateMetaOptions} from "./types";

const googleAuthSymbol = Symbol("googleAuth");
const jwtSymbol = Symbol("jwt");
export const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";
export const GOOGLE_DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
export const FIELDS = "id,kind,name,mimeType,parents,modifiedTime,createdTime,size";

type ISearchFileOptions = {
  folderOnly?: boolean;
  fileOnly?: boolean;
  nameContains?: string;
  query?: string;
  inParents?: string | number;
};

export class TsGooleDrive {
  private [googleAuthSymbol]: GoogleAuth;
  private [jwtSymbol]: JWT;

  constructor(options: GoogleAuthOptions) {
    options.scopes = "https://www.googleapis.com/auth/drive";
    this[googleAuthSymbol] = new GoogleAuth(options);
  }

  public query() {
    return new Query(this[googleAuthSymbol]);
  }

  public async getFile(id: string) {
    const jwt = await this._getJWT();
    const url = `/files/${id}`;
    const params = {fields: FIELDS};

    try {
      const res = await jwt.request({baseURL: GOOGLE_DRIVE_API, url, params});
      const file = new File(jwt);
      Object.assign(file, res.data);
      return file;
    } catch (err) {
      // ignore error
    }
  }

  // https://developers.google.com/drive/api/v3/reference/files/create
  public async createFolder(options: ICreateFolderOptions = {}) {
    const jwt = await this._getJWT();
    const url = `/files`;
    const params = {fields: FIELDS};
    const data: any = {mimeType: "application/vnd.google-apps.folder", name: options.name, description: options.description};
    if (options.parent) {
      data.parents = [options.parent];
    }

    const res = await jwt.request({baseURL: GOOGLE_DRIVE_API, url, params, data, method: "POST"});
    const file = new File(jwt);
    Object.assign(file, res.data);
    return file;
  }

  // https://developers.google.com/drive/api/v3/reference/files/create
  public async upload(filename: string, options: IUpdateMetaOptions = {}) {
    const jwt = await this._getJWT();
    const params = {uploadType: "media", fields: FIELDS};

    // upload
    const buffer = fs.readFileSync(filename);
    const res = await jwt.request({url: GOOGLE_DRIVE_UPLOAD_API, method: "POST", params, body: buffer});

    // create file
    const file = new File(jwt);
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
    const jwt = await this._getJWT();
    const url = `/files/trash`;
    const params = {};
    const res = await jwt.request({baseURL: GOOGLE_DRIVE_API, url, method: "DELETE", params});
    return true;
  }

  private async _getJWT() {
    if (!this[jwtSymbol]) {
      this[jwtSymbol] = await this[googleAuthSymbol].getClient() as JWT;
    }

    return this[jwtSymbol];
  }
}
