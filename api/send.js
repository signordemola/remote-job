require("dotenv").config();
const nodemailer = require("nodemailer");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOC files are allowed"));
    }
  },
}).single("resume");

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
  tls: { rejectUnauthorized: true },
});

// Serverless function
module.exports = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send(`Error sending application: ${err.message}.`);
    }

    try {
      const formData = req.body;
      const resume = req.file;

      // Filter out hidden inputs to prevent spam/bot submissions
      if (formData.__gra__ || formData.consent) {
        return res.send("Error: Invalid submission detected.");
      }

      // Remove hidden fields from formData
      delete formData.__gra__;
      delete formData.consent;

      // Prepare email content
      const mailOptions = {
        from: process.env.ZOHO_USER,
        to: "xinai.leunghr@qulaaengineering.com",
        subject: "New Job Application Submission",
        html: `
          <h2>New Application for Remote Chat Support/Data Entry Role</h2>
          <p><strong>Full Name:</strong> ${formData.name || "N/A"}</p>
          <p><strong>Email:</strong> ${formData.email || "N/A"}</p>
          <p><strong>Phone:</strong> ${formData.phone || "N/A"}</p>
          <p><strong>Date of Birth:</strong> ${formData.dob || "N/A"}</p>
          <p><strong>Address:</strong> ${formData.address || "N/A"}</p>
          <p><strong>State:</strong> ${formData.state || "N/A"}</p>
          <p><strong>U.S. Authorized:</strong> ${formData.us_auth || "N/A"}</p>
          <p><strong>IRS Verified:</strong> ${
            formData.irs_verified || "N/A"
          }</p>
          <p><strong>Reliable Internet:</strong> ${
            formData.internet || "N/A"
          }</p>
          <p><strong>Remote Experience:</strong> ${
            formData.remote_exp || "N/A"
          }</p>
          <p><strong>Desired Salary:</strong> ${formData.salary || "N/A"} (${
          formData.salary_type || "N/A"
        })</p>
          <p><strong>Weekly Hours:</strong> ${formData.hours || "N/A"}</p>
          <p><strong>Hourly Rate:</strong> ${formData.hourly_rate || "N/A"}</p>
          <p><strong>Availability:</strong> ${
            Array.isArray(formData.availability)
              ? formData.availability.join(", ")
              : formData.availability || "None"
          }</p>
          <p><strong>Experience:</strong> ${formData.experience || "N/A"}</p>
          <p><strong>Cover Letter:</strong> ${
            formData.cover_letter || "N/A"
          }</p>
          <p><strong>Why Support:</strong> ${formData.why_support || "N/A"}</p>
          <p><strong>Unique Qualities:</strong> ${
            formData.qualities || "N/A"
          }</p>
          <p><strong>Referred By:</strong> ${formData.referred || "N/A"}</p>
          <p><strong>Why Good Fit:</strong> ${formData.message || "N/A"}</p>
          <p><strong>Genuine Information Confirmed:</strong> ${
            formData.genuine ? "Yes" : "No"
          }</p>
        `,
        attachments: resume
          ? [
              {
                filename: resume.originalname,
                content: resume.buffer,
              },
            ]
          : [],
      };

      // Send email
      await transporter.sendMail(mailOptions);
      res.send(
        "✅ Your application has been submitted successfully! <a href='/'>Back to form</a>"
      );
    } catch (error) {
      console.error("Error sending email:", error);
      res
        .status(500)
        .send(
          `Error sending application: ${error.message}. <a href="/">Try again</a>`
        );
    }
  });
};
