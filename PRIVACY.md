# Privacy Policy

**Effective date:** 14 August 2026  
**Status:** Prototype policy requiring operator review before production deployment

## 1. Purpose and scope

The Smart Community System is an academic prototype for reporting and managing local community issues. This policy explains the information the proposed service may collect, why it is needed, and how it should be protected.

This repository does not itself operate a public reporting service. Before deployment, the organisation operating the service must identify itself, provide valid privacy contact details, confirm the laws and council policies that apply, and update this policy to reflect the implemented system.

## 2. Information the service may collect

Depending on the implemented features and a user's actions, the service may process:

- account details, such as name, email address, authentication identifiers, and role;
- report details, including category, description, location, photographs, and submission time;
- comments, status updates, assignments, and resolution feedback;
- technical and security information, such as IP address, device/browser information, authentication events, and audit logs; and
- communications sent to the service operator.

Users should not submit unnecessary sensitive information, photographs of people, identity documents, private correspondence, or information unrelated to the reported community issue.

## 3. How information is collected

Information may be collected:

- directly from users through registration, report, comment, and feedback forms;
- from authorised council staff and administrators as they manage reports;
- automatically when required for authentication, security monitoring, and reliable operation; and
- from approved integrations, if integrations are introduced and disclosed before use.

## 4. Why information is used

Information may be used to:

- create and secure user accounts;
- receive, validate, route, and resolve community issue reports;
- communicate progress and important service notices;
- prevent duplicate, fraudulent, abusive, or unsafe submissions;
- maintain an accountable history of report activity;
- investigate incidents, diagnose errors, and protect the service; and
- produce aggregated service statistics that do not identify individuals.

Personal information must not be sold or used for unrelated advertising.

## 5. Public visibility

Personal account details must not appear in public report views. Before any public map or community feed is introduced, the operator must assess whether descriptions, photographs, timestamps, or precise locations could identify a person, home, vehicle, or sensitive place. Information should be generalised, redacted, or withheld when disclosure could create a privacy or safety risk.

## 6. Disclosure and service providers

Information should be available only to users and staff who need it for an authorised function. The proposed production architecture uses Amazon Web Services, including Amazon EC2, Amazon RDS for PostgreSQL, and Amazon S3. A production operator must configure an appropriate hosting region, contractual safeguards, access controls, and cross-border disclosure notices before storing real information.

Information may also be disclosed when required by law or when reasonably necessary to address a serious and imminent safety threat. The production operator must document the authority and decision process for such disclosures.

## 7. Storage and security

The proposed safeguards include:

- HTTPS for information in transit;
- secure password hashing and token handling;
- role-based access control and least-privilege permissions;
- server-side validation and parameterised database access;
- restricted file types, sizes, and storage permissions;
- protected secrets and environment configuration;
- security logging, audit records, backups, and recovery procedures; and
- regular dependency, access, and configuration reviews.

No system can guarantee absolute security. Real personal information must not be entered into development, demonstration, or test environments.

## 8. Retention and deletion

The prototype does not yet define an operational retention schedule. Before production use, the operator must document retention periods for accounts, reports, photographs, comments, notifications, feedback, security logs, backups, and audit records. Information should be retained only as long as required for service delivery, accountability, security, or applicable law, then securely deleted or de-identified.

## 9. Access and correction

A production service must provide a private method for individuals to request access to or correction of their personal information. Requests may be limited where an applicable law permits or requires it, but the operator should explain the reason and available review process.

Do not post personal information or privacy requests in a public GitHub issue.

## 10. Cookies and analytics

The repository does not currently implement advertising or behavioural analytics. Essential authentication or security storage may be introduced as the application is developed. Any analytics, non-essential cookies, or third-party tracking must be documented here and presented to users with appropriate controls before activation.

## 11. Data incidents

Suspected privacy or security incidents should be contained, assessed, documented, and escalated promptly. A production operator must maintain a response plan and determine whether affected people, regulators, law enforcement, or other parties must be notified.

Security vulnerabilities should be reported according to [SECURITY.md](SECURITY.md), without including real personal information.

## 12. Changes to this policy

This policy must be reviewed whenever data collection, system functionality, service providers, hosting locations, legal obligations, or the operating organisation changes. Material changes should be recorded in the repository and communicated to affected users before they take effect.

## 13. Privacy contact

No production service operator or privacy contact has been appointed for this academic prototype. Deployment must not accept real user information until a responsible organisation and private contact channel are published here.

## 14. Australian privacy guidance

The production operator should assess whether the Australian Privacy Act 1988, the Australian Privacy Principles, state or territory privacy laws, records legislation, and local-government requirements apply. Useful guidance is available from the Office of the Australian Information Commissioner:

- [Australian Privacy Principles](https://www.oaic.gov.au/privacy/australian-privacy-principles)
- [Guide to developing an APP privacy policy](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/more-guidance/guide-to-developing-an-app-privacy-policy)
- [Notifiable Data Breaches scheme](https://www.oaic.gov.au/privacy/notifiable-data-breaches/about-the-notifiable-data-breaches-scheme)

This repository policy is project documentation and is not legal advice.
