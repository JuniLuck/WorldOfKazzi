# Certificate-Based Authentication Setup Guide

This guide will help you set up certificate-based authentication for accessing your OneNote data without requiring user login.

## Step 1: Create an Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: `WorldOfKazzi OneNote Reader`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave empty for now
5. Click **Register**

## Step 2: Note Important IDs

After registration, copy these values to your `.env` file:
- **Application (client) ID** → `AZURE_CLIENT_ID`
- **Directory (tenant) ID** → `AZURE_TENANT_ID`

## Step 3: Generate a Certificate

### Option A: Using OpenSSL (Recommended)
```bash
# Create a private key (no password required)
openssl genrsa -out app-cert.pem 2048

# OR: Create a password-protected private key (optional, more secure)
# openssl genrsa -des3 -out app-cert.pem 2048

# Create a certificate signing request
# You'll be prompted for certificate details (country, organization, etc.)
# These are just for the certificate metadata, NOT your Microsoft password
openssl req -new -key app-cert.pem -out app-cert.csr

# Create a self-signed certificate (valid for 1 year)
openssl x509 -req -days 365 -in app-cert.csr -signkey app-cert.pem -out app-cert.crt

# Get the certificate thumbprint
openssl x509 -in app-cert.crt -fingerprint -sha1 -noout
```

### Option B: Using PowerShell (Windows)
```powershell
# Generate a self-signed certificate
$cert = New-SelfSignedCertificate -Subject "CN=WorldOfKazzi" -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable -KeySpec Signature -KeyLength 2048 -KeyAlgorithm RSA -HashAlgorithm SHA256
Export-Certificate -Cert $cert -FilePath ".\app-cert.crt"
$mypwd = ConvertTo-SecureString -String "segment-exhale-harmful-swell-rising" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath ".\app-cert.pfx" -Password $mypwd
$cert.Thumbprint
```

## ✅ **Certificate Generation Complete!**

You've successfully generated your certificate! Here's what was created:
- **Certificate**: `certificates/app-cert.crt` 
- **Private Key**: `certificates/app-cert-private.pem`
- **Thumbprint**: `AEA1FD497E482E9B1A1DC534DC7C0F430A955803`

## Step 4: Upload Certificate to Azure

1. In your App Registration, go to **Certificates & secrets**
2. Click **Certificates** tab
3. Click **Upload certificate**
4. Upload your `.crt` file
5. Copy the **Thumbprint** → `AZURE_CERTIFICATE_THUMBPRINT`

## Step 5: Configure API Permissions

1. In your App Registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Application permissions** (NOT Delegated)
5. Add these permissions:
   - `Notes.Read.All`
   - `User.Read.All` (needed to access other user's data)
6. Click **Grant admin consent** for your tenant

## Step 6: Set Up Environment Variables

Create a `.env` file in your project root:

```bash
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CERTIFICATE_PATH=./certificates/app-cert-private.pem
AZURE_CERTIFICATE_THUMBPRINT=your-certificate-thumbprint-here
ONENOTE_USER_ID=your-user-id-here
```

## Step 7: Get Your User ID

You can get your User ID in several ways:

### Option A: From Azure AD
1. Go to **Azure Active Directory** > **Users**
2. Find your user account
3. Copy the **Object ID**

### Option B: Using Graph Explorer
1. Go to [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in with your account
3. Run: `GET https://graph.microsoft.com/v1.0/me`
4. Copy the `id` field

### Option C: Using PowerShell
```powershell
# Install the Microsoft Graph PowerShell module if you haven't already
Install-Module Microsoft.Graph -Scope CurrentUser

# Connect and get your user ID
Connect-MgGraph -Scopes "User.Read"
$user = Get-MgUser -UserId "your-email@domain.com"
$user.Id
```

## Step 8: Store Your Certificate Securely

1. Create a `certificates` folder in your project root
2. Move your `app-cert.pem` file to this folder
3. Add `certificates/` to your `.gitignore` file
4. Set appropriate file permissions (read-only for your app)

## Step 9: Test the Setup

Run your application:
```bash
npm run dev
```

The app should now load your OneNote sections without requiring login!

## Important Security Notes

- **Never commit certificates to version control**
- **Use environment variables for all sensitive data**
- **Consider using Azure Key Vault for production**
- **Rotate certificates regularly (before they expire)**
- **The certificate gives full access to your OneNote data - protect it!**

## Troubleshooting

### "Invalid client_assertion" error
- Check that your certificate thumbprint matches exactly
- Ensure the certificate hasn't expired
- Verify the private key file path is correct

### "Insufficient privileges" error
- Make sure you granted admin consent for the API permissions
- Check that you're using Application permissions, not Delegated
- Verify the app has `Notes.Read.All` permission

### "User not found" error
- Double-check your `ONENOTE_USER_ID` in the `.env` file
- Make sure the user ID is the Object ID from Azure AD, not the email

## Production Considerations

For production deployment:
1. Use Azure Key Vault to store certificates
2. Set up certificate rotation automation
3. Use managed identities if deploying to Azure
4. Monitor certificate expiration dates
5. Set up proper logging and alerting
