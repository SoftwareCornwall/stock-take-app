# Stock Take Mobile Web App
## Agile User Stories and Acceptance Criteria

# Epic 1, Authentication & Access

## Story 1.1 Login to application

**As a staff member**
I want to log into the stock take app
So that I can access stock take sessions.

### Acceptance Criteria

* User can enter username and password.
* Valid credentials grant access.
* Invalid credentials show an error message.
* User remains logged in during active use.
* Login page is usable on a mobile device.

## Story 1.2 Logout

### Acceptance Criteria

* Logout option is visible after login.
* Logout clears the active session.
* User is returned to the login screen.

# Epic 2, Stock Take Sessions

## Story 2.1 Create stock take session

### Acceptance Criteria

* New session can be created.
* Session is automatically named using the current date.
* Session status defaults to Active.
* All item counts start at 0.
* User can start a session in under 30 seconds.

## Story 2.2 Resume stock take session

### Acceptance Criteria

* User can see active sessions.
* Existing counts are preserved.
* User can continue updating items.
* Previously entered serial numbers remain visible.

## Story 2.3 Complete stock take session

### Acceptance Criteria

* User can press Complete Session.
* Confirmation prompt is shown.
* Session status changes to Completed.
* Completed sessions become read only.
* Completed sessions can still be exported.

# Epic 3, Department Management

## Story 3.1 Select super department

### Acceptance Criteria

* User must select a super department first.
* Available options are Tech Cornwall and Agile on the Beach.
* Selection is required before viewing stock items.

## Story 3.2 Create sub department

### Acceptance Criteria

* User can add a new sub department.
* New sub department belongs to the selected super department.
* New sub department is immediately available for selection.
* Empty names are rejected.

## Story 3.3 Select sub department

### Acceptance Criteria

* Sub department selection is optional.
* Existing sub departments are displayed.
* Selected sub department is stored against stock entries.

# Epic 4, Catalogue Browsing

## Story 4.1 View catalogue items

### Acceptance Criteria

* Items appear in a scrollable list.
* List is optimised for mobile.
* Large tap targets are used.
* No keyboard interaction is required for browsing.
* Performance remains responsive on mobile devices.

## Story 4.2 Search catalogue items

### Acceptance Criteria

* Search field is available.
* Search filters catalogue results.
* Search is optional.
* Scroll and tap remains the primary interaction method.

# Epic 5, Counting Items

## Story 5.1 Open item update screen

### Acceptance Criteria

* Tapping an item opens the update view.
* Current quantity is displayed.
* Item name is displayed.
* Current condition is displayed if already set.

## Story 5.2 Increase and decrease quantity

### Acceptance Criteria

* Plus button increases quantity by 1.
* Minus button decreases quantity by 1.
* Quantity cannot go below 0.
* Changes are visible immediately.
* Keyboard entry is not required.

## Story 5.3 Set item condition

### Acceptance Criteria

* User can choose New, Good, Fair, Damaged or Other.
* Selection uses tap controls.
* No typing required.
* Selected value is saved.

## Story 5.4 Save item count

### Acceptance Criteria

* Confirm button saves changes.
* Existing record is updated rather than duplicated.
* Quantity is retained after save.
* Condition is retained after save.
* User returns to the catalogue list.

## Story 5.5 Prevent duplicate entries

### Acceptance Criteria

* Only one session record exists per item and sub department combination.
* Saving updates modifies the existing record.
* Duplicate records cannot be created manually.

# Epic 6, Serial Number Tracking

## Story 6.1 Capture serial number

### Acceptance Criteria

* Serial number field only appears for serial tracked items.
* Serial number is mandatory for serial tracked items.
* Quantity is fixed at 1 for serial tracked items.
* User cannot save without a serial number.
* Serial number is stored against the stock take record.

## Story 6.2 Hide serial number field for standard items

### Acceptance Criteria

* Non serial tracked items do not show a serial field.
* Screen remains uncluttered.
* User can complete updates without additional steps.

## Story 6.3 Prevent multi quantity serial assets

### Acceptance Criteria

* Serial tracked items cannot have quantity greater than 1.
* Each serial number creates an individual record.
* User receives validation if attempting to increase quantity above 1.

# Epic 7, CSV Export

## Story 7.1 Export session data

### Acceptance Criteria

* Export available for active sessions.
* Export available for completed sessions.
* CSV downloads successfully.
* No manual cleanup required.

## Story 7.2 Export by super department

### Acceptance Criteria

* One CSV is generated per super department.
* Export only includes records from the selected super department.
* File downloads successfully.

## Story 7.3 Export serial tracked items

### Acceptance Criteria

* CSV contains Sub Department, Item Name, Serial Number, Quantity and Condition.
* Column order matches specification.

## Story 7.4 Export non serial items

### Acceptance Criteria

* CSV contains Sub Department, Item Name, Quantity and Condition.
* Serial Number column is omitted.

# Epic 8, Session Administration

## Story 8.1 Archive completed sessions

### Acceptance Criteria

* Sessions can be archived.
* Archived sessions are hidden from active lists.
* Archived sessions remain available for reporting.
* No permanent deletion occurs.

# Epic 9, Multi User Support

## Story 9.1 Support concurrent editing

### Acceptance Criteria

* Multiple users can update records concurrently.
* Last write wins behaviour is applied.
* Application does not lock records.
* Save operations complete successfully.

# Epic 10, Catalogue Administration

## Story 10.1 Add catalogue item

### Acceptance Criteria

* User can create a catalogue item.
* Required fields are Name, Category and Serial Tracked.
* New item appears immediately in catalogue lists.
* Empty names are rejected.

## Story 10.2 Edit catalogue item

### Acceptance Criteria

* User can update item name.
* User can update category.
* User can update serial tracked status.
* Changes are visible immediately.
* Existing stock take records are preserved.

## Story 10.3 Archive catalogue item

### Acceptance Criteria

* User can archive an item.
* Archived items do not appear in normal stock taking.
* Historical records remain intact.
* Archived items can be viewed separately.

# Epic 11, Simple Configuration

## Story 11.1 Configure shared credentials

### Acceptance Criteria

* Username and password are stored in configuration.
* Login validates against configured credentials.
* Credentials can be changed without code changes.
* Invalid login attempts are rejected.

# Technical Stories

## T1 Create Supabase schema and migrations

### Acceptance Criteria

* Tables created for Sessions, Departments, Sub Departments, Catalogue Items and Session Items.

## T2 Deploy application to Vercel

### Acceptance Criteria

* Application accessible via URL.
* Environment variables configured.
* Production build successful.

## T3 Seed initial catalogue

### Acceptance Criteria

* Initial catalogue data imported.
* All items visible in app.
* Serial tracking flags correctly assigned.
