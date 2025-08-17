# VS Code Extension Testing Guide

## 🧪 Manual Testing Protocol

### **Phase 1: Installation & Setup**

1. **Open VS Code**
   ```bash
   code .
   ```

2. **Open Extension Directory**
   - File → Open Folder → `ai-terminal-vscode`

3. **Test Extension Development**
   - Press `F5` to launch Extension Development Host
   - New VS Code window opens with extension loaded

4. **Verify Extension Activation**
   - Check Output panel for "AI Terminal" logs
   - Look for: "AI Terminal extension is now active!"

### **Phase 2: Configuration Testing**

1. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)

2. **Run Configuration Command**
   ```
   AI Terminal: Configure AI Terminal
   ```

3. **Test Configuration Flow**
   - Choose Groq (recommended)
   - Enter test API key
   - Verify connection test

4. **Check Settings**
   - File → Preferences → Settings
   - Search "AI Terminal"
   - Verify all settings appear

### **Phase 3: Core Functionality Testing**

1. **Create Test File**
   ```javascript
   // test.js
   function authenticateUser(email, password) {
     // Cursor here - test suggestions
   }
   
   class UserManager {
     // Test class suggestions
   }
   ```

2. **Test Inline Suggestions**
   - Type inside functions
   - Look for ghost text suggestions
   - Press Tab to accept

3. **Test Manual Analysis**
   - Right-click → "Analyze Current File"
   - Or use `Ctrl+Alt+A` / `Cmd+Alt+A`
   - Check Output panel for analysis

4. **Test Background Analysis**
   - Command: "Rebuild Project Embeddings"
   - Monitor progress in Output panel

### **Phase 4: Architecture Explorer Testing**

1. **Run Architecture Command**
   ```
   AI Terminal: Show Architecture Patterns
   ```

2. **Verify Webview Opens**
   - Check architecture overview panel
   - Test pattern cards interaction
   - Verify responsive design

### **Phase 5: Error Handling Testing**

1. **Test Invalid API Key**
   - Configure with fake API key
   - Verify error messages appear
   - Check graceful fallback

2. **Test Network Issues**
   - Disconnect internet
   - Verify offline capabilities
   - Test error handling

3. **Test Large Files**
   - Open very large file (1000+ lines)
   - Test performance impact
   - Verify suggestions still work

### **Phase 6: Performance Testing**

1. **Monitor Resource Usage**
   - Open Activity Monitor/Task Manager
   - Watch CPU and memory usage
   - Verify reasonable resource consumption

2. **Test Suggestion Speed**
   - Measure time from typing to suggestion
   - Should be under 1 second for most cases

3. **Test Background Processing**
   - Verify UI remains responsive during analysis
   - Check that typing isn't blocked

## 📝 Test Results Checklist

### ✅ **Basic Functionality**
- [ ] Extension loads without errors
- [ ] Configuration wizard works
- [ ] Commands appear in palette
- [ ] Settings are configurable

### ✅ **AI Integration**
- [ ] API connection successful
- [ ] Inline suggestions appear
- [ ] Manual analysis works
- [ ] Error handling graceful

### ✅ **Background Analysis**
- [ ] Embeddings build successfully
- [ ] File changes trigger updates
- [ ] Performance remains acceptable
- [ ] Progress feedback provided

### ✅ **Architecture Explorer**
- [ ] Webview opens correctly
- [ ] Patterns display properly
- [ ] Interactions work smoothly
- [ ] Visual design acceptable

### ✅ **Edge Cases**
- [ ] Invalid API keys handled
- [ ] Network errors handled
- [ ] Large files processed
- [ ] Empty projects handled

## 🐛 Common Issues & Solutions

### **Extension Not Loading**
- Check VS Code version compatibility
- Verify TypeScript compilation successful
- Check extension manifest syntax

### **No Suggestions Appearing**
- Verify API key configured
- Check internet connection
- Look for errors in Output panel

### **Slow Performance**
- Disable background analysis for large repos
- Reduce suggestion trigger delay
- Check system resources

### **Background Analysis Failing**
- Check file permissions
- Verify supported file types
- Look for memory issues

## 📊 Performance Benchmarks

### **Target Metrics**
- Extension activation: < 2 seconds
- Suggestion latency: < 1 second
- Background analysis: < 5 seconds per 100 files
- Memory usage: < 100MB additional

### **Acceptable Limits**
- Activation time: < 5 seconds
- Suggestion timeout: 10 seconds
- Memory limit: 200MB
- CPU usage: < 10% sustained

## 🚀 Next Steps After Testing

1. **Fix Critical Issues**
   - Address any crashes or errors
   - Improve performance bottlenecks
   - Polish user experience

2. **Package Extension**
   ```bash
   npx vsce package
   ```

3. **Prepare for Marketplace**
   - Create demo videos
   - Write marketplace description
   - Prepare promotional materials

4. **Beta Testing**
   - Share with select users
   - Gather feedback
   - Iterate based on real usage