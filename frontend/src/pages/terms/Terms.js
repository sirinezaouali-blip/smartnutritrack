import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './Terms.module.css';

const Terms = () => {
  const { t } = useLanguage();

  return (
    <div className={styles.termsContainer}>
      <div className={styles.termsContent}>
        <h1 className={styles.title}>{t?.terms?.title || 'Terms of Service'}</h1>

        <div className={styles.section}>
          <h2>{t?.terms?.lastUpdated || 'Last Updated'}</h2>
          <p>{t?.terms?.lastUpdatedDate || 'October 12, 2025'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.acceptance?.title || 'Acceptance of Terms'}</h2>
          <p>{t?.terms?.acceptance?.content || 'By accessing and using SmartNutriTrack, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.description?.title || 'Service Description'}</h2>
          <p>{t?.terms?.description?.content || 'SmartNutriTrack is a mobile application that provides nutrition tracking, meal planning, and health analytics services. Our AI-powered features help users make informed decisions about their diet and wellness.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.userAccounts?.title || 'User Accounts'}</h2>
          <h3>{t?.terms?.userAccounts?.registration?.title || 'Account Registration'}</h3>
          <p>{t?.terms?.userAccounts?.registration?.content || 'To use our services, you must register for an account. You agree to provide accurate, current, and complete information and to update this information as necessary.'}</p>

          <h3>{t?.terms?.userAccounts?.responsibility?.title || 'Account Responsibility'}</h3>
          <p>{t?.terms?.userAccounts?.responsibility?.content || 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.acceptableUse?.title || 'Acceptable Use'}</h2>
          <p>{t?.terms?.acceptableUse?.intro || 'You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:'}</p>
          <ul>
            <li>{t?.terms?.acceptableUse?.items?.misuse || 'Use the service in any way that violates applicable laws or regulations'}</li>
            <li>{t?.terms?.acceptableUse?.items?.impersonate || 'Impersonate any person or entity or misrepresent your affiliation'}</li>
            <li>{t?.terms?.acceptableUse?.items?.interfere || 'Interfere with or disrupt the service or servers'}</li>
            <li>{t?.terms?.acceptableUse?.items?.harmful || 'Upload or transmit harmful, offensive, or inappropriate content'}</li>
            <li>{t?.terms?.acceptableUse?.items?.reverse || 'Attempt to reverse engineer, decompile, or disassemble the application'}</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.healthDisclaimer?.title || 'Health Disclaimer'}</h2>
          <div className={styles.disclaimer}>
            <p><strong>{t?.terms?.healthDisclaimer?.important || 'IMPORTANT:'}</strong> {t?.terms?.healthDisclaimer?.content || 'The information provided by SmartNutriTrack is for informational purposes only and is not intended as medical advice. Always consult with qualified healthcare providers for medical advice, diagnosis, or treatment.'}</p>
          </div>
          <p>{t?.terms?.healthDisclaimer?.additional || 'We are not responsible for any health outcomes resulting from the use of our service. Users should exercise their own judgment and consult professionals for personalized health advice.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.aiFeatures?.title || 'AI Features and Limitations'}</h2>
          <p>{t?.terms?.aiFeatures?.content || 'Our AI-powered features, including food recognition and nutritional analysis, are designed to assist users but may not always be 100% accurate. Users should verify information independently and use their judgment when making dietary decisions.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.privacy?.title || 'Privacy and Data'}</h2>
          <p>{t?.terms?.privacy?.content || 'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices regarding the collection and use of your personal information.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.intellectualProperty?.title || 'Intellectual Property'}</h2>
          <p>{t?.terms?.intellectualProperty?.content || 'The service and its original content, features, and functionality are and will remain the exclusive property of SmartNutriTrack and its licensors. The service is protected by copyright, trademark, and other laws.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.termination?.title || 'Termination'}</h2>
          <p>{t?.terms?.termination?.content || 'We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including breach of these Terms.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.disclaimer?.title || 'Disclaimer of Warranties'}</h2>
          <p>{t?.terms?.disclaimer?.content || 'The service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations or warranties of any kind, express or implied, as to the operation of the service or the information, content, or materials included therein.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.limitation?.title || 'Limitation of Liability'}</h2>
          <p>{t?.terms?.limitation?.content || 'In no event shall SmartNutriTrack be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.governingLaw?.title || 'Governing Law'}</h2>
          <p>{t?.terms?.governingLaw?.content || 'These Terms shall be interpreted and governed by the laws of [Your Jurisdiction], without regard to its conflict of law provisions.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.changes?.title || 'Changes to Terms'}</h2>
          <p>{t?.terms?.changes?.content || 'We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.terms?.contact?.title || 'Contact Information'}</h2>
          <p>{t?.terms?.contact?.content || 'If you have any questions about these Terms of Service, please contact us at:'}</p>
          <p className={styles.contactInfo}>
            Email: legal@smartnutritrack.com<br />
            Address: [Your Business Address]
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
