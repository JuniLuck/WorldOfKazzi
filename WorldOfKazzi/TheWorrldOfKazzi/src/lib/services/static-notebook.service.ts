// Static notebook service for public access without authentication
export interface StaticPage {
    id: string;
    title: string;
    content: string;
    createdDateTime: string;
    sectionId: string;
}

export interface StaticSection {
    id: string;
    displayName: string;
    pages: StaticPage[];
}

export interface StaticNotebook {
    id: string;
    displayName: string;
    sections: StaticSection[];
}

// This would be populated with your actual notebook data
// You can export this from OneNote and paste it here, or create a script to populate it
export const STATIC_NOTEBOOK_DATA: StaticNotebook = {
    id: "0-2A982C9E458A03FE!28254",
    displayName: "DND Note",
    sections: [
        {
            id: "section-1",
            displayName: "Characters",
            pages: [
                {
                    id: "page-1",
                    title: "Character Creation Guide",
                    content: `
                        <div>
                            <h1>Character Creation Guide</h1>
                            <p>Welcome to the character creation guide for our D&D campaign!</p>
                            <h2>Step 1: Choose Your Race</h2>
                            <p>Consider the following races...</p>
                            <h2>Step 2: Choose Your Class</h2>
                            <p>Pick a class that fits your playstyle...</p>
                        </div>
                    `,
                    createdDateTime: "2024-01-01T00:00:00Z",
                    sectionId: "section-1"
                },
                {
                    id: "page-2",
                    title: "Player Characters",
                    content: `
                        <div>
                            <h1>Current Player Characters</h1>
                            <h2>Thorin - Dwarf Fighter</h2>
                            <p>A sturdy dwarf warrior with a heart of gold...</p>
                            <h2>Elara - Elf Wizard</h2>
                            <p>A scholarly elf who seeks ancient knowledge...</p>
                        </div>
                    `,
                    createdDateTime: "2024-01-02T00:00:00Z",
                    sectionId: "section-1"
                }
            ]
        },
        {
            id: "section-2",
            displayName: "Campaign Notes",
            pages: [
                {
                    id: "page-3",
                    title: "Session 1 - The Tavern Meeting",
                    content: `
                        <div>
                            <h1>Session 1 - The Tavern Meeting</h1>
                            <p><strong>Date:</strong> January 15, 2024</p>
                            <h2>What Happened</h2>
                            <p>The party met at the Prancing Pony tavern...</p>
                            <h2>Key NPCs Introduced</h2>
                            <ul>
                                <li>Barliman Butterbur - Tavern keeper</li>
                                <li>Mysterious hooded figure</li>
                            </ul>
                        </div>
                    `,
                    createdDateTime: "2024-01-15T00:00:00Z",
                    sectionId: "section-2"
                }
            ]
        },
        {
            id: "section-3",
            displayName: "World Building",
            pages: [
                {
                    id: "page-4",
                    title: "Kingdom of Aethermoor",
                    content: `
                        <div>
                            <h1>Kingdom of Aethermoor</h1>
                            <h2>Geography</h2>
                            <p>Aethermoor is a vast kingdom located in the northern reaches...</p>
                            <h2>Major Cities</h2>
                            <ul>
                                <li><strong>Silverkeep</strong> - The capital city</li>
                                <li><strong>Ironhold</strong> - Mining town in the mountains</li>
                                <li><strong>Meadowbrook</strong> - Farming community</li>
                            </ul>
                            <h2>Notable Locations</h2>
                            <p>The Whispering Woods, Ancient Ruins of Zephyr...</p>
                        </div>
                    `,
                    createdDateTime: "2024-01-10T00:00:00Z",
                    sectionId: "section-3"
                }
            ]
        }
    ]
};

export class StaticNotebookService {
    async getNotebook(): Promise<StaticNotebook> {
        // Simulate async operation
        return Promise.resolve(STATIC_NOTEBOOK_DATA);
    }

    async getSections(): Promise<StaticSection[]> {
        return Promise.resolve(STATIC_NOTEBOOK_DATA.sections);
    }

    async getSection(sectionId: string): Promise<StaticSection | null> {
        const section = STATIC_NOTEBOOK_DATA.sections.find(s => s.id === sectionId);
        return Promise.resolve(section || null);
    }

    async getPages(sectionId: string): Promise<StaticPage[]> {
        const section = await this.getSection(sectionId);
        return Promise.resolve(section?.pages || []);
    }

    async getPage(pageId: string): Promise<StaticPage | null> {
        for (const section of STATIC_NOTEBOOK_DATA.sections) {
            const page = section.pages.find(p => p.id === pageId);
            if (page) {
                return Promise.resolve(page);
            }
        }
        return Promise.resolve(null);
    }

    async getPageContent(pageId: string): Promise<string> {
        const page = await this.getPage(pageId);
        return Promise.resolve(page?.content || '');
    }
}

export const staticNotebookService = new StaticNotebookService();
