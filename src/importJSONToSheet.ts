import {google} from 'googleapis';
import {JWT} from 'google-auth-library';
import axios from "axios";
import path from "path";
// Load the service account JSON key file
const key = require('../serviceAccount.json');

const keyFilePath = path.join(__dirname, '../serviceAccount.json');

export async function importJSONToSheet(jsonPath: string) {
    console.log("jsonPath", jsonPath)
    try {
        const {default: data} = await import((`./${jsonPath}`));

        console.log("data", data)

        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({version: 'v4', auth});


        // Use the client to interact with the Google Sheets API
        const spreadsheetId = "1gLnAjJ9-e3bzOdm0q67eBT_wWfdL9HNZkllAlOLHDjE"

        // @ts-ignore
        // sheets.spreadsheets.values.update({
        //     spreadsheetId,
        //     range: range,
        //     valueInputOption: valueInputOption,
        //     resource: resource,
        // })

        const dataArray = data.map((title: string) => [title])

        const firstCallRequest = [
            {
                addSheet: {
                    properties: {
                        title: jsonPath.split('_')[0]
                    }
                }
            }]

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: firstCallRequest
            }
        })

        // Call the spreadsheets.get method
        const res = await sheets.spreadsheets.get({
            spreadsheetId,
            includeGridData: false,
        });

        const sheetsLength = res?.data?.sheets?.length
        // Get the ID of the last sheet in the spreadsheet
        // @ts-ignore
        const lastSheet = res?.data?.sheets[sheetsLength - 1];
        // @ts-ignore
        const lastSheetId = lastSheet.properties.sheetId;

        // Define the batch update request to create a new worksheet and insert data
        const secondCallRequest = [
            {
                //https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/other#GridRange
                updateCells: {
                    range: {
                        sheetId: lastSheetId,
                        startRowIndex: 1,
                        startColumnIndex: 0
                    },
                    rows: dataArray.map((row: string[]) => ({values: row.map(cell => ({userEnteredValue: {stringValue: cell}}))})),
                    // rows: data.map((title: string) => [title]),
                    fields: 'userEnteredValue'
                }
            }
        ];

// Send the batch update request to the Google Sheets API
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: secondCallRequest
            }
        })


        // // Write the data to the sheet using the Google Sheets API
        // const writeResponse = await gapi.client.sheets.spreadsheets.values.update({
        //     spreadsheetId: spreadsheetId,
        //     range: `${sheetName}!A1`,
        //     valueInputOption: "USER_ENTERED",
        //     resource: {
        //         values: rows,
        //     },
        // });

    } catch (err) {
        console.error(`Error importing JSON data to sheet: ${err}`);
    }
}
