import { apiClient } from "@/services/apiClient";

interface SendEmailParams {
  type: "new_registration" | "contact_form";
  data: {
    email: string;
    fullName: string;
    role: string;
    organization?: string;
  };
}

/**
 * Service pour envoyer des notifications par email via le backend
 */
export const emailService = {
  /**
   * Send notification email via backend API
   */
  async sendNotification(params: SendEmailParams) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/email/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Error sending email:", error);
        // Don't throw - continue with registration even if email fails
        return { success: false, error: error.message };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Failed to send email:", error);
      // Fail silently for now
      return { success: false, error: String(error) };
    }
  },

  /**
   * Send registration notification to admin
   */
  async notifyAdminNewRegistration(
    email: string,
    fullName: string,
    role: string,
    organization?: string
  ) {
    return this.sendNotification({
      type: "new_registration",
      data: {
        email,
        fullName,
        role,
        organization,
      },
    });
  },
};

/**
 * Service pour gérer les emails temporaires
 */
export const tempEmailService = {
  /**
   * Generate a temporary email address
   * Format: temp_[timestamp]_[random]@assurance-sante-connect.com
   */
  generateTempEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `temp_${timestamp}_${random}@assurance-sante-connect.com`;
  },

  /**
   * Check if an email is temporary
   */
  isTempEmail(email: string): boolean {
    return email.includes("temp_") && email.includes("@assurance-sante-connect.com");
  },

  /**
   * Store temporary email mapping via backend
   */
  async storeTempEmailMapping(realEmail: string, tempEmail: string, userId: string) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/email/temp-mapping`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            user_id: userId,
            real_email: realEmail,
            temp_email: tempEmail,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Error storing temp email:", error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to store temp email:", error);
      return { success: false, error };
    }
  },

  /**
   * Get real email from temp email via backend
   */
  async getRealEmail(tempEmail: string) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/email/real-email?tempEmail=${encodeURIComponent(tempEmail)}`,
        {
          headers: {
            "Authorization": `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      return data?.real_email || null;
    } catch (error) {
      console.error("Failed to get real email:", error);
      return null;
    }
  },

  /**
   * Update temp email to real email after verification
   */
  async confirmRealEmail(userId: string, realEmail: string) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/email/confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({
            user_id: userId,
            real_email: realEmail,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Error confirming email:", error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to confirm email:", error);
      return { success: false, error };
    }
  },
};
