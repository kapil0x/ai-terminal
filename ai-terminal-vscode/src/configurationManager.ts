import * as vscode from 'vscode';

export class ConfigurationManager {
    
    async configure(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiTerminal');
        
        // Step 1: Choose AI Service
        const serviceChoice = await vscode.window.showQuickPick([
            {
                label: '🚀 Groq',
                description: 'Fast inference, recommended for real-time suggestions',
                detail: 'Free tier available, excellent for code completion',
                service: 'groq'
            },
            {
                label: '🤖 OpenAI',
                description: 'High quality responses, slower inference',
                detail: 'GPT-3.5/GPT-4 models',
                service: 'openai'
            },
            {
                label: '⚙️ Custom API',
                description: 'Use your own AI service endpoint',
                detail: 'Compatible with OpenAI API format',
                service: 'custom'
            }
        ], {
            placeHolder: 'Choose your AI service',
            title: 'AI Terminal Configuration'
        });
        
        if (!serviceChoice) {
            return;
        }
        
        // Step 2: Configure API settings
        let apiUrl = '';
        let defaultModel = '';
        
        switch (serviceChoice.service) {
            case 'groq':
                apiUrl = 'https://api.groq.com/openai/v1';
                defaultModel = 'llama3-70b-8192';
                break;
            case 'openai':
                apiUrl = 'https://api.openai.com/v1';
                defaultModel = 'gpt-3.5-turbo';
                break;
            case 'custom':
                const customUrl = await vscode.window.showInputBox({
                    prompt: 'Enter your custom API URL',
                    placeHolder: 'https://your-api.com/v1',
                    validateInput: (value) => {
                        if (!value || !value.startsWith('http')) {
                            return 'Please enter a valid URL starting with http:// or https://';
                        }
                        return null;
                    }
                });
                
                if (!customUrl) {
                    return;
                }
                
                apiUrl = customUrl;
                defaultModel = await vscode.window.showInputBox({
                    prompt: 'Enter the model name to use',
                    placeHolder: 'gpt-3.5-turbo'
                }) || 'gpt-3.5-turbo';
                break;
        }
        
        // Step 3: Get API Key
        const apiKey = await vscode.window.showInputBox({
            prompt: `Enter your ${serviceChoice.label} API key`,
            placeHolder: 'sk-...',
            password: true,
            validateInput: (value) => {
                if (!value || value.trim().length < 10) {
                    return 'Please enter a valid API key';
                }
                return null;
            }
        });
        
        if (!apiKey) {
            return;
        }
        
        // Step 4: Configure additional settings
        const enableInline = await vscode.window.showQuickPick([
            { label: 'Yes', description: 'Show ghost text suggestions while typing', value: true },
            { label: 'No', description: 'Only show suggestions in dropdown menu', value: false }
        ], {
            placeHolder: 'Enable inline (ghost text) suggestions?'
        });
        
        const enableBackground = await vscode.window.showQuickPick([
            { label: 'Yes', description: 'Build project embeddings for better context', value: true },
            { label: 'No', description: 'Skip background analysis (faster startup)', value: false }
        ], {
            placeHolder: 'Enable background analysis?'
        });
        
        // Step 5: Save configuration
        try {
            await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
            await config.update('apiUrl', apiUrl, vscode.ConfigurationTarget.Global);
            await config.update('model', defaultModel, vscode.ConfigurationTarget.Global);
            
            if (enableInline) {
                await config.update('enableInlineSuggestions', enableInline.value, vscode.ConfigurationTarget.Workspace);
            }
            
            if (enableBackground) {
                await config.update('enableBackgroundAnalysis', enableBackground.value, vscode.ConfigurationTarget.Workspace);
            }
            
            // Step 6: Test the configuration
            const testConnection = await vscode.window.showQuickPick([
                { label: 'Yes', description: 'Verify API connection works', value: true },
                { label: 'Skip', description: 'Configure later', value: false }
            ], {
                placeHolder: 'Test API connection?'
            });
            
            if (testConnection?.value) {
                await this.testConnection(apiUrl, apiKey, defaultModel);
            }
            
            vscode.window.showInformationMessage(
                'AI Terminal configured successfully! 🎉',
                'View Settings'
            ).then(selection => {
                if (selection === 'View Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'aiTerminal');
                }
            });
            
            // Suggest rebuilding embeddings if background analysis is enabled
            if (enableBackground?.value) {
                vscode.window.showInformationMessage(
                    'Build project embeddings for better suggestions?',
                    'Build Now',
                    'Later'
                ).then(selection => {
                    if (selection === 'Build Now') {
                        vscode.commands.executeCommand('aiTerminal.rebuildEmbeddings');
                    }
                });
            }
            
        } catch (error) {
            vscode.window.showErrorMessage(`Configuration failed: ${error}`);
        }
    }
    
    private async testConnection(apiUrl: string, apiKey: string, model: string): Promise<void> {
        const progress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Testing AI Terminal connection...',
            cancellable: false
        }, async (progress) => {
            try {
                const axios = require('axios');
                
                progress.report({ increment: 50, message: 'Sending test request...' });
                
                const response = await axios.post(`${apiUrl}/chat/completions`, {
                    model: model,
                    messages: [{ role: 'user', content: 'Hello, respond with just "OK" if you can hear me.' }],
                    max_tokens: 10,
                    temperature: 0
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                
                progress.report({ increment: 50, message: 'Connection successful!' });
                
                const responseText = response.data.choices[0]?.message?.content || '';
                
                if (responseText.toLowerCase().includes('ok')) {
                    vscode.window.showInformationMessage('✅ API connection test successful!');
                } else {
                    vscode.window.showWarningMessage(`⚠️ API responded, but with unexpected message: "${responseText}"`);
                }
                
            } catch (error: any) {
                let errorMessage = 'Connection test failed';
                
                if (error.response) {
                    const status = error.response.status;
                    if (status === 401) {
                        errorMessage = 'Authentication failed - check your API key';
                    } else if (status === 429) {
                        errorMessage = 'Rate limit exceeded - API key is valid but quota reached';
                    } else if (status === 404) {
                        errorMessage = 'API endpoint not found - check your API URL';
                    } else {
                        errorMessage = `API error (${status}): ${error.response.data?.error?.message || 'Unknown error'}`;
                    }
                } else if (error.code === 'ENOTFOUND') {
                    errorMessage = 'Network error - check your internet connection and API URL';
                } else if (error.code === 'ECONNABORTED') {
                    errorMessage = 'Request timeout - API is not responding';
                } else {
                    errorMessage = `Network error: ${error.message}`;
                }
                
                vscode.window.showErrorMessage(`❌ ${errorMessage}`);
            }
        });
        
        await progress;
    }
    
    async showCurrentConfiguration(): Promise<void> {
        const config = vscode.workspace.getConfiguration('aiTerminal');
        
        const apiKey = config.get<string>('apiKey', '');
        const apiUrl = config.get<string>('apiUrl', '');
        const model = config.get<string>('model', '');
        const enableInline = config.get<boolean>('enableInlineSuggestions', true);
        const enableBackground = config.get<boolean>('enableBackgroundAnalysis', true);
        
        const maskedApiKey = apiKey ? apiKey.substring(0, 8) + '...' : 'Not configured';
        
        const info = `
**AI Terminal Configuration:**

🔑 **API Key:** ${maskedApiKey}
🌐 **API URL:** ${apiUrl || 'Not configured'}
🤖 **Model:** ${model || 'Not configured'}
💬 **Inline Suggestions:** ${enableInline ? 'Enabled' : 'Disabled'}
📊 **Background Analysis:** ${enableBackground ? 'Enabled' : 'Disabled'}
        `.trim();
        
        const action = await vscode.window.showInformationMessage(
            info,
            { modal: true },
            'Reconfigure',
            'Test Connection',
            'Open Settings'
        );
        
        switch (action) {
            case 'Reconfigure':
                await this.configure();
                break;
            case 'Test Connection':
                if (apiKey && apiUrl && model) {
                    await this.testConnection(apiUrl, apiKey, model);
                } else {
                    vscode.window.showWarningMessage('Please configure API settings first');
                }
                break;
            case 'Open Settings':
                vscode.commands.executeCommand('workbench.action.openSettings', 'aiTerminal');
                break;
        }
    }
    
    isConfigured(): boolean {
        const config = vscode.workspace.getConfiguration('aiTerminal');
        const apiKey = config.get<string>('apiKey', '');
        const apiUrl = config.get<string>('apiUrl', '');
        
        return !!(apiKey && apiUrl);
    }
    
    async promptForConfiguration(): Promise<void> {
        const configure = await vscode.window.showWarningMessage(
            'AI Terminal is not configured. Set up your API key to enable intelligent suggestions.',
            'Configure Now',
            'Later'
        );
        
        if (configure === 'Configure Now') {
            await this.configure();
        }
    }
}