import {GoogleAuth, JWT} from "google-auth-library";
import {File} from "./File";
import {FIELDS, GOOGLE_DRIVE_API} from "./TsGooleDrive";

const googleAuthSymbol = Symbol("googleAuth");
const jwtSymbol = Symbol("jwt");
type IOperator = "=" | ">" | ">=" | "<" | "<=";
type orderByKey = "createdTime" |
    "folder" |
    "modifiedByMeTime" |
    "modifiedTime" |
    "name" |
    "name_natural" |
    "quotaBytesUsed" |
    "recency" |
    "sharedWithMeTime" |
    "starred" |
    "viewedByMeTime";

// https://developers.google.com/drive/api/v3/reference/files/list
// https://developers.google.com/drive/api/v3/search-files
export class Query {
  public queries: string[] = [];
  public pageSize: number = 100;
  public orderBy: string[] = [];

  private nextPageToken?: string;
  private [googleAuthSymbol]: GoogleAuth;
  private [jwtSymbol]: JWT;

  constructor(googleAuth: GoogleAuth) {
    this[googleAuthSymbol] = googleAuth;
  }

  public hasNextPage() {
    return this.nextPageToken === undefined || !!this.nextPageToken;
  }

  public setPageSize(value: number) {
    this.pageSize = value;
    return this;
  }

  public setOrderBy(value: orderByKey | orderByKey[]) {
    if (Array.isArray(value)) {
        this.orderBy = this.orderBy.concat(value);
    } else {
      this.orderBy.push(value);
    }

    return this;
  }

  public setFolderOnly() {
    this.queries.push("mimeType='application/vnd.google-apps.folder'");
    return this;
  }

  public setFileOnly() {
    this.queries.push("mimeType!='application/vnd.google-apps.folder'");
    return this;
  }

  public setFullTextContains(name: string) {
    this.queries.push(`fullText contains '${name}'`);
    return this;
  }

  public setNameContains(name: string) {
    this.queries.push(`name contains '${name}'`);
    return this;
  }

  public setNameEqual(name: string) {
    this.queries.push(`name = '${name}'`);
    return this;
  }

  public setModifiedTime(operator: IOperator, date: Date) {
    this.queries.push(`modifiedTime ${operator} '${date.toISOString()}'`);
    return this;
  }

  public setQuery(query: string) {
    this.queries.push(query);
    return this;
  }

  public inFolder(folderId: string) {
    this.queries.push(`'${folderId}' in parents`);
    return this;
  }

  public inTrash() {
    this.queries.push(`trashed = true`);
    return this;
  }

  public async runOnce() {
    this.setPageSize(1);
    const list = await this.run();
    return list.length ? list[0] : undefined;
  }

  public async run() {
    // if the next page token is ""
    if (this.nextPageToken === "") {
      throw new Error("The query has no more next page.");
    }

    const jwt = await this._getJwt();
    const url = `/files`;
    const params = {
      q: this.queries.join(" and "), 
      spaces: "drive", 
      pageSize: this.pageSize, 
      pageToken: this.nextPageToken,
      fields: `kind,nextPageToken,incompleteSearch,files(${FIELDS})`,
      orderBy: this.orderBy.join(","),
    };

    const res = await jwt.request({baseURL: GOOGLE_DRIVE_API, url, params});
    const result = res.data as any;

    // update next page token, we must at least mark it into empty
    this.nextPageToken = result.nextPageToken || "";

    // convert to files
    const list: File[] = [];
    if (result.files && Array.isArray(result.files)) {
      for (const item of result.files) {
        const file = new File(jwt);
        Object.assign(file, item);
        list.push(file);
      }
    }

    return list;
  }

  private async _getJwt() {
    if (!this[jwtSymbol]) {
      this[jwtSymbol] = await this[googleAuthSymbol].getClient() as JWT;
    }

    return this[jwtSymbol];
  }
}
