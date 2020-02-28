import * as fs from "fs";
import {TsGooleDrive} from "./src";

const tsGoogleDrive = new TsGooleDrive({keyFilename: "serviceAccount.json"});

async function getSingleFile() {
    const fileId = "";
    const file = await tsGoogleDrive.getFile(fileId);
    const isFolder = file.isFolder;
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

async function uploadFile() {
    const folderId = "";
    const filename = "./icon.png";
    const buffer = fs.readFileSync(filename);
    const newFile = await tsGoogleDrive.upload(filename, {parent: folderId});
    const downloadBuffer = await newFile.download();
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
