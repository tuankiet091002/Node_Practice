import fs from "fs";

export default function deleteFile(path) {
    fs.unlink(path, (err) => {
        console.log(err);
    });
}
