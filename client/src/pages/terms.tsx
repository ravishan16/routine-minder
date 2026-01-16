import { ArrowLeft, FileText, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen pb-20">
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold">Terms of Service</h2>
          </div>

          <p className="text-sm text-muted-foreground">
            Last updated: January 2026
          </p>

          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By using Routine Minder, you agree to these Terms of Service. If you do not agree 
                with any part of these terms, please do not use the application.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Description of Service</h3>
              <p className="text-muted-foreground">
                Routine Minder is a personal habit tracking application designed to help you 
                build and maintain daily routines. The app allows you to create routines, 
                track completions, view statistics, and export your data.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">User Responsibilities</h3>
              <p className="text-muted-foreground">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Backing up your data regularly using the export feature</li>
                <li>Maintaining the security of your device</li>
                <li>Using the application in accordance with these terms</li>
              </ul>
            </section>

            <Card className="p-4 bg-warning/10 border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-warning mb-2">Important Data Disclaimer</h3>
                  <p className="text-sm text-muted-foreground">
                    This application uses in-memory storage. Your data may be lost when the 
                    server restarts, when you clear your browser data, or due to technical issues. 
                    <strong className="text-foreground"> We are not responsible for any loss of data.</strong> 
                    Please export your data regularly to prevent data loss.
                  </p>
                </div>
              </div>
            </Card>

            <section>
              <h3 className="font-semibold mb-2">Limitation of Liability</h3>
              <p className="text-muted-foreground">
                Routine Minder is provided "as is" without any warranties, express or implied. 
                We do not guarantee that the service will be uninterrupted, error-free, or that 
                data will be preserved. To the fullest extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>We are not liable for any data loss</li>
                <li>We are not liable for service interruptions</li>
                <li>We are not liable for any indirect or consequential damages</li>
                <li>Your use of the app is at your own risk</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Data Ownership</h3>
              <p className="text-muted-foreground">
                You retain full ownership of all data you create in Routine Minder. We do not 
                claim any rights to your habits, routines, or any other content you create. 
                You are free to export, modify, or delete your data at any time.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Modifications to Service</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue the service at any time 
                without notice. We recommend exporting your data regularly to protect against 
                any changes to the service.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Changes to Terms</h3>
              <p className="text-muted-foreground">
                We may update these Terms of Service from time to time. Continued use of the 
                application after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">Contact</h3>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us 
                through the app's support channels.
              </p>
            </section>
          </div>
        </Card>
      </main>
    </div>
  );
}
