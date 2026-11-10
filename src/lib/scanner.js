// Barcode scanning, Android app only. Uses Google's code scanner through ML
// Kit: Play Services shows its own camera screen and hands back what it read,
// so the app never needs the camera permission. Loaded on demand, so the
// website never downloads the plugin.
import { isAndroidApp } from "./platform.js";

export const canScan = isAndroidApp;

// Thrown when Play Services is still downloading the scanner. It starts the
// download itself; trying again a moment later works.
export class ScannerNotReady extends Error {}

// The barcode read, or null if the scan was cancelled.
export async function scanBarcode() {
  const { BarcodeScanner, BarcodeFormat } = await import("@capacitor-mlkit/barcode-scanning");
  const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    throw new ScannerNotReady("Scanner is downloading");
  }
  try {
    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE],
    });
    return barcodes[0]?.rawValue ?? null;
  } catch (error) {
    if (/cancel/i.test(String(error?.message ?? error))) return null;
    throw error;
  }
}
