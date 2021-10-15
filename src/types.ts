import {Credentials, GoogleAuthOptions, OAuth2ClientOptions} from "google-auth-library";

export const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";
export const GOOGLE_DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
export const FILE_FIELDS = "id,kind,name,mimeType,parents,modifiedTime,createdTime,size";

export type ITsGoogleDriveOptions = GoogleAuthOptions | {oAuthCredentials: Credentials, oauthClientOptions?: OAuth2ClientOptions};

export type IUpdateMetaOptions = {
    name?: string;
    parent?: string;
    description?: string;
};

export type ICreateFolderOptions = {
    name?: string;
    parent?: string;
    description?: string;
};

type ISearchFileOptions = {
    folderOnly?: boolean;
    fileOnly?: boolean;
    nameContains?: string;
    query?: string;
    inParents?: string | number;
};
