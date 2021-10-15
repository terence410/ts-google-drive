import * as fs from "fs";
import {google} from "googleapis";
import {TsGoogleDrive} from "./src";

const tsGoogleDrive = new TsGoogleDrive({keyFilename: "serviceAccount.json"});

async function auth() {
    const drive1 = new TsGoogleDrive({keyFilename: "serviceAccount.json"});
    const drive2 = new TsGoogleDrive({credentials: {client_email: "", private_key: ""}});

    // for steps in getting access_token using oauth, you can take reference below
    // https://medium.com/@terence410/using-google-oauth-to-access-its-api-nodejs-b2678ade776f
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
    const trashedFiles = await tsGoogleDrive
        .query()
        .inTrash()
        .run();

    await tsGoogleDrive.emptyTrash();
}
