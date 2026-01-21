import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 21, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Routine Minder, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Description of Service</h2>
            <p className="text-muted-foreground">
              Routine Minder is a free, open-source habit tracking application that helps users 
              track daily routines and build better habits. The service includes web and progressive 
              web app (PWA) interfaces with optional cross-device synchronization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">User Accounts</h2>
            <p className="text-muted-foreground">
              To use cross-device sync features, you must sign in with a Google account. You are 
              responsible for maintaining the security of your Google account credentials. You agree 
              to provide accurate information and to update it as necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
            <p className="text-muted-foreground mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Upload malicious content or code</li>
              <li>Abuse the service in ways that degrade performance for other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">User Content</h2>
            <p className="text-muted-foreground">
              You retain ownership of all content you create within the app (routine names, notes, etc.). 
              By using the service, you grant us a limited license to store and sync your content solely 
              for the purpose of providing the service to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Open Source</h2>
            <p className="text-muted-foreground">
              Routine Minder is open-source software licensed under the MIT License. The source code 
              is available at{" "}
              <a 
                href="https://github.com/ravishan16/routine-minder" 
                className="text-primary hover:underline"
                target="_blank" 
                rel="noopener noreferrer"
              >
                github.com/ravishan16/routine-minder
              </a>. 
              You are free to fork, modify, and self-host the application according to the license terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Service Availability</h2>
            <p className="text-muted-foreground">
              We strive to maintain high availability but do not guarantee uninterrupted access to the 
              service. The app is designed to work offline, so your local data remains accessible even 
              when the sync service is unavailable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
              WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, SECURE, OR UNINTERRUPTED. 
              USE OF THE SERVICE IS AT YOUR OWN RISK.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF 
              THE SERVICE, INCLUDING BUT NOT LIMITED TO LOSS OF DATA OR PROFITS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Termination</h2>
            <p className="text-muted-foreground">
              You may stop using the service at any time. We reserve the right to suspend or terminate 
              access for users who violate these terms. Upon termination, your right to use the service 
              ceases, but you may export your data beforehand.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these terms at any time. Continued use of the service after changes 
              constitutes acceptance of the new terms. Material changes will be noted with an updated 
              revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, please open an issue on our{" "}
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
        </div>
      </div>
    </div>
  );
}
