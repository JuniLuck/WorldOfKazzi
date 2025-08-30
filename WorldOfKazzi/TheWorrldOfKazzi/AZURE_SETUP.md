# Azure OneNote Setup Guide
This guide will walk you through setting up Azure AD and connecting your OneNote notebooks to your Svelte application.

## Step 1: Azure AD Application Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory"
3. Click on "App registrations" in the left menu
4. Click "New registration"
   - Name: "WorldOfKazzi OneNote Wiki"
   - Supported account types: "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts"
   - Redirect URI: Add "Web" and enter "http://localhost:5173"
5. Click "Register"

After registration, note down:
- Application (client) ID
- Directory (tenant) ID

## Step 2: Configure API Permissions

1. In your app registration:
2. Click "API permissions" in the left menu
3. Click "Add a permission"
4. Choose "Microsoft Graph"
5. Select "Delegated permissions" (not Application permissions)
6. Add these permissions:
   - Notes.Read
   - Notes.Read.All
   - User.Read
7. Click "Add permissions"

Note: For personal accounts, we'll use delegated permissions instead of application permissions, which means the app will access OneNote with your personal account's permissions.

## Step 3: Create Client Secret

1. In your app registration:
2. Click "Certificates & secrets" in the left menu
3. Under "Client secrets", click "New client secret"
   - Description: "OneNote Wiki Access"
   - Expiration: Choose your preferred duration (24 months recommended)
4. Click "Add"
5. IMPORTANT: Copy the secret value immediately and save it securely
   (You won't be able to see it again!)

## Step 4: Get Your User ID

1. In Azure Portal:
2. Go to "Azure Active Directory"
3. Click "Users" in the left menu
4. Find your account
5. Copy your "Object ID" (This is your User ID)

## Step 5: Update Environment Variables

Update your `.env` file with:

```
VITE_AZURE_CLIENT_ID=your_client_id_here
VITE_AZURE_TENANT_ID=your_tenant_id_here
VITE_AZURE_CLIENT_SECRET=your_client_secret_here
VITE_USER_ID=your_user_id_here
```

## Step 6: Test Connection

1. Start your application:
   ```bash
   npm run dev
   ```

2. Check if notebooks are loading in the sidebar
3. Try opening a notebook section
4. Try viewing a page

## Troubleshooting

If you encounter errors:

1. Check permissions in Azure AD:
   - Ensure admin consent is granted
   - Verify all required permissions are added

2. Verify environment variables:
   - All values are correctly copied
   - No extra spaces or quotes
   - File is in the correct location

3. Check OneNote access:
   - Confirm you can access the notebooks in OneNote web app
   - Ensure notebooks are not personal notebooks (must be in OneDrive for Business)

Need help? Let me know at which step you encounter issues!
