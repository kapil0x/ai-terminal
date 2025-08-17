// AI Terminal VS Code Extension Demo File
// Use this file to test and demonstrate the extension capabilities

// Test 1: Basic function suggestions
function authenticateUser(email, password) {
    // Type here to test inline suggestions
    // AI Terminal should suggest authentication patterns
}

// Test 2: Class-based patterns
class UserManager {
    constructor() {
        // Test constructor suggestions
    }
    
    // Test method suggestions with architectural awareness
    async createUser(userData) {
        // Should suggest validation patterns
    }
    
    // Test error handling suggestions
    validateUser(user) {
        // Should suggest validation patterns from project
    }
}

// Test 3: API endpoint patterns
async function handleUserRegistration(req, res) {
    // Should suggest Express.js patterns if detected
    // Test error handling and response patterns
}

// Test 4: Database patterns
class UserRepository {
    async findById(id) {
        // Should suggest database query patterns
    }
    
    async save(user) {
        // Test transaction and error handling suggestions
    }
}

// Test 5: Security patterns
function hashPassword(password) {
    // Should suggest crypto patterns and security best practices
}

// Test 6: Factory pattern recognition
class AuthProviderFactory {
    static create(type) {
        // Should recognize and suggest factory pattern implementation
    }
}

// Test 7: Observer pattern
class EventEmitter {
    constructor() {
        this.listeners = {};
    }
    
    on(event, callback) {
        // Should suggest observer pattern methods
    }
}

// Test 8: Async/await patterns
async function processUserData(userData) {
    try {
        // Should suggest proper async error handling
    } catch (error) {
        // Test error handling suggestions
    }
}

// Test 9: Import suggestions
// Type: import { } from 'react'
// Should suggest common React imports based on project

// Test 10: Complex architectural suggestions
class APIGateway {
    constructor() {
        // Should suggest microservice patterns if detected
    }
    
    route(request) {
        // Test routing pattern suggestions
    }
}