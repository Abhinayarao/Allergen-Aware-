-- Firestore reference for Allergen-Aware Recipe Advisor
-- ----------------------------------------------------
-- This project now uses Firebase Firestore instead of a SQL/Postgres database.
-- The information below documents the collections and fields that the
-- FastAPI backend expects. Use it as guidance when reviewing your
-- Firestore data model and security rules.

-- Collection: user_profiles (document id = Firebase Auth UID)
-- Fields:
--   user_id (string, matches UID)
--   email (string)
--   first_name (string, optional)
--   last_name (string, optional)
--   phone (string, optional)
--   date_of_birth (string, optional)
--   emergency_contact (string, optional)
--   created_at (timestamp)
--   updated_at (timestamp)

-- Collection: allergen_profiles (document id = Firebase Auth UID)
-- Fields:
--   user_id (string, matches UID)
--   peanuts, tree_nuts, shellfish, fish, gluten, dairy,
--   eggs, soy, sesame, sulfites, mustard, celery,
--   lupin, mollusks (booleans, default false)
--   custom_allergens (array<string>)
--   severity_level (string: 'mild' | 'moderate' | 'severe')
--   created_at (timestamp)
--   updated_at (timestamp)

-- Collection: food_scans (document id auto-generated)
-- Fields:
--   user_id (string, UID of owner)
--   scan_type (string)
--   food_id (string)
--   food_name (string)
--   scan_data (map)
--   analysis_result (map)
--   created_at (timestamp)

-- Suggested Firestore security rules (pseudo-code):
-- match /databases/{database}/documents {
--   match /user_profiles/{userId} {
--     allow read, write: if request.auth != null && request.auth.uid == userId;
--   }
--   match /allergen_profiles/{userId} {
--     allow read, write: if request.auth != null && request.auth.uid == userId;
--   }
--   match /food_scans/{scanId} {
--     allow read, delete: if request.auth != null && request.auth.uid == resource.data.user_id;
--     allow create: if request.auth != null && request.resource.data.user_id == request.auth.uid;
--   }
-- }

-- Indexes:
--   • Create a composite index on food_scans for user_id ascending, created_at descending
--     if you plan to support history lookups ordered by timestamp.

-- Note: Collections are automatically created when the backend writes
-- the first document, so no manual database migration scripts are required.
