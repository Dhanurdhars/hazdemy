import { Link } from 'react-router-dom';
import { PageHead } from '../components/UI';
import { COMPANY } from '../data/catalog';

// Change these two lines if the privacy contact or the policy date changes.
const PRIVACY_EMAIL = COMPANY.email;
const LAST_UPDATED = 'October 2026';

const Mail = () => <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>;

export default function Privacy() {
  return (
    <>
      <PageHead crumbs={[{ label: 'Privacy & Cookie Policy' }]} title="Privacy & Cookie Policy"
        lead="How we handle personal information and cookies on this website." />
      <section className="legal"><div className="wrap legal-wrap">
        <p className="legal-date"><b>Last updated:</b> {LAST_UPDATED}</p>

        <h2>Who we are</h2>
        <p>Hazdemy Learning (“Hazdemy”, “we”, “us”) provides instructor-led technology training. This policy explains what information we collect through this website, how we use it, and the choices you have. If you have questions, contact us at <Mail />.</p>

        <h2>Information we collect</h2>
        <ul>
          <li><b>Information you give us:</b> when you use the contact form or “Ask for details” on a course, we collect your first and last name, work email, work telephone (optional), company (optional), the course you are interested in, and your message.</li>
          <li><b>Information collected automatically:</b> like most websites, our hosting provider records basic technical data such as your IP address, browser type and the pages requested. We use this to keep the site secure (for example, to stop spam and limit repeated form submissions) and to fix problems.</li>
          <li><b>Chat with our course advisor:</b> the “Haz” course advisor runs inside your browser. What you type is used to search our course catalogue on your device and is not sent to or stored on our servers. If you use the microphone button, your browser’s own speech-recognition service converts your voice to text.</li>
        </ul>

        <h2>Cookies and similar technologies</h2>
        <p>We do not use advertising or tracking cookies, and we do not use analytics tools that profile you. The site uses only the following:</p>
        <ul>
          <li><b>Browser storage (essential):</b> we use your browser’s local storage to remember your light/dark theme and catalogue view, and session storage to keep your chat with the course advisor while you browse. Session storage is cleared when you close the tab.</li>
          <li><b>Fonts:</b> our fonts are loaded from Google Fonts, which means your browser connects to Google’s servers and shares your IP address with Google. Google does not set cookies for this.</li>
        </ul>
        <p>You can clear this information at any time by clearing your browser’s site data.</p>

        <h2>How we use information</h2>
        <ul>
          <li>To respond to your enquiry, including sending course details, delivery options, availability and quotes.</li>
          <li>To operate, maintain and improve the website and our training offerings.</li>
          <li>To keep the website secure and prevent misuse.</li>
          <li>To meet legal obligations.</li>
        </ul>
        <p><b>We do not sell your personal information.</b></p>

        <h2>Sharing</h2>
        <p>We share personal information only with service providers that help us run this website, and only so they can provide those services to us:</p>
        <ul>
          <li><b>Vercel</b>: website hosting.</li>
          <li><b>Upstash</b>: secure database where enquiries are stored.</li>
          <li><b>Our email provider</b>: to deliver your enquiry to our training team and send you a confirmation.</li>
          <li><b>Google</b>: font delivery, as described above.</li>
        </ul>
        <p>We may also disclose information where required by law or to protect our rights and users.</p>

        <h2>Data retention and security</h2>
        <p>We keep enquiry information only as long as needed to respond to you and manage our relationship with you, then delete or anonymise it. Access to enquiries is restricted to authorised staff and protected by a password, and data is sent over encrypted (HTTPS) connections. No method of transmission over the internet is completely secure, but we take reasonable technical and organisational measures to protect your information.</p>

        <h2>Your rights</h2>
        <p>Depending on where you live, you may have the right to access, correct or delete your personal information, to restrict or object to how we use it, and to receive a copy of it. To make a request, email <Mail />. We will respond within the time required by applicable law.</p>

        <h2>International transfers</h2>
        <p>Our service providers may process information in countries other than your own, including the United States and India. Where this happens, we take steps to make sure your information remains protected in line with this policy and applicable law.</p>

        <h2>Children</h2>
        <p>This website is intended for professionals and businesses and is not directed to children. We do not knowingly collect personal information from children.</p>

        <h2>Changes to this policy</h2>
        <p>We may update this policy from time to time. When we do, we will change the “Last updated” date at the top of this page.</p>

        <h2>Contact</h2>
        <p>Questions about this policy or your information? Email <Mail />, write to us at {COMPANY.address}, or use our <Link to="/contact">contact page</Link>.</p>
      </div></section>
    </>
  );
}
