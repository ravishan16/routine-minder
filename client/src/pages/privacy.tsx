import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 21, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Overview</h2>
            <p className="text-muted-foreground">
              Routine Minder is designed with privacy as a core principle. We collect only the minimum 
              data necessary to provide cross-device sync functionality. Your routine and habit data 
              belongs to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data We Collect</h2>
            <p className="text-muted-foreground mb-3">When you sign in with Google, we collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Google Account Email</strong> — Used to identify your account and enable sync across devices</li>
              <li><strong>Display Name</strong> — Shown in the app for personalization</li>
              <li><strong>Profile Photo URL</strong> — Displayed in settings (optional)</li>
            </ul>
            <p className="text-muted-foreground mt-3">We also store:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Routine Data</strong> — Names, categories, and preferences for your habits</li>
              <li><strong>Completion Records</strong> — Timestamps of when you complete routines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Your Data</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Sync your routines and progress across devices</li>
              <li>Display your habit tracking dashboard and statistics</li>
              <li>Maintain your account and preferences</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We do <strong>not</strong> sell, share, or use your data for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Storage</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using Cloudflare D1 (SQLite database) and is cached locally 
              on your device for offline access. Data is transmitted over encrypted HTTPS connections.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Retention & Deletion</h2>
            <p className="text-muted-foreground">
              Your data is retained as long as your account is active. You can delete all your data 
              at any time from the Settings page in the app. Upon deletion, all routines, completions, 
              and account information will be permanently removed from our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
            <p className="text-muted-foreground mb-3">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Google Sign-In</strong> — For authentication (<a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>)</li>
              <li><strong>Cloudflare</strong> — For hosting and database (<a href="https://www.cloudflare.com/privacypolicy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Cloudflare Privacy Policy</a>)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Access your data (visible in the app)</li>
              <li>Export your data (available in Settings)</li>
              <li>Delete your data (available in Settings)</li>
              <li>Revoke Google access at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              For privacy-related questions or concerns, please open an issue on our{" "}
              <a 
                href="https://github.com/ravishan16/routine-minder/issues" 
                className="text-primary hover:underline"
                target="_blank" 
                rel="noopener noreferrer"
              >
                GitHub repository
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. Changes will be posted on this page 
              with an updated revision date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
