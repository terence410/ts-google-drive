import {Buffer} from "buffer";
import {config} from "dotenv";
config();

import { assert, expect } from "chai";
import * as fs from "fs";
import "mocha";
import {TsGoogleDrive} from "../src/TsGoogleDrive";
import {google} from "googleapis";

const folderId = process.env.FOLDER_ID || "";
const keyFilename = process.env.KEY_FILENAME || "";
const clientEmail = process.env.CLIENT_EMAIL;
const privateKey = process.env.PRIVATE_KEY;
const accessToken = process.env.ACCESS_TOKEN;
const credentials = clientEmail && privateKey ? {client_email: clientEmail, private_key: privateKey} : undefined;
const tsGoogleDrive = new TsGoogleDrive({keyFilename, credentials});
let testFolderId = "";

const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Testing", () => {
    // create test folder
    before(async () => {
        const newFolder = await tsGoogleDrive.createFolder({
            name: "testing",
            parent: folderId,
        });
        assert.isTrue(newFolder.isFolder);
        assert.isTrue(newFolder.parents.includes(folderId));

        // assign into testFolderId for further testing
        testFolderId = newFolder.id;

        // wait for a while for the folder to be able to be searched
        await timeout(3000);
    });

    // remove test folder
    after(async () => {
        const testFolder = await tsGoogleDrive.getFile(testFolderId);
        if (testFolder) {
            await testFolder.delete();
        }
    });

    it("get folder", async () => {
        const testFolder = await tsGoogleDrive.getFile(testFolderId);
        assert.isDefined(testFolder);
        if (testFolder) {
            assert.isTrue(testFolder.isFolder);
        }

        const newFile = await tsGoogleDrive.getFile("unknown");
        assert.isUndefined(newFile);
    });

    it("create folder", async () => {
        const newFolder = await tsGoogleDrive.createFolder({
            name: "testing",
            parent: testFolderId,
        });
        assert.isTrue(newFolder.isFolder);
        assert.isTrue(newFolder.parents.includes(testFolderId));

        // wait for a while for the folder to appear
        await timeout(3000);

        // try to search for it
        const foundFolder1 = await tsGoogleDrive
            .query()
            .setFolderOnly()
            .setModifiedTime("=", newFolder.modifiedAt)
            .runOnce();
        assert.isDefined(foundFolder1);

        // try to search for it
        const foundFolder2 = await tsGoogleDrive
            .query()
            .setFolderOnly()
            .setModifiedTime(">", newFolder.modifiedAt)
            .runOnce();
        assert.isUndefined(foundFolder2);
    });

    it("upload file", async () => {
        const filename = "./icon.png";
        const buffer = fs.readFileSync(filename);
        const newFile = await tsGoogleDrive.upload(filename, {parent: testFolderId});
        assert.isDefined(newFile);
        assert.isTrue(newFile.parents.includes(testFolderId));

        const downloadBuffer = await newFile.download();
        assert.deepEqual(buffer, downloadBuffer);
    });

    it("download with stream", async () => {
        const filename = "./icon.png";
        const buffer = fs.readFileSync(filename);
        const newFile = await tsGoogleDrive.upload(filename, {parent: testFolderId});
        assert.isDefined(newFile);
        assert.isTrue(newFile.parents.includes(testFolderId));

        // download by stream
        const drive = google.drive({version: "v3", auth: newFile.client});
        const file = await drive.files.get({
            fileId: newFile.id,
            alt: 'media'
        }, {responseType: "stream"});

        let downloadBuffer = Buffer.alloc(0);
        file.data.on("data", data => {
            downloadBuffer = Buffer.concat([downloadBuffer, data]);
        });
        // wait for it to be completed
        await new Promise(resolve => file.data.on("end", resolve));

        // check if they are the same
        assert.deepEqual(buffer, downloadBuffer);
    });

    it("search folders", async () => {
      const folders = await tsGoogleDrive
        .query()
        .setFolderOnly()
        .inFolder(testFolderId)
        .run();
      assert.isArray(folders);

      for (const item of folders) {
          assert.isTrue(item.isFolder);
          assert.isTrue(item.parents.includes(testFolderId));
          await item.delete();
      }
    });

    it("search files", async () => {
        const filename = "icon.png";
        const files = await tsGoogleDrive
          .query()
          .setFileOnly()
          .inFolder(testFolderId)
          .setNameEqual(filename)
          .run();

        for (const item of files) {
            assert.isFalse(item.isFolder);
            assert.equal(item.name, filename);
            assert.isTrue(item.parents.includes(testFolderId));
            await item.delete();
        }
    });

    it("search with paging", async () => {
        const total = 5;
        const promises = Array(total).fill(0).map((x, i) => {
            return tsGoogleDrive.createFolder({parent: testFolderId, name: "New" + i});
        });
        await Promise.all(promises);

        // wait a while first
        await timeout(3000);

        const query = await tsGoogleDrive
            .query()
            .setFolderOnly()
            .inFolder(testFolderId)
            .setPageSize(4)
            .setOrderBy("name")
            .setNameContains("New");

        while (query.hasNextPage()) {
            const folders = await query.run();
            const deletePromises = folders.map(x => {
                assert.isTrue(x.parents.includes(testFolderId));
                return x.delete();
            });
            await Promise.all(deletePromises);
        }
    });

    it("empty trash", async () => {
        const trashedFiles = await tsGoogleDrive
            .query()
            .inTrash()
            .run();

        await tsGoogleDrive.emptyTrash();
    });
});
