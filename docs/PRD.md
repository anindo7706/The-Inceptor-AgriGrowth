# AgriGrowth — Product Requirements Document

> Converted from `AgriGrowth_PRD_Updated_Logistics.docx` (v1.0, MVP Development). This markdown is the
> canonical PRD for development — always read it here, not from the `.docx`.
> Two blocks (§29A and §30) appeared in reverse paragraph order in the source document and have been
> restored to logical reading order. No wording was changed.

**Version:** 1.0 · **Status:** MVP Development

**Technology Direction:** Next.js + TypeScript + Backend APIs + Database + AI Services


## 1. Product Vision

AgriGrowth is a digital agricultural contract platform that connects:

- Buyers / Companies
- Landowners
- Farmers / Agricultural Workers
- Platform Administrators

The platform helps buyers secure agricultural production, landowners utilize available land, workers receive farming jobs, and administrators manage contracts, verification, payments, and risks.

The core workflow is:

```text
Buyer creates crop demand
  ↓
Platform calculates suitable land requirements
  ↓
Available landowners receive relevant contract opportunities
  ↓
Landowner accepts a contract
  ↓
Contract becomes active
  ↓
Crop timeline and farming tasks are generated
  ↓
Required workers are notified when their work stage arrives
  ↓
Workers perform tasks
  ↓
GPS + photo evidence is submitted
  ↓
Weather and AI systems analyze conditions
  ↓
Buyer monitors production
  ↓
Admin monitors risks and disputes
  ↓
Payments are distributed after verification
```

## 2. Problem Statement

Agricultural supply chains often have several disconnected participants.

Buyers need reliable crop production but may not directly control farms.

Landowners may have available agricultural land but lack guaranteed buyers.

Farmers and agricultural workers may struggle to find organized, predictable work.

Crop production monitoring is often manual and difficult to verify.

The platform solves this by creating a connected digital ecosystem for agricultural contracts, land allocation, workforce management, crop monitoring, evidence verification, and payment tracking.

## 3. User Roles

The platform will have four primary roles.

### 3.1 Buyer

The buyer may be:

- Food company
- Agricultural company
- Retailer
- Processing company
- Exporter
- Large agricultural purchaser

The buyer creates crop demand and contracts land through the platform.

### 3.2 Landowner

The landowner owns or manages agricultural land.

The landowner can:

- Register land
- Mark land as available
- View relevant crop contract offers
- Accept or reject offers
- Monitor crop progress
- Coordinate workers
- Receive contract-related payments

### 3.3 Farmer / Agricultural Worker

Workers perform agricultural jobs such as:

- Land preparation
- Planting
- Fertilizer application
- Irrigation
- Pest treatment
- Harvesting
- Post-harvest work

Workers receive jobs according to crop stage and workforce requirements.

### 3.4 Admin

The platform administrator manages:

- Crop definitions
- Crop timelines
- Contract rules
- Financial ranges
- Commission
- Worker requirement rules
- AI alerts
- Disputes
- Verification
- Platform monitoring

## 4. Complete Platform Workflow

The complete workflow should be:

```text
Buyer
  ↓
Select category
  ↓
Select crop
  ↓
Enter quantity required
  ↓
Select production location on map
  ↓
System identifies suitable and available land
  ↓
Buyer selects one or multiple land parcels
  ↓
Buyer submits contract request and proposed amount
  ↓
Admin/platform validates the request
  ↓
Relevant landowners receive the contract opportunity
  ↓
Landowner accepts or declines
  ↓
Contract becomes active
  ↓
Crop plan and timeline are generated
  ↓
Worker requirements are calculated by crop stage
  ↓
Workers receive job notifications when required
  ↓
Workers perform tasks
  ↓
GPS and photo evidence are submitted
  ↓
AI and rule-based systems analyze evidence and progress
  ↓
Buyer, landowner and admin receive relevant updates
  ↓
Crop progresses through stages
  ↓
Harvest is completed
  ↓
Final verification occurs
  ↓
Payments and commission are processed
  ↓
Contract is completed
```

## 5. Buyer Workflow

After login, the buyer should see a dashboard containing:

- Active contracts
- Pending contracts
- Total contracted production
- Estimated production
- At-risk contracts
- Upcoming milestones
- Payment status
- Notifications

The buyer should be able to create a new crop demand.

Workflow:

```text
Choose Category
  ↓
Choose Crop
  ↓
Enter Required Quantity
  ↓
Select Production Location
  ↓
View Available Land on Map
  ↓
Select One or Multiple Land Parcels
  ↓
Enter Contract Financial Proposal
  ↓
Submit Contract Request
```

## 6. Crop Category and Selection System

The buyer first selects a category.

Examples:

- Grains / Crops
- Vegetables
- Fruits
- Flowers
- Commercial Crops

After selecting a category, relevant crops should be displayed.

Example:

Grains:

- Paddy
- Wheat
- Maize

Vegetables:

- Potato
- Tomato
- Onion

Fruits:

- Mango
- Banana

The crop list must be managed by the backend and admin, not hardcoded permanently in the frontend.

## 7. Quantity and Land Requirement Calculation

The buyer enters the required crop quantity.

Example:

- Required quantity: 100 tonnes of paddy

The system should estimate how much land is required.

The calculation may use:

- Expected crop yield
- Region
- Soil suitability
- Historical productivity
- Crop type
- Safety buffer

Example:

- Required Production / Expected Yield per Acre
- Estimated Required Land Area

This should initially use configurable rule-based estimates.

Later, AI or predictive models can improve the estimate.

## 8. Map-Based Land Selection

After entering crop requirements, the buyer sees a map.

The map should display:

- Available land parcels
- Approximate location
- Land area
- Crop suitability
- Availability status
- Optional land score

The buyer can select:

- One land parcel
- Multiple land parcels

The selected land should collectively help satisfy the required production quantity.

The system should prevent selection of land that is:

- Already under an active contract
- Unavailable
- Incompatible with the crop
- Restricted by admin rules

## 9. Land Suitability Scoring

Each land parcel may receive a suitability score.

Example:

- Suitability Score = 0 to 100

Factors may include:

- Soil information
- Crop compatibility
- Climate
- Water availability
- Historical crop information
- Geographic region

For the MVP, this can initially be rule-based.

Example:

Suitable crop region: +30 Suitable soil: +25 Adequate water availability: +20 Good historical performance: +15 Other factors: +10

The score should not be presented as a scientifically guaranteed prediction unless validated data is available.

## 10. Contract Offer System

The buyer does not directly negotiate with the landowner.

The buyer submits a contract request to the platform.

The platform defines financial rules.

Example:

Admin-approved range:

- ₹5,00,000 to ₹5,50,000

The buyer selects or proposes an amount within the allowed range.

The platform then sends relevant contract offers to landowners.

Landowners can:

- Accept
- Decline

For the MVP, there should not be open-ended negotiation between buyers and landowners.

This simplifies contract management.

## 11. Financial Allocation

The total buyer contract amount should be divided logically.

Example:

```text
Buyer Contract Amount
  ↓
Platform Commission
  ↓
Landowner Allocation
  ↓
Worker Budget
  ↓
Operational / Service Allocation if applicable
```

Example:

- Total Contract Value = ₹10,00,000
- Platform Commission = configurable

Remaining amount is allocated according to contract rules.

The exact payment structure must be configurable by the admin.

The system must not hardcode financial percentages directly into frontend components.

## 12. Landowner Registration and Land Management

The landowner should register:

- Name
- Contact information
- Location
- Land size
- Land coordinates
- Availability
- Optional soil information
- Optional irrigation information

A land parcel should have statuses such as:

- AVAILABLE
- RESERVED
- UNDER_CONTRACT
- UNAVAILABLE

The landowner dashboard should display:

- Available land
- Contract offers
- Active contracts
- Crop progress
- Upcoming tasks
- Worker requirements
- Weather alerts
- Payments

## 13. Landowner Contract Workflow

After login:

```text
Landowner Dashboard
  ↓
View Available Land
  ↓
Receive Relevant Crop Contract Offers
  ↓
Open Contract Details
  ↓
Review Crop
  ↓
Review Duration
  ↓
Review Land Requirement
  ↓
Review Financial Information
  ↓
Accept or Decline
```

If accepted:

- Contract Status = ACTIVE

The selected land becomes unavailable for conflicting contracts.

## 14. Contract Fulfillment

A contract should not become active until the required conditions are satisfied.

Possible contract statuses:

- DRAFT
- SUBMITTED
- UNDER_REVIEW
- OFFERED
- PARTIALLY_ACCEPTED
- ACTIVE
- AT_RISK
- COMPLETED
- CANCELLED
- DISPUTED

For contracts involving multiple land parcels, the system should track:

- Required production
- Land accepted
- Estimated production capacity
- Remaining production requirement

The contract may remain partially fulfilled until sufficient land is accepted.

## 15. Crop Plan System

Each crop should have a configurable crop plan.

A crop plan contains:

- Crop name
- Expected duration
- Growth stages
- Required activities
- Evidence requirements
- Worker requirements
- Notification rules

Example stages:

- Preparation
- Planting
- Early Growth
- Vegetative Growth
- Reproductive / Flowering
- Maturity
- Harvest

The timeline must be crop-specific.

Different crops must not use the same fixed schedule.

## 16. Adaptive Crop Timeline

Each crop has a different duration.

Example:

Paddy may have one timeline.

Wheat may have another.

Tomato may have another.

Therefore, tasks must be generated based on:

Crop + Planting Date + Crop Stage Rules + Weather Conditions + Actual Progress

The system should not simply say:

Day 5 → same task for every crop.

Instead:

```text
Crop Plan
  ↓
Planting Date
  ↓
Generate Initial Milestones
  ↓
Monitor Actual Conditions
  ↓
Adjust Future Tasks if Required
```

## 17. Task and Milestone System

A contract should generate milestones.

Each milestone can contain:

- Title
- Description
- Crop stage
- Planned start date
- Planned end date
- Priority
- Required workers
- Evidence requirements
- Status

Example:

```text
Planting
  ↓
Upload evidence

```text
Fertilizer application
  ↓
Upload evidence if required

```text
Irrigation
  ↓
Can be automatically reviewed against weather

```text
Harvest
  ↓
GPS + evidence + completion verification
```

Task statuses:

- PENDING
- UPCOMING
- ACTIVE
- COMPLETED
- SKIPPED
- DELAYED
- UNDER_REVIEW

## 18. Weather-Based Decision Logic

Weather must affect agricultural task recommendations.

Example:

A scheduled irrigation task exists.

The weather system detects heavy rainfall.

The system should not blindly ask the worker to irrigate.

Instead:

```text
Task: Irrigation
  ↓
Check Recent Rainfall
  ↓
Check Forecast
  ↓
Check Crop Stage
  ↓
Decision
```

Possible decisions:

- PROCEED
- SKIP
- DELAY
- REVIEW

Example:

```text
Heavy rainfall detected
  ↓
Irrigation unnecessary
  ↓
Task marked SKIPPED or DELAYED
  ↓
Landowner receives explanation
```

The weather system should assist decisions, not automatically make unsafe agricultural decisions without configurable rules.

## 19. Farmer / Worker Workforce Model

Workers are not necessarily required every day.

Different crop stages require different workforce levels.

Example:

Paddy:

- Preparation Stage: High worker requirement
- Planting Stage: High worker requirement
- Growing Stage: Low worker requirement
- Harvest Stage: High worker requirement

Therefore, the system must calculate workers by:

- Crop + Stage + Land Area + Task Type + Configured Productivity Rules

## 20. Workforce Requirement Calculation

Example formula:

- Required Workers = Land Area × Worker Factor × Task Factor

Example:

- 5 acres × 4 workers per acre for planting
- 20 workers

This must be configurable by the admin.

The system should support different rules for:

- Planting
- Fertilization
- Irrigation
- Pest treatment
- Harvesting

The workforce requirement should not be permanently hardcoded.

## 21. Initial Worker Recruitment

When a contract becomes active, the system should calculate whether workers are immediately required.

If workers are required:

```text
Contract Activated
  ↓
Determine Current Crop Stage
  ↓
Calculate Worker Requirement
  ↓
Find Eligible Workers
  ↓
Send Notifications
  ↓
Workers Accept or Decline
  ↓
Fill Required Positions
```

Workers may be selected based on:

- Location
- Availability
- Skill
- Previous performance
- Job type

For the MVP, location and availability are sufficient.

## 22. Farmer Job Acceptance

Workers should see:

- Job title
- Crop
- Location
- Date
- Estimated duration
- Payment information
- Landowner information after acceptance if appropriate

Worker actions:

- ACCEPT
- DECLINE

The backend must prevent:

- Double booking
- Over-assignment
- Accepting already filled jobs

## 23. Contact Sharing

After the required contract and job conditions are satisfied:

The system may share:

Landowner contact information with the assigned worker.

Worker contact information with the landowner.

Contact information should only be shared after:

- Worker assignment
- Job acceptance
- Relevant privacy and platform rules

## 24. Growing Stage Workforce

During crop growth, workers may not be continuously required.

The system should generate jobs only when needed.

Example:

```text
Fertilizer required
  ↓
Create Job

```text
Irrigation required
  ↓
Create Job

```text
Disease treatment required
  ↓
Create Job

```text
Harvest begins
  ↓
Create Larger Workforce Requirement
```

This reduces unnecessary worker notifications.

## 25. Work Verification

A worker should not simply press:

- "Task Completed"

Verification should include configurable evidence.

Possible evidence:

- GPS check-in
- GPS check-out
- Timestamp
- Photo
- Optional AI analysis
- Landowner confirmation
- Admin review for exceptions

Task:

```text
Worker assigned
  ↓
GPS Check-in
  ↓
Perform Work
  ↓
Upload Evidence
  ↓
Submit Completion
  ↓
System Verification
  ↓
Completed / Review Required
```

## 26. GPS Verification

GPS verification should use browser or mobile device geolocation.

The application can request:

- navigator.geolocation

The backend should receive:

- Latitude
- Longitude
- Timestamp
- Accuracy

The system compares worker coordinates with the contract land coordinates.

Example:

Distance between worker and farm:

- Within allowed radius: PASS
- Outside allowed radius: FLAG

Example statuses:

- VERIFIED
- TOO_FAR
- LOW_ACCURACY
- LOCATION_DENIED
- REVIEW_REQUIRED

GPS verification must not be treated as perfect proof because location accuracy can vary.

## 27. Evidence Photo Submission

Workers or landowners may submit photos for milestones.

Examples:

- Planting evidence
- Crop growth
- Fertilizer application
- Disease symptoms
- Harvest completion

Each uploaded image should be linked to:

- Contract
- Land parcel
- Milestone
- Task
- User
- Timestamp
- Optional location data

Images should be stored using a proper storage service, not directly inside the database.

The database should store the image URL and metadata.

## 28. AI Crop Image Analysis

AI should analyze submitted crop images.

The initial AI workflow:

```text
Image Uploaded
  ↓
Image Validation
  ↓
AI Service
  ↓
Analysis Result
  ↓
Confidence Score
  ↓
Potential Issue Detection
  ↓
Store Result
  ↓
Generate Alert if Required
```

Possible analysis:

- Crop health indication
- Disease possibility
- Pest symptoms
- Growth stage indication
- Image quality check

AI results must include confidence and should not be treated as guaranteed agricultural diagnosis.

## 29. AI Confidence and Review Logic

Example:

```text
Confidence ≥ 85%
  ↓
High-confidence result

```text
Confidence 60% to 84%
  ↓
Show result but mark as moderate confidence

```text
Confidence below 60%
  ↓
Request additional evidence or manual review
```

Example statuses:

- NORMAL
- WARNING
- HIGH_RISK
- REVIEW_REQUIRED

Admin or authorized users should be able to review important AI alerts.

## 29A. Field Inspection and Anti-Fraud Verification

GPS and AI photo verification alone are not sufficient to establish that submitted crop evidence actually represents the contracted field and crop. A farmer or worker could intentionally submit photographs of healthy crops from another part of the same field while infected crops are avoided, or submit crops brought from a different field in order to bypass crop-health verification, geolocation checks, or the platform's risk index.

To address these risks, the platform must include physical field inspection by an authorized inspector appointed by AgriGrowth. The inspector provides an independent ground-level verification layer and creates a local employment opportunity through inspection jobs.

### 29A.1 Inspector Appointment and Inspection Jobs

Each required field inspection should create a unique inspection job assigned to an authorized inspector. Every inspection must have a unique Job ID and remain linked to the relevant Contract, Land Parcel, crop, milestone or verification event, inspector, scheduled inspection date, inspection status, submitted evidence, findings, and final decision.

Inspectors should be authorized by AgriGrowth and should only be able to access inspection jobs assigned to them or otherwise authorized by the platform. The platform should maintain an auditable record of inspector assignment, acceptance, inspection activity, submission, review, and final outcome.

### 29A.2 Physical Field Verification

The inspector must physically visit the contracted land parcel and verify that the crop being produced is actually present on the contracted field. The inspection should verify, as applicable:

- The physical field corresponds to the registered land parcel.
- The crop is actually planted and growing on the contracted field.
- The observed crop and growth stage are consistent with the contract and submitted evidence.
- Crop health conditions observed on the ground are reasonably consistent with submitted photographs and AI results.
- The submitted evidence is not being collected only from a healthy portion of the field while materially different conditions exist elsewhere.
- The crop has not been brought from another field and presented as evidence for the contracted field.
- The inspected field boundaries and location are consistent with the registered land coordinates and parcel information.

### 29A.3 Anti-Fraud Evidence

An inspection record should contain, where applicable:

- Unique inspection Job ID
- Contract ID
- Land Parcel ID
- Inspector ID
- Inspection timestamp
- Inspector GPS coordinates
- GPS accuracy
- Field inspection photographs and/or video evidence
- Observed crop and growth stage
- Observed health or disease condition
- Inspector findings
- Verification status
- Reason for any rejection or fraud flag
- Inspector submission timestamp
- Review and audit history

### 29A.4 Healthy-Crop Photo Bypass Prevention

If a farmer submits photographs showing healthy crops while the actual contracted crop contains disease, pests, severe damage, or other material risk, AI image analysis should not be treated as sufficient proof of field-wide crop health. The platform should be able to trigger a physical inspection when evidence is inconsistent, risk increases, repeated evidence appears unusually similar, image coverage is insufficient, or other anti-fraud rules are triggered.

The inspector should inspect representative areas of the field rather than relying only on a single crop sample or a single photograph. Where practical, inspection evidence should cover multiple areas of the contracted parcel so that a healthy section cannot be used to conceal materially different conditions elsewhere.

### 29A.5 Cross-Field Crop Substitution Prevention

GPS verification confirms the location of the device at the time of submission, but GPS alone does not prove that the crop shown in a photograph originated from that field. Therefore, where required by the contract, risk rules, or inspection policy, the inspector must verify the crop physically at the registered field and confirm that the crop observed is being grown on that land.

The platform should flag suspicious cases such as evidence submitted from inconsistent locations, evidence inconsistent with the crop timeline, abrupt unexplained changes in crop condition, or inspection findings that do not match submitted evidence. A physical inspection should resolve such cases before the evidence is treated as fully verified.

### 29A.6 Inspection Outcomes

Possible inspection outcomes should include:

- VERIFIED
- VERIFIED_WITH_OBSERVATIONS
- REINSPECTION_REQUIRED
- EVIDENCE_MISMATCH
- HIGH_RISK
- SUSPECTED_FRAUD
- FAILED

An inspection failure or suspected fraud finding should be linked to the relevant contract and audit record and may trigger manual review, additional inspection, risk-index adjustment, payment hold, dispute handling, or other configurable platform actions.

### 29A.7 Risk Index Protection

The contract risk index must not be calculated solely from farmer-submitted photographs or AI image results when physical verification is required. Verified field inspection findings should be treated as a higher-trust evidence layer. A farmer should not be able to maintain or improve their risk index by selectively submitting healthy crop photographs while concealing infected areas or substituting crops from another field.

### 29A.8 Inspection Audit Trail

Every inspection must produce an immutable audit trail containing the inspection Job ID, assigned inspector, timestamps, location evidence, submitted inspection evidence, findings, verification outcome, and any subsequent administrative decision. Changes to inspection results should themselves be recorded in the audit log rather than silently overwriting the original inspection record.

### 29A.9 Relationship with AI and GPS Verification

Field inspection does not replace GPS or AI verification. It adds a physical verification layer when digital evidence alone cannot reliably establish the truth of the crop condition or crop origin. The intended verification model is therefore: GPS evidence + photo evidence + AI analysis + configurable rules + physical inspector verification when required.

## 30. Rural Hub-and-Spoke Logistics

The platform should support a realistic rural logistics model that does not assume large trucks can directly reach every farmer's field. The logistics system should use a two-stage collection model: local last-mile collection from farms to a village collection center, followed by bulk transport from the collection center to a regional warehouse, buyer, or processing unit.

Core logistics workflow:

Buyer Contract → Farmer Harvest → Local Last-Mile Collection → Village Collection Center → Physical Weighing + Quality/Quantity Recording → Aggregation of Produce → Bulk Transport → Regional Warehouse / Buyer / Processing Unit → Delivery Confirmation → Payment / Settlement

Rural hub-and-spoke model:

```text
Farm B1 ──┐

```text
Farm B2 ──┼──→ Village Collection Center ──→ Truck ──→ Warehouse / Buyer

```text
Farm B3 ──┘
```

Local transport such as tractors, small pickups, or other suitable local vehicles should handle Farm → Collection Center movement. Larger trucks can then handle Collection Center → Warehouse / Buyer movement after produce from multiple nearby farms has been aggregated.

Example: Farmer A → 2 tonnes, Farmer B → 3 tonnes, Farmer C → 3 tonnes → Village Collection Center → 8 tonnes aggregated → One bulk truck → Warehouse.

This model is useful because large trucks may not be able to access remote village farms, local vehicles can handle farm-to-center movement, multiple farmers' produce can be aggregated, and bulk transport can reduce unnecessary truck trips. Collection centers can also support physical weighing and verification and provide a traceable movement path from farm → collection center → warehouse → buyer.

The platform can select a suitable nearby collection center using the farmer's registered field coordinates and the collection-center location. The logistics layer should connect with the existing architecture as: Contract → Crop Production → Harvest → Collection Center → Verification → Aggregation → Transport → Warehouse/Buyer → Payment.

Proposed / future implementation: detailed transporter assignment, collection-center database, route optimization, GPS tracking, real-time fleet optimization, and automated logistics should be treated as future implementation unless explicitly implemented. The MVP should not claim these capabilities as already available.

## 31. Production Forecasting

The platform may estimate expected production.

Inputs may include:

- Land area
- Crop type
- Historical yield estimates
- Crop health signals
- Weather conditions
- Growth progress

For MVP:

Use rule-based estimation.

Later:

Use machine learning or predictive models.

The system must clearly distinguish:

Estimated production from Guaranteed production.

## 32. AI and Smart Logic Strategy

The MVP should not attempt to train large machine learning models from scratch.

Use a layered approach.

- Layer 1: Rule-Based Logic

Used for:

- Crop timelines
- Worker requirements
- Task generation
- Weather decisions
- Suitability scoring
- Basic risk scoring
- Layer 2: External AI / ML APIs

Used for:

- Crop image analysis
- Disease identification
- Image classification
- Layer 3: Predictive Models

Future implementation:

- Yield prediction
- Disease risk prediction
- Production forecasting

The system should function even when advanced AI is unavailable.

## 33. System Architecture

Recommended architecture:

```text
Frontend Next.js
  ↓
Application API Layer
  ↓
Business Logic
  ↓
Database + External APIs + AI Services + Weather Services + Map / Geolocation Services + Image Storage
```

The frontend should not directly contain secret API keys.

All sensitive API calls should be handled securely through the backend.

## 34. Backend API Architecture

Use organized API routes or server-side actions.

Recommended structure:

src/ app/ api/ auth/ users/ crops/ lands/ contracts/ tasks/ evidence/ workforce/ weather/ ai/ payments/ notifications/

Each API should:

- Validate input
- Authenticate the user
- Check authorization
- Execute business logic
- Return structured responses
- Handle errors safely

## 35. Authentication APIs

Required capabilities:

- Register
- Login
- Logout
- Session management
- Role management

Example role protection:

Buyer cannot access admin-only APIs.

Worker cannot modify buyer contracts.

Landowner cannot access another landowner's private contracts.

Authentication must eventually replace the current hardcoded demo OTP logic.

## 36. Crop and Category APIs

Example endpoints:

- GET /api/categories
- GET /api/categories/{id}/crops
- GET /api/crops
- GET /api/crops/{id}

Admin endpoints:

- POST /api/crops
- PATCH /api/crops/{id}
- DELETE /api/crops/{id}

Crop data should include:

- Name
- Category
- Duration
- Expected yield
- Timeline
- Workforce rules

## 37. Land APIs

Required operations:

- POST /api/lands
- GET /api/lands
- GET /api/lands/{id}
- PATCH /api/lands/{id}
- DELETE /api/lands/{id}

Additional capabilities:

- GET /api/lands/available
- GET /api/lands/search

Land data should include:

- Owner
- Coordinates
- Area
- Status
- Availability
- Suitability information

## 38. Buyer Demand APIs

Required operations:

- POST /api/demands
- GET /api/demands
- GET /api/demands/{id}
- PATCH /api/demands/{id}

A demand contains:

- Buyer
- Crop
- Quantity
- Location
- Required production
- Selected land
- Financial proposal
- Status

## 39. Contract APIs

Required operations:

- POST /api/contracts
- GET /api/contracts
- GET /api/contracts/{id}
- PATCH /api/contracts/{id}
- POST /api/contracts/{id}/accept
- POST /api/contracts/{id}/decline

Contract logic must validate:

- User role
- Land availability
- Financial rules
- Contract state
- Duplicate conflicts

## 40. Task and Milestone APIs

Required operations:

- GET /api/contracts/{id}/tasks
- POST /api/tasks
- GET /api/tasks/{id}
- PATCH /api/tasks/{id}
- POST /api/tasks/{id}/complete

Task completion should trigger verification logic.

## 41. Evidence APIs

Required operations:

- POST /api/evidence/upload
- GET /api/evidence/{id}
- GET /api/tasks/{id}/evidence

Evidence metadata should include:

- User ID
- Task ID
- Contract ID
- Image URL
- Timestamp
- GPS information
- Verification status

## 42. Workforce APIs

Required operations:

- GET /api/jobs
- POST /api/jobs
- GET /api/jobs/{id}
- POST /api/jobs/{id}/accept
- POST /api/jobs/{id}/decline
- GET /api/workers/available

The backend must prevent overbooking.

## 43. Weather APIs

The weather module should support:

- Current weather
- Rainfall
- Forecast
- Temperature
- Weather alerts

Weather data should be connected to land location.

The system should evaluate:

- Task + Crop + Weather + Rules

Possible output:

- PROCEED
- SKIP
- DELAY
- REVIEW

## 44. AI APIs

Recommended AI flow:

- POST /api/ai/analyze-crop

Input:

- Image
- Crop type
- Optional location
- Optional growth stage

Output:

- Analysis result
- Confidence
- Risk level
- Recommendations
- Review requirement

AI API providers should be abstracted so they can be replaced later.

## 45. Payment APIs and Platform Commission

The payment system should track:

- Buyer payment status
- Contract value
- Landowner allocation
- Worker payment
- Platform commission

Example statuses:

- PENDING
- AUTHORIZED
- PAID
- FAILED
- REFUNDED

The MVP may initially simulate payments while keeping the backend structure ready for real payment integration.

Financial records should be stored server-side.

## 46. Core Database Entities

Recommended initial database entities:

- User
- UserRole
- Land
- CropCategory
- Crop
- CropPlan
- CropStage
- BuyerDemand
- Contract
- ContractLand
- Milestone
- Task
- WorkerJob
- WorkerAssignment
- GPSCheckIn
- Evidence
- AIAnalysis
- WeatherRecord
- Notification
- Payment
- Transaction
- Dispute
- AuditLog

Important relationships:

```text
User
  ↓
Landowner owns Land

```text
Buyer
  ↓
Creates BuyerDemand

```text
BuyerDemand
  ↓
Creates Contract

```text
Contract
  ↓
Contains one or multiple Land parcels

```text
Contract
  ↓
Generates Milestones

```text
Milestone
  ↓
Contains Tasks

```text
Task
  ↓
May create WorkerJob

```text
WorkerJob
  ↓
Assigned to Worker

```text
Task
  ↓
Has Evidence

```text
Evidence
  ↓
May have AIAnalysis
```

## 47. Important State Machines

- Land

```text
AVAILABLE
  ↓
RESERVED
  ↓
UNDER_CONTRACT
  ↓
AVAILABLE after completion if applicable
```

- Contract

```text
DRAFT
  ↓
SUBMITTED
  ↓
OFFERED
  ↓
PARTIALLY_ACCEPTED
  ↓
ACTIVE
  ↓
AT_RISK if necessary
  ↓
COMPLETED
```

Alternative:

- DECLINED CANCELLED DISPUTED
- Task

```text
PENDING
  ↓
ACTIVE
  ↓
SUBMITTED_FOR_REVIEW
  ↓
COMPLETED
```

Alternative:

- SKIPPED DELAYED REJECTED REVIEW_REQUIRED
- Worker Job

```text
OPEN
  ↓
PARTIALLY_FILLED
  ↓
FILLED
  ↓
IN_PROGRESS
  ↓
COMPLETED
```

## 48. Frontend, Implementation Strategy and MVP Success

The existing frontend should be reused where possible.

Do not rebuild working pages unnecessarily.

Current prototype pages should gradually become functional.

Recommended implementation order:

- Phase 0 — Repository Audit
- Read PRD
- Inspect existing frontend
- Identify reusable pages
- Identify missing features
- Do not modify working functionality unnecessarily
- Phase 1 — Foundation

Implement:

- Database
- ORM
- Environment variables
- API structure
- Validation
- Error handling
- Seed data
- Phase 2 — Authentication and Roles

Implement:

- Real users
- Buyer role
- Landowner role
- Worker role
- Admin role
- Protected routes
- Session management
- Phase 3 — Land Management

Implement:

- Land registration
- Coordinates
- Area
- Availability
- Land status
- Phase 4 — Buyer Demand Flow

Implement:

- Category selection
- Crop selection
- Quantity input
- Land requirement estimation
- Map
- Available land selection
- Multiple land selection
- Contract proposal
- Phase 5 — Contract Engine

Implement:

- Contract creation
- Offer generation
- Landowner acceptance
- Partial fulfillment
- Contract activation
- Financial allocation
- Phase 6 — Crop Timeline and Tasks

Implement:

- Crop-specific timelines
- Milestones
- Tasks
- Notifications
- Adaptive scheduling
- Phase 7 — Workforce System

Implement:

- Worker requirement calculation
- Job creation
- Worker notifications
- Acceptance
- Assignment
- Contact sharing
- Phase 8 — GPS and Evidence

Implement:

- Geolocation
- GPS check-in
- GPS validation
- Photo upload
- Evidence storage
- Verification
- Phase 9 — Weather Intelligence

Implement:

- Weather API
- Rainfall detection
- Forecast evaluation
- Task recommendations
- Phase 10 — AI Integration

Implement:

- Crop image upload
- AI analysis
- Confidence scoring
- Risk flags
- Dashboard alerts
- Admin review
- Phase 11 — Payments

Implement:

- Contract financial tracking
- Landowner allocation
- Worker payments
- Platform commission
- Payment statuses

## MVP Success Criteria

The MVP should demonstrate the complete end-to-end flow:

Buyer logs in.

Buyer selects a crop.

Buyer enters required quantity.

System estimates required land.

Buyer selects available land.

Buyer submits a contract request.

Landowner receives and accepts the offer.

Contract becomes active.

Crop-specific milestones are generated.

Required workers receive jobs.

Workers accept jobs.

Workers perform GPS check-in.

Workers upload evidence.

Evidence is stored.

AI analysis can analyze crop images.

Weather can affect task recommendations.

Buyer can monitor contract progress.

Landowner can monitor farming progress.

Admin can review risks and disputes.

Payment and commission records are tracked.

## Final Development Principles

Do not rebuild the entire existing frontend unless necessary.

Reuse existing components and pages wherever possible.

Convert mock data into real backend-connected data gradually.

Keep frontend, backend, database, AI, weather, and payment logic separated.

Do not expose API keys in frontend code.

Validate important business rules on the backend.

Do not implement every feature in one step.

Complete one phase, test it, then continue.

Use rule-based logic where real machine learning is not yet required.

Clearly distinguish demo data, estimated data, AI predictions, and verified data.

Do not present AI results as guaranteed agricultural or financial outcomes.

Preserve a clean and understandable folder structure.

Every major feature must connect to the database rather than relying only on frontend state.

Existing functionality should not be broken when adding new features.

Before major code changes, inspect relevant existing files and dependencies.

## AI Agent Instructions

Before implementing any major feature:

Read this docs/PRD.md.

Inspect the relevant existing code.

Identify reusable components.

Explain the implementation plan.

Make changes incrementally.

Test the application.

Report changed files.

Report any required environment variables.

Do not silently replace working architecture.

Ask before making destructive or major architectural changes.

