import {Credentials, GoogleAuthOptions, OAuth2ClientOptions} from "google-auth-library";

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
