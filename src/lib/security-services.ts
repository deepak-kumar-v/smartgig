export async function generateTwoFactorSecret() {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
        secret: "JBSWY3DPEHPK3PXP", // Mock Base32 secret
        qrCodeUrl: "https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/SmartGIG:User?secret=JBSWY3DPEHPK3PXP&issuer=SmartGIG" // Mock QR Code (using Google Charts API for visualization simplicity or just a placeholder)
    };
}

export async function verifyTwoFactorToken(token: string) {
    await new Promise(resolve => setTimeout(resolve, 600));
    // Accept '123456' as valid for testing
    return token === '123456';
}

export async function enableTwoFactor(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
}

export async function disableTwoFactor(userId: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
}

export async function generateRecoveryCodes() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        "A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2", "M3N4-O5P6",
        "Q7R8-S9T0", "U1V2-W3X4", "Y5Z6-A7B8", "C9D0-E1F2"
    ];
}

export async function getLoginHistory() {
    return [
        { id: 1, device: "Chrome 120 on Windows 10", location: "New York, USA", ip: "192.168.1.1", time: "Just now", status: "Active" },
        { id: 2, device: "Safari on iPhone 15", location: "New York, USA", ip: "10.0.0.1", time: "2 hours ago", status: "Inactive" },
        { id: 3, device: "Firefox on MacOS", location: "Boston, USA", ip: "172.16.0.1", time: "2 days ago", status: "Inactive" },
    ];
}
