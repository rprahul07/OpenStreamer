import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useBranding } from '@/contexts/BrandingContext';
import Colors from '@/constants/colors';

const LAST_UPDATED = 'February 19, 2026';

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function Para({ children }: { children: React.ReactNode }) {
    return <Text style={styles.para}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{children}</Text>
        </View>
    );
}

export default function PrivacyPolicyScreen() {
    const insets = useSafeAreaInsets();
    const { branding } = useBranding();
    const appName = branding.appName || 'Academic Audio Platform';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 8 }]}>
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
                    hitSlop={12}
                >
                    <Ionicons name="chevron-back" size={22} color={Colors.dark.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: (Platform.OS === 'ios' ? insets.bottom : 0) + 40,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <View style={[styles.heroBadge, { backgroundColor: branding.accentColor + '18', borderColor: branding.accentColor + '35' }]}>
                    <Ionicons name="shield-checkmark" size={28} color={branding.accentColor} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.heroTitle, { color: branding.accentColor }]}>Your Privacy Matters</Text>
                        <Text style={styles.heroSub}>Last updated: {LAST_UPDATED}</Text>
                    </View>
                </View>

                <Para>
                    Welcome to {appName}. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services. Please read this policy carefully. If you disagree with its terms, please discontinue use of the application.
                </Para>

                <Section title="1. Information We Collect">
                    <Para>We may collect the following types of information:</Para>
                    <Bullet>
                        <Text style={styles.bulletBold}>Account Information</Text>: Name, username, email address, department, academic year, and class section provided during registration.
                    </Bullet>
                    <Bullet>
                        <Text style={styles.bulletBold}>Usage Data</Text>: Tracks played, playlists created, listening history, and in-app interactions.
                    </Bullet>
                    <Bullet>
                        <Text style={styles.bulletBold}>Device Information</Text>: Device type, operating system version, unique device identifiers, and network information.
                    </Bullet>
                    <Bullet>
                        <Text style={styles.bulletBold}>Audio Files</Text>: Files and playlists you upload or create within the application.
                    </Bullet>
                    <Bullet>
                        <Text style={styles.bulletBold}>Preferences</Text>: Your in-app settings such as audio quality, notification preferences, and branding customizations.
                    </Bullet>
                </Section>

                <Section title="2. How We Use Your Information">
                    <Para>We use the collected data to:</Para>
                    <Bullet>Provide, operate, and maintain the {appName} service</Bullet>
                    <Bullet>Personalize your experience and deliver content relevant to your academic context</Bullet>
                    <Bullet>Process and manage your account and playlists</Bullet>
                    <Bullet>Send you administrative information such as updates, security alerts, and support messages</Bullet>
                    <Bullet>Monitor and analyze usage patterns to improve functionality</Bullet>
                    <Bullet>Comply with legal obligations and institutional policies</Bullet>
                    <Bullet>Detect, prevent, and address technical issues or unauthorized activity</Bullet>
                </Section>

                <Section title="3. Data Sharing & Disclosure">
                    <Para>
                        We do not sell, trade, or rent your personal information to third parties. We may share data in the following limited circumstances:
                    </Para>
                    <Bullet>
                        <Text style={styles.bulletBold}>With your institution</Text>: Your academic institution may have access to aggregate usage statistics and content you share within class or department channels.
                    </Bullet>
                    <Bullet>
                        <Text style={styles.bulletBold}>Service providers</Text>: We may share data with trusted third-party vendors (e.g., cloud storage, analytics) who assist in operating our service, under strict confidentiality agreements.
                    </Bullet>
                    <Bullet>
                        <Text style={styles.bulletBold}>Legal requirements</Text>: We may disclose information if required by law, court order, or governmental authority.
                    </Bullet>
                    <Bullet>
                        <Text style={styles.bulletBold}>Business transfers</Text>: In the event of a merger or acquisition, user data may be transferred as part of that transaction.
                    </Bullet>
                </Section>

                <Section title="4. Data Retention">
                    <Para>
                        We retain your personal information for as long as your account is active or as needed to provide our services. Listening history and usage logs are retained for up to 12 months. You may request deletion of your account and associated data at any time by contacting support.
                    </Para>
                </Section>

                <Section title="5. Data Security">
                    <Para>
                        We implement industry-standard security measures to protect your information, including:
                    </Para>
                    <Bullet>TLS/HTTPS encryption for all data transmitted between your device and our servers</Bullet>
                    <Bullet>JSON Web Token (JWT) authentication with short expiry windows</Bullet>
                    <Bullet>Encrypted storage of sensitive credentials</Bullet>
                    <Bullet>Regular security audits and vulnerability assessments</Bullet>
                    <Para>
                        However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
                    </Para>
                </Section>

                <Section title="6. Your Rights & Choices">
                    <Para>Depending on your location, you may have the right to:</Para>
                    <Bullet>Access and obtain a copy of your personal data</Bullet>
                    <Bullet>Correct inaccurate or incomplete information</Bullet>
                    <Bullet>Request deletion of your account and personal data</Bullet>
                    <Bullet>Opt out of certain data collection (e.g., analytics) via the Privacy & Security settings</Bullet>
                    <Bullet>Withdraw consent for non-essential data processing at any time</Bullet>
                    <Para>
                        To exercise these rights, please contact us via the support email listed in the About section.
                    </Para>
                </Section>

                <Section title="7. Notifications">
                    <Para>
                        We may send push notifications related to your playlists, new content shared in your class or department, and system updates. You can manage notification preferences at any time from the Settings → Notifications screen, or through your device's system notification settings.
                    </Para>
                </Section>

                <Section title="8. Children's Privacy">
                    <Para>
                        {appName} is designed for use by enrolled students and faculty at partnered academic institutions. Users must be at least 13 years of age (or the applicable minimum age in their jurisdiction) to create an account. We do not knowingly collect personal information from children under 13.
                    </Para>
                </Section>

                <Section title="9. Third-Party Services">
                    <Para>
                        Our application may use third-party services that collect information used to identify you. These include:
                    </Para>
                    <Bullet>Amazon Web Services (S3) for file storage</Bullet>
                    <Bullet>Supabase for database and authentication services</Bullet>
                    <Bullet>Expo platform services for push notifications and app delivery</Bullet>
                    <Para>
                        Each of these services has its own Privacy Policy governing the use of collected data. We encourage you to review their respective policies.
                    </Para>
                </Section>

                <Section title="10. Changes to This Policy">
                    <Para>
                        We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date at the top of this document and, where appropriate, sending an in-app notification. Your continued use of the application after any changes constitutes your acceptance of the revised policy.
                    </Para>
                </Section>

                <Section title="11. Contact Us">
                    <Para>
                        If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:
                    </Para>
                    <View style={[styles.contactCard, { borderColor: branding.accentColor + '30' }]}>
                        <View style={styles.contactRow}>
                            <Ionicons name="mail-outline" size={16} color={branding.accentColor} />
                            <Text style={styles.contactText}>{branding.contactEmail || 'support@academicaudio.edu'}</Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Ionicons name="business-outline" size={16} color={branding.accentColor} />
                            <Text style={styles.contactText}>{appName} Support Team</Text>
                        </View>
                        <View style={styles.contactRow}>
                            <Ionicons name="location-outline" size={16} color={branding.accentColor} />
                            <Text style={styles.contactText}>Academic Institution, India</Text>
                        </View>
                    </View>
                </Section>

                <View style={styles.footer}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={Colors.dark.textMuted} />
                    <Text style={styles.footerText}>
                        © {new Date().getFullYear()} {appName}. All rights reserved.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.dark.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.dark.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 18,
        color: Colors.dark.text,
    },
    scroll: {
        flex: 1,
    },

    // Hero
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 14,
        padding: 16,
        marginTop: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    heroTitle: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 16,
        marginBottom: 2,
    },
    heroSub: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        color: Colors.dark.textMuted,
    },

    // Sections
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 15,
        color: Colors.dark.text,
        marginBottom: 10,
    },
    para: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 13.5,
        color: Colors.dark.textSecondary,
        lineHeight: 22,
        marginBottom: 10,
    },

    // Bullets
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 8,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.dark.textMuted,
        marginTop: 8,
        flexShrink: 0,
    },
    bulletText: {
        flex: 1,
        fontFamily: 'Poppins_400Regular',
        fontSize: 13.5,
        color: Colors.dark.textSecondary,
        lineHeight: 22,
    },
    bulletBold: {
        fontFamily: 'Poppins_600SemiBold',
        color: Colors.dark.text,
    },

    // Contact card
    contactCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    contactText: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 13,
        color: Colors.dark.text,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 24,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: Colors.dark.border,
        marginTop: 8,
    },
    footerText: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        color: Colors.dark.textMuted,
    },
});
