import { assert, expect } from "chai";
import {config} from "dotenv";
config();
import * as fs from "fs";
import "mocha";
import {TsGooleDrive} from "../src/TsGooleDrive";

const folderId = process.env.FOLDER_ID || "";
const keyFilename = process.env.KEY_FILENAME || "";
const clientEmail = process.env.CLIENT_EMAIL;
const privateKey = process.env.PRIVATE_KEY;
const credentials = clientEmail && privateKey ? {client_email: clientEmail, private_key: privateKey} : undefined;
const tsGoogleDrive = new TsGooleDrive({keyFilename, credentials});

describe.only("general", () => {
    it("get folder", async () => {
        const myFile = await tsGoogleDrive.getFile(folderId);
        assert.isDefined(myFile);
        if (myFile) {
            assert.isTrue(myFile.isFolder);
        }

        const newFile = await tsGoogleDrive.getFile("unknown");
        assert.isUndefined(newFile);
    });

    it("create folder", async () => {
        const newFolder = await tsGoogleDrive.createFolder({
            name: "testing",
            parent: folderId,
        });
        assert.isTrue(newFolder.isFolder);
        assert.isTrue(newFolder.parents.includes(folderId));

        // wait for a while for the folder to appear
        await new Promise(resolve => setTimeout(resolve, 3000));

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
        const newFile = await tsGoogleDrive.upload(filename, {parent: folderId});
        assert.isDefined(newFile);
        assert.isTrue(newFile.parents.includes(folderId));

        const downloadBuffer = await newFile.download();
        assert.deepEqual(buffer, downloadBuffer);
    });

    it("search folders", async () => {
      const folders = await tsGoogleDrive
        .query()
        .setFolderOnly()
        .inFolder(folderId)
        .run();
      assert.isArray(folders);

      for (const item of folders) {
          assert.isTrue(item.isFolder);
          assert.isTrue(item.parents.includes(folderId));
          await item.delete();
      }
    });

    it("search files", async () => {
        const filename = "icon.png";
        const files = await tsGoogleDrive
          .query()
          .setFileOnly()
          .inFolder(folderId)
          .setNameEqual(filename)
          .run();

        for (const item of files) {
            assert.isFalse(item.isFolder);
            assert.equal(item.name, filename);
            assert.isTrue(item.parents.includes(folderId));
            await item.delete();
        }
    });

    it("search with paging", async () => {
        const total = 10;
        const promises = Array(total).fill(0).map((x, i) => {
            return tsGoogleDrive.createFolder({parent: folderId, name: "New" + i});
        });
        await Promise.all(promises);

        // wait a while first
        await new Promise(resolve => setTimeout(resolve, 3000));

        const query = await tsGoogleDrive
            .query()
            .setFolderOnly()
            .inFolder(folderId)
            .setPageSize(4)
            .setOrderBy("name")
            .setNameContains("New");

        while (query.hasNextPage()) {
            const folders = await query.run();
            const deletePromises = folders.map(x => {
                assert.isTrue(x.parents.includes(folderId));
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
