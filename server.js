import dotenv from "dotenv";
import http from "http";
import { Client } from "@notionhq/client";

dotenv.config();

// The dotenv library will read from your .env file into these values on `process.env`
const notionDatabaseId = process.env.NOTION_DB_ID;
const notionSecret = process.env.NOTION_API_KEY;

// Will provide an error to users who forget to create the .env file
// with their Notion data in it
if (!notionDatabaseId || !notionSecret) {
  throw Error("Must define NOTION_SECRET and NOTION_DATABASE_ID in env");
}

// Initializing the Notion client with your secret
const notion = new Client({
  auth: notionSecret,
});

const host = "localhost";
const port = 8000;

// Require an async function here to support await with the DB query
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  switch (req.url) {
    case "/":
      // Query the database and wait for the result
      const query = await notion.databases.query({
        database_id: notionDatabaseId,
      });

      // We map over the complex shape of the results and return a nice clean array of
      // objects in the shape of our `ThingToLearn` interface
      //   const list = query.results.map((row) => {
      //     // row represents a row in our database and the name of the column is the
      //     // way to reference the data in that column
      //     const labelCell = row.properties.label;
      //     const urlCell = row.properties.url;

      //     // Depending on the column "type" we selected in Notion there will be different
      //     // data available to us (URL vs Date vs text for example) so in order for Typescript
      //     // to safely infer we have to check the `type` value.  We had one text and one url column.
      //     const isLabel = labelCell.type === "rich_text";
      //     const isUrl = urlCell.type === "url";

      //     // Verify the types are correct
      //     if (isLabel && isUrl) {
      //       // Pull the string values of the cells off the column data
      //       const label = labelCell.rich_text?.[0].plain_text;
      //       const url = urlCell.url ?? "";

      //       // Return it in our `ThingToLearn` shape
      //       return { label, url };
      //     }

      //     // If a row is found that does not match the rules we checked it will still return in the
      //     // the expected shape but with a NOT_FOUND label
      //     return { label: "NOT_FOUND", url: "" };
      //   });

      const modified = query.results.map((row) => {
        let desc = row.properties.description.rich_text[0].plain_text;
        let title = row.properties.title.title[0].plain_text;
        let image = row.properties.image.files[0].file.url;

        return {
          description: desc,
          title,
          image,
        };
      });

      res.setHeader("Content-Type", "application/json");
      res.writeHead(200);
      res.end(JSON.stringify(modified));
      break;

    default:
      res.setHeader("Content-Type", "application/json");
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Resource not found" }));
  }
});

server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
