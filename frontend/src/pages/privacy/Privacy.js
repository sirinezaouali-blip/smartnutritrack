import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import styles from './Privacy.module.css';

const Privacy = () => {
  const { t } = useLanguage();

  return (
    <div className={styles.privacyContainer}>
      <div className={styles.privacyContent}>
        <h1 className={styles.title}>{t?.privacy?.title || 'Privacy Policy'}</h1>

        <div className={styles.section}>
          <h2>{t?.privacy?.lastUpdated || 'Last Updated'}</h2>
          <p>{t?.privacy?.lastUpdatedDate || 'October 12, 2025'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.introduction?.title || 'Introduction'}</h2>
          <p>{t?.privacy?.introduction?.content || 'SmartNutriTrack ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.informationWeCollect?.title || 'Information We Collect'}</h2>

          <h3>{t?.privacy?.informationWeCollect?.personalInfo?.title || 'Personal Information'}</h3>
          <ul>
            <li>{t?.privacy?.informationWeCollect?.personalInfo?.name || 'Name and contact information'}</li>
            <li>{t?.privacy?.informationWeCollect?.personalInfo?.email || 'Email address'}</li>
            <li>{t?.privacy?.informationWeCollect?.personalInfo?.health || 'Health and fitness data (age, weight, height, dietary preferences)'}</li>
            <li>{t?.privacy?.informationWeCollect?.personalInfo?.medical || 'Medical information (allergies, conditions, medications)'}</li>
          </ul>

          <h3>{t?.privacy?.informationWeCollect?.usageData?.title || 'Usage Data'}</h3>
          <ul>
            <li>{t?.privacy?.informationWeCollect?.usageData?.meals || 'Meal tracking data and nutritional information'}</li>
            <li>{t?.privacy?.informationWeCollect?.usageData?.photos || 'Food photos (for AI analysis)'}</li>
            <li>{t?.privacy?.informationWeCollect?.usageData?.device || 'Device information and app usage statistics'}</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.howWeUse?.title || 'How We Use Your Information'}</h2>
          <ul>
            <li>{t?.privacy?.howWeUse?.personalize || 'Personalize your nutrition and fitness recommendations'}</li>
            <li>{t?.privacy?.howWeUse?.track || 'Track your progress and provide analytics'}</li>
            <li>{t?.privacy?.howWeUse?.ai || 'Process food images using AI for nutritional analysis'}</li>
            <li>{t?.privacy?.howWeUse?.improve || 'Improve our services and develop new features'}</li>
            <li>{t?.privacy?.howWeUse?.communicate || 'Send you important updates and notifications'}</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.dataSharing?.title || 'Data Sharing and Disclosure'}</h2>
          <p>{t?.privacy?.dataSharing?.content || 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy:'}</p>
          <ul>
            <li>{t?.privacy?.dataSharing?.serviceProviders || 'With service providers who assist us in operating our app'}</li>
            <li>{t?.privacy?.dataSharing?.legal || 'When required by law or to protect our rights'}</li>
            <li>{t?.privacy?.dataSharing?.businessTransfer || 'In connection with a business transfer or acquisition'}</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.dataSecurity?.title || 'Data Security'}</h2>
          <p>{t?.privacy?.dataSecurity?.content || 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.yourRights?.title || 'Your Rights'}</h2>
          <ul>
            <li>{t?.privacy?.yourRights?.access || 'Access and review your personal data'}</li>
            <li>{t?.privacy?.yourRights?.correct || 'Correct inaccurate or incomplete data'}</li>
            <li>{t?.privacy?.yourRights?.delete || 'Request deletion of your data'}</li>
            <li>{t?.privacy?.yourRights?.export || 'Export your data in a portable format'}</li>
            <li>{t?.privacy?.yourRights?.optOut || 'Opt out of certain data processing activities'}</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.cookies?.title || 'Cookies and Tracking'}</h2>
          <p>{t?.privacy?.cookies?.content || 'We may use cookies and similar tracking technologies to enhance your experience with our app. You can control cookie settings through your device settings.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.children?.title || 'Children\'s Privacy'}</h2>
          <p>{t?.privacy?.children?.content || 'Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.changes?.title || 'Changes to This Policy'}</h2>
          <p>{t?.privacy?.changes?.content || 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.'}</p>
        </div>

        <div className={styles.section}>
          <h2>{t?.privacy?.contact?.title || 'Contact Us'}</h2>
          <p>{t?.privacy?.contact?.content || 'If you have any questions about this Privacy Policy, please contact us at:'}</p>
          <p className={styles.contactInfo}>
            Email: privacy@smartnutritrack.com<br />
            Address: [Your Business Address]
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
