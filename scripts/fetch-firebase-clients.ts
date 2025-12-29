/* 
  List documents from a Firestore collection using the public REST API.
  Defaults to the 'clients' collection for project 'jrv-manager'.
  Usage:
    - npx ts-node scripts/fetch-firebase-clients.ts
    - npx ts-node scripts/fetch-firebase-clients.ts <collectionName>
    - FIREBASE_COLLECTION=<name> npx ts-node scripts/fetch-firebase-clients.ts
*/

const FIREBASE_PROJECT_ID = "jrv-manager";

function getCollectionNameFromArgs(): string {
  const argCollection = process.argv[2];
  const envCollection = process.env.FIREBASE_COLLECTION;
  return (argCollection || envCollection || "clients").trim();
}

async function fetchAllDocumentsFromCollection(collectionName: string): Promise<any[]> {
  const encodedCollectionName = encodeURIComponent(collectionName);
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${encodedCollectionName}`;

  const collectedDocuments: any[] = [];
  let pageToken: string | undefined = undefined;

  // Firestore REST supports pagination via nextPageToken
  // Loop until all documents are fetched or an error occurs
  // We keep the code simple and readable rather than clever
  // because clarity matters for maintenance and debugging.
  while (true) {
    const url: string = pageToken ? `${baseUrl}?pageToken=${encodeURIComponent(pageToken)}` : baseUrl;

    const response: any = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await safeReadText(response);
      throw new Error(`Firestore REST error ${response.status} ${response.statusText}: ${errorText}`);
    }

    const data: any = await response.json();
    const documents = Array.isArray(data.documents) ? data.documents : [];
    collectedDocuments.push(...documents);

    if (typeof data.nextPageToken === "string" && data.nextPageToken.length > 0) {
      pageToken = data.nextPageToken;
    } else {
      break;
    }
  }

  return collectedDocuments;
}

async function safeReadText(response: any): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "<no response body>";
  }
}

function summarizeDocument(document: any): { id: string; fieldNames: string[] } {
  const fullResourceName: string = typeof document?.name === "string" ? document.name : "";
  const id = fullResourceName.split("/").pop() || "<unknown-id>";
  const fieldsObject = document?.fields && typeof document.fields === "object" ? document.fields : {};
  const fieldNames = Object.keys(fieldsObject);
  return { id, fieldNames };
}

async function main(): Promise<void> {
  const collectionName = getCollectionNameFromArgs();
  console.log(`Querying Firestore collection '${collectionName}' in project '${FIREBASE_PROJECT_ID}'...`);

  try {
    const documents = await fetchAllDocumentsFromCollection(collectionName);
    console.log(`Found ${documents.length} document(s).`);
    for (const doc of documents) {
      const summary = summarizeDocument(doc);
      const fieldList = summary.fieldNames.length > 0 ? ` (fields: ${summary.fieldNames.join(", ")})` : "";
      console.log(`- ${summary.id}${fieldList}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch Firestore documents:", message);
    console.error(
      "Hints:\n" +
        "- Ensure the collection exists (default: 'clients').\n" +
        "- Firestore security rules must allow public read if no auth is provided.\n" +
        "- If reads require authentication, we will need credentials or a token."
    );
    process.exit(1);
  }
}

// Run
void main();


