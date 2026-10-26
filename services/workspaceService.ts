/**
 * Google Workspace REST API integrations for GoldieAI
 * Pure client-side calls utilizing the Gmail, Drive, Document, and Sheet REST API surfaces.
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

/**
 * Lists the user's latest files on Google Drive (limiting to major documents/sheets for dashboard presentation).
 */
export async function listDriveFiles(accessToken: string): Promise<GoogleDriveFile[]> {
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=12&fields=nextPageToken,files(id,name,mimeType,webViewLink)&q=trashed=false%20and%20(mimeType='application/vnd.google-apps.document'%20or%2520mimeType='application/vnd.google-apps.spreadsheet'%2520or%2520mimeType='application/pdf'%2520or%2520mimeType='text/plain'%2520or%252520mimeType='text/html')&orderBy=modifiedTime%20desc`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to list Drive files: ${response.statusText} (${errText})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Creates a file metadata slot on Google Drive first, then PATCH uploads standard media text content.
 */
export async function uploadFileToDrive(
  accessToken: string,
  filename: string,
  mimeType: string,
  content: string
): Promise<GoogleDriveFile> {
  // Step 1: Create Metadata
  const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: filename,
      mimeType: mimeType,
    }),
  });

  if (!createResponse.ok) {
    const errVal = await createResponse.text();
    throw new Error(`Failed to initialize file slot: ${createResponse.statusText} (${errVal})`);
  }

  const metaData = await createResponse.json();
  const fileId = metaData.id;

  // Step 2: Upload Raw Media Payload
  const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': mimeType,
    },
    body: content,
  });

  if (!uploadResponse.ok) {
    const errVal = await uploadResponse.text();
    throw new Error(`Failed to upload contents to Drive: ${uploadResponse.statusText} (${errVal})`);
  }

  return {
    id: fileId,
    name: filename,
    mimeType: mimeType,
    webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
  };
}

/**
 * Creates a beautiful formal document on Google Docs.
 */
export async function createGoogleDoc(
  accessToken: string,
  title: string,
  rawContent: string
): Promise<{ documentId: string; documentUrl: string }> {
  // Create first
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const errVal = await createRes.text();
    throw new Error(`Failed to create Google Doc template: ${createRes.statusText} (${errVal})`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;

  // Process a batch update request inserting the text
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text: rawContent,
            location: { index: 1 },
          },
        },
      ],
    }),
  });

  if (!updateRes.ok) {
    const errVal = await updateRes.text();
    throw new Error(`Failed to insert text into Google Doc: ${updateRes.statusText} (${errVal})`);
  }

  return {
    documentId,
    documentUrl: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

/**
 * Creates a brand new spreadsheet styled as an SEO Planner.
 */
export async function createGoogleSheetSEOPlanner(
  accessToken: string,
  title: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: {
            title: 'Think Tank Digital SEO Log',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errVal = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${createRes.statusText} (${errVal})`);
  }

  const sData = await createRes.json();
  const spreadsheetId = sData.spreadsheetId;

  // Add Row column headers
  await appendRowToGoogleSheet(
    accessToken,
    spreadsheetId,
    'Think Tank Digital SEO Log',
    [
      'Target Keyword',
      'Title Headline',
      'Meta Description',
      'Word Count',
      'Content Delivery Layout',
      'Creation Date',
      'Direct Document Hyperlink'
    ]
  );

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Appends custom list rows of SEO logs to an active Google Spreadsheet.
 */
export async function appendRowToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  values: string[]
): Promise<any> {
  const range = `${sheetName}!A1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed adding rows to Google Sheet: ${response.statusText} (${errText})`);
  }

  return await response.json();
}

/**
 * Safely constructs RFC 2822 formatting and delivers high conversion pitches through Gmail.
 */
export async function sendGmailMessage(
  accessToken: string,
  recipientEmail: string,
  subject: string,
  htmlBody: string
): Promise<{ id: string }> {
  const rfcLines = [
    `To: ${recipientEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ];

  const rawString = rfcLines.join('\r\n');
  const base64Safe = btoa(unescape(encodeURIComponent(rawString)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Safe,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail API transmission error: ${response.statusText} (${errText})`);
  }

  return await response.json();
}
