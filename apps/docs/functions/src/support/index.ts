/**
 * Support Cloud Functions
 *
 * Handles contact form submissions, support tickets, and notification timestamps.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Contact form submission data
 */
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: "general" | "technical" | "sales" | "partnership" | "feedback";
}

/**
 * Contact ticket stored in Firestore
 */
interface ContactTicket extends ContactFormData {
  userId?: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
  ticketNumber: string;
}

/**
 * Generate a unique ticket number
 */
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PHX-${timestamp}-${random}`;
}

/**
 * Determine priority based on category
 */
function determinePriority(
  category: ContactFormData["category"]
): ContactTicket["priority"] {
  switch (category) {
    case "technical":
      return "high";
    case "sales":
    case "partnership":
      return "medium";
    default:
      return "low";
  }
}

/**
 * Submit a contact form
 * Creates a support ticket and optionally sends notification emails
 */
export const submitContactForm = functions.https.onCall(
  async (data: ContactFormData, context) => {
    // Validate input
    if (!data.name || !data.email || !data.subject || !data.message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Name, email, subject, and message are required"
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid email format"
      );
    }

    // Validate category
    const validCategories = [
      "general",
      "technical",
      "sales",
      "partnership",
      "feedback",
    ];
    if (!validCategories.includes(data.category)) {
      data.category = "general";
    }

    // Sanitize input (basic XSS prevention)
    const sanitize = (str: string): string =>
      str
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .trim();

    const ticketNumber = generateTicketNumber();

    const ticket: ContactTicket = {
      name: sanitize(data.name),
      email: data.email.toLowerCase().trim(),
      subject: sanitize(data.subject),
      message: sanitize(data.message),
      category: data.category,
      userId: context.auth?.uid,
      status: "new",
      priority: determinePriority(data.category),
      ticketNumber,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      // Save to Firestore
      const docRef = await db.collection("support_tickets").add(ticket);

      functions.logger.info(
        `Contact form submitted: ${ticketNumber}`,
        { ticketId: docRef.id, category: data.category }
      );

      // Update latest support timestamp for notifications
      await db.collection("metadata").doc("latest_updates").set(
        {
          supportUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        ticketNumber,
        message: "Your message has been received. We'll respond within 1-2 business days.",
      };
    } catch (error) {
      functions.logger.error("Failed to submit contact form:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to submit contact form. Please try again."
      );
    }
  }
);

/**
 * Get latest content timestamps for notification badges
 * Returns timestamps for news, support, and other content types
 */
export const getLatestContentTimestamps = functions.https.onCall(
  async (_data, _context) => {
    try {
      // Get metadata document with latest timestamps
      const metadataDoc = await db
        .collection("metadata")
        .doc("latest_updates")
        .get();

      if (!metadataDoc.exists) {
        // Initialize with current timestamps if not exists
        const initialData = {
          newsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          supportUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          docsUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("metadata").doc("latest_updates").set(initialData);

        return {
          newsUpdatedAt: Date.now(),
          supportUpdatedAt: Date.now(),
          docsUpdatedAt: Date.now(),
        };
      }

      const data = metadataDoc.data();

      // Convert Firestore timestamps to milliseconds
      const toMillis = (timestamp: admin.firestore.Timestamp | undefined): number => {
        if (timestamp && typeof timestamp.toMillis === "function") {
          return timestamp.toMillis();
        }
        return Date.now();
      };

      return {
        newsUpdatedAt: toMillis(data?.newsUpdatedAt),
        supportUpdatedAt: toMillis(data?.supportUpdatedAt),
        docsUpdatedAt: toMillis(data?.docsUpdatedAt),
      };
    } catch (error) {
      functions.logger.error("Failed to get content timestamps:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get content timestamps"
      );
    }
  }
);

/**
 * Get user's support tickets
 */
export const getUserTickets = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in to view tickets"
    );
  }

  try {
    const snapshot = await db
      .collection("support_tickets")
      .where("userId", "==", context.auth.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const tickets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
    }));

    return { tickets };
  } catch (error) {
    functions.logger.error("Failed to get user tickets:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get tickets"
    );
  }
});

/**
 * Admin: Get all tickets with filters
 */
export const getAdminTickets = functions.https.onCall(
  async (data: { status?: string; category?: string; limit?: number }, context) => {
    // Check if caller is admin
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can view all tickets"
      );
    }

    try {
      let query: admin.firestore.Query = db.collection("support_tickets");

      if (data.status) {
        query = query.where("status", "==", data.status);
      }

      if (data.category) {
        query = query.where("category", "==", data.category);
      }

      query = query.orderBy("createdAt", "desc").limit(data.limit || 100);

      const snapshot = await query.get();

      const tickets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      }));

      return { tickets };
    } catch (error) {
      functions.logger.error("Failed to get admin tickets:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get tickets"
      );
    }
  }
);

/**
 * Admin: Update ticket status
 */
export const updateTicketStatus = functions.https.onCall(
  async (
    data: { ticketId: string; status: string; response?: string },
    context
  ) => {
    // Check if caller is admin
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can update tickets"
      );
    }

    const validStatuses = ["new", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(data.status)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid status"
      );
    }

    try {
      const updateData: Record<string, unknown> = {
        status: data.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (data.response) {
        updateData.adminResponse = data.response;
        updateData.respondedAt = admin.firestore.FieldValue.serverTimestamp();
        updateData.respondedBy = context.auth.uid;
      }

      await db.collection("support_tickets").doc(data.ticketId).update(updateData);

      functions.logger.info(`Ticket ${data.ticketId} updated to ${data.status}`);

      return { success: true };
    } catch (error) {
      functions.logger.error("Failed to update ticket:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update ticket"
      );
    }
  }
);
