
CREATE TABLE audit_trail (
  id uuid DEFAULT uuid_generate_v4 (),
  "userId" uuid,
  method VARCHAR(10),
  path VARCHAR(255),
  body JSONB,
  query JSONB,
  headers JSONB,
  "responseStatus" INT,
  "responseBody" JSONB,
  duration BIGINT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_audit_fkey" FOREIGN KEY ("userId")
      REFERENCES "users" (id) MATCH SIMPLE
      ON UPDATE CASCADE
      ON DELETE CASCADE
);

  