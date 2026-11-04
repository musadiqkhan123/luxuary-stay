# API reference

Base URL: `http://localhost:5000/api`
Auth: send `Authorization: Bearer <token>` (token comes from login/register).
All responses look like `{ "success": true, "data": ..., "meta"?: ..., "message"?: ... }`.
Errors look like `{ "success": false, "message": "..." }` with the right HTTP status (400, 401, 403, 404, 409, 429, 500).

Roles: **A** admin, **M** manager, **R** receptionist, **H** housekeeping, **G** guest, **Public** no login.

## Health
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /health | Public | API + database status |

## Auth
| Method | URL | Access | Body / query |
|---|---|---|---|
| POST | /auth/register | Public | `name, email, password, phone?, privacyAccepted: true, marketing?` |
| POST | /auth/login | Public | `email, password` (rate limited) |
| GET | /auth/me | Any | — |
| PUT | /auth/me | Any | `name, phone, address, city, country, preferences, marketing` |
| PUT | /auth/me/password | Any | `currentPassword, newPassword` → returns a fresh token (other sessions are signed out) |
| POST | /auth/forgot-password | Public | `email` → emails a reset link (30 min). Same answer whether or not the email exists. Rate limited |
| POST | /auth/reset-password/:token | Public | `password` → sets the new password, link works once |
| GET | /auth/me/export | Any | Downloads all your data (GDPR) |
| DELETE | /auth/me | G | Closes the guest account |

## Users
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /users | A M R | `?role=guest|staff|<role>&search=&status=active|inactive&page=&limit=` (non-admins see guests only) |
| GET | /users/permissions | A | Role permission matrix |
| GET | /users/:id | A M R | Profile + booking history |
| POST | /users | A M R | Admin: any role. Others: guest only. Without a password the user is emailed a "set your password" link (48 h). `tempPassword` is returned only when email is not configured |
| PUT | /users/:id | A M R | Admin can also change `role`, `jobTitle`, `isActive`, `password` |
| PATCH | /users/:id/status | A | `{ isActive: true|false }` |
| POST | /users/:id/send-reset | A | Emails the user a password reset link (24 h) |

## Rooms
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /rooms | Public | `?type=&guests=&minPrice=&maxPrice=` (staff also `?status=`) |
| GET | /rooms/availability | Public | `?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=&type=` |
| GET | /rooms/:id | Public | Room + already-booked date ranges |
| POST | /rooms | A M | `roomNumber, type, floor, pricePerNight, maxGuests, bedType, size, view, amenities[], images[], description` |
| PUT | /rooms/:id | A M | Any room field |
| DELETE | /rooms/:id | A M | Deletes, or retires the room if it has booking history |
| PATCH | /rooms/:id/status | A M R H | `{ status: available|reserved|occupied|cleaning|maintenance }` (H: available/cleaning/maintenance) |

Room types: `classic, deluxe, executive, presidential`.

## Bookings, check-in and check-out
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /bookings | A M R G | `?status=&search=&page=` (guests get their own) |
| POST | /bookings | A M R G | `roomId, checkIn, checkOut, adults, children, specialRequests` (+ `guestId` for staff) |
| GET | /bookings/today | A M R | Arrivals, departures, in-house |
| GET | /bookings/:id | A M R G | Booking + services + invoice |
| PUT | /bookings/:id | A M R | Change `checkIn, checkOut, roomId, adults, children, specialRequests` before check-in |
| PATCH | /bookings/:id/cancel | A M R G | `{ reason?, noShow? }` |
| POST | /bookings/:id/check-in | A M R | Issues key card, room → occupied |
| GET | /bookings/:id/bill | A M R G | Live bill (or final invoice) |
| POST | /bookings/:id/check-out | A M R | `{ discount?, notes?, payment?: { amount, method } }` → invoice, room → cleaning, cleaning task |

Booking statuses: `confirmed, checked-in, checked-out, cancelled, no-show`.

## Invoices
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /invoices | A M R G | `?status=unpaid|partially-paid|paid&page=` |
| GET | /invoices/:id | A M R G | Invoice + hotel details |
| POST | /invoices/:id/payments | A M R | `{ amount, method: cash|card|bank-transfer|online }` |

## Guest services
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /services | Any | `?status=&type=` (guests get their own) |
| POST | /services | A M R G | `type, details?, scheduledFor?` (staff: `bookingId`, `charge?`). Guest must be checked in |
| PATCH | /services/:id | Any | Staff: `status, charge, staffNote`. Guest: cancel own pending request |

Types: `room-service, laundry, wake-up-call, transport, spa, housekeeping, other`.

## Housekeeping
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /housekeeping | A M R H | `?status=` (housekeepers see own + unassigned) |
| GET | /housekeeping/staff | A M R H | List of housekeepers |
| POST | /housekeeping | A M R | `roomId, type, priority, assignedTo?, dueDate?, notes?` |
| PATCH | /housekeeping/:id | A M R H | `status, notes` (+ `priority, type, assignedTo, dueDate` for front office). Completing a clean sets the room to available |

## Maintenance
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /maintenance | Any | `?status=&priority=` (guests get their own) |
| POST | /maintenance | Any | `title, description?, priority, roomId? or location, blockRoom?` (guests: their current room) |
| PATCH | /maintenance/:id | A M R | `status, priority, assignedTo, resolutionNote` |

## Feedback
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /feedback/public | Public | Published reviews for the website |
| GET | /feedback | A M R G | `?rating=` + average in `meta` |
| POST | /feedback | G | `rating (1-5), comment, title?, bookingId?` |
| PATCH | /feedback/:id/respond | A M R | `{ message }` |
| PATCH | /feedback/:id/publish | A M | `{ isPublished }` |

## Notifications
| Method | URL | Access |
|---|---|---|
| GET | /notifications | Any (unread count in `meta.unread`) |
| PATCH | /notifications/:id/read | Any |
| PATCH | /notifications/read-all | Any |

## Reports
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /reports/dashboard | Any | Summary cards for the logged-in role |
| GET | /reports/analytics | A M | `?days=7..365` occupancy, revenue, ADR, RevPAR, forecast, pricing suggestions |

## Uploads (Cloudinary)
| Method | URL | Access | Notes |
|---|---|---|---|
| POST | /uploads | Any (folder rules below) | `{ image: "data:image/jpeg;base64,...", folder }` → `{ url, publicId }`. Max 5 MB. Folders: `rooms` (A M), `hotel` (A), `avatars` and `maintenance` (everyone) |
| DELETE | /uploads | Uploader or A M | `{ publicId }` — remove a photo that was uploaded but not saved |

Save the returned object in a document: `images: [{ url, publicId }]` on rooms, `avatar` on users (`PUT /auth/me` or `/users/:id`),
`photos` on maintenance reports, `heroImage` in settings. Photos removed from a room, or replaced avatars / homepage photos, are deleted from Cloudinary automatically.

## Settings
| Method | URL | Access | Notes |
|---|---|---|---|
| GET | /settings | Public | Hotel details, currency, tax, rates, policies |
| PUT | /settings | A | Any setting field (nested objects merge) |
| POST | /settings/apply-room-rates | A | Copy standard rates to every room of each type |
