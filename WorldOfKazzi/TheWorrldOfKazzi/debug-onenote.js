// Debug script to check what OneNote data we can access
import { azureAuthService } from './src/lib/services/azure-auth.js';
import { Client } from '@microsoft/microsoft-graph-client';

async function debugOneNote() {
    try {
        console.log('=== OneNote Debug ===');
        
        // Initialize auth
        console.log('1. Initializing auth...');
        await azureAuthService.initialize();
        
        // Get token
        console.log('2. Getting token...');
        const token = await azureAuthService.acquireTokenForGraph();
        console.log('   Token acquired:', token ? 'Yes' : 'No');
        
        // Create Graph client
        const client = Client.init({
            authProvider: (callback) => {
                callback(null, token);
            }
        });
        
        // Test basic Graph API
        console.log('3. Testing basic Graph API...');
        const me = await client.api('/me').get();
        console.log('   User:', me.displayName, `(${me.userPrincipalName})`);
        
        // Test OneNote notebooks
        console.log('4. Testing OneNote notebooks...');
        try {
            const notebooks = await client.api('/me/onenote/notebooks').get();
            console.log('   Notebooks found:', notebooks.value?.length || 0);
            
            if (notebooks.value?.length > 0) {
                console.log('   Available notebooks:');
                notebooks.value.forEach(nb => {
                    console.log(`     - ${nb.displayName} (ID: ${nb.id})`);
                });
                
                // Check if our configured notebook exists
                const targetNotebook = notebooks.value.find(nb => 
                    nb.id === '0-2A982C9E458A03FE!28254' || 
                    nb.displayName.toLowerCase().includes('dnd')
                );
                
                if (targetNotebook) {
                    console.log('   Target notebook found:', targetNotebook.displayName);
                    
                    // Test sections
                    console.log('5. Testing sections in target notebook...');
                    const sections = await client.api(`/me/onenote/notebooks/${targetNotebook.id}/sections`).get();
                    console.log('   Sections found:', sections.value?.length || 0);
                    
                    // Test pages
                    console.log('6. Testing pages in target notebook...');
                    const pages = await client.api(`/me/onenote/notebooks/${targetNotebook.id}/pages`).get();
                    console.log('   Pages found:', pages.value?.length || 0);
                    
                } else {
                    console.log('   Target notebook NOT found!');
                    console.log('   This might be why OneNote access is failing.');
                }
            }
        } catch (onenoteError) {
            console.error('   OneNote API Error:', onenoteError);
        }
        
        // Test direct sections call
        console.log('7. Testing direct sections call...');
        try {
            const allSections = await client.api('/me/onenote/sections').get();
            console.log('   All sections found:', allSections.value?.length || 0);
        } catch (sectionsError) {
            console.error('   Sections API Error:', sectionsError);
        }
        
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugOneNote();
