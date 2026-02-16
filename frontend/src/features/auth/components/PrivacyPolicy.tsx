import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
    onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-6">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
                    <p className="text-muted-foreground text-sm">Last updated: February 16, 2026</p>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none space-y-4">
                    <section>
                        <h2 className="text-xl font-semibold">1. Introduction</h2>
                        <p>
                            MooMetrics ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your farmer and livestock data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold">2. Data We Collect</h2>
                        <ul className="list-disc pl-6">
                            <li><strong>Livestock Records:</strong> Tag numbers, health status, and photos taken via the camera.</li>
                            <li><strong>Location Data:</strong> Weather information is based on your region to provide localized updates.</li>
                            <li><strong>Device Information:</strong> We use Firebase to monitor app performance and crash reports for stability.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold">3. How We Use Data</h2>
                        <p>
                            Your data is used solely to provide management insights for your farm. We do not sell or share your data with third parties for marketing purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold">4. Data Safety</h2>
                        <p>
                            All data is stored locally using IndexedDB for offline access and synced securely to our servers when an internet connection is available.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold">5. Account Deletion</h2>
                        <p>
                            You may request account deletion at any time through the Profile settings. All your farm data will be permanently removed from our servers within 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold">6. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at support@moometrics.app.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
