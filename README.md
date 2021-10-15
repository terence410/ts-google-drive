# Google Drive API Library #

[![NPM version][npm-image]][npm-url]
[![Test][github-action-image]][github-action-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]

[npm-image]: https://img.shields.io/npm/v/ts-google-drive.svg
[npm-url]: https://npmjs.org/package/ts-google-drive
[github-action-image]: https://github.com/terence410/ts-google-drive/workflows/Testing/badge.svg
[github-action-url]: https://github.com/terence410/ts-google-drive/actions
[codecov-image]: https://img.shields.io/codecov/c/github/terence410/ts-google-drive.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/terence410/ts-google-drive
[david-image]: https://img.shields.io/david/terence410/ts-google-drive.svg?style=flat-square
[david-url]: https://david-dm.org/terence410/ts-google-drive

Manage Google Drive easily. Support create folders, upload files, download files, searching, etc..
The library is build with [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk).

# Features

- Create Folders
- Upload Files
- Download Files (as Buffer)
- Powerful file query tools
- Empty Trash

# Usage
```typescript
import {TsGooleDrive} from "ts-google-drive";
import {google} from "googleapis";
const tsGoogleDrive = new TsGooleDrive({keyFilename: "serviceAccount.json"});

async function auth() {
  const drive1 = new TsGoogleDrive({keyFilename: "serviceAccount.json"});
  const drive2 = new TsGoogleDrive({credentials: {client_email: "", private_key: ""}});

  // https://www.npmjs.com/package/google-auth-library
  const drive3 = new TsGoogleDrive({oAuthCredentials: {access_token: ""}});
  const drive4 = new TsGoogleDrive({oAuthCredentials: {refresh_token: ""}, oauthClientOptions: {clientId: "", clientSecret: ""}});
}

async function getSingleFile() {
    const fileId = "";
    const file = await tsGoogleDrive.getFile(fileId);
    if (file) {
        const isFolder = file.isFolder;
    } 
}

async function listFolders() {
    const folderId = "";
    const folders = await tsGoogleDrive
        .query()
        .setFolderOnly()
        .inFolder(folderId)
        .run();
}

async function createFolder() {
    const folderId = "";
    const newFolder = await tsGoogleDrive.createFolder({
        name: "testing",
        parent: folderId,
    });

    // try to search for it again
    const foundFolder = await tsGoogleDrive
        .query()
        .setFolderOnly()
        .setModifiedTime("=", newFolder.modifiedAt)
        .runOnce();
}

async function uploadAndDownload() {
  const folderId = "";
  const filename = "./icon.png";
  const newFile = await tsGoogleDrive.upload(filename, {parent: folderId});
  const downloadBuffer = await newFile.download();

  // you have to use "googleapis" package
  // of if you want stream
  const drive = google.drive({version: "v3", auth: newFile.client});
  const file = await drive.files.get({
    fileId: newFile.id,
    alt: 'media'
  }, {responseType: "stream"});

  file.data.on("data", data => {
    // stream data
  });
  file.data.on("end", () => {
    // stream end
  });

  // or use pipe
  const writeStream = fs.createWriteStream('./output.png');
  file.data.pipe(writeStream);
}

async function search() {
    const folderId = "";
    const query = await tsGoogleDrive
        .query()
        .setFolderOnly()
        .inFolder(folderId)
        .setPageSize(3)
        .setOrderBy("name")
        .setNameContains("New");
    
    // or you can use any query https://developers.google.com/drive/api/v3/search-files
    query.setQuery("name = 'hello'");

    while (query.hasNextPage()) {
        const folders = await query.run();
        for (const folder of folders) {
            await folder.delete();
        }
    }
}

async function emptyTrash() {
    await tsGoogleDrive.emptyTrash();
}
```

# Using Service Account

- Create a Google Cloud Project
- [Create Service Account](https://console.cloud.google.com/iam-admin/serviceaccounts/create)
    - Service account details > Choose any service account name > CREATE
    - Grant this service account access to project > CONTINUE
    - Grant users access to this service account ( > CREATE KEY
    - Save the key file into your project
- Enable Drive API
    -  [APIs and Services](https://console.cloud.google.com/apis/dashboard) > Enable APIS AND SERVICES 
    - Search Google Drive API > Enable
- To access shared folder 
    - Open the JSON key file, you will find an email xxx@xxx.iam.gserviceaccount.com. 
    - Go to your Google Drive Folder and shared the edit permission to the email address.
- Create using serviceAccount.json
```typescript
const drive1 = new TsGoogleDrive({keyFilename: "serviceAccount.json"});
```
- Create using client_email and private_key (which is available inside the services account JSON)
```typescript
const drive2 = new TsGoogleDrive({credentials: {client_email: "", private_key: ""}});
```

# Using OAuth
- You can take reference on below link how to grab an oauth access token
- https://medium.com/@terence410/using-google-oauth-to-access-its-api-nodejs-b2678ade776f
```typescript
const drive3 = new TsGoogleDrive({oAuthCredentials: {access_token: ""}});
const drive4 = new TsGoogleDrive({oAuthCredentials: {refresh_token: ""}, oauthClientOptions: {clientId: "", clientSecret: ""}});
```

# Links
- https://www.npmjs.com/package/googleapis
- https://www.npmjs.com/package/google-auth-library
- https://developers.google.com/drive
