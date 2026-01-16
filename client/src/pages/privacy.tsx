import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent" />
            <h2 className="text-lg font-semibold">Your Privacy Matters</h2>
          </div>

          <p className="text-sm text-muted-foreground">
            Last updated: January 2026
          </p>

          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">Data Collection</h3>
              <p className="text-muted-foreground">
                Routine Minder does not collect, store, or transmit any personal data to external servers. 
                All your habit data, routines, and settings are stored locally on your device or in the app's 
                local storage.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">No Tracking</h3>
              <p className="text-muted-foreground">
                We do not use cookies, analytics tools, or any form of tracking. Your usage patterns, 
                habits, and personal information are never monitored or analyzed by us or any third parties.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Data Storage</h3>
              <p className="text-muted-foreground">
                All data is stored in your browser's local storage or the app's memory. This means:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Your data stays on your device</li>
                <li>No data is sent to our servers</li>
                <li>You have complete control over your information</li>
                <li>Clearing browser data will delete app data</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Data Export</h3>
              <p className="text-muted-foreground">
                You can export your data at any time using the Export feature in Settings. 
                We provide CSV and JSON formats for your convenience. Exported data can be 
                saved to your preferred cloud service (Google Drive, iCloud, etc.) at your discretion.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Third-Party Services</h3>
              <p className="text-muted-foreground">
                Routine Minder does not integrate with or share data with any third-party services 
                unless you explicitly choose to export your data to external platforms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Your Rights</h3>
              <p className="text-muted-foreground">
                Since all data is stored locally and we don't collect any information, you maintain 
                full control. You can:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Export your data anytime</li>
                <li>Delete your data by clearing browser storage</li>
                <li>Use the app completely anonymously</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Contact</h3>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us through 
                the app's support channels.
              </p>
            </section>
          </div>
        </Card>
      </main>
    </div>
  );
}
