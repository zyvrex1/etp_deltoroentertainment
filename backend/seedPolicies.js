require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const Policy = require("./models/policyModel");

const defaultPolicies = [
  {
    policyKey: "tos",
    title: "Terms of Service",
    content: `Welcome to eTicketsPro. By accessing or using our service, you agree to be bound by these terms.

1. Acceptance of Terms
By creating an account, buying tickets, or sponsoring events on eTicketsPro, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use the services.

2. User Accounts
You are responsible for maintaining the confidentiality of your account credentials. Any activities occurring under your account are your sole responsibility.

3. Ticket Sales and Purchases
All ticket sales are subject to availability. Pricing, fees, and event details are managed by promoters and are subject to change.

4. Intellectual Property
All content, branding, designs, and software on the platform are the property of eTicketsPro/Deltoro Entertainment and protected by copyright laws.

5. Termination
We reserve the right to suspend or terminate your account at our sole discretion for any violation of these terms.`,
  },
  {
    policyKey: "privacy",
    title: "Privacy Policy",
    content: `Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your personal information.

1. Information We Collect
We collect information you provide directly to us (e.g., name, email, phone number, payment details) when registering, purchasing tickets, or participating in sponsor events.

2. How We Use Information
We use your information to facilitate transactions, improve our services, send announcements, and communicate updates about events and policy changes.

3. Sharing of Information
We do not sell your personal data. We may share information with promoters and event coordinators to facilitate event entry, or with service providers performing functions on our behalf.

4. Data Security
We implement modern technical security measures to protect your personal data from unauthorized access, alteration, or disclosure.

5. Your Rights
You may request access to, correction of, or deletion of your personal data by contacting support.`,
  },
  {
    policyKey: "refund",
    title: "Refund Policy",
    content: `This Refund Policy outlines the terms for ticket and order refunds on eTicketsPro.

1. Promoter Refund Rules
Refund guidelines are primarily set by individual event promoters. Please check the specific event details before purchasing.

2. Canceled or Rescheduled Events
If an event is canceled entirely, buyers will receive a full refund or exchange option. If rescheduled, tickets will generally remain valid for the new date unless otherwise stated.

3. Processing Fees
Service fees and processing charges may be non-refundable depending on the circumstances of cancellation.`,
  },
  {
    policyKey: "cp",
    title: "Cookie Policy",
    content: `Our Cookie Policy explains how we use cookies and similar tracking technologies.

1. What are Cookies?
Cookies are small text files stored on your device to help analyze traffic, remember user preferences, and provide a personalized browsing experience.

2. Types of Cookies We Use
- Essential: Required for login and navigation.
- Analytics: Help us understand user interactions and improve the platform.

3. Managing Cookies
You can disable or manage cookies through your browser settings, although some features of the platform may not function properly.`,
  },
  {
    policyKey: "guidelines",
    title: "Community Guidelines",
    content: `Please review our guidelines to ensure a safe, respectful environment for everyone.

1. Respect and Integrity
Treat all users, promoters, and sponsors with respect. Harassment, abuse, or hate speech is strictly prohibited.

2. Authentic Events
Promoters must list genuine, accurate event details. Deceptive practices, fraudulent ticketing, or misleading listings will result in immediate bans.

3. Safe Space
We do not tolerate promotion of illegal activities, violence, or dangerous conduct on the platform.`,
  },
  {
    policyKey: "sponsor",
    title: "Sponsor Terms",
    content: `Special terms for event sponsors and partnerships.

1. Sponsorship Agreements
Sponsors agree to provide funding or resources as specified in the event packages. Promoters agree to fulfill advertisement slots, booth spaces, and promotional benefits.

2. Brand Assets
Sponsors grant eTicketsPro and the event promoter a non-exclusive license to display the sponsor's logo and branding for event promotion.

3. ROI and Metrics
Any engagement metrics or reports provided by the platform are for estimation and planning purposes only.`,
  },
];

const seedPolicies = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    for (const policy of defaultPolicies) {
      // Check if it already exists
      const existing = await Policy.findOne({ policyKey: policy.policyKey });
      if (!existing) {
        await Policy.create({
          ...policy,
          date: new Date(),
        });
        console.log(`Created policy: ${policy.title}`);
      } else {
        console.log(`Policy already exists: ${policy.title}`);
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding policies:", error);
    process.exit(1);
  }
};

seedPolicies();
