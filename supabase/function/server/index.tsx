import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Create Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  );
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b84f09d0/health", (c) => {
  return c.json({ status: "ok" });
});

// ============== AUTH ROUTES ==============

// Sign up route
app.post("/make-server-b84f09d0/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Unexpected error in signup route: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============== MEDICINE ROUTES ==============

// Get all medicines for a user
app.get("/make-server-b84f09d0/medicines", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const medicines = await kv.getByPrefix(`medicine:${user.id}:`);
    return c.json({ medicines: medicines.map(m => m.value) });
  } catch (error) {
    console.log(`Error fetching medicines: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add a new medicine
app.post("/make-server-b84f09d0/medicines", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { name, expiryDate, dosage, frequency, notes, imageUrl } = body;

    if (!name || !expiryDate) {
      return c.json({ error: "Medicine name and expiry date are required" }, 400);
    }

    const medicineId = crypto.randomUUID();
    const medicine = {
      id: medicineId,
      userId: user.id,
      name,
      expiryDate,
      dosage,
      frequency,
      notes,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`medicine:${user.id}:${medicineId}`, medicine);
    return c.json({ medicine });
  } catch (error) {
    console.log(`Error adding medicine: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete a medicine
app.delete("/make-server-b84f09d0/medicines/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const medicineId = c.req.param('id');
    await kv.del(`medicine:${user.id}:${medicineId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting medicine: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============== MEDICAL REPORTS ROUTES ==============

// Get all medical reports for a user
app.get("/make-server-b84f09d0/reports", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const reports = await kv.getByPrefix(`report:${user.id}:`);
    return c.json({ reports: reports.map(r => r.value) });
  } catch (error) {
    console.log(`Error fetching reports: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add a new medical report
app.post("/make-server-b84f09d0/reports", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { title, date, category, notes, fileUrl } = body;

    if (!title) {
      return c.json({ error: "Report title is required" }, 400);
    }

    const reportId = crypto.randomUUID();
    const report = {
      id: reportId,
      userId: user.id,
      title,
      date: date || new Date().toISOString(),
      category,
      notes,
      fileUrl,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`report:${user.id}:${reportId}`, report);
    return c.json({ report });
  } catch (error) {
    console.log(`Error adding report: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete a medical report
app.delete("/make-server-b84f09d0/reports/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const reportId = c.req.param('id');
    await kv.del(`report:${user.id}:${reportId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting report: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============== REMINDERS ROUTES ==============

// Get all reminders for a user
app.get("/make-server-b84f09d0/reminders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const reminders = await kv.getByPrefix(`reminder:${user.id}:`);
    return c.json({ reminders: reminders.map(r => r.value) });
  } catch (error) {
    console.log(`Error fetching reminders: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add a new reminder
app.post("/make-server-b84f09d0/reminders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { medicineName, time, frequency, startDate, endDate, notes } = body;

    if (!medicineName || !time) {
      return c.json({ error: "Medicine name and time are required" }, 400);
    }

    const reminderId = crypto.randomUUID();
    const reminder = {
      id: reminderId,
      userId: user.id,
      medicineName,
      time,
      frequency,
      startDate,
      endDate,
      notes,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`reminder:${user.id}:${reminderId}`, reminder);
    return c.json({ reminder });
  } catch (error) {
    console.log(`Error adding reminder: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Toggle reminder enabled status
app.put("/make-server-b84f09d0/reminders/:id/toggle", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const reminderId = c.req.param('id');
    const key = `reminder:${user.id}:${reminderId}`;
    const reminder = await kv.get(key);
    
    if (!reminder) {
      return c.json({ error: "Reminder not found" }, 404);
    }

    reminder.enabled = !reminder.enabled;
    await kv.set(key, reminder);
    return c.json({ reminder });
  } catch (error) {
    console.log(`Error toggling reminder: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete a reminder
app.delete("/make-server-b84f09d0/reminders/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const reminderId = c.req.param('id');
    await kv.del(`reminder:${user.id}:${reminderId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting reminder: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============== EMERGENCY CONTACTS ROUTES ==============

// Get emergency contacts for a user
app.get("/make-server-b84f09d0/emergency-contacts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const contacts = await kv.get(`emergency-contacts:${user.id}`);
    return c.json({ contacts: contacts || [] });
  } catch (error) {
    console.log(`Error fetching emergency contacts: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update emergency contacts
app.put("/make-server-b84f09d0/emergency-contacts", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { contacts } = body;

    await kv.set(`emergency-contacts:${user.id}`, contacts);
    return c.json({ contacts });
  } catch (error) {
    console.log(`Error updating emergency contacts: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get medical info for a user (for QR code)
app.get("/make-server-b84f09d0/medical-info", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const medicalInfo = await kv.get(`medical-info:${user.id}`);
    return c.json({ medicalInfo: medicalInfo || {} });
  } catch (error) {
    console.log(`Error fetching medical info: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update medical info
app.put("/make-server-b84f09d0/medical-info", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { bloodType, allergies, chronicConditions, medications, emergencyNotes } = body;

    const medicalInfo = {
      bloodType,
      allergies,
      chronicConditions,
      medications,
      emergencyNotes,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`medical-info:${user.id}`, medicalInfo);
    return c.json({ medicalInfo });
  } catch (error) {
    console.log(`Error updating medical info: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============== BLOOD DONATION ROUTES ==============

// Get all blood donation requests
app.get("/make-server-b84f09d0/blood-requests", async (c) => {
  try {
    const requests = await kv.getByPrefix(`blood-request:`);
    return c.json({ requests: requests.map(r => r.value) });
  } catch (error) {
    console.log(`Error fetching blood requests: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create a blood donation request
app.post("/make-server-b84f09d0/blood-requests", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { patientName, bloodType, unitsNeeded, location, hospital, contactNumber, urgency, notes } = body;

    if (!patientName || !bloodType || !location || !contactNumber) {
      return c.json({ error: "Required fields missing" }, 400);
    }

    const requestId = crypto.randomUUID();
    const request = {
      id: requestId,
      userId: user.id,
      patientName,
      bloodType,
      unitsNeeded,
      location,
      hospital,
      contactNumber,
      urgency,
      notes,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`blood-request:${requestId}`, request);
    return c.json({ request });
  } catch (error) {
    console.log(`Error creating blood request: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============== EMERGENCY FUND ROUTES ==============

// Get all emergency fund requests
app.get("/make-server-b84f09d0/fund-requests", async (c) => {
  try {
    const requests = await kv.getByPrefix(`fund-request:`);
    return c.json({ requests: requests.map(r => r.value) });
  } catch (error) {
    console.log(`Error fetching fund requests: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create an emergency fund request
app.post("/make-server-b84f09d0/fund-requests", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user?.id || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { patientName, condition, amountNeeded, amountRaised, description, contactNumber, hospital } = body;

    if (!patientName || !condition || !amountNeeded || !contactNumber) {
      return c.json({ error: "Required fields missing" }, 400);
    }

    const requestId = crypto.randomUUID();
    const request = {
      id: requestId,
      userId: user.id,
      patientName,
      condition,
      amountNeeded,
      amountRaised: amountRaised || 0,
      description,
      contactNumber,
      hospital,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    await kv.set(`fund-request:${requestId}`, request);
    return c.json({ request });
  } catch (error) {
    console.log(`Error creating fund request: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);