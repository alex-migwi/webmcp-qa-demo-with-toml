// user.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserService {
    private currentUser = 'Test User';

    async login(args: { user: string; pass: string }) {
        if (args?.user === 'test@example.com' && args.pass === 'ValidPass123') {
            return { success: true, token: 'abc123' };
        }
        return { error: 'Invalid credentials' };
    }

    async getprofile() {
        return { name: this.currentUser, email: 'test@example.com' };
    }

    async logout() {
        return { success: true };
    }

    // Note: deleteAccount is intentionally NOT implemented here!
    // Calling tool 'userservice_deleteaccount' will test unregistered/missing tool detection.
}