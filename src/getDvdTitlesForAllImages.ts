import {importJSONToSheet} from "./importJSONToSheet";

const vision = require('@google-cloud/vision');
const fs = require("fs");
const path = require("path");

const forbiddenWords = ["Blu-ray", "Blueray", "Bluray", "STUDIO", "DVD", "COFFRET", "studio"]
const DIRECTORY_PATH = "../ressources"


const getDvdTitlesForAllImages = async () => {
    const files = fs.readdirSync(DIRECTORY_PATH);

    // files.forEach(async (file: string) => {
    //     const filePath = path.join(DIRECTORY_PATH, file);
    //     await getDvdTitles(filePath);
    // })

    for (const file of files) {
        const filePath = path.join(DIRECTORY_PATH, file);
        await getDvdTitles(filePath);
        console.log(`finishing ${filePath}`)
    }
}

const getDvdTitles = async (filePath: string) => {
    // Creates a client
    const client = new vision.ImageAnnotatorClient({
        keyFilename: '../serviceAccount.json',
    });

    // Performs label detection on the image file
    const [result] = await client.textDetection(filePath);

    const ocrResultText = result.fullTextAnnotation.text;

    const withoutLineBreak = ocrResultText.split("\n").map((title: string) => title.replace("\n", ""))
    const withoutTitleLessThanFourChar = withoutLineBreak.filter((title: string) => title.length > 4)
    const notForbiddenWords = withoutTitleLessThanFourChar.filter((title: string) => {
        let isForbidden = false

        forbiddenWords.forEach(forbiddenWord => {
            if (title.includes(forbiddenWord)) {
                isForbidden = true
            }
        })
        return !isForbidden
    }) //?


    const resultInStirng = JSON.stringify(notForbiddenWords);

    console.log("filePath", filePath)
    const path = filePath.split("/").at(-1)?.replace(".jpg", "")
    // //todo make it in a dist dir
    fs.writeFileSync(`${path}_result.json`, resultInStirng);

    await importJSONToSheet(`${path}_result.json`)

}

getDvdTitlesForAllImages()



